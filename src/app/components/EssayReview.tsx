import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Sparkles, AlertCircle, CheckCircle2, Lightbulb, FileText } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

export default function EssayReview() {
  const [essay, setEssay] = useState("");
  const [analyzed, setAnalyzed] = useState(false);

  const handleAnalyze = () => {
    setAnalyzed(true);
  };

  // Mock analysis data
  const analysis = {
    overallScore: 78,
    scores: {
      clarity: 82,
      depth: 75,
      authenticity: 80,
      structure: 72,
    },
    strengths: [
      "Strong opening narrative that immediately engages the reader",
      "Clear demonstration of empathy and patient-centered thinking",
      "Good use of specific examples from clinical experiences",
    ],
    improvements: [
      {
        type: "Structure",
        issue: "The transition from your opening story to why medicine is abrupt",
        suggestion:
          "Consider adding a bridge sentence that connects your personal experience to your broader motivation for medicine",
        severity: "Medium",
      },
      {
        type: "Reflection",
        issue: "Limited reflection on what you learned from your research experience",
        suggestion:
          "Expand on how your research shaped your understanding of evidence-based medicine and scientific inquiry",
        severity: "High",
      },
      {
        type: "Clarity",
        issue: "Sentence on line 12 is overly complex (47 words)",
        suggestion: "Break this into 2-3 shorter sentences for better readability",
        severity: "Low",
      },
    ],
    competencies: [
      { name: "Service Orientation", score: 85, present: true },
      { name: "Teamwork", score: 70, present: true },
      { name: "Resilience", score: 60, present: false },
      { name: "Scientific Inquiry", score: 55, present: false },
    ],
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
                <Button onClick={handleAnalyze} disabled={essay.length < 100}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Essay
                </Button>
              </div>
            </div>
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
                {/* Overall Score */}
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <p className="text-5xl font-semibold text-blue-600">{analysis.overallScore}</p>
                  <p className="text-sm text-gray-600 mt-2">Overall Essay Score</p>
                  <Badge className="mt-3 bg-blue-100 text-blue-700">Competitive Essay</Badge>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-3">
                  <p className="font-medium">Score Breakdown</p>
                  {Object.entries(analysis.scores).map(([category, score]) => (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{category}</span>
                        <span className="font-medium">{score}/100</span>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  ))}
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
              <ul className="space-y-2">
                {analysis.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Improvement Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-orange-600" />
                Suggested Improvements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.improvements.map((improvement, idx) => (
                <Alert
                  key={idx}
                  className={
                    improvement.severity === "High"
                      ? "border-orange-200 bg-orange-50"
                      : improvement.severity === "Medium"
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-blue-200 bg-blue-50"
                  }
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{improvement.type}</p>
                        <Badge
                          variant="outline"
                          className={
                            improvement.severity === "High"
                              ? "border-orange-300 text-orange-700"
                              : improvement.severity === "Medium"
                              ? "border-yellow-300 text-yellow-700"
                              : "border-blue-300 text-blue-700"
                          }
                        >
                          {improvement.severity} Priority
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">
                        <strong>Issue:</strong> {improvement.issue}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Suggestion:</strong> {improvement.suggestion}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>

          {/* AAMC Competencies */}
          <Card>
            <CardHeader>
              <CardTitle>AAMC Core Competencies Coverage</CardTitle>
              <CardDescription>
                How well your essay demonstrates key medical school competencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.competencies.map((competency) => (
                  <div
                    key={competency.name}
                    className={`p-4 rounded-lg border ${
                      competency.present
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{competency.name}</p>
                      {competency.present ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <Progress value={competency.score} className="h-2 mb-2" />
                    <p className="text-xs text-gray-600">
                      {competency.present
                        ? `Well demonstrated (${competency.score}%)`
                        : "Consider adding examples that show this quality"}
                    </p>
                  </div>
                ))}
              </div>
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
