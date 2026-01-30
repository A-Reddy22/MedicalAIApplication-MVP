import Dashboard from "../components/Dashboard";
import { useAppData } from "../state/appData";
import { useAuth } from "../../auth/useAuth";

export default function DashboardPage() {
  const { matches, profile } = useAppData();
  const { user } = useAuth();
  const userName = profile?.applicantProfile?.academic?.fullName || user?.name || user?.email || "Student";

  return <Dashboard matches={matches} userName={userName} />;
}
