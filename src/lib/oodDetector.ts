import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import type { OodCheckResult } from '../types';

const PET_CLASSES = new Set(['cat', 'dog']);
const NON_PET_BLOCK_SCORE = 0.5;
const MIN_DETECTION_SCORE = 0.25;

let modelPromise: Promise<cocoSsd.ObjectDetection> | null = null;

export async function getCocoSsdModel(): Promise<cocoSsd.ObjectDetection> {
  if (!modelPromise) {
    modelPromise = (async () => {
      await tf.ready();
      return cocoSsd.load({ base: 'lite_mobilenet_v2' });
    })().catch((err) => {
      modelPromise = null;
      throw err;
    });
  }
  return modelPromise;
}

export function preloadOodDetector(): void {
  void getCocoSsdModel().catch(() => {
    // Graceful silent catch during background preload; handled at inference time
  });
}

/**
 * Pure non-pet blocker:
 * - If coco-ssd detects "cat" or "dog" (any confidence >= 0.25), allow ONNX prediction.
 * - If coco-ssd fails to load or detects nothing, fall back to ONNX prediction.
 * - ONLY block when coco-ssd clearly detects a non-pet class (score > 0.5) AND detects no cat/dog.
 */
export async function checkImageForPet(img: HTMLImageElement): Promise<OodCheckResult> {
  try {
    const model = await getCocoSsdModel();
    const predictions = await model.detect(img, 10, MIN_DETECTION_SCORE);

    const detectedLabels = predictions.map((pred) => ({
      className: pred.class,
      score: pred.score,
    }));

    const hasPet = detectedLabels.some((item) =>
      PET_CLASSES.has(item.className.toLowerCase())
    );

    if (hasPet) {
      return {
        status: 'pet_detected',
        isPet: true,
        detectedLabels,
        topNonPetLabel: null,
      };
    }

    const clearNonPet = detectedLabels.find(
      (item) =>
        !PET_CLASSES.has(item.className.toLowerCase()) &&
        item.score > NON_PET_BLOCK_SCORE
    );

    if (clearNonPet) {
      return {
        status: 'non_pet',
        isPet: false,
        detectedLabels,
        topNonPetLabel: clearNonPet.className,
      };
    }

    // Nothing detected or no confident non-pet class -> fall back to ONNX model
    return {
      status: 'unavailable',
      isPet: true,
      detectedLabels,
      topNonPetLabel: null,
    };
  } catch {
    return {
      status: 'unavailable',
      isPet: true,
      detectedLabels: [],
      topNonPetLabel: null,
    };
  }
}
