import { useState } from "react";
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
  Demographics,
  Experience,
  MatchResult,
  SubmittedProfilePayload,
} from "../types";

interface ProfileIntakeProps {
  onMatchesGenerated?: (matches: MatchResult[]) => void;
}

export default function ProfileIntake({ onMatchesGenerated }: ProfileIntakeProps) {
  const [name, setName] = useState("");
  const [userId] = useState("demo-user");
  const [experiences, setExperiences] = useState<Experience[]>([
    {
      id: 1,
      type: "clinical",
      title: "Emergency Room Volunteer",
      hours: "150",
      description: "Assisted nursing staff with patient transport and comfort measures...",
    },
  ]);
  const [demographics, setDemographics] = useState<Demographics>({
    preferredRegions: [],
    missionPreferences: [],
  });
  const [personalStatement, setPersonalStatement] = useState("");

  const preferredRegionOptions = ["West Coast", "East Coast", "Midwest", "South", "No Preference"];
  const missionPreferenceOptions = ["Research-Heavy", "Primary Care", "Rural Medicine", "Urban Health"];

  const addExperience = () => {
    setExperiences((prev) => [
      ...prev,
      { id: Date.now(), type: "clinical", title: "", hours: "", description: "" },
    ]);
  };

  const removeExperience = (id: Experience["id"]) => {
    setExperiences((prev) => prev.filter((exp) => exp.id !== id));
  };

  const updateExperience = (id: Experience["id"], patch: Partial<Experience>) => {
    setExperiences((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const toggleDemographicArray = (field: "preferredRegions" | "missionPreferences", value: string) => {
    setDemographics((prev) => {
      const current = new Set(prev[field] ?? []);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      return { ...prev, [field]: Array.from(current) };
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // grab simple input values by id where native inputs exist
    const undergrad = (document.getElementById("undergrad") as HTMLInputElement | null)?.value ?? "UC Berkeley";
    const major = (document.getElementById("major") as HTMLInputElement | null)?.value ?? "Biology";
    const cumGPA = (document.getElementById("cumGPA") as HTMLInputElement | null)?.value ?? "";
    const scienceGPA = (document.getElementById("scienceGPA") as HTMLInputElement | null)?.value ?? "";
    const mcat = (document.getElementById("mcat") as HTMLInputElement | null)?.value ?? "";
    const gradYear = "2025"; // current UI uses a custom Select component — keep default for now

    const payload: SubmittedProfilePayload = {
      name,
      userId,
      undergrad,
      major,
      cumGPA,
      scienceGPA,
      mcat,
      gradYear,
      experiences,
      demographics,
      essays: {
        personalStatement,
      },
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Save failed", text);
        alert("Failed to save profile. See console for details.");
        return;
      }

      const data = await res.json();
      const profileId: string | undefined = data.id;
      alert("Profile saved (id: " + (profileId ?? "unknown") + ")");

      const matchRes = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    } catch (err) {
      console.error(err);
      alert("Network error while saving profile.");
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

      <Tabs defaultValue="academic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="experiences">Experiences</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="essays">Essays</TabsTrigger>
        </TabsList>

        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-6">
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="undergrad">Undergraduate Institution</Label>
                  <Input id="undergrad" name="undergrad" placeholder="e.g., UC Berkeley" defaultValue="UC Berkeley" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="major">Major</Label>
                  <Input id="major" name="major" placeholder="e.g., Biology" defaultValue="Biology" />
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
                    defaultValue="3.78"
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
                    defaultValue="3.72"
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
                    defaultValue="515"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mcatChem">MCAT: Chem/Phys</Label>
                  <Input id="mcatChem" name="mcatChem" type="number" min="118" max="132" defaultValue="129" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mcatCars">MCAT: CARS</Label>
                  <Input id="mcatCars" name="mcatCars" type="number" min="118" max="132" defaultValue="128" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mcatBio">MCAT: Bio/Biochem</Label>
                  <Input id="mcatBio" name="mcatBio" type="number" min="118" max="132" defaultValue="130" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mcatPsych">MCAT: Psych/Soc</Label>
                  <Input id="mcatPsych" name="mcatPsych" type="number" min="118" max="132" defaultValue="128" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradYear">Expected Graduation Year</Label>
                <Select defaultValue="2025">
                  <SelectTrigger id="gradYear">
                    <SelectValue />
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
              {experiences.map((exp, idx) => (
                <div key={exp.id} className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Experience {idx + 1}</Badge>
                    {experiences.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExperience(exp.id)}
                        type="button"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Experience Type</Label>
                      <Select
                        value={exp.type}
                        onValueChange={(value) => updateExperience(exp.id, { type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clinical">Clinical Volunteering</SelectItem>
                          <SelectItem value="shadowing">Physician Shadowing</SelectItem>
                          <SelectItem value="research">Research</SelectItem>
                          <SelectItem value="leadership">Leadership</SelectItem>
                          <SelectItem value="community">Community Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Total Hours</Label>
                      <Input
                        type="number"
                        placeholder="150"
                        value={exp.hours ?? ""}
                        onChange={(e) => updateExperience(exp.id, { hours: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Role/Title</Label>
                    <Input
                      placeholder="e.g., Emergency Room Volunteer"
                      value={exp.title ?? ""}
                      onChange={(e) => updateExperience(exp.id, { title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description (700 character limit - AMCAS format)</Label>
                    <Textarea
                      placeholder="Describe your responsibilities, skills learned, and impact..."
                      maxLength={700}
                      rows={4}
                      value={exp.description ?? ""}
                      onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                      {(exp.description?.length ?? 0)}/700 characters
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Experience Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-semibold text-blue-700">150</p>
                  <p className="text-sm text-gray-600">Clinical Hours</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-semibold text-green-700">200</p>
                  <p className="text-sm text-gray-600">Research Hours</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-semibold text-purple-700">80</p>
                  <p className="text-sm text-gray-600">Shadowing Hours</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-semibold text-orange-700">120</p>
                  <p className="text-sm text-gray-600">Community Service</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Demographics & Preferences</CardTitle>
              <CardDescription>
                Optional information to help with school targeting (not used for discrimination)
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
                    value={demographics.age ?? ""}
                    onChange={(e) => setDemographics((prev) => ({ ...prev, age: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State of Residence</Label>
                  <Select
                    value={demographics.state ?? undefined}
                    onValueChange={(value) => setDemographics((prev) => ({ ...prev, state: value }))}
                  >
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ca">California</SelectItem>
                      <SelectItem value="ny">New York</SelectItem>
                      <SelectItem value="tx">Texas</SelectItem>
                      <SelectItem value="fl">Florida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preferred Geographic Regions</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {preferredRegionOptions.map((region) => {
                    const isActive = demographics.preferredRegions?.includes(region);
                    return (
                      <Badge
                        key={region}
                        variant={isActive ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleDemographicArray("preferredRegions", region)}
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
                    const isActive = demographics.missionPreferences?.includes(mission);
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
        <Button type="submit">Save & Continue to School Matching</Button>
      </div>
    </form>
  );
}





