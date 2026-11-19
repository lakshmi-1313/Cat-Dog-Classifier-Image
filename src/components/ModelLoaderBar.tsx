import React, { useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FolderOpen,
  AlertCircle,
  PawPrint,
  RotateCw,
} from 'lucide-react';
import type { ModelLoadStatus } from '../types';

interface ModelLoaderBarProps {
  modelStatus: ModelLoadStatus;
  modelFilename: string | null;
  modelError: string | null;
  onSelectModelFile: (file: File) => void;
  onRetryDefaultModel: () => void;
}

export const ModelLoaderBar: React.FC<ModelLoaderBarProps> = ({
  modelStatus,
  modelFilename,
  modelError,
  onSelectModelFile,
  onRetryDefaultModel,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectModelFile(file);
    }
    e.target.value = '';
  };

  return (
    <section
      aria-label="Model Status & Loader"
      className="rounded-3xl border border-[#F3E5D8] bg-white px-5 sm:px-6 py-3.5 shadow-[0_6px_24px_rgba(140,88,60,0.06)]"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-[#3E2C23] whitespace-nowrap">
            <PawPrint className="h-4 w-4 text-[#FF7E67]" />
            <span>Model Status</span>
          </span>

          {modelStatus === 'loading' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C6DDF4] bg-[#EEF6FC] px-3.5 py-1 text-xs font-semibold text-[#2E5E8C] whitespace-nowrap">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#5B9BD5] shrink-0" />
              <span>Loading final_cat_dog_model.onnx…</span>
            </span>
          )}

          {modelStatus === 'ready' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 max-w-full">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">
                Model ready:{' '}
                <span className="font-mono font-semibold">
                  {modelFilename ?? 'final_cat_dog_model.onnx'}
                </span>
              </span>
            </span>
          )}

          {(modelStatus === 'idle' || modelStatus === 'error') && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-semibold text-amber-800 whitespace-nowrap">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>No model loaded</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".onnx"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Select ONNX model file"
          />

          {modelStatus === 'error' && (
            <button
              type="button"
              onClick={onRetryDefaultModel}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#F3E5D8] bg-[#FFF8F2] px-3 py-1.5 text-xs font-semibold text-[#5C473B] hover:bg-[#FFF0EA] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          )}

          <button
            type="button"
            disabled={modelStatus === 'loading'}
            onClick={() => fileInputRef.current?.click()}
            className={`inline-flex items-center gap-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 ${
              modelStatus === 'ready'
                ? 'px-2.5 py-1 text-[11px] font-semibold text-[#8A7060] hover:text-[#4A3B32] hover:bg-[#FFF5EB]'
                : 'border border-[#F3E5D8] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#6E5649] hover:bg-[#FFF5EB] hover:text-[#3E2C23]'
            }`}
          >
            <FolderOpen className="h-3 w-3" />
            <span>
              {modelStatus === 'ready' ? 'Change Model (.onnx)' : 'Load Model (.onnx)'}
            </span>
          </button>
        </div>
      </div>

      {modelStatus === 'error' && modelError && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800"
        >
          <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
          <span>
            Unable to auto-load <code className="font-mono">/final_cat_dog_model.onnx</code> ({modelError}). You can retry or select a local <code className="font-mono">.onnx</code> file.
          </span>
        </div>
      )}
    </section>
  );
};
