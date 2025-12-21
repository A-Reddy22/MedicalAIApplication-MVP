export interface MatchResult {
  schoolId: string;
  name: string;
  matchScore: number;
  gpaScore: number | null;
  mcatScore: number | null;
  gpaMedian: number | null;
  mcatMedian: number | null;
}

export interface SubmittedProfilePayload {
  name: string;
  undergrad?: string;
  major?: string;
  cumGPA?: string;
  scienceGPA?: string;
  mcat?: string;
  gradYear?: string;
  experiences?: unknown[];
  updatedAt?: string;
}
