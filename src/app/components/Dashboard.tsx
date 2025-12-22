import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { MatchResult } from "../types";

interface DashboardProps {
  userName?: string;
  matches?: MatchResult[];
}

export default function Dashboard({ userName, matches = [] }: DashboardProps) {
  const readinessScore = 82;

  const greetingName = userName?.trim() || "there";
  const sortedMatches = [...matches].sort((a, b) => b.matchScore - a.matchScore);
  const topSchools = sortedMatches.slice(0, 3);

  const findReachSchools = () => {
    let start = 50;
    while (start >= 0) {
      const rangeMatches = sortedMatches
        .filter((school) => school.matchScore >= start && school.matchScore <= start + 10)
        .slice(0, 3);

      if (rangeMatches.length) {
        return rangeMatches;
      }

      start -= 10;
    }

    return [] as MatchResult[];
  };

  const reachSchools = findReachSchools();

  const nextSteps = [
    {
      title: "Increase Clinical Hours",
      description: "Add 100+ hours to match competitive applicants",
      impact: "High",
      icon: AlertCircle,
    },
    {
      title: "Complete Personal Statement",
      description: "Draft uploaded, needs AI review and refinement",
      impact: "Critical",
      icon: Clock,
    },
    {
      title: "Request Letters of Recommendation",
      description: "3 of 4 letters secured",
      impact: "Medium",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Welcome back, {greetingName}</h1>
        <p className="text-gray-600">
          Here's your application readiness overview for Fall 2026 matriculation
        </p>
      </div>

      {/* Readiness Score */}
      <Card>
        <CardHeader>
          <CardTitle>Application Readiness</CardTitle>
          <CardDescription>Based on your profile vs. competitive applicants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold">{readinessScore}%</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <TrendingUp className="w-3 h-3 mr-1" />
                Strong Profile
              </Badge>
            </div>
            <Progress value={readinessScore} className="h-3" />
            <p className="text-sm text-gray-600">
              You're in a competitive position for top 20 programs. Focus on clinical experience
              to improve competitiveness at reach schools.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Competitive Schools */}
        <Card>
          <CardHeader>
            <CardTitle>Most Competitive Matches</CardTitle>
            <CardDescription>Schools where you're a strong fit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSchools.length ? (
                topSchools.map((school) => (
                  <div key={school.schoolId ?? school.name} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{school.name}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        School match
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">{school.matchScore}%</p>
                      <p className="text-xs text-gray-500">Match</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">Save your profile to see your strongest fits.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reach Schools */}
        <Card>
          <CardHeader>
            <CardTitle>Reach School Potential</CardTitle>
            <CardDescription>Improve these areas to boost your chances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reachSchools.length ? (
                reachSchools.map((school) => (
                  <div key={school.schoolId ?? school.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{school.name}</p>
                      <span className="text-sm text-gray-600">{school.matchScore}% match</span>
                    </div>
                    <Progress value={school.matchScore} className="h-2" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">
                  We couldn't find reach-range matches yet. Save your profile to get personalized suggestions.
                </p>
              )}
              {reachSchools.length > 0 && (
                <p className="text-sm text-gray-600 pt-2">
                  Clinical hours are 20% below average for these programs
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Next Steps</CardTitle>
          <CardDescription>Actions to strengthen your application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {nextSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.impact === "Critical"
                        ? "bg-red-100"
                        : step.impact === "High"
                        ? "bg-orange-100"
                        : "bg-blue-100"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        step.impact === "Critical"
                          ? "text-red-600"
                          : step.impact === "High"
                          ? "text-orange-600"
                          : "text-blue-600"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium">{step.title}</h3>
                      <Badge
                        variant="outline"
                        className={`${
                          step.impact === "Critical"
                            ? "border-red-200 text-red-700"
                            : step.impact === "High"
                            ? "border-orange-200 text-orange-700"
                            : "border-blue-200 text-blue-700"
                        }`}
                      >
                        {step.impact}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Button className="w-full mt-4">View Full Recommendations</Button>
        </CardContent>
      </Card>
    </div>
  );
}
