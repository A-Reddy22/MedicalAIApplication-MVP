import { useEffect, useState } from "react";
import { GraduationCap, User, Target, Calendar, LayoutDashboard, MessageSquare, FileText } from "lucide-react";
import Dashboard from "./components/Dashboard";
import ProfileIntake from "./components/ProfileIntake";
import SchoolMatch from "./components/SchoolMatch";
import ApplicationTracker from "./components/ApplicationTracker";
import EssayReview from "./components/EssayReview";
import { MatchResult, SubmittedProfilePayload } from "./types";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

type Page = "dashboard" | "profile" | "schools" | "tracker" | "essay" | "chat";

type Session = {
  mode: "guest" | "username" | "google";
  userId: string;
  displayName: string;
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [profile, setProfile] = useState<(SubmittedProfilePayload & { id?: string }) | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authChoice, setAuthChoice] = useState<"guest" | "username" | "google">("guest");
  const [usernameInput, setUsernameInput] = useState("");
  const [googleEmailInput, setGoogleEmailInput] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("medadmit.session");
    if (!stored) return;

    try {
      const parsed: Session = JSON.parse(stored);
      setSession(parsed);
    } catch (err) {
      console.error("Failed to parse session", err);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    localStorage.setItem("medadmit.session", JSON.stringify(session));
    loadLatestProfile(session.userId);
  }, [session]);

  async function loadLatestProfile(userId: string) {
    try {
      const res = await fetch(`/api/profile/user/${userId}`);
      if (!res.ok) return;

      const data = await res.json();
      const savedProfile = data.profile as SubmittedProfilePayload & { id?: string };
      setProfile(savedProfile);

      setSession((prev) => {
        if (!prev) return prev;
        const nextName = savedProfile.name ?? prev.displayName;
        if (nextName === prev.displayName) return prev;
        return { ...prev, displayName: nextName };
      });

      if (savedProfile?.id) {
        await fetchMatchesForProfile(savedProfile.id, userId);
      }
    } catch (err) {
      console.error("Failed to fetch latest profile", err);
    }
  }

  async function fetchMatchesForProfile(profileId: string, ownerUserId?: string) {
    try {
      const res = await fetch(`/api/match?profileId=${profileId}&limit=30`);
      if (!res.ok) {
        console.error("Failed to fetch matches", await res.text());
        return;
      }

      const data = await res.json();
      setMatches(data.matches ?? []);
    } catch (err) {
      console.error("Failed to fetch matches", err);
    }
  }

  const navigation = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
    { id: "profile", name: "Your Profile", icon: User },
    { id: "schools", name: "School Match", icon: Target },
    { id: "tracker", name: "Application Tracker", icon: Calendar },
    { id: "essay", name: "Essay Review", icon: FileText },
    { id: "chat", name: "Chat Agent", icon: MessageSquare },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard matches={matches} userName={defaultName} />;
      case "profile":
        return (
          <ProfileIntake
            userId={session.userId}
            defaultName={defaultName}
            onMatchesGenerated={(nextMatches) => {
              setMatches(nextMatches);
              setCurrentPage("schools");
            }}
            onProfileSaved={(savedProfile) => {
              setProfile(savedProfile);
              setSession((prev) =>
                prev ? { ...prev, displayName: savedProfile.name ?? prev.displayName } : prev,
              );
            }}
          />
        );
      case "schools":
        return <SchoolMatch matches={matches} />;
      case "tracker":
        return <ApplicationTracker />;
      case "essay":
        return <EssayReview />;
      case "chat":
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-blue-500" />
              <h2 className="mb-2">Med School Chat Agent</h2>
              <p className="text-gray-600">Coming soon - AI-powered admissions Q&A</p>
            </div>
          </div>
        );
      default:
        return <Dashboard matches={matches} userName={defaultName} />;
    }
  };

  const defaultName = profile?.name ?? session?.displayName;

  const startGuestSession = () => {
    const existing = localStorage.getItem("medadmit.guestId");
    const guestId = existing ?? `guest-${crypto.randomUUID?.() ?? Date.now().toString(36)}`;
    localStorage.setItem("medadmit.guestId", guestId);
    activateSession({ mode: "guest", userId: guestId, displayName: "Guest" });
  };

  const activateSession = (next: Session) => {
    setMatches([]);
    setProfile(null);
    setCurrentPage("dashboard");
    setSession(next);
  };

  const handleUsernameLogin = () => {
    if (!usernameInput.trim()) return;
    const cleanedName = usernameInput.trim();
    const slug = cleanedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const userId = `user-${slug || Date.now().toString(36)}`;
    activateSession({ mode: "username", userId, displayName: cleanedName });
  };

  const handleGoogleLogin = () => {
    if (!googleEmailInput.trim()) return;
    const email = googleEmailInput.trim().toLowerCase();
    const nameFromEmail = email.split("@")[0] || "Google User";
    const userId = `google-${email.replace(/[^a-z0-9]+/g, "-")}`;
    activateSession({ mode: "google", userId, displayName: nameFromEmail });
  };

  if (!session) {
    const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-3xl space-y-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-semibold">Welcome to MedAdmit AI</h1>
              <p className="text-sm text-gray-600">Choose how you want to start. Your choice controls how we save your progress.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div
              className={`border rounded-xl p-4 space-y-3 ${authChoice === "guest" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Continue as Guest</h3>
                <input
                  type="radio"
                  name="authChoice"
                  value="guest"
                  checked={authChoice === "guest"}
                  onChange={() => setAuthChoice("guest")}
                />
              </div>
              <p className="text-sm text-gray-600">Keep everything in this browser. No sign-in required.</p>
              <Button className="w-full" variant={authChoice === "guest" ? "default" : "secondary"} onClick={startGuestSession}>
                Continue
              </Button>
            </div>

            <div
              className={`border rounded-xl p-4 space-y-3 ${authChoice === "username" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Sign in with a username</h3>
                <input
                  type="radio"
                  name="authChoice"
                  value="username"
                  checked={authChoice === "username"}
                  onChange={() => setAuthChoice("username")}
                />
              </div>
              <p className="text-sm text-gray-600">Link your progress to a username so you can return to it later.</p>
              <Input
                placeholder="Enter a username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                disabled={authChoice !== "username"}
              />
              <Button className="w-full" onClick={handleUsernameLogin} disabled={authChoice !== "username" || !usernameInput.trim()}>
                Save & continue
              </Button>
            </div>

            <div
              className={`border rounded-xl p-4 space-y-3 ${authChoice === "google" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Sign in with Google</h3>
                <input
                  type="radio"
                  name="authChoice"
                  value="google"
                  checked={authChoice === "google"}
                  onChange={() => setAuthChoice("google")}
                />
              </div>
              <p className="text-sm text-gray-600">
                Use your Google email to keep your profile linked. {googleConfigured ? "" : "Set VITE_GOOGLE_CLIENT_ID for full Google sign-in."}
              </p>
              <Input
                type="email"
                placeholder="you@example.com"
                value={googleEmailInput}
                onChange={(e) => setGoogleEmailInput(e.target.value)}
                disabled={authChoice !== "google"}
              />
              <Button className="w-full" onClick={handleGoogleLogin} disabled={authChoice !== "google" || !googleEmailInput.trim()}>
                Continue with Google
              </Button>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            You can switch methods later; each option saves data separately so you can try the app as a guest without touching your signed-in profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
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
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id as Page)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 w-64 p-6 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{defaultName || "Guest"}</p>
              <p className="text-xs text-gray-500 truncate">
                {session.mode === "guest" ? "Progress saved for this browser" : `Signed in as ${session.mode}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">{renderPage()}</div>
      </div>
    </div>
  );
}
