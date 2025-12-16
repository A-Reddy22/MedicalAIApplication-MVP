import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Progress } from "./ui/progress";
import { MapPin, DollarSign, Users, TrendingUp, Search, SlidersHorizontal } from "lucide-react";

interface School {
  id: number;
  name: string;
  location: string;
  tier: "Safety" | "Target" | "Reach";
  matchScore: number;
  avgGPA: number;
  avgMCAT: number;
  acceptanceRate: number;
  tuition: string;
  mission: string;
  yourGPAPercentile: number;
  yourMCATPercentile: number;
}

export default function SchoolMatch() {
  const [filterTier, setFilterTier] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const schools: School[] = [
    {
      id: 1,
      name: "UC Irvine School of Medicine",
      location: "Irvine, CA",
      tier: "Target",
      matchScore: 88,
      avgGPA: 3.7,
      avgMCAT: 513,
      acceptanceRate: 4.2,
      tuition: "$41,500 (in-state)",
      mission: "Primary Care & Research",
      yourGPAPercentile: 90,
      yourMCATPercentile: 87,
    },
    {
      id: 2,
      name: "Emory University School of Medicine",
      location: "Atlanta, GA",
      tier: "Target",
      matchScore: 85,
      avgGPA: 3.75,
      avgMCAT: 515,
      acceptanceRate: 3.8,
      tuition: "$59,800",
      mission: "Research-Heavy",
      yourGPAPercentile: 85,
      yourMCATPercentile: 82,
    },
    {
      id: 3,
      name: "Wake Forest School of Medicine",
      location: "Winston-Salem, NC",
      tier: "Target",
      matchScore: 82,
      avgGPA: 3.69,
      avgMCAT: 512,
      acceptanceRate: 5.1,
      tuition: "$62,000",
      mission: "Primary Care",
      yourGPAPercentile: 92,
      yourMCATPercentile: 89,
    },
    {
      id: 4,
      name: "UCLA David Geffen School of Medicine",
      location: "Los Angeles, CA",
      tier: "Reach",
      matchScore: 68,
      avgGPA: 3.89,
      avgMCAT: 519,
      acceptanceRate: 2.4,
      tuition: "$37,200 (in-state)",
      mission: "Research-Heavy",
      yourGPAPercentile: 65,
      yourMCATPercentile: 60,
    },
    {
      id: 5,
      name: "Stanford University School of Medicine",
      location: "Stanford, CA",
      tier: "Reach",
      matchScore: 52,
      avgGPA: 3.92,
      avgMCAT: 521,
      acceptanceRate: 1.9,
      tuition: "$67,000",
      mission: "Research-Heavy",
      yourGPAPercentile: 45,
      yourMCATPercentile: 42,
    },
    {
      id: 6,
      name: "University of Arizona College of Medicine",
      location: "Tucson, AZ",
      tier: "Safety",
      matchScore: 92,
      avgGPA: 3.65,
      avgMCAT: 509,
      acceptanceRate: 6.8,
      tuition: "$35,000 (in-state)",
      mission: "Primary Care & Rural Medicine",
      yourGPAPercentile: 95,
      yourMCATPercentile: 94,
    },
  ];

  const filteredSchools = schools.filter((school) => {
    const matchesTier = filterTier === "all" || school.tier.toLowerCase() === filterTier;
    const matchesSearch = school.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const tierColors = {
    Safety: "bg-green-100 text-green-700 border-green-200",
    Target: "bg-blue-100 text-blue-700 border-blue-200",
    Reach: "bg-orange-100 text-orange-700 border-orange-200",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">School Match Results</h1>
        <p className="text-gray-600">
          Top 50 medical schools ranked by your competitiveness based on GPA, MCAT, and experiences
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search schools..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger className="w-[150px]">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="target">Target</SelectItem>
                  <SelectItem value="reach">Reach</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-semibold text-green-600">
                {schools.filter((s) => s.tier === "Safety").length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Safety Schools</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-semibold text-blue-600">
                {schools.filter((s) => s.tier === "Target").length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Target Schools</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-semibold text-orange-600">
                {schools.filter((s) => s.tier === "Reach").length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Reach Schools</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School List */}
      <div className="space-y-4">
        {filteredSchools.map((school) => (
          <Card key={school.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle>{school.name}</CardTitle>
                    <Badge variant="outline" className={tierColors[school.tier]}>
                      {school.tier}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {school.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {school.tuition}
                    </span>
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-semibold text-blue-600">{school.matchScore}%</div>
                  <p className="text-xs text-gray-500">Match Score</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Avg GPA</p>
                  <p className="font-semibold">{school.avgGPA}</p>
                  <p className="text-xs text-green-600">You: {school.yourGPAPercentile}th %ile</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Avg MCAT</p>
                  <p className="font-semibold">{school.avgMCAT}</p>
                  <p className="text-xs text-green-600">You: {school.yourMCATPercentile}th %ile</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Accept Rate</p>
                  <p className="font-semibold">{school.acceptanceRate}%</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Mission</p>
                  <p className="text-xs font-semibold">{school.mission}</p>
                </div>
              </div>

              {/* Match Analysis */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Your Competitiveness</span>
                  <span className="font-medium">{school.matchScore}%</span>
                </div>
                <Progress value={school.matchScore} className="h-2" />
                <p className="text-sm text-gray-600">
                  {school.tier === "Safety" && (
                    <>
                      <span className="text-green-600 font-medium">Strong match.</span> Your stats exceed
                      this program's averages.
                    </>
                  )}
                  {school.tier === "Target" && (
                    <>
                      <span className="text-blue-600 font-medium">Good fit.</span> Your profile aligns
                      well with accepted applicants.
                    </>
                  )}
                  {school.tier === "Reach" && (
                    <>
                      <span className="text-orange-600 font-medium">Competitive program.</span> Consider
                      strengthening clinical hours to improve your chances.
                    </>
                  )}
                </p>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">Add to My List</Button>
                <Button variant="outline">View Details</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
