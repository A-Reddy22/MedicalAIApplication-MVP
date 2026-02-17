import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../../auth/useAuth";
import { apiUrl } from "../lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, refresh } = useAuth();
  const [devName, setDevName] = useState("Dev User");
  const [oauthConfigured, setOauthConfigured] = useState<boolean | null>(null);
  const [devAuthEnabled, setDevAuthEnabled] = useState(false);
  const [oauthIssueMessage, setOauthIssueMessage] = useState<string | null>(null);

  const googleStartUrl = useMemo(() => apiUrl("/api/auth/google/start"), []);
  const authError = searchParams.get("authError");

  const authErrorMessage = useMemo(() => {
    if (!authError) return null;
    if (authError.startsWith("token_exchange_failed")) {
      return "Google login failed while exchanging the authorization code. Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI for an exact match.";
    }
    if (authError === "invalid_state") {
      return "Your login session expired or state validation failed. Please try signing in again.";
    }
    if (authError.startsWith("google_access_denied")) {
      return "Google sign-in was cancelled. Please try again.";
    }
    if (authError === "missing_code") {
      return "Google callback did not include an authorization code.";
    }
    if (authError === "missing_id_token") {
      return "Google callback did not return an ID token. Verify requested scopes include openid, email, and profile.";
    }
    return "Google login failed. Retry once, then check backend OAuth diagnostics.";
  }, [authError]);

  useEffect(() => {
    const loadAuthConfig = async () => {
      try {
        const response = await fetch(apiUrl("/api/auth/config"), { credentials: "include" });
        if (!response.ok) {
          setOauthConfigured(false);
          setDevAuthEnabled(import.meta.env.DEV);
          setOauthIssueMessage(null);
          return;
        }
        const data = await response.json();
        setOauthConfigured(Boolean(data.oauthConfigured));
        setDevAuthEnabled(Boolean(data.devFallbackEnabled));
        setOauthIssueMessage(data?.oauthIssue?.message ? String(data.oauthIssue.message) : null);
      } catch {
        setOauthConfigured(false);
        setDevAuthEnabled(import.meta.env.DEV);
        setOauthIssueMessage(null);
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

      {authErrorMessage ? (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{authErrorMessage}</p>
      ) : null}

      {oauthConfigured === false ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
          Google OAuth is not configured on the backend yet. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and
          GOOGLE_REDIRECT_URI in your backend env.
        </p>
      ) : null}

      {oauthIssueMessage ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">{oauthIssueMessage}</p>
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
