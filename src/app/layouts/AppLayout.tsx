import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { GraduationCap, LayoutDashboard, User, Target, Calendar, FileText, MessageSquare, LogOut } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../../auth/useAuth";
import { AppDataProvider, useAppData } from "../state/appData";

const navigation = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Your Profile", path: "/profile", icon: User },
  { name: "School Match", path: "/schools", icon: Target },
  { name: "Application Tracker", path: "/tracker", icon: Calendar },
  { name: "Essay Review", path: "/essay", icon: FileText },
  { name: "Chat Agent", path: "/chat", icon: MessageSquare },
];

function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile } = useAppData();

  const displayName =
    profile?.applicantProfile?.academic?.fullName || user?.name || user?.email || "Student";
  const subtext = user?.email ? `Signed in as ${user.email}` : "Signed in";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <GraduationCap className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="font-semibold">MedAdmit AI</h1>
            <p className="text-xs text-gray-500">Med School Assistant</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          {user?.pictureUrl ? (
            <img
              src={user.pictureUrl}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{subtext}</p>
          </div>
        </div>
        <Button variant="secondary" className="w-full" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

export default function AppLayout() {
  return (
    <AppDataProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </AppDataProvider>
  );
}
