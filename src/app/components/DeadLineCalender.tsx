import { Badge } from "./ui/badge";

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

interface Deadline {
  date: Date;
  school: string;
  type: "primary" | "secondary";
  tier: "Safety" | "Target" | "Reach";
}

interface DeadlineCalendarProps {
  applications?: Application[];
}

export default function DeadlineCalendar({ applications = [] }: DeadlineCalendarProps) {
  // Convert applications to deadlines
  const deadlines: Deadline[] = applications.flatMap(app => [
    {
      date: new Date(app.deadlines.primary),
      school: app.school,
      type: "primary" as const,
      tier: app.tier,
    },
    {
      date: new Date(app.deadlines.secondary),
      school: app.school,
      type: "secondary" as const,
      tier: app.tier,
    }
  ]);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get first day of month and number of days
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Create calendar grid
  const calendarDays: (number | null)[] = [];
  
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Check if a day has deadlines
  const getDeadlinesForDay = (day: number) => {
    return deadlines.filter(d => {
      return d.date.getDate() === day &&
             d.date.getMonth() === currentMonth &&
             d.date.getFullYear() === currentYear;
    });
  };

  const tierColors = {
    Safety: "bg-green-500",
    Target: "bg-blue-500",
    Reach: "bg-orange-500",
  } as const;

  const typeLabels = {
    primary: "P",
    secondary: "S",
  } as const;

  return (
    <div className="w-full">
      {/* Month/Year Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{monthNames[currentMonth]} {currentYear}</h3>
        <div className="flex gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-600">Primary</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-gray-600">Secondary</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          const dayDeadlines = day ? getDeadlinesForDay(day) : [];
          const isToday = day === currentDate.getDate();
          
          return (
            <div
              key={index}
              className={`min-h-[80px] border border-gray-200 rounded p-1 ${
                day ? "bg-white hover:bg-gray-50" : "bg-gray-50"
              } ${isToday ? "ring-2 ring-blue-500" : ""}`}
            >
              {day && (
                <>
                  <div className={`text-sm font-medium mb-1 ${
                    isToday ? "text-blue-600" : "text-gray-700"
                  }`}>
                    {day}
                  </div>
                  
                  {/* Deadline indicators */}
                  <div className="space-y-1">
                    {dayDeadlines.map((deadline, idx) => (
                      <div
                        key={idx}
                        className={`text-xs p-1 rounded ${
                          deadline.type === "primary" 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-purple-100 text-purple-700"
                        }`}
                        title={`${deadline.school} - ${deadline.type}`}
                      >
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${tierColors[deadline.tier]}`} />
                          <span className="truncate text-xs">
                            {deadline.school.split(" ")[0]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs font-medium text-gray-700 mb-2">School Tier Legend:</p>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">Safety</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-600">Target</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-gray-600">Reach</span>
          </div>
        </div>
      </div>
    </div>
  );
}
