import { useEffect, useRef, useState } from "react";
import { GraduationCap, User, Target, Calendar, LayoutDashboard, MessageSquare, FileText } from "lucide-react";
import Dashboard from "./components/Dashboard";
import ProfileIntake from "./components/ProfileIntake";
import SchoolMatch from "./components/SchoolMatch";
import ApplicationTracker from "./components/ApplicationTracker";
import EssayReview from "./components/EssayReview";
import { MatchResult, SubmittedProfilePayload } from "./types";

type Page = "dashboard" | "profile" | "schools" | "tracker" | "essay" | "chat";

type AuthState = {
  token: string;
  userId: string;
  email?: string;
  name?: string;
  picture?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [profile, setProfile] = useState<(SubmittedProfilePayload & { id?: string }) | null>(null);
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const primaryButtonRef = useRef<HTMLDivElement | null>(null);
  const sidebarButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const existingToken = localStorage.getItem("idToken");
    if (existingToken) {
      const parsed = decodeIdToken(existingToken);
      if (parsed?.sub) {
        setAuth({
          token: existingToken,
          userId: parsed.sub,
          email: parsed.email,
          name: parsed.name,
          picture: parsed.picture,
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!googleClientId) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleLoaded(true);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [googleClientId]);

  useEffect(() => {
    if (!googleLoaded || !googleClientId || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => {
        const parsed = decodeIdToken(response.credential);
        if (!parsed?.sub) return;
        const nextAuth: AuthState = {
          token: response.credential,
          userId: parsed.sub,
          email: parsed.email,
          name: parsed.name,
          picture: parsed.picture,
        };
        setAuth(nextAuth);
        localStorage.setItem("idToken", response.credential);
      },
    });

    const targets = [primaryButtonRef.current, sidebarButtonRef.current].filter(Boolean) as HTMLDivElement[];
    targets.forEach((target) => {
      target.innerHTML = "";
      window.google!.accounts.id.renderButton(target, {
        theme: "outline",
        size: "large",
        width: 240,
      });
    });

    window.google.accounts.id.prompt();
  }, [googleLoaded, googleClientId]);

  useEffect(() => {
    if (!auth?.userId || !auth.token) return;
    loadLatestProfile(auth.userId, auth.token);
  }, [auth?.userId, auth?.token]);

  function decodeIdToken(idToken: string) {
    try {
      const payload = JSON.parse(atob(idToken.split(".")[1]));
      return payload;
    } catch (err) {
      console.error("Failed to parse id token", err);
      return null;
    }
  }

  async function loadLatestProfile(userId: string, token: string) {
    try {
      const res = await fetch(`/api/profile/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;

      const data = await res.json();
      const savedProfile = data.profile as SubmittedProfilePayload & { id?: string };
      setProfile(savedProfile);

      if (savedProfile?.id) {
        await fetchMatchesForProfile(savedProfile.id);
      }
    } catch (err) {
      console.error("Failed to fetch latest profile", err);
    }
  }

  async function fetchMatchesForProfile(profileId: string) {
    try {
      const res = await fetch(`/api/match?profileId=${profileId}&limit=30`, {
        headers: auth?.token
          ? {
              Authorization: `Bearer ${auth.token}`,
            }
          : undefined,
      });
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
    if (!auth?.userId) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
          <h2 className="text-2xl font-semibold">Sign in with Google to personalize your experience</h2>
          <p className="text-gray-600 max-w-xl">
            We’ll securely save your profile to your Google account so you can reload your information and application
            matches without re-entering details.
          </p>
          <div ref={primaryButtonRef} />
          {!googleClientId && (
            <p className="text-sm text-red-600">Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.</p>
          )}
        </div>
      );
    }

    switch (currentPage) {
      case "dashboard":
        return <Dashboard matches={matches} userName={profile?.name} />;
      case "profile":
        return (
          <ProfileIntake
            authToken={auth.token}
            userId={auth.userId}
            defaultName={auth.name}
            onMatchesGenerated={(nextMatches) => {
              setMatches(nextMatches);
              setCurrentPage("schools");
            }}
            onProfileSaved={(savedProfile) => {
              setProfile(savedProfile);
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
        return <Dashboard matches={matches} userName={profile?.name} />;
    }
  };

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
          {auth?.userId ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                {auth.picture ? (
                  <img src={auth.picture} alt={auth.name ?? "User avatar"} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{auth.name ?? "Signed in"}</p>
                <p className="text-xs text-gray-500 truncate">{auth.email ?? auth.userId}</p>
                <button
                  type="button"
                  className="mt-2 text-xs text-blue-600 hover:underline"
                  onClick={() => {
                    setAuth(null);
                    setProfile(null);
                    setMatches([]);
                    localStorage.removeItem("idToken");
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium mb-2">Welcome</p>
              <div ref={sidebarButtonRef} />
              {!googleClientId && (
                <p className="text-xs text-red-600 mt-2">Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8 space-y-6">
          {googleClientId && !auth.token && (
            <div className="border border-blue-200 bg-blue-50 text-blue-900 p-4 rounded-lg">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Sign in with Google to personalize your experience</p>
                  <p className="text-sm text-blue-800">
                    We’ll securely save your profile to your Google account so you can reload your information and matches without
                    re-entering details.
                  </p>
                </div>
                <div ref={primaryButtonRef} className="self-start" />
              </div>
            </div>
          )}
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
