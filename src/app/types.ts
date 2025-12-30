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
  userId?: string;
  undergrad?: string;
  major?: string;
  cumGPA?: string;
  scienceGPA?: string;
  mcat?: string;
  gradYear?: string;
  experiences?: Experience[];
  extrasScore?: number;
  demographics?: Demographics;
  essays?: EssaysPayload;
  updatedAt?: string;
}

export interface Experience {
  id: string;
  type: string;
  roleTitle: string;
  totalHours: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Demographics {
  age?: string;
  state?: string;
  race?: string;
  gender?: string;
  ses?: string;
  preferredRegions?: string[];
  missionPreferences?: string[];
}

export interface EssaysPayload {
  personalStatement?: string;
}
