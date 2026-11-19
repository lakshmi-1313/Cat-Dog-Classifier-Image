/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type * as ort from 'onnxruntime-web';
import { Header } from './components/Header';
import { ModelLoaderBar } from './components/ModelLoaderBar';
import { UploadDropzone } from './components/UploadDropzone';
import { ResultsCard } from './components/ResultsCard';
import { PredictionHistoryTable } from './components/PredictionHistoryTable';
import {
  createDefaultSession,
  createSessionFromFile,
  loadImageFromUrl,
  runImageClassification,
  validateImageFile,
} from './lib/classifier';
import { preloadOodDetector } from './lib/oodDetector';
import type {
  ClassificationResult,
  ModelLoadStatus,
  SampleImageItem,
} from './types';

const SAMPLE_IMAGES: SampleImageItem[] = [
  {
    id: 'sample-cat',
    label: 'Tabby Cat',
    filename: 'sample_tabby_cat.jpg',
    src: '/src/assets/images/sample_tabby_cat_1795015921960.jpg',
  },
  {
    id: 'sample-dog',
    label: 'Golden Retriever',
    filename: 'sample_golden_dog.jpg',
    src: '/src/assets/images/sample_golden_dog_1795015923058.jpg',
  },
];

export default function App() {
  const sessionRef = useRef<ort.InferenceSession | null>(null);
  const createdObjectUrlsRef = useRef<string[]>([]);

  const [modelStatus, setModelStatus] = useState<ModelLoadStatus>('loading');
  const [modelFilename, setModelFilename] = useState<string | null>('final_cat_dog_model.onnx');
  const [modelError, setModelError] = useState<string | null>(null);

  const [isClassifying, setIsClassifying] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [uncertaintyMargin, setUncertaintyMargin] = useState<number>(15);
  const [history, setHistory] = useState<ClassificationResult[]>([]);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);

  const loadDefaultModel = useCallback(async () => {
    setModelStatus('loading');
    setModelError(null);
    setUploadError(null);
    try {
      const { session, filename } = await createDefaultSession();
      sessionRef.current = session;
      setModelFilename(filename);
      setModelStatus('ready');
    } catch (err) {
      sessionRef.current = null;
      setModelFilename(null);
      setModelStatus('error');
      setModelError(
        err instanceof Error
          ? err.message
          : 'Failed to initialize /final_cat_dog_model.onnx'
      );
    }
  }, []);

  useEffect(() => {
    void loadDefaultModel();
    preloadOodDetector();
    return () => {
      for (const url of createdObjectUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
      createdObjectUrlsRef.current = [];
    };
  }, [loadDefaultModel]);

  const handleSelectModelFile = useCallback(async (file: File) => {
    setModelStatus('loading');
    setModelError(null);
    setUploadError(null);
    try {
      const session = await createSessionFromFile(file);
      sessionRef.current = session;
      setModelFilename(file.name);
      setModelStatus('ready');
    } catch (err) {
      sessionRef.current = null;
      setModelFilename(null);
      setModelStatus('error');
      setModelError(
        err instanceof Error
          ? err.message
          : 'Failed to initialize ONNX Runtime session from the selected file.'
      );
    }
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!sessionRef.current) {
      setUploadError('Please load an .onnx model file first.');
      return;
    }

    setUploadError(null);
    const validationError = validateImageFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setIsClassifying(true);
    const objectUrl = URL.createObjectURL(file);

    try {
      const img = await loadImageFromUrl(objectUrl, file.name);
      const result = await runImageClassification(sessionRef.current, img, {
        filename: file.name,
        fileSizeBytes: file.size,
        imageUrl: objectUrl,
      });

      createdObjectUrlsRef.current.push(objectUrl);
      setHistory((prev) => [result, ...prev]);
      setActiveResultId(result.id);
    } catch (err) {
      URL.revokeObjectURL(objectUrl);
      setUploadError(
        err instanceof Error
          ? err.message
          : `Failed to process "${file.name}". Please ensure it is a valid image.`
      );
    } finally {
      setIsClassifying(false);
    }
  }, []);

  const handleSampleSelected = useCallback(async (sample: SampleImageItem) => {
    if (!sessionRef.current) {
      setUploadError('Please load an .onnx model file first.');
      return;
    }

    setUploadError(null);
    setIsClassifying(true);
    try {
      const img = await loadImageFromUrl(sample.src, sample.filename);
      const result = await runImageClassification(sessionRef.current, img, {
        filename: sample.filename,
        fileSizeBytes: 0,
        imageUrl: sample.src,
      });

      setHistory((prev) => [result, ...prev]);
      setActiveResultId(result.id);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : `Failed to classify "${sample.filename}".`
      );
    } finally {
      setIsClassifying(false);
    }
  }, []);

  // Support Ctrl+V / Cmd+V image paste only when model is ready
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!sessionRef.current || modelStatus !== 'ready') return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.kind === 'file') {
          const pastedFile = item.getAsFile();
          if (pastedFile) {
            void processFile(pastedFile);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [modelStatus, processFile]);

  const handleClearHistory = useCallback(() => {
    for (const url of createdObjectUrlsRef.current) {
      URL.revokeObjectURL(url);
    }
    createdObjectUrlsRef.current = [];
    setHistory([]);
    setActiveResultId(null);
    setUploadError(null);
  }, []);

  const activeResult =
    history.find((item) => item.id === activeResultId) ?? history[0] ?? null;

  return (
    <div className="min-h-screen flex flex-col paw-pattern-bg text-[#4A3B32]">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <ModelLoaderBar
          modelStatus={modelStatus}
          modelFilename={modelFilename}
          modelError={modelError}
          onSelectModelFile={(file) => void handleSelectModelFile(file)}
          onRetryDefaultModel={() => void loadDefaultModel()}
        />

        <UploadDropzone
          modelStatus={modelStatus}
          isClassifying={isClassifying}
          errorMessage={uploadError}
          onFileSelected={(file) => void processFile(file)}
          onSampleSelected={(sample) => void handleSampleSelected(sample)}
          samples={SAMPLE_IMAGES}
        />

        <ResultsCard
          result={activeResult}
          uncertaintyMargin={uncertaintyMargin}
          onUncertaintyMarginChange={setUncertaintyMargin}
        />

        <PredictionHistoryTable
          history={history}
          activeId={activeResult?.id ?? null}
          uncertaintyMargin={uncertaintyMargin}
          onSelectResult={(record) => setActiveResultId(record.id)}
          onClearHistory={handleClearHistory}
        />
      </main>
    </div>
  );
}
