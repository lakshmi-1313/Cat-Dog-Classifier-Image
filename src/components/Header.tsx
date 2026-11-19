import React from 'react';
import { Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-[#F3E5D8] bg-[#FFF5EB]/85 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#3E2C23] text-balance">
              🐾 Cat vs. Dog AI Classifier
            </h1>
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-[#F3E5D8] bg-white px-4 py-1.5 text-xs font-semibold text-[#6E5649] shadow-[0_2px_10px_rgba(140,88,60,0.05)]">
              <Sparkles className="h-3.5 w-3.5 text-[#FF7E67] shrink-0" />
              <span>MobileNetV2 Transfer</span>
              <span aria-hidden="true" className="text-[#E6D0BE]">•</span>
              <span className="font-mono tabular-nums text-[#4A3B32]">95.7% Test Accuracy</span>
              <span aria-hidden="true" className="text-[#E6D0BE]">•</span>
              <span className="font-mono tabular-nums text-[#4A3B32]">0.989 ROC-AUC</span>
              <span aria-hidden="true" className="text-[#E6D0BE]">•</span>
              <span className="text-[#FF7E67]">Client-Side ONNX</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
