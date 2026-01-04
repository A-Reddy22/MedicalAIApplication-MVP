export interface MatchResult {
  schoolId: string;
  name: string;
  matchScore: number;
  gpaScore: number | null;
  mcatScore: number | null;
  gpaMedian: number | null;
  mcatMedian: number | null;
}

export type PreferNotToSay = "prefer_not_to_say";

export interface ApplicantAcademic {
  fullName: string;
  undergradInstitution: string;
  major: string;
  cumulativeGPA: number;
  scienceGPA: number;
  mcatTotal: number;
  mcatBreakdown: {
    chemPhys: number;
    cars: number;
    bioBiochem: number;
    psychSoc: number;
  };
  graduationYear: number;
}

export interface ApplicantDemographics {
  age: number;
  stateOfResidence: string | PreferNotToSay;
  raceEthnicity: string | PreferNotToSay;
  gender: string | PreferNotToSay;
  socioeconomicStatus: string | PreferNotToSay;
  geographicPreferences: string[];
  missionPreferences: string[];
}

export interface ApplicantProfile {
  academic: ApplicantAcademic;
  demographics: ApplicantDemographics;
}

export interface LegacyDemographics {
  age?: string;
  state?: string;
  race?: string;
  gender?: string;
  ses?: string;
  preferredRegions?: string[];
  missionPreferences?: string[];
}

export interface SubmittedProfilePayload {
  userId?: string;
  applicantProfile: ApplicantProfile;
  experiences?: Experience[];
  extrasScore?: number;
  essays?: EssaysPayload;
  updatedAt?: string;
  // Legacy fields for compatibility with older stored profiles.
  name?: string;
  undergrad?: string;
  major?: string;
  cumGPA?: string;
  scienceGPA?: string;
  mcat?: string;
  gradYear?: string;
  demographics?: LegacyDemographics;
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

export interface EssaysPayload {
  personalStatement?: string;
}
