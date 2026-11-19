import * as ort from 'onnxruntime-web';
import type { ClassificationResult, OodCheckResult, PredictedClass } from '../types';
import { checkImageForPet } from './oodDetector';

export const INPUT_SIZE = 96;
export const INPUT_NAME = 'input_layer_6';
export const OUTPUT_NAME = 'Identity:0';

export const ACCEPTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/bmp',
  'image/x-ms-bmp',
  'image/webp',
]);

export const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.webp'];

export const DEFAULT_MODEL_URL = '/final_cat_dog_model.onnx';
export const FALLBACK_MODEL_URL = '/model/final_cat_dog_model.onnx';

function configureOnnxRuntime(): void {
  ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
}

export async function createDefaultSession(): Promise<{
  session: ort.InferenceSession;
  filename: string;
}> {
  configureOnnxRuntime();
  try {
    const session = await ort.InferenceSession.create(DEFAULT_MODEL_URL);
    return { session, filename: 'final_cat_dog_model.onnx' };
  } catch (primaryErr) {
    try {
      const session = await ort.InferenceSession.create(FALLBACK_MODEL_URL);
      return { session, filename: 'final_cat_dog_model.onnx' };
    } catch {
      throw primaryErr;
    }
  }
}

export async function createSessionFromFile(file: File): Promise<ort.InferenceSession> {
  if (!file.name.toLowerCase().endsWith('.onnx')) {
    throw new Error(`"${file.name}" is not an .onnx model file. Please select a valid .onnx file.`);
  }
  if (file.size === 0) {
    throw new Error(`"${file.name}" is empty (0 bytes).`);
  }
  configureOnnxRuntime();
  const buffer = await file.arrayBuffer();
  return await ort.InferenceSession.create(buffer);
}

export function validateImageFile(file: File): string | null {
  if (!file) {
    return 'No file was provided.';
  }
  if (file.size === 0) {
    return `"${file.name}" is empty (0 bytes) and cannot be decoded.`;
  }

  const lowerName = file.name.toLowerCase();
  const hasValidExt = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const hasValidMime = ACCEPTED_MIME_TYPES.has(file.type.toLowerCase());

  if (!hasValidMime && !hasValidExt) {
    return `Unsupported file format for "${file.name}". Please upload a JPG, PNG, BMP, or WEBP image.`;
  }

  return null;
}

export function loadImageFromUrl(url: string, filename: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (img.naturalWidth <= 0 || img.naturalHeight <= 0) {
        reject(new Error(`"${filename}" appears corrupted (invalid image dimensions).`));
        return;
      }
      resolve(img);
    };
    img.onerror = () => {
      reject(
        new Error(
          `Could not decode "${filename}". The file may be corrupted or not a valid JPG, PNG, BMP, or WEBP image.`
        )
      );
    };
    img.src = url;
  });
}

export interface PreprocessedTensorResult {
  tensor: ort.Tensor;
  previewDataUrl: string;
}

/**
 * Draws the image onto an offscreen 96x96 canvas, extracts RGBA data,
 * discards the alpha channel, and applies MobileNetV2 normalization:
 * normalized = (channelValue / 127.5) - 1.0
 * Shape: [1, 96, 96, 3]
 */
export function preprocessImage(img: HTMLImageElement): PreprocessedTensorResult {
  const canvas = document.createElement('canvas');
  canvas.width = INPUT_SIZE;
  canvas.height = INPUT_SIZE;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Browser 2D canvas context is unavailable for preprocessing.');
  }

  ctx.drawImage(img, 0, 0, INPUT_SIZE, INPUT_SIZE);
  const imageData = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
  const rgba = imageData.data;

  const floatData = new Float32Array(1 * INPUT_SIZE * INPUT_SIZE * 3);
  let dst = 0;

  for (let i = 0; i < rgba.length; i += 4) {
    floatData[dst++] = rgba[i] / 127.5 - 1.0;     // R
    floatData[dst++] = rgba[i + 1] / 127.5 - 1.0; // G
    floatData[dst++] = rgba[i + 2] / 127.5 - 1.0; // B
  }

  const tensor = new ort.Tensor('float32', floatData, [1, INPUT_SIZE, INPUT_SIZE, 3]);
  const previewDataUrl = canvas.toDataURL('image/png');

  return { tensor, previewDataUrl };
}

export async function runImageClassification(
  session: ort.InferenceSession,
  img: HTMLImageElement,
  meta: {
    filename: string;
    fileSizeBytes: number;
    imageUrl: string;
  }
): Promise<ClassificationResult> {
  const { tensor, previewDataUrl } = preprocessImage(img);

  const feeds: Record<string, ort.Tensor> = {
    [INPUT_NAME]: tensor,
  };

  // Run COCO-SSD non-pet pre-check alongside ONNX inference
  const [oodCheck, inferenceOutput] = await Promise.all([
    checkImageForPet(img),
    (async () => {
      const t0 = performance.now();
      const outputs = await session.run(feeds);
      const latencyMs = performance.now() - t0;
      return { outputs, latencyMs };
    })(),
  ]);

  const { outputs, latencyMs } = inferenceOutput;
  const outputTensor = outputs[OUTPUT_NAME] ?? outputs[session.outputNames[0]];
  if (!outputTensor || !outputTensor.data || outputTensor.data.length === 0) {
    throw new Error(
      `Model output "${OUTPUT_NAME}" was missing or empty. Expected a single sigmoid scalar.`
    );
  }

  const rawValue = Number(outputTensor.data[0]);
  if (!Number.isFinite(rawValue)) {
    throw new Error('Model returned a non-finite probability value.');
  }

  const probabilityDog = Math.min(1, Math.max(0, rawValue));
  const probabilityCat = 1 - probabilityDog;

  const now = new Date();
  const timestamp = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp,
    filename: meta.filename,
    fileSizeBytes: meta.fileSizeBytes,
    imageUrl: meta.imageUrl,
    originalWidth: img.naturalWidth,
    originalHeight: img.naturalHeight,
    probabilityDog,
    probabilityCat,
    latencyMs,
    preprocessedPreviewUrl: previewDataUrl,
    oodCheck,
  };
}

export function evaluatePrediction(
  probabilityDog: number,
  uncertaintyMarginPercent: number,
  oodCheck?: OodCheckResult
): {
  label: PredictedClass;
  rawLeaning: 'Dog' | 'Cat';
  confidencePercent: number;
  isUncertain: boolean;
  isNotPet: boolean;
} {
  const margin = uncertaintyMarginPercent / 100;
  const rawLeaning: 'Dog' | 'Cat' = probabilityDog >= 0.5 ? 'Dog' : 'Cat';
  const winningProb = rawLeaning === 'Dog' ? probabilityDog : 1 - probabilityDog;
  const confidencePercent = winningProb * 100;

  if (oodCheck && oodCheck.status === 'non_pet' && !oodCheck.isPet) {
    return {
      label: 'NotPet',
      rawLeaning,
      confidencePercent,
      isUncertain: false,
      isNotPet: true,
    };
  }

  const isUncertain = Math.abs(probabilityDog - 0.5) < margin;

  return {
    label: isUncertain ? 'Uncertain' : rawLeaning,
    rawLeaning,
    confidencePercent,
    isUncertain,
    isNotPet: false,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return 'Sample asset';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
