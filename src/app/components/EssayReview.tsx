import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Sparkles, AlertCircle, CheckCircle2, Lightbulb, FileText, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

type ParsedAnalysis = {
  overallImpression: string;
  strengths: string[];
  weaknesses: string[];
  rating: string | null;
  vulnerabilities: string[];
};

const headingMatchers = [
  { key: "overallImpression", label: "Overall Impression", regex: /^(\d+\.)?\s*Overall Impression/i },
  { key: "strengths", label: "Strengths", regex: /^(\d+\.)?\s*Strengths/i },
  { key: "weaknesses", label: "Weaknesses", regex: /^(\d+\.)?\s*Weaknesses/i },
  { key: "essayRating", label: "Essay Rating", regex: /^(\d+\.)?\s*Essay Rating/i },
  { key: "vulnerabilities", label: "Security Vulnerabilities", regex: /^(\d+\.)?\s*Security Vulnerabilities/i },
];

function parseAnalysis(text: string): ParsedAnalysis {
  if (!text.trim()) {
    return {
      overallImpression: "",
      strengths: [],
      weaknesses: [],
      rating: null,
      vulnerabilities: [],
    };
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let currentSection: string | null = null;
  const overallLines: string[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const vulnerabilities: string[] = [];
  let rating: string | null = null;

  const pushBullet = (target: string[], line: string) => {
    const cleaned = line.replace(/^[-*•]\s+/, "").replace(/^\d+\.\s+/, "").trim();
    if (cleaned) {
      target.push(cleaned);
    }
  };

  for (const line of lines) {
    const headingMatch = headingMatchers.find((heading) => heading.regex.test(line));
    if (headingMatch) {
      currentSection = headingMatch.key;
      if (currentSection === "essayRating") {
        const match = line.match(/([0-9]+(?:\.[0-9]+)?)/);
        if (match) {
          rating = match[1];
        }
      }
      continue;
    }

    if (currentSection === "essayRating") {
      const match = line.match(/([0-9]+(?:\.[0-9]+)?)/);
      if (match) {
        rating = match[1];
      }
      continue;
    }

    if (currentSection === "overallImpression") {
      overallLines.push(line);
      continue;
    }

    if (currentSection === "strengths") {
      pushBullet(strengths, line);
      continue;
    }

    if (currentSection === "weaknesses") {
      pushBullet(weaknesses, line);
      continue;
    }

    if (currentSection === "vulnerabilities") {
      pushBullet(vulnerabilities, line);
    }
  }

  return {
    overallImpression: overallLines.join(" "),
    strengths,
    weaknesses,
    rating,
    vulnerabilities,
  };
}

export default function EssayReview() {
  const [essay, setEssay] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const parsed = useMemo(() => parseAnalysis(analysisText), [analysisText]);

  useEffect(() => {
    if (isLoading) return;
    if (!essay.trim()) {
      setAnalyzed(false);
      setAnalysisText("");
      setErrorMessage("");
      return;
    }

    setAnalyzed(false);
    setAnalysisText("");
    setErrorMessage("");
  }, [essay, isLoading]);

  const handleAnalyze = async () => {
    const trimmedEssay = essay.trim();
    if (!trimmedEssay) {
      setAnalyzed(false);
      setAnalysisText("");
      setErrorMessage("Please paste your essay before analyzing.");
      return;
    }

    if (trimmedEssay.length > 5300) {
      setAnalyzed(false);
      setAnalysisText("");
      setErrorMessage("Essay exceeds the 5,300 character limit.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setAnalysisText("");
    setAnalyzed(false);

    try {
      const response = await fetch("/api/essay/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ essay: trimmedEssay }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      if (!data?.analysis) {
        throw new Error("Missing analysis");
      }

      setAnalysisText(data.analysis);
      setAnalyzed(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to analyze essay at this time. Please try again.");
      setAnalysisText("");
      setAnalyzed(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Essay Review</h1>
        <p className="text-gray-600">
          Get AI-powered feedback on your personal statement and secondary essays
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Essay</CardTitle>
            <CardDescription>
              Paste your personal statement (5,300 character limit - AMCAS)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste your essay here for AI analysis..."
              rows={16}
              maxLength={5300}
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{essay.length}/5,300 characters</p>
              <div className="flex gap-2">
                <Button variant="outline">Upload File</Button>
                <Button onClick={handleAnalyze} disabled={isLoading || essay.length === 0}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isLoading ? "Analyzing..." : "Analyze Essay"}
                </Button>
              </div>
            </div>
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card>
          <CardHeader>
            <CardTitle>AI Analysis</CardTitle>
            <CardDescription>Comprehensive feedback on your essay</CardDescription>
          </CardHeader>
          <CardContent>
            {!analyzed ? (
              <div className="h-[450px] flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">
                    Paste your essay and click "Analyze Essay" to get AI feedback
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="h-[250px] overflow-y-auto whitespace-pre-wrap text-sm text-gray-700">
                  {errorMessage || analysisText || "Analyzing..."}
                </div>

                {parsed.overallImpression && (
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Overall Impression</p>
                    <p className="text-sm text-gray-700">{parsed.overallImpression}</p>
                  </div>
                )}

                {/* Overall Score */}
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <p className="text-5xl font-semibold text-blue-600">
                    {parsed.rating ?? "--"}
                    <span className="text-2xl align-top">/10</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Overall Essay Rating</p>
                  <Badge className="mt-3 bg-blue-100 text-blue-700">Harsh, realistic score</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {analyzed && (
        <>
          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              {parsed.strengths.length ? (
                <ul className="space-y-2">
                  {parsed.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Strengths will appear here after analysis.</p>
              )}
            </CardContent>
          </Card>

          {/* Improvement Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-orange-600" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {parsed.weaknesses.length ? (
                parsed.weaknesses.map((weakness, idx) => (
                  <Alert key={idx} className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="text-sm text-gray-700">{weakness}</p>
                    </AlertDescription>
                  </Alert>
                ))
              ) : (
                <p className="text-sm text-gray-500">Areas for improvement will appear here after analysis.</p>
              )}
            </CardContent>
          </Card>

          {/* Security Vulnerabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                Security Vulnerabilities
              </CardTitle>
              <CardDescription>Potential privacy or disclosure risks in the essay content</CardDescription>
            </CardHeader>
            <CardContent>
              {parsed.vulnerabilities.length ? (
                <ul className="space-y-2">
                  {parsed.vulnerabilities.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 bg-rose-50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Security risks will appear here after analysis.</p>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button className="flex-1">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Improved Version
            </Button>
            <Button variant="outline" className="flex-1">
              Save Analysis
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
