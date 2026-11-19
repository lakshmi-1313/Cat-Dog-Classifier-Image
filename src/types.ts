export type ModelLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export type PredictedClass = 'Dog' | 'Cat' | 'Uncertain' | 'NotPet';

export interface DetectedObjectItem {
  className: string;
  score: number;
}

export interface OodCheckResult {
  status: 'pet_detected' | 'non_pet' | 'unavailable';
  isPet: boolean;
  detectedLabels: DetectedObjectItem[];
  topNonPetLabel: string | null;
}

export interface ClassificationResult {
  id: string;
  timestamp: string;
  filename: string;
  fileSizeBytes: number;
  imageUrl: string;
  originalWidth: number;
  originalHeight: number;
  probabilityDog: number; // Sigmoid output p in [0, 1]
  probabilityCat: number; // 1 - p
  latencyMs: number;
  preprocessedPreviewUrl: string;
  oodCheck: OodCheckResult;
}

export interface SampleImageItem {
  id: string;
  label: string;
  filename: string;
  src: string;
}
