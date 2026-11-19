import React, { useRef, useState } from 'react';
import { Upload, AlertCircle, Image as ImageIcon, Loader2, Lock } from 'lucide-react';
import type { ModelLoadStatus, SampleImageItem } from '../types';

interface UploadDropzoneProps {
  modelStatus: ModelLoadStatus;
  isClassifying: boolean;
  errorMessage: string | null;
  onFileSelected: (file: File) => void;
  onSampleSelected: (sample: SampleImageItem) => void;
  samples: SampleImageItem[];
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  modelStatus,
  isClassifying,
  errorMessage,
  onFileSelected,
  onSampleSelected,
  samples,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isModelReady = modelStatus === 'ready';
  const isDisabled = !isModelReady || isClassifying;

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDisabled) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDisabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isDisabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelected(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <section aria-label="Image Upload" className="space-y-3.5">
      <div
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled}
        onClick={() => !isDisabled && inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF7E67] shadow-[0_8px_28px_rgba(140,88,60,0.06)] ${
          !isModelReady
            ? 'border-[#E6D5C7] bg-[#FFF8F2]/80 opacity-80 cursor-not-allowed'
            : isDragging
              ? 'border-[#FF7E67] bg-[#FFF0EA] scale-[1.01] cursor-copy'
              : isClassifying
                ? 'border-[#FF7E67]/70 bg-white opacity-85 cursor-wait'
                : 'border-[#FF7E67]/65 bg-white hover:border-[#FF7E67] hover:bg-[#FFF9F5] hover:scale-[1.006] cursor-pointer'
        }`}
      >
        {/* Subtle decorative corner cat-ear & paw SVG accents */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 left-6 h-12 w-12 text-[#F48FB1]/20 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:-rotate-6"
          viewBox="0 0 48 48"
          fill="currentColor"
        >
          <path d="M10 38 C10 24, 14 10, 20 8 C24 16, 26 20, 28 20 C30 20, 32 16, 36 8 C42 10, 44 24, 44 38 Z" />
        </svg>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-1 right-7 h-12 w-12 text-[#5B9BD5]/20 transition-transform duration-300 group-hover:translate-y-0.5 group-hover:rotate-6"
          viewBox="0 0 48 48"
          fill="currentColor"
        >
          <ellipse cx="24" cy="30" rx="9" ry="7.5" />
          <circle cx="14" cy="18" r="4" />
          <circle cx="21" cy="14" r="4" />
          <circle cx="29" cy="14" r="4" />
          <circle cx="35" cy="19" r="3.8" />
        </svg>

        <input
          ref={inputRef}
          type="file"
          disabled={isDisabled}
          accept=".jpg,.jpeg,.png,.bmp,.webp,image/jpeg,image/png,image/bmp,image/webp"
          onChange={handleInputChange}
          className="sr-only"
          aria-label="Upload an image file for Cat vs. Dog classification"
        />

        <div className="relative px-6 py-8 sm:py-10 flex flex-col items-center text-center">
          {/* Cozy icon badge with cute cat/dog ear silhouettes */}
          <div className="relative mb-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-transform duration-200 ${
                !isModelReady
                  ? 'border-[#EBD9C8] bg-[#FFF5EB] text-[#B39886]'
                  : isDragging
                    ? 'border-[#FF7E67]/50 bg-[#FFE4DC] text-[#E65C44] scale-110'
                    : 'border-[#F3E5D8] bg-[#FFF5EB] text-[#FF7E67] group-hover:scale-105'
              }`}
            >
              {isClassifying ? (
                <Loader2 className="h-6 w-6 animate-spin text-[#FF7E67]" />
              ) : !isModelReady ? (
                <Lock className="h-6 w-6" />
              ) : (
                <Upload className="h-6 w-6" />
              )}
            </div>
            <span
              aria-hidden="true"
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-[#F3E5D8] bg-white text-xs shadow-sm"
            >
              {isModelReady ? '🐾' : '💤'}
            </span>
          </div>

          <h2 className="font-display text-lg sm:text-xl font-bold text-[#3E2C23]">
            {!isModelReady
              ? modelStatus === 'loading'
                ? 'Warming up the pet detector…'
                : 'Load an .onnx model above to wake up the classifier!'
              : isClassifying
                ? 'Sniffing pixels...'
                : isDragging
                  ? 'Yay! Drop your fur-baby photo!'
                  : 'Drop a fur-baby photo here!'}
          </h2>

          <p className="mt-1.5 text-sm text-[#7A6254] max-w-lg">
            Supports{' '}
            <span className="rounded-full bg-[#FFF5EB] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#6E5649]">
              JPG
            </span>{' '}
            <span className="rounded-full bg-[#FFF5EB] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#6E5649]">
              PNG
            </span>{' '}
            <span className="rounded-full bg-[#FFF5EB] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#6E5649]">
              BMP
            </span>{' '}
            <span className="rounded-full bg-[#FFF5EB] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#6E5649]">
              WEBP
            </span>{' '}
            · Resized to <span className="font-mono text-xs font-semibold text-[#5C473B]">96×96</span> right in your browser!
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!isDisabled) inputRef.current?.click();
              }}
              disabled={isDisabled}
              className="inline-flex items-center gap-2 rounded-full bg-[#FF7E67] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(255,126,103,0.32)] hover:bg-[#F46850] hover:scale-[1.03] active:scale-[0.98] disabled:bg-[#DFCFC2] disabled:text-[#8E796B] disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Pick a Pet Photo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick sample bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#F3E5D8] bg-white px-5 py-3 shadow-[0_4px_16px_rgba(140,88,60,0.04)]">
        <span className="text-xs font-bold text-[#6E5649]">
          ✨ Try a cute sample pet
        </span>
        <div className="flex flex-wrap items-center gap-2.5">
          {samples.map((sample) => (
            <button
              key={sample.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onSampleSelected(sample)}
              className="inline-flex items-center gap-2 rounded-full border border-[#F3E5D8] bg-[#FFF5EB]/70 px-3 py-1.5 text-xs font-bold text-[#4A3B32] hover:border-[#FF7E67]/60 hover:bg-[#FFF0EA] hover:scale-[1.03] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <img
                src={sample.src}
                alt={sample.label}
                referrerPolicy="no-referrer"
                className="h-6 w-6 rounded-full border border-white object-cover shadow-sm"
              />
              <span>{sample.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* File validation or inference error banner */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-sm"
        >
          <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
          <div className="leading-snug font-medium">{errorMessage}</div>
        </div>
      )}
    </section>
  );
};
