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

  const googleStartUrl = useMemo(() => apiUrl("/api/auth/google/start"), []);

  const devFallbackEnabled =
    import.meta.env.DEV &&
    !import.meta.env.VITE_GOOGLE_CLIENT_ID &&
    (import.meta.env.VITE_DEV_AUTH === "true" || import.meta.env.DEV);

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

      {devFallbackEnabled ? (
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
