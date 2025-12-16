import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Calendar, CheckCircle2, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface Application {
  id: number;
  school: string;
  tier: "Safety" | "Target" | "Reach";
  primaryStatus: "Not Started" | "In Progress" | "Submitted";
  secondaryStatus: "Not Started" | "In Progress" | "Submitted";
  secondaryEssays: { completed: number; total: number };
  lors: { received: number; total: number };
  interviewStatus: "None" | "Invited" | "Completed";
  deadlines: {
    primary: string;
    secondary: string;
  };
  overallProgress: number;
}

export default function ApplicationTracker() {
  const applications: Application[] = [
    {
      id: 1,
      school: "UC Irvine School of Medicine",
      tier: "Target",
      primaryStatus: "Submitted",
      secondaryStatus: "In Progress",
      secondaryEssays: { completed: 5, total: 8 },
      lors: { received: 3, total: 4 },
      interviewStatus: "None",
      deadlines: {
        primary: "October 1, 2025",
        secondary: "December 15, 2025",
      },
      overallProgress: 65,
    },
    {
      id: 2,
      school: "Emory University School of Medicine",
      tier: "Target",
      primaryStatus: "Submitted",
      secondaryStatus: "Submitted",
      secondaryEssays: { completed: 6, total: 6 },
      lors: { received: 4, total: 4 },
      interviewStatus: "Invited",
      deadlines: {
        primary: "October 1, 2025",
        secondary: "November 30, 2025",
      },
      overallProgress: 100,
    },
    {
      id: 3,
      school: "Wake Forest School of Medicine",
      tier: "Target",
      primaryStatus: "Submitted",
      secondaryStatus: "Not Started",
      secondaryEssays: { completed: 0, total: 5 },
      lors: { received: 3, total: 4 },
      interviewStatus: "None",
      deadlines: {
        primary: "October 1, 2025",
        secondary: "January 15, 2026",
      },
      overallProgress: 45,
    },
    {
      id: 4,
      school: "UCLA David Geffen School of Medicine",
      tier: "Reach",
      primaryStatus: "In Progress",
      secondaryStatus: "Not Started",
      secondaryEssays: { completed: 0, total: 7 },
      lors: { received: 2, total: 4 },
      interviewStatus: "None",
      deadlines: {
        primary: "October 1, 2025",
        secondary: "December 1, 2025",
      },
      overallProgress: 25,
    },
  ];

  const upcomingDeadlines = [
    { school: "Wake Forest", task: "Secondary Application", date: "January 15, 2026", daysLeft: 30 },
    { school: "UC Irvine", task: "Secondary Essays", date: "December 15, 2025", daysLeft: 15 },
    { school: "UCLA", task: "Primary Application", date: "October 1, 2025", daysLeft: -16 },
  ];

  const statusColors = {
    "Not Started": "bg-gray-100 text-gray-700",
    "In Progress": "bg-yellow-100 text-yellow-700",
    Submitted: "bg-green-100 text-green-700",
  };

  const interviewColors = {
    None: "bg-gray-100 text-gray-700",
    Invited: "bg-blue-100 text-blue-700",
    Completed: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Application Tracker</h1>
        <p className="text-gray-600">
          Track your application progress and stay on top of deadlines
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-semibold">{applications.length}</p>
            <p className="text-sm text-gray-600 mt-1">Total Applications</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-semibold text-green-600">
              {applications.filter((a) => a.primaryStatus === "Submitted").length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Primary Submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-semibold text-blue-600">
              {applications.filter((a) => a.interviewStatus === "Invited").length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Interview Invites</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-semibold text-yellow-600">
              {upcomingDeadlines.filter((d) => d.daysLeft > 0).length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Upcoming Deadlines</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          <TabsTrigger value="deadlines">Upcoming Deadlines</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{app.school}</CardTitle>
                      <Badge variant="outline">{app.tier}</Badge>
                    </div>
                    <CardDescription>
                      Overall Progress: {app.overallProgress}% complete
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={app.overallProgress} className="h-2" />

                {/* Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Primary Application</p>
                    <Badge className={statusColors[app.primaryStatus]}>{app.primaryStatus}</Badge>
                    <p className="text-xs text-gray-500">Due: {app.deadlines.primary}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Secondary Application</p>
                    <Badge className={statusColors[app.secondaryStatus]}>
                      {app.secondaryStatus}
                    </Badge>
                    <p className="text-xs text-gray-500">Due: {app.deadlines.secondary}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Secondary Essays</p>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(app.secondaryEssays.completed / app.secondaryEssays.total) * 100}
                        className="h-2 flex-1"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {app.secondaryEssays.completed}/{app.secondaryEssays.total} completed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Letters of Rec</p>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(app.lors.received / app.lors.total) * 100}
                        className="h-2 flex-1"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {app.lors.received}/{app.lors.total} received
                    </p>
                  </div>
                </div>

                {/* Interview Status */}
                {app.interviewStatus !== "None" && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        Interview {app.interviewStatus}
                      </span>
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                <div className="pt-2">
                  <p className="text-sm font-medium mb-2">Next Steps:</p>
                  <ul className="space-y-1">
                    {app.secondaryStatus === "In Progress" && (
                      <li className="text-sm text-gray-600 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Complete {app.secondaryEssays.total - app.secondaryEssays.completed} more
                        secondary essays
                      </li>
                    )}
                    {app.lors.received < app.lors.total && (
                      <li className="text-sm text-gray-600 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Request {app.lors.total - app.lors.received} more letter(s) of
                        recommendation
                      </li>
                    )}
                    {app.primaryStatus === "In Progress" && (
                      <li className="text-sm text-gray-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        Submit primary application before {app.deadlines.primary}
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Stay on top of your application timeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingDeadlines.map((deadline, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      deadline.daysLeft < 0
                        ? "bg-red-50 border-red-200"
                        : deadline.daysLeft < 7
                        ? "bg-orange-50 border-orange-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          deadline.daysLeft < 0
                            ? "bg-red-100"
                            : deadline.daysLeft < 7
                            ? "bg-orange-100"
                            : "bg-blue-100"
                        }`}
                      >
                        <Calendar
                          className={`w-6 h-6 ${
                            deadline.daysLeft < 0
                              ? "text-red-600"
                              : deadline.daysLeft < 7
                              ? "text-orange-600"
                              : "text-blue-600"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{deadline.school}</p>
                        <p className="text-sm text-gray-600">{deadline.task}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{deadline.date}</p>
                      <p
                        className={`text-sm ${
                          deadline.daysLeft < 0
                            ? "text-red-600 font-medium"
                            : deadline.daysLeft < 7
                            ? "text-orange-600"
                            : "text-gray-600"
                        }`}
                      >
                        {deadline.daysLeft < 0
                          ? `${Math.abs(deadline.daysLeft)} days overdue`
                          : `${deadline.daysLeft} days left`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Calendar View Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>Visual timeline of all deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">Interactive calendar coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
