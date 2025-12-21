import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { AlertCircle, GraduationCap, Stethoscope } from "lucide-react";
import { MatchResult } from "../types";

interface SchoolMatchProps {
  matches: MatchResult[];
}

export default function SchoolMatch({ matches }: SchoolMatchProps) {
  const hasMatches = matches && matches.length > 0;

  if (!hasMatches) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No matches yet</CardTitle>
          <CardDescription>
            Save your profile to generate a ranked list of 30 schools based on your GPA and MCAT.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3 text-gray-600">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          Complete the profile form and click "Save" to fetch schools.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Matched Schools</h1>
        <p className="text-gray-600">Top {matches.length} schools ranked by your match score</p>
      </div>

      <div className="space-y-4">
        {matches.map((school, idx) => (
          <Card key={school.schoolId}>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                  #{idx + 1}
                </Badge>
                <div>
                  <CardTitle className="leading-tight">{school.name}</CardTitle>
                  <CardDescription>Based on your GPA/MCAT profile</CardDescription>
                </div>
              </div>
              <div className="text-right min-w-[90px]">
                <div className="text-3xl font-semibold text-blue-600">{school.matchScore}%</div>
                <p className="text-xs text-gray-500">Match score</p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <GraduationCap className="w-4 h-4" /> Median GPA
                  </div>
                  <p className="text-lg font-semibold">{school.gpaMedian ?? "N/A"}</p>
                  <p className="text-xs text-gray-500">Your percentile: {school.gpaScore ?? "N/A"}%</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Stethoscope className="w-4 h-4" /> Median MCAT
                  </div>
                  <p className="text-lg font-semibold">{school.mcatMedian ?? "N/A"}</p>
                  <p className="text-xs text-gray-500">Your percentile: {school.mcatScore ?? "N/A"}%</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Overall Competitiveness</p>
                  <Progress value={school.matchScore} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
