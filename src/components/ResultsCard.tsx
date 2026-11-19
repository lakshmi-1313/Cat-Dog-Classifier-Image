import React from 'react';
import { motion } from 'motion/react';
import { SlidersHorizontal, Clock, Maximize2, Cpu, Sparkles, ShieldAlert } from 'lucide-react';
import type { ClassificationResult } from '../types';
import { evaluatePrediction, formatBytes } from '../lib/classifier';

interface ResultsCardProps {
  result: ClassificationResult | null;
  uncertaintyMargin: number; // Percentage around 50%, e.g., 42 means ±42% (92% min confidence)
  onUncertaintyMarginChange: (margin: number) => void;
}

const DEFAULT_MARGIN = 15;

export const ResultsCard: React.FC<ResultsCardProps> = ({
  result,
  uncertaintyMargin,
  onUncertaintyMarginChange,
}) => {
  const lowerBound = Math.max(0, 50 - uncertaintyMargin);
  const upperBound = Math.min(100, 50 + uncertaintyMargin);
  const minConfidenceRequired = 50 + uncertaintyMargin;

  if (!result) {
    return (
      <section
        aria-label="Classification Results"
        className="rounded-3xl border border-[#F3E5D8] bg-white p-6 sm:p-8 shadow-[0_8px_28px_rgba(140,88,60,0.06)]"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1.5">
            <h2 className="font-display text-lg font-bold text-[#3E2C23]">
              🐾 Pet Detective Results
            </h2>
            <p className="text-sm text-[#7A6254] max-w-xl">
              Drop a cute cat or dog photo above to see who the model thinks it is, along with confidence scores, pet pre-check, and browser inference speed!
            </p>
          </div>

          {/* Interactive threshold control remains immediately accessible */}
          <div className="w-full lg:w-84 rounded-2xl border border-[#F3E5D8] bg-[#FFF5EB]/70 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="uncertainty-slider-empty"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A3B32]"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#FF7E67]" />
                <span>Min Confidence / Uncertainty</span>
              </label>
              <span className="rounded-full bg-white border border-[#F3E5D8] px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-[#3E2C23]">
                {minConfidenceRequired}% (±{uncertaintyMargin}%)
              </span>
            </div>
            <input
              id="uncertainty-slider-empty"
              type="range"
              min={0}
              max={49}
              step={1}
              value={uncertaintyMargin}
              onChange={(e) => onUncertaintyMarginChange(Number(e.target.value))}
              className="precision-slider w-full"
            />
            <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[#7A6254]">
              <span>Uncertain zone: {lowerBound}%–{upperBound}%</span>
              <span>Default: 65% (±15%)</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const evaluation = evaluatePrediction(
    result.probabilityDog,
    uncertaintyMargin,
    result.oodCheck
  );
  const dogPercent = result.probabilityDog * 100;
  const catPercent = result.probabilityCat * 100;

  const detectedNonPetHint =
    result.oodCheck?.topNonPetLabel
      ? `Spotted "${result.oodCheck.topNonPetLabel}"`
      : null;

  const badgeConfig =
    evaluation.label === 'NotPet'
      ? {
          text: 'Not a Cat or Dog / Not Sure 🤔',
          containerClass:
            'border-[#E6C9C5] bg-gradient-to-r from-[#FDF2F0] to-[#FFF8F6] text-[#8C3B2B] shadow-[0_3px_12px_rgba(200,100,85,0.12)]',
          helperNote:
            'This looks like a person or non-pet object! Our binary classifier only recognizes cats and dogs.',
          subBadge: detectedNonPetHint,
        }
      : evaluation.label === 'Uncertain'
        ? {
            text: 'Not Sure / Uncertain 🤔',
            containerClass:
              'border-amber-200 bg-gradient-to-r from-amber-50 to-[#FFF5EB] text-amber-900 shadow-[0_3px_12px_rgba(245,158,11,0.12)]',
            helperNote:
              'Low confidence or non-pet image detected — try uploading a clearer photo of a cat or dog.',
            subBadge: `${evaluation.rawLeaning} lean at ${evaluation.confidencePercent.toFixed(1)}% (< ${minConfidenceRequired}%)`,
          }
        : evaluation.label === 'Dog'
          ? {
              text: 'Dog 🐶',
              containerClass:
                'border-[#5B9BD5]/40 bg-gradient-to-r from-[#EBF4FC] to-[#F4F9FE] text-[#285A8A] shadow-[0_3px_12px_rgba(91,155,213,0.16)]',
              helperNote: null,
              subBadge: 'Woof! Sigmoid p ≥ 0.500',
            }
          : {
              text: 'Cat 🐱',
              containerClass:
                'border-[#F48FB1]/45 bg-gradient-to-r from-[#FCEBF1] to-[#FFF4F8] text-[#8F2D52] shadow-[0_3px_12px_rgba(244,143,177,0.18)]',
              helperNote: null,
              subBadge: 'Meow! Sigmoid p < 0.500',
            };

  return (
    <section
      aria-label="Classification Results"
      className="rounded-3xl border border-[#F3E5D8] bg-white overflow-hidden shadow-[0_8px_28px_rgba(140,88,60,0.07)]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left Column: Uploaded Image + Original Dimensions */}
        <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#F3E5D8] bg-[#FFF8F2]/80 p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="relative flex items-center justify-center rounded-2xl border border-[#F3E5D8] bg-white overflow-hidden min-h-[260px] sm:min-h-[300px] shadow-inner">
            <img
              src={result.imageUrl}
              alt={`Uploaded specimen: ${result.filename}`}
              referrerPolicy="no-referrer"
              className="max-h-[340px] w-full object-contain"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="min-w-0">
              <div className="text-sm font-bold text-[#3E2C23] truncate max-w-[240px]">
                {result.filename}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#7A6254]">
                <span className="inline-flex items-center gap-1 font-mono tabular-nums text-[#5C473B]">
                  <Maximize2 className="h-3 w-3 text-[#FF7E67]" />
                  {result.originalWidth} × {result.originalHeight} px
                </span>
                <span aria-hidden="true">·</span>
                <span>{formatBytes(result.fileSizeBytes)}</span>
              </div>
            </div>

            {/* 96x96 preprocessed tensor thumbnail */}
            <div className="flex items-center gap-2.5 rounded-2xl border border-[#F3E5D8] bg-white px-3 py-1.5 shadow-sm">
              <img
                src={result.preprocessedPreviewUrl}
                alt="96 by 96 model input preview"
                className="h-8 w-8 rounded-lg border border-[#F3E5D8] object-cover"
              />
              <div className="text-[11px] leading-tight">
                <div className="font-bold text-[#4A3B32]">Tensor Input</div>
                <div className="font-mono tabular-nums text-[#8A7060]">96×96×3</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Prediction Badge, Metrics, Probability Bars & Threshold Slider */}
        <div className="lg:col-span-7 p-5 sm:p-7 flex flex-col justify-between gap-6">
          <div className="space-y-6">
            {/* Celebratory top prediction row */}
            <div className="space-y-3 pb-5 border-b border-[#F3E5D8]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8A7060]">
                    <Sparkles className="h-3.5 w-3.5 text-[#FF7E67]" />
                    <span>Predicted Pet</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-5 py-2 font-display text-xl font-bold tracking-tight ${badgeConfig.containerClass}`}
                    >
                      {badgeConfig.text}
                    </span>
                    {badgeConfig.subBadge && (
                      <span className="rounded-full bg-[#FFF5EB] px-3 py-1 text-xs font-semibold text-[#6E5649]">
                        {badgeConfig.subBadge}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-[#FFF8F2] border border-[#F3E5D8] px-3.5 py-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A7060]">
                      Confidence
                    </div>
                    <div className="mt-0.5 text-2xl font-bold font-mono tabular-nums text-[#3E2C23]">
                      {evaluation.confidencePercent.toFixed(1)}
                      <span className="text-sm font-normal text-[#8A7060] ml-0.5">%</span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#FFF8F2] border border-[#F3E5D8] px-3.5 py-2">
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#8A7060]">
                      <Clock className="h-3 w-3 text-[#FF7E67]" />
                      <span>Latency</span>
                    </div>
                    <div className="mt-0.5 text-2xl font-bold font-mono tabular-nums text-[#3E2C23]">
                      {result.latencyMs.toFixed(1)}
                      <span className="text-sm font-normal text-[#8A7060] ml-1">ms</span>
                    </div>
                  </div>
                </div>
              </div>

              {badgeConfig.helperNote && (
                <div className="flex items-start gap-2 rounded-2xl border border-[#F3E5D8] bg-[#FFF8F2] px-4 py-2.5 text-xs font-medium text-[#6E5649]">
                  <ShieldAlert className="h-4 w-4 text-[#FF7E67] mt-0.5 shrink-0" />
                  <span>{badgeConfig.helperNote}</span>
                </div>
              )}
            </div>

            {/* Chunky Pill-Shaped Probability Progress Bars */}
            <div className="space-y-4">
              {/* Dog probability bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-[#3E2C23]">
                    Dog 🐶{' '}
                    <span className="text-xs font-semibold text-[#8A7060] ml-1">
                      (p × 100%)
                    </span>
                  </span>
                  <span className="rounded-full bg-[#EBF4FC] px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-[#285A8A]">
                    {dogPercent.toFixed(2)}%
                  </span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-[#EDF4FB] p-0.5 border border-[#DCEAF8]">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: Math.max(0.01, dogPercent / 100) }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ originX: 0 }}
                    className="h-full w-full rounded-full bg-[#5B9BD5]"
                  />
                </div>
              </div>

              {/* Cat probability bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-[#3E2C23]">
                    Cat 🐱{' '}
                    <span className="text-xs font-semibold text-[#8A7060] ml-1">
                      ((1 − p) × 100%)
                    </span>
                  </span>
                  <span className="rounded-full bg-[#FCEBF1] px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-[#8F2D52]">
                    {catPercent.toFixed(2)}%
                  </span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-[#FDF0F5] p-0.5 border border-[#FADBE7]">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: Math.max(0.01, catPercent / 100) }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ originX: 0 }}
                    className="h-full w-full rounded-full bg-[#F48FB1]"
                  />
                </div>
              </div>
            </div>

            {/* Sigmoid Decision Boundary Scale */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-[#7A6254]">
                <span className="font-semibold">
                  Sigmoid Output Scale (p = {result.probabilityDog.toFixed(4)})
                </span>
                <span className="font-mono tabular-nums">
                  Uncertain band: {lowerBound}% – {upperBound}%
                </span>
              </div>
              <div className="relative h-5 w-full rounded-full bg-[#FFF5EB] border border-[#F3E5D8] overflow-hidden">
                {/* Highlighted uncertainty margin around 50% */}
                <div
                  className="absolute inset-y-0 bg-amber-200/70 border-x border-amber-400/70 transition-all duration-150"
                  style={{
                    left: `${lowerBound}%`,
                    width: `${Math.max(0, upperBound - lowerBound)}%`,
                  }}
                />
                {/* 50% center threshold line */}
                <div
                  className="absolute inset-y-0 w-px bg-[#C9B3A2]"
                  style={{ left: '50%' }}
                />
                {/* Current prediction marker */}
                <div
                  className="absolute top-0 bottom-0 w-1.5 -ml-[3px] rounded-full bg-[#FF7E67] shadow-sm transition-all duration-200"
                  style={{ left: `${dogPercent}%` }}
                  title={`p = ${result.probabilityDog.toFixed(4)}`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-[#8A7060]">
                <span>0.0 (Cat 🐱)</span>
                <span>0.5</span>
                <span>1.0 (Dog 🐶)</span>
              </div>
            </div>
          </div>

          {/* Uncertainty Threshold Slider */}
          <div className="rounded-2xl border border-[#F3E5D8] bg-[#FFF5EB]/70 p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="uncertainty-slider"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3E2C23]"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#FF7E67]" />
                <span>Min Confidence / Uncertainty Margin</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white border border-[#F3E5D8] px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-[#3E2C23]">
                  {minConfidenceRequired}% min (±{uncertaintyMargin}% around 50%)
                </span>
                {uncertaintyMargin !== DEFAULT_MARGIN && (
                  <button
                    type="button"
                    onClick={() => onUncertaintyMarginChange(DEFAULT_MARGIN)}
                    className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#FF7E67] border border-[#F3E5D8] hover:bg-[#FFF0EA] cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <input
              id="uncertainty-slider"
              type="range"
              min={0}
              max={49}
              step={1}
              value={uncertaintyMargin}
              onChange={(e) => onUncertaintyMarginChange(Number(e.target.value))}
              className="precision-slider w-full"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#7A6254]">
              <span>
                Flags predictions below{' '}
                <code className="font-mono text-[#4A3B32] bg-white px-1.5 py-0.5 rounded-full border border-[#F3E5D8]">
                  {minConfidenceRequired}%
                </code>{' '}
                confidence (<code className="font-mono text-[#4A3B32]">|p − 0.5| &lt; {(uncertaintyMargin / 100).toFixed(2)}</code>) as Uncertain 🤔
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[#6E5649]">
                <Cpu className="h-3 w-3 text-[#FF7E67]" />
                input_layer_6 → Identity:0
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
