import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "./ui/badge";
import {
  ApplicantProfile,
  Experience,
  MatchResult,
  PreferNotToSay,
  SubmittedProfilePayload,
} from "../types";
import { apiUrl } from "../lib/api";

interface ProfileIntakeProps {
  onMatchesGenerated?: (matches: MatchResult[]) => void;
  onProfileSaved?: (profile: SubmittedProfilePayload & { id?: string }) => void;
  defaultName?: string;
  profile?: (SubmittedProfilePayload & { id?: string }) | null;
}

type ApplicantProfileDraft = {
  academic: {
    fullName: string;
    undergradInstitution: string;
    major: string;
    cumulativeGPA: string;
    scienceGPA: string;
    mcatTotal: string;
    mcatBreakdown: {
      chemPhys: string;
      cars: string;
      bioBiochem: string;
      psychSoc: string;
    };
    graduationYear: string;
  };
  demographics: {
    age: string;
    stateOfResidence: string;
    raceEthnicity: string;
    gender: string;
    socioeconomicStatus: string;
    geographicPreferences: string[];
    missionPreferences: string[];
  };
};

const PREFER_NOT_TO_SAY: PreferNotToSay = "prefer_not_to_say";

export default function ProfileIntake({ onMatchesGenerated, onProfileSaved, defaultName, profile }: ProfileIntakeProps) {
  const [applicantProfile, setApplicantProfile] = useState<ApplicantProfileDraft>(() => ({
    academic: {
      fullName: defaultName ?? "",
      undergradInstitution: "",
      major: "",
      cumulativeGPA: "",
      scienceGPA: "",
      mcatTotal: "",
      mcatBreakdown: {
        chemPhys: "",
        cars: "",
        bioBiochem: "",
        psychSoc: "",
      },
      graduationYear: "",
    },
    demographics: {
      age: "",
      stateOfResidence: "",
      raceEthnicity: "",
      gender: "",
      socioeconomicStatus: "",
      geographicPreferences: [],
      missionPreferences: [],
    },
  }));
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [experienceErrors, setExperienceErrors] = useState<Record<string, Partial<Record<keyof Experience, string>>>>(
    {}
  );
  const [newExperienceErrors, setNewExperienceErrors] = useState<Partial<Record<keyof Experience, string>>>({});
  const [personalStatement, setPersonalStatement] = useState("");
  const createExperienceId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
  const [newExperience, setNewExperience] = useState<Experience>(() => ({
    id: createExperienceId(),
    type: "Clinical Volunteering",
    roleTitle: "",
    totalHours: Number.NaN,
    description: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const buildEmptyProfile = (nameOverride?: string): ApplicantProfileDraft => ({
    academic: {
      fullName: nameOverride ?? "",
      undergradInstitution: "",
      major: "",
      cumulativeGPA: "",
      scienceGPA: "",
      mcatTotal: "",
      mcatBreakdown: {
        chemPhys: "",
        cars: "",
        bioBiochem: "",
        psychSoc: "",
      },
      graduationYear: "",
    },
    demographics: {
      age: "",
      stateOfResidence: "",
      raceEthnicity: "",
      gender: "",
      socioeconomicStatus: "",
      geographicPreferences: [],
      missionPreferences: [],
    },
  });

  const normalizePreferNotToSay = (value?: string | null) => {
    if (!value) return "";
    const normalized = value.trim().toLowerCase();
    if (normalized === "prefer not to say" || normalized === PREFER_NOT_TO_SAY) {
      return PREFER_NOT_TO_SAY;
    }
    return value;
  };

  const toDraftNumber = (value?: number | string | null) =>
    value === null || value === undefined || Number.isNaN(value) ? "" : String(value);

  useEffect(() => {
    const baseProfile = buildEmptyProfile(defaultName ?? "");
    const academic = profile?.applicantProfile?.academic;
    const demographics = profile?.applicantProfile?.demographics;
    const fallbackDemographics = profile?.demographics;
    setApplicantProfile({
      academic: {
        fullName: academic?.fullName ?? profile?.name ?? baseProfile.academic.fullName,
        undergradInstitution: academic?.undergradInstitution ?? profile?.undergrad ?? baseProfile.academic.undergradInstitution,
        major: academic?.major ?? profile?.major ?? baseProfile.academic.major,
        cumulativeGPA: toDraftNumber(academic?.cumulativeGPA ?? profile?.cumGPA),
        scienceGPA: toDraftNumber(academic?.scienceGPA ?? profile?.scienceGPA),
        mcatTotal: toDraftNumber(academic?.mcatTotal ?? profile?.mcat),
        mcatBreakdown: {
          chemPhys: toDraftNumber(academic?.mcatBreakdown?.chemPhys),
          cars: toDraftNumber(academic?.mcatBreakdown?.cars),
          bioBiochem: toDraftNumber(academic?.mcatBreakdown?.bioBiochem),
          psychSoc: toDraftNumber(academic?.mcatBreakdown?.psychSoc),
        },
        graduationYear: toDraftNumber(academic?.graduationYear ?? profile?.gradYear),
      },
      demographics: {
        age: toDraftNumber(demographics?.age ?? fallbackDemographics?.age),
        stateOfResidence: normalizePreferNotToSay(demographics?.stateOfResidence ?? fallbackDemographics?.state),
        raceEthnicity: normalizePreferNotToSay(demographics?.raceEthnicity ?? fallbackDemographics?.race),
        gender: normalizePreferNotToSay(demographics?.gender ?? fallbackDemographics?.gender),
        socioeconomicStatus: normalizePreferNotToSay(demographics?.socioeconomicStatus ?? fallbackDemographics?.ses),
        geographicPreferences:
          demographics?.geographicPreferences ?? fallbackDemographics?.preferredRegions ?? baseProfile.demographics.geographicPreferences,
        missionPreferences:
          demographics?.missionPreferences ?? fallbackDemographics?.missionPreferences ?? baseProfile.demographics.missionPreferences,
      },
    });
    const seedExperience: Experience = {
      id: createExperienceId(),
      type: "Clinical Volunteering",
      roleTitle: "Emergency Room Volunteer",
      totalHours: 150,
      description: "Assisted nursing staff with patient transport and comfort measures...",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const normalizedExperiences = profile?.experiences?.length
      ? profile.experiences.map((experience) => ({
          id: experience.id ? String(experience.id) : createExperienceId(),
          type: experience.type ?? "Clinical Volunteering",
          roleTitle: experience.roleTitle ?? "",
          totalHours:
            typeof experience.totalHours === "number" ? experience.totalHours : Number.parseInt(String(experience.totalHours ?? ""), 10),
          description: experience.description ?? "",
          createdAt: experience.createdAt ?? new Date().toISOString(),
          updatedAt: experience.updatedAt ?? new Date().toISOString(),
        }))
      : [seedExperience];
    setExperiences(normalizedExperiences);
    setPersonalStatement(profile?.essays?.personalStatement ?? "");
    setExperienceErrors({});
    setNewExperienceErrors({});
    setNewExperience({
      id: createExperienceId(),
      type: "Clinical Volunteering",
      roleTitle: "",
      totalHours: Number.NaN,
      description: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }, [profile, defaultName]);

  const preferredRegionOptions = ["West", "Northeast", "Midwest", "South", "No Preference"];
  const missionPreferenceOptions = ["Research-Heavy", "Primary Care", "Rural Medicine", "Urban Health", "No Preference"];
  const experienceTypeOptions = [
    "Clinical Volunteering",
    "Physician Shadowing",
    "Research",
    "Leadership",
    "Community Service",
  ];
  const stateOptions = [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "District of Columbia",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ];

  const updateAcademic = (patch: Partial<ApplicantProfileDraft["academic"]>) => {
    setApplicantProfile((prev) => ({
      ...prev,
      academic: {
        ...prev.academic,
        ...patch,
      },
    }));
  };

  const updateDemographics = (patch: Partial<ApplicantProfileDraft["demographics"]>) => {
    setApplicantProfile((prev) => ({
      ...prev,
      demographics: {
        ...prev.demographics,
        ...patch,
      },
    }));
  };

  const resetNewExperience = () => {
    setNewExperience({
      id: createExperienceId(),
      type: "Clinical Volunteering",
      roleTitle: "",
      totalHours: Number.NaN,
      description: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const validateExperience = (experience: Experience) => {
    const errors: Partial<Record<keyof Experience, string>> = {};
    const typeValue = experience.type?.trim();
    if (!typeValue) {
      errors.type = "Experience type is required.";
    }
    if (!experience.roleTitle?.trim()) {
      errors.roleTitle = "Role/title is required.";
    }
    if (!Number.isInteger(experience.totalHours) || experience.totalHours <= 0) {
      errors.totalHours = "Total hours must be a positive integer.";
    }
    if (!experience.description?.trim()) {
      errors.description = "Description is required.";
    } else if (experience.description.length > 700) {
      errors.description = "Description must be 700 characters or less.";
    }
    return errors;
  };

  const addExperience = () => {
    const errors = validateExperience(newExperience);
    if (Object.keys(errors).length > 0) {
      setNewExperienceErrors(errors);
      return;
    }
    setExperiences((prev) => [
      ...prev,
      {
        ...newExperience,
        createdAt: newExperience.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    setNewExperienceErrors({});
    resetNewExperience();
  };

  const removeExperience = (id: Experience["id"]) => {
    setExperienceErrors((prev) => {
      const next = { ...prev };
      delete next[String(id)];
      return next;
    });

    setExperiences((prev) => prev.filter((exp) => String(exp.id) !== String(id)));
  };

  const updateExperience = (id: Experience["id"], patch: Partial<Experience>) => {
    const updatedAt = new Date().toISOString();

    // build the merged experience from current state for validation
    const existing = experiences.find((exp) => exp.id === id) ?? null;
    const merged: Experience | null = existing ? { ...existing, ...patch, updatedAt } : null;

    // update state (use merged if available, otherwise apply patch defensively)
    setExperiences((prev) =>
      prev.map((experience) =>
        experience.id === id
          ? merged ?? { ...experience, ...patch, updatedAt }
          : experience,
      ),
    );

    // validate the merged object and set errors
    if (merged) {
      setExperienceErrors((prev) => ({
        ...prev,
        [String(id)]: validateExperience(merged),
      }));
    }
  };

  const updateNewExperience = (patch: Partial<Experience>) => {
    const updatedAt = new Date().toISOString();
    setNewExperience((prev) => {
      const updated = { ...prev, ...patch, updatedAt };
      setNewExperienceErrors(validateExperience(updated));
      return updated;
    });
  };

  const experienceSummary = useMemo(() => {
    return experiences.reduce(
      (acc, experience) => {
        const typeKey = experienceTypeOptions.includes(experience.type)
          ? experience.type
          : "Other";
        const hours = Number.isFinite(experience.totalHours) ? experience.totalHours : 0;
        switch (typeKey) {
          case "Clinical Volunteering":
            acc.clinical += hours;
            break;
          case "Research":
            acc.research += hours;
            break;
          case "Physician Shadowing":
            acc.shadowing += hours;
            break;
          case "Community Service":
            acc.community += hours;
            break;
          case "Leadership":
            acc.leadership += hours;
            break;
          default:
            acc.other += hours;
            break;
        }
        return acc;
      },
      {
        clinical: 0,
        research: 0,
        shadowing: 0,
        community: 0,
        leadership: 0,
        other: 0,
      }
    );
  }, [experiences, experienceTypeOptions]);

  const experienceScore = useMemo(() => {
    const totals = Object.values(experienceSummary);
    const totalHours = totals.reduce((sum, value) => sum + value, 0);
    if (totalHours === 0) {
      return 0;
    }
    const nonZeroCategories = totals.filter((value) => value > 0).length;
    const maxShare = Math.max(...totals) / totalHours;

    // Heuristic: reward total hours with diminishing returns, boost distribution + balance, penalize over-concentration.
    const totalPoints = 50 * (1 - Math.exp(-totalHours / 250));
    const distributionPoints = (nonZeroCategories / totals.length) * 30;
    const balanceBonus =
      experienceSummary.clinical > 0 &&
      experienceSummary.community > 0 &&
      experienceSummary.research > 0
        ? 15
        : 0;
    const concentrationPenalty = maxShare > 0.6 ? (maxShare - 0.6) * 40 : 0;

    return Math.min(100, Math.max(0, Math.round(totalPoints + distributionPoints + balanceBonus - concentrationPenalty)));
  }, [experienceSummary]);

  const toggleDemographicArray = (
    field: "geographicPreferences" | "missionPreferences",
    value: string
  ) => {
    setApplicantProfile((prev) => {
      const current = new Set(prev.demographics[field] ?? []);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      return {
        ...prev,
        demographics: {
          ...prev.demographics,
          [field]: Array.from(current),
        },
      };
    });
  };

  const normalizeApplicantProfile = (): { profile: ApplicantProfile | null; errors: string[] } => {
    const errors: string[] = [];
    const requireText = (value: string, label: string) => {
      if (!value.trim()) {
        errors.push(label);
        return "";
      }
      return value.trim();
    };
    const requireNumber = (value: string, label: string) => {
      if (!value.trim()) {
        errors.push(label);
        return null;
      }
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        errors.push(label);
        return null;
      }
      return parsed;
    };
    const requireArray = (value: string[], label: string) => {
      if (!value || value.length === 0) {
        errors.push(label);
        return [];
      }
      return value;
    };

    const academicDraft = applicantProfile.academic;
    const demographicsDraft = applicantProfile.demographics;

    const normalizedState = normalizePreferNotToSay(demographicsDraft.stateOfResidence);
    const normalizedRace = normalizePreferNotToSay(demographicsDraft.raceEthnicity);
    const normalizedGender = normalizePreferNotToSay(demographicsDraft.gender);
    const normalizedSes = normalizePreferNotToSay(demographicsDraft.socioeconomicStatus);

    if (!normalizedState) errors.push("State of residence");
    if (!normalizedRace) errors.push("Race/ethnicity");
    if (!normalizedGender) errors.push("Gender");
    if (!normalizedSes) errors.push("Socioeconomic status");

    const profile: ApplicantProfile = {
      academic: {
        fullName: requireText(academicDraft.fullName, "Full name"),
        undergradInstitution: requireText(academicDraft.undergradInstitution, "Undergraduate institution"),
        major: requireText(academicDraft.major, "Major"),
        cumulativeGPA: requireNumber(academicDraft.cumulativeGPA, "Cumulative GPA") ?? 0,
        scienceGPA: requireNumber(academicDraft.scienceGPA, "Science GPA") ?? 0,
        mcatTotal: requireNumber(academicDraft.mcatTotal, "MCAT total") ?? 0,
        mcatBreakdown: {
          chemPhys: requireNumber(academicDraft.mcatBreakdown.chemPhys, "MCAT Chem/Phys") ?? 0,
          cars: requireNumber(academicDraft.mcatBreakdown.cars, "MCAT CARS") ?? 0,
          bioBiochem: requireNumber(academicDraft.mcatBreakdown.bioBiochem, "MCAT Bio/Biochem") ?? 0,
          psychSoc: requireNumber(academicDraft.mcatBreakdown.psychSoc, "MCAT Psych/Soc") ?? 0,
        },
        graduationYear: requireNumber(academicDraft.graduationYear, "Graduation year") ?? 0,
      },
      demographics: {
        age: requireNumber(demographicsDraft.age, "Age") ?? 0,
        stateOfResidence: normalizedState as ApplicantProfile["demographics"]["stateOfResidence"],
        raceEthnicity: normalizedRace as ApplicantProfile["demographics"]["raceEthnicity"],
        gender: normalizedGender as ApplicantProfile["demographics"]["gender"],
        socioeconomicStatus: normalizedSes as ApplicantProfile["demographics"]["socioeconomicStatus"],
        geographicPreferences: requireArray(demographicsDraft.geographicPreferences, "Geographic preferences"),
        missionPreferences: requireArray(demographicsDraft.missionPreferences, "Mission preferences"),
      },
    };

    return { profile: errors.length ? null : profile, errors };
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeApplicantProfile();
    if (normalized.errors.length > 0 || !normalized.profile) {
      alert(
        `Please complete all required fields before saving:\n- ${Array.from(new Set(normalized.errors)).join("\n- ")}`
      );
      return;
    }

    if (experiences.length === 0) {
      alert("Please add at least one experience before continuing.");
      return;
    }

    const validationResults = experiences.reduce<Record<string, Partial<Record<keyof Experience, string>>>>(
      (acc, experience) => {
        const errors = validateExperience(experience);
        if (Object.keys(errors).length > 0) {
          acc[experience.id] = errors;
        }
        return acc;
      },
      {}
    );

    if (Object.keys(validationResults).length > 0) {
      setExperienceErrors(validationResults);
      return;
    }

    // Persist the unified applicant profile as a single payload to avoid academic/demographic overwrite.
    const payload: SubmittedProfilePayload = {
      applicantProfile: normalized.profile,
      experiences,
      extrasScore: experienceScore,
      essays: {
        personalStatement,
      },
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(apiUrl("/api/profile"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Save failed", text);
        alert(
          `Failed to save profile: ${text || res.statusText}. Make sure the backend is running on the same PORT/VITE_API_PORT as the dev server.`
        );
        return;
      }

      const data = await res.json();
      const profileId: string | undefined = data.id;
      alert("Profile saved (id: " + (profileId ?? "unknown") + ")");

      const matchRes = await fetch(apiUrl("/api/match"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileId, profile: payload, limit: 30 }),
      });

      if (!matchRes.ok) {
        console.error("Match request failed", await matchRes.text());
        alert("Profile saved but failed to generate matches.");
        return;
      }

      const matchData = await matchRes.json();
      const matches: MatchResult[] = matchData.matches ?? [];
      onMatchesGenerated?.(matches);

      const profileWithId = { ...payload, id: profileId };
      onProfileSaved?.(profileWithId);
    } catch (err) {
      console.error(err);
      alert("Network error while saving profile. Verify the API server is running and reachable.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="mb-2">Your Profile</h1>
        <p className="text-gray-600">
          Complete your academic and extracurricular information for personalized school matching
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="experiences">Experiences</TabsTrigger>
          <TabsTrigger value="essays">Essays</TabsTrigger>
        </TabsList>

        {/* Unified Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
              <CardDescription>Your undergraduate performance and test scores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="e.g., Jane Doe"
                    value={applicantProfile.academic.fullName}
                    onChange={(e) => updateAcademic({ fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="undergrad">Undergraduate Institution</Label>
                  <Input
                    id="undergrad"
                    name="undergrad"
                    placeholder="e.g., UC Berkeley"
                    value={applicantProfile.academic.undergradInstitution}
                    onChange={(e) => updateAcademic({ undergradInstitution: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="major">Major</Label>
                  <Input
                    id="major"
                    name="major"
                    placeholder="e.g., Biology"
                    value={applicantProfile.academic.major}
                    onChange={(e) => updateAcademic({ major: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cumGPA">Cumulative GPA</Label>
                  <Input
                    id="cumGPA"
                    name="cumGPA"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4.0"
                    placeholder="3.75"
                    value={applicantProfile.academic.cumulativeGPA}
                    onChange={(e) => updateAcademic({ cumulativeGPA: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scienceGPA">Science GPA</Label>
                  <Input
                    id="scienceGPA"
                    name="scienceGPA"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4.0"
                    placeholder="3.70"
                    value={applicantProfile.academic.scienceGPA}
                    onChange={(e) => updateAcademic({ scienceGPA: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mcat">MCAT Score</Label>
                  <Input
                    id="mcat"
                    name="mcat"
                    type="number"
                    min="472"
                    max="528"
                    placeholder="515"
                    value={applicantProfile.academic.mcatTotal}
                    onChange={(e) => updateAcademic({ mcatTotal: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mcatChem">MCAT: Chem/Phys</Label>
                  <Input
                    id="mcatChem"
                    name="mcatChem"
                    type="number"
                    min="118"
                    max="132"
                    value={applicantProfile.academic.mcatBreakdown.chemPhys}
                    onChange={(e) =>
                      updateAcademic({
                        mcatBreakdown: { ...applicantProfile.academic.mcatBreakdown, chemPhys: e.target.value },
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mcatCars">MCAT: CARS</Label>
                  <Input
                    id="mcatCars"
                    name="mcatCars"
                    type="number"
                    min="118"
                    max="132"
                    value={applicantProfile.academic.mcatBreakdown.cars}
                    onChange={(e) =>
                      updateAcademic({
                        mcatBreakdown: { ...applicantProfile.academic.mcatBreakdown, cars: e.target.value },
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mcatBio">MCAT: Bio/Biochem</Label>
                  <Input
                    id="mcatBio"
                    name="mcatBio"
                    type="number"
                    min="118"
                    max="132"
                    value={applicantProfile.academic.mcatBreakdown.bioBiochem}
                    onChange={(e) =>
                      updateAcademic({
                        mcatBreakdown: { ...applicantProfile.academic.mcatBreakdown, bioBiochem: e.target.value },
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mcatPsych">MCAT: Psych/Soc</Label>
                  <Input
                    id="mcatPsych"
                    name="mcatPsych"
                    type="number"
                    min="118"
                    max="132"
                    value={applicantProfile.academic.mcatBreakdown.psychSoc}
                    onChange={(e) =>
                      updateAcademic({
                        mcatBreakdown: { ...applicantProfile.academic.mcatBreakdown, psychSoc: e.target.value },
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradYear">Expected Graduation Year</Label>
                <Select value={applicantProfile.academic.graduationYear} onValueChange={(value) => updateAcademic({ graduationYear: value })}>
                  <SelectTrigger id="gradYear">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demographics & Preferences</CardTitle>
              <CardDescription>
                Required information to support mission fit and regional alignment. Prefer not to say is accepted and neutral.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="22"
                    value={applicantProfile.demographics.age}
                    onChange={(e) => updateDemographics({ age: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State of Residence</Label>
                  <Select
                    value={applicantProfile.demographics.stateOfResidence || undefined}
                    onValueChange={(value) => updateDemographics({ stateOfResidence: value })}
                  >
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PREFER_NOT_TO_SAY}>Prefer not to say</SelectItem>
                      {stateOptions.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="race">Race/Ethnicity</Label>
                  <Select
                    value={applicantProfile.demographics.raceEthnicity || undefined}
                    onValueChange={(value) => updateDemographics({ raceEthnicity: value })}
                  >
                    <SelectTrigger id="race">
                      <SelectValue placeholder="Select race" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Black or African American">Black or African American</SelectItem>
                      <SelectItem value="Hispanic/Latino">Hispanic/Latino</SelectItem>
                      <SelectItem value="Native American or Alaska Native">Native American or Alaska Native</SelectItem>
                      <SelectItem value="Native Hawaiian or Pacific Islander">Native Hawaiian or Pacific Islander</SelectItem>
                      <SelectItem value="Asian">Asian</SelectItem>
                      <SelectItem value="White">White</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value={PREFER_NOT_TO_SAY}>Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={applicantProfile.demographics.gender || undefined}
                    onValueChange={(value) => updateDemographics({ gender: value })}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Non-binary">Non-binary</SelectItem>
                      <SelectItem value={PREFER_NOT_TO_SAY}>Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ses">Socioeconomic Status</Label>
                  <Select
                    value={applicantProfile.demographics.socioeconomicStatus || undefined}
                    onValueChange={(value) => updateDemographics({ socioeconomicStatus: value })}
                  >
                    <SelectTrigger id="ses">
                      <SelectValue placeholder="Select SES" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Disadvantaged">Disadvantaged</SelectItem>
                      <SelectItem value="Non-disadvantaged">Non-disadvantaged</SelectItem>
                      <SelectItem value={PREFER_NOT_TO_SAY}>Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Geographic Preferences (Regions)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {preferredRegionOptions.map((region) => {
                    const isActive = applicantProfile.demographics.geographicPreferences?.includes(region);
                    return (
                      <Badge
                        key={region}
                        variant={isActive ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleDemographicArray("geographicPreferences", region)}
                      >
                        {region}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>School Mission Preferences</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {missionPreferenceOptions.map((mission) => {
                    const isActive = applicantProfile.demographics.missionPreferences?.includes(mission);
                    return (
                      <Badge
                        key={mission}
                        variant={isActive ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleDemographicArray("missionPreferences", mission)}
                      >
                        {mission}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experiences Tab */}
        <TabsContent value="experiences" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Clinical & Research Experiences</CardTitle>
                  <CardDescription>
                    Add your volunteer work, shadowing, research, and leadership roles
                  </CardDescription>
                </div>
                <Button onClick={addExperience} size="sm" type="button">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Experience
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">New Experience</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Experience Type</Label>
                    <Select
                      value={experienceTypeOptions.includes(newExperience.type) ? newExperience.type : "Other"}
                      onValueChange={(value) => {
                        if (value === "Other") {
                          updateNewExperience({
                            type: experienceTypeOptions.includes(newExperience.type) ? "" : newExperience.type,
                          });
                        } else {
                          updateNewExperience({ type: value });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceTypeOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {newExperienceErrors.type && (
                      <p className="text-xs text-red-600">{newExperienceErrors.type}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Total Hours</Label>
                    <Input
                      type="number"
                      placeholder="150"
                      value={Number.isFinite(newExperience.totalHours) ? String(newExperience.totalHours) : ""}
                      onChange={(e) => {
                        const parsed = Number.parseInt(e.target.value, 10);
                        updateNewExperience({ totalHours: Number.isNaN(parsed) ? Number.NaN : parsed });
                      }}
                    />
                    {newExperienceErrors.totalHours && (
                      <p className="text-xs text-red-600">{newExperienceErrors.totalHours}</p>
                    )}
                  </div>
                </div>

                {!experienceTypeOptions.includes(newExperience.type) && (
                  <div className="space-y-2">
                    <Label>Specify Experience Type</Label>
                    <Input
                      placeholder="e.g., Healthcare Startup Internship"
                      value={newExperience.type}
                      onChange={(e) => updateNewExperience({ type: e.target.value })}
                    />
                    {newExperienceErrors.type && (
                      <p className="text-xs text-red-600">{newExperienceErrors.type}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Role/Title</Label>
                  <Input
                    placeholder="e.g., Emergency Room Volunteer"
                    value={newExperience.roleTitle}
                    onChange={(e) => updateNewExperience({ roleTitle: e.target.value })}
                  />
                  {newExperienceErrors.roleTitle && (
                    <p className="text-xs text-red-600">{newExperienceErrors.roleTitle}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Description (700 character limit - AMCAS format)</Label>
                  <Textarea
                    placeholder="Describe your responsibilities, skills learned, and impact..."
                    maxLength={700}
                    rows={4}
                    value={newExperience.description}
                    onChange={(e) => updateNewExperience({ description: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    {newExperience.description.length}/700 characters
                  </p>
                  {newExperienceErrors.description && (
                    <p className="text-xs text-red-600">{newExperienceErrors.description}</p>
                  )}
                </div>
              </div>

              {experiences.map((exp, idx) => (
                <div key={exp.id} className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Experience {idx + 1}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExperience(exp.id)}
                      type="button"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Experience Type</Label>
                      <Select
                        value={experienceTypeOptions.includes(exp.type) ? exp.type : "Other"}
                        onValueChange={(value) => {
                          if (value === "Other") {
                            updateExperience(exp.id, {
                              type: experienceTypeOptions.includes(exp.type) ? "" : exp.type,
                            });
                          } else {
                            updateExperience(exp.id, { type: value });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {experienceTypeOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {experienceErrors[exp.id]?.type && (
                        <p className="text-xs text-red-600">{experienceErrors[exp.id]?.type}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Total Hours</Label>
                      <Input
                        type="number"
                        placeholder="150"
                        value={Number.isFinite(exp.totalHours) ? String(exp.totalHours) : ""}
                        onChange={(e) => {
                          const parsed = Number.parseInt(e.target.value, 10);
                          updateExperience(exp.id, { totalHours: Number.isNaN(parsed) ? Number.NaN : parsed });
                        }}
                      />
                      {experienceErrors[exp.id]?.totalHours && (
                        <p className="text-xs text-red-600">{experienceErrors[exp.id]?.totalHours}</p>
                      )}
                    </div>
                  </div>

                  {!experienceTypeOptions.includes(exp.type) && (
                    <div className="space-y-2">
                      <Label>Specify Experience Type</Label>
                      <Input
                        placeholder="e.g., Healthcare Startup Internship"
                        value={exp.type}
                        onChange={(e) => updateExperience(exp.id, { type: e.target.value })}
                      />
                      {experienceErrors[exp.id]?.type && (
                        <p className="text-xs text-red-600">{experienceErrors[exp.id]?.type}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Role/Title</Label>
                    <Input
                      placeholder="e.g., Emergency Room Volunteer"
                      value={exp.roleTitle}
                      onChange={(e) => updateExperience(exp.id, { roleTitle: e.target.value })}
                    />
                    {experienceErrors[exp.id]?.roleTitle && (
                      <p className="text-xs text-red-600">{experienceErrors[exp.id]?.roleTitle}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Description (700 character limit - AMCAS format)</Label>
                    <Textarea
                      placeholder="Describe your responsibilities, skills learned, and impact..."
                      maxLength={700}
                      rows={4}
                      value={exp.description}
                      onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                      {exp.description.length}/700 characters
                    </p>
                    {experienceErrors[exp.id]?.description && (
                      <p className="text-xs text-red-600">{experienceErrors[exp.id]?.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Experiences Strength</CardTitle>
              <CardDescription>
                Provide a 0-100 rating that reflects your research, clinical, leadership, and service depth.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="extrasScore">Experiences score (0-100)</Label>
              <Input
                id="extrasScore"
                name="extrasScore"
                type="number"
                min="0"
                max="100"
                placeholder="85"
                value={experienceScore}
                readOnly
              />
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Experience Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-semibold text-blue-700">{experienceSummary.clinical}</p>
                  <p className="text-sm text-gray-600">Clinical Hours</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-semibold text-green-700">{experienceSummary.research}</p>
                  <p className="text-sm text-gray-600">Research Hours</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-semibold text-purple-700">{experienceSummary.shadowing}</p>
                  <p className="text-sm text-gray-600">Shadowing Hours</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-semibold text-orange-700">{experienceSummary.community}</p>
                  <p className="text-sm text-gray-600">Community Service</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-semibold text-yellow-700">{experienceSummary.leadership}</p>
                  <p className="text-sm text-gray-600">Leadership Hours</p>
                </div>
                {experienceSummary.other > 0 && (
                  <div className="text-center p-4 bg-teal-50 rounded-lg">
                    <p className="text-2xl font-semibold text-teal-700">{experienceSummary.other}</p>
                    <p className="text-sm text-gray-600">Other Hours</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Essays Tab */}
        <TabsContent value="essays" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Statement</CardTitle>
              <CardDescription>Your AMCAS personal statement (5,300 character limit)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your personal statement here for AI analysis..."
                rows={12}
                maxLength={5300}
                value={personalStatement}
                onChange={(e) => setPersonalStatement(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{personalStatement.length}/5,300 characters</p>
                <Button type="button">Upload from File</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" onClick={() => alert("Draft saved locally (not implemented)")}>
          Save Draft
        </Button>
        <Button type="submit" disabled={experiences.length === 0}>
          Save & Continue to School Matching
        </Button>
      </div>
    </form>
  );
}
