export interface Capability {
  icon: string;
  title: string;
  colour: string;
  description: string;
  points: string[];
}

export interface UseCase {
  icon: string;
  sector: string;
  example: string;
}

export interface HowItWorksStep {
  step: string;
  title: string;
  detail: string;
}
