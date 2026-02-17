import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../../auth/useAuth";
import { apiUrl } from "../lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, refresh } = useAuth();
  const [devName, setDevName] = useState("Dev User");
  const [oauthConfigured, setOauthConfigured] = useState<boolean | null>(null);
  const [devAuthEnabled, setDevAuthEnabled] = useState(false);

  const googleStartUrl = useMemo(() => apiUrl("/api/auth/google/start"), []);

  useEffect(() => {
    const loadAuthConfig = async () => {
      try {
        const response = await fetch(apiUrl("/api/auth/config"), { credentials: "include" });
        if (!response.ok) {
          setOauthConfigured(false);
          setDevAuthEnabled(import.meta.env.DEV);
          return;
        }
        const data = await response.json();
        setOauthConfigured(Boolean(data.oauthConfigured));
        setDevAuthEnabled(Boolean(data.devFallbackEnabled));
      } catch {
        setOauthConfigured(false);
        setDevAuthEnabled(import.meta.env.DEV);
      }
    };

    loadAuthConfig();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = googleStartUrl;
  };

  const handleDevLogin = async () => {
    try {
      const response = await fetch(apiUrl("/api/auth/dev-login"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: devName }),
      });
      if (!response.ok) {
        alert("Dev login failed. Configure Google OAuth credentials to continue.");
        return;
      }
      await refresh();
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Dev login failed", error);
      alert("Dev login failed. Check the backend console for details.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Sign in to continue</h2>
        <p className="text-sm text-gray-600">
          Use your Google account to save your profile, track progress, and return anytime.
        </p>
      </div>

      <Button className="w-full" onClick={handleGoogleLogin}>
        Continue with Google
      </Button>

      {oauthConfigured === false ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
          Google OAuth is not configured on the backend yet. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and
          GOOGLE_REDIRECT_URI in your backend env.
        </p>
      ) : null}

      {devAuthEnabled ? (
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <p className="text-xs text-gray-500">
            Google OAuth is not configured. Use dev mode only for local testing.
          </p>
          <Input
            value={devName}
            onChange={(event) => setDevName(event.target.value)}
            placeholder="Dev display name"
          />
          <Button variant="secondary" className="w-full" onClick={handleDevLogin}>
            Continue in dev mode
          </Button>
        </div>
      ) : null}

      <p className="text-xs text-gray-500">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
