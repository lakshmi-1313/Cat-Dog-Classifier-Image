import React from 'react';
import { Trash2, History } from 'lucide-react';
import type { ClassificationResult } from '../types';
import { evaluatePrediction } from '../lib/classifier';

interface PredictionHistoryTableProps {
  history: ClassificationResult[];
  activeId: string | null;
  uncertaintyMargin: number;
  onSelectResult: (record: ClassificationResult) => void;
  onClearHistory: () => void;
}

export const PredictionHistoryTable: React.FC<PredictionHistoryTableProps> = ({
  history,
  activeId,
  uncertaintyMargin,
  onSelectResult,
  onClearHistory,
}) => {
  return (
    <section
      aria-label="Session Prediction History"
      className="rounded-3xl border border-[#F3E5D8] bg-white overflow-hidden shadow-[0_8px_28px_rgba(140,88,60,0.06)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[#F3E5D8] bg-[#FFF8F2]/70">
        <div className="flex items-center gap-2.5">
          <History className="h-4 w-4 text-[#FF7E67]" />
          <h2 className="font-display text-base font-bold text-[#3E2C23]">
            Session Prediction History
          </h2>
          <span className="rounded-full bg-white border border-[#F3E5D8] px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-[#7A6254]">
            {history.length} {history.length === 1 ? 'pet' : 'pets'}
          </span>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          disabled={history.length === 0}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#F3E5D8] bg-white px-3.5 py-1.5 text-xs font-bold text-[#6E5649] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      {history.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="font-display text-sm font-bold text-[#5C473B]">
            No fur-babies checked yet! 🐾
          </p>
          <p className="mt-1 text-xs text-[#8A7060]">
            Every photo you classify will appear right here with timestamps, probabilities, and inference speed.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F3E5D8] bg-[#FFFDF9] text-[11px] font-bold uppercase tracking-wider text-[#8A7060]">
                <th scope="col" className="py-3 pl-6 pr-3 whitespace-nowrap">Time</th>
                <th scope="col" className="py-3 px-3 whitespace-nowrap">Filename</th>
                <th scope="col" className="py-3 px-3 whitespace-nowrap">Prediction</th>
                <th scope="col" className="py-3 px-3 text-right whitespace-nowrap">Confidence</th>
                <th scope="col" className="py-3 px-3 text-right whitespace-nowrap">Dog %</th>
                <th scope="col" className="py-3 px-3 text-right whitespace-nowrap">Cat %</th>
                <th scope="col" className="py-3 pl-3 pr-6 text-right whitespace-nowrap">Inference Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7ECE2] text-sm">
              {history.map((item) => {
                const evaluation = evaluatePrediction(
                  item.probabilityDog,
                  uncertaintyMargin,
                  item.oodCheck
                );
                const isSelected = item.id === activeId;
                const predictionText =
                  evaluation.label === 'NotPet'
                    ? 'Not a Cat or Dog / Not Sure 🤔'
                    : evaluation.label === 'Uncertain'
                      ? 'Not Sure / Uncertain 🤔'
                      : evaluation.label === 'Dog'
                        ? 'Dog 🐶'
                        : 'Cat 🐱';

                const predictionPill =
                  evaluation.label === 'NotPet'
                    ? 'bg-[#FDF2F0] text-[#8C3B2B] border-[#E6C9C5]'
                    : evaluation.label === 'Uncertain'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : evaluation.label === 'Dog'
                        ? 'bg-[#EBF4FC] text-[#285A8A] border-[#5B9BD5]/35'
                        : 'bg-[#FCEBF1] text-[#8F2D52] border-[#F48FB1]/40';

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectResult(item)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFF0EA]/70'
                        : 'hover:bg-[#FFF5EB]/85'
                    }`}
                  >
                    <td className="py-3 pl-6 pr-3 font-mono text-xs tabular-nums text-[#8A7060] whitespace-nowrap">
                      {item.timestamp}
                    </td>
                    <td className="py-3 px-3 max-w-[220px]">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.imageUrl}
                          alt={item.filename}
                          referrerPolicy="no-referrer"
                          className="h-8 w-8 rounded-xl border border-[#F3E5D8] object-cover shrink-0 shadow-xs"
                        />
                        <span className="truncate font-semibold text-[#3E2C23]">
                          {item.filename}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-bold ${predictionPill}`}
                      >
                        {predictionText}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs font-bold tabular-nums text-[#3E2C23] whitespace-nowrap">
                      {evaluation.confidencePercent.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs font-semibold tabular-nums text-[#285A8A] whitespace-nowrap">
                      {(item.probabilityDog * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs font-semibold tabular-nums text-[#8F2D52] whitespace-nowrap">
                      {(item.probabilityCat * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 pl-3 pr-6 text-right font-mono text-xs tabular-nums text-[#7A6254] whitespace-nowrap">
                      {item.latencyMs.toFixed(1)} ms
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
