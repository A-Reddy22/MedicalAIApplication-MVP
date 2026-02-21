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
  const [googleStartUrl, setGoogleStartUrl] = useState(() => apiUrl("/api/auth/google/start"));
  const [oauthConfigured, setOauthConfigured] = useState<boolean | null>(null);
  const [devAuthEnabled, setDevAuthEnabled] = useState(false);
  const [oauthIssueMessage, setOauthIssueMessage] = useState<string | null>(null);
  const [callbackFailureDetail, setCallbackFailureDetail] = useState<string | null>(null);
  const authError = searchParams.get("authError");

  const authErrorMessage = useMemo(() => {
    if (!authError) return null;
    if (authError.startsWith("token_exchange_failed")) {
      return "Google login failed while exchanging the authorization code. Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI for an exact match.";
    }
    if (authError === "token_exchange_network_failed") {
      return "Google login failed while contacting the token endpoint. Verify backend internet access and retry.";
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
    if (authError === "id_token_verification_failed") {
      return "Google ID token validation failed. Retry once, then check backend OAuth diagnostics.";
    }
    if (authError === "profile_fetch_failed") {
      return "Google profile lookup failed after token exchange. Check backend OAuth diagnostics and retry.";
    }
    if (authError === "session_sign_failed") {
      return "Google login succeeded, but creating your server session cookie failed. Check SESSION_JWT_SECRET and backend cookie settings.";
    }
    if (authError === "missing_identity" || authError === "missing_google_subject") {
      return "Google callback succeeded but did not return a usable identity. Verify scopes and OAuth app configuration.";
    }
    if (authError === "redirect_origin_mismatch") {
      return "Backend redirect URI origin does not match the running backend origin. Align GOOGLE_REDIRECT_URI exactly.";
    }
    if (authError === "oauth_not_configured") {
      return "Google OAuth is not configured on the backend. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.";
    }
    if (authError === "callback_failed") {
      return "Google login failed inside the backend callback. This usually means the API server is running an older callback handler or hit an internal error. Open /api/auth/diagnostics and check lastOAuthCallbackFailure.";
    }
    if (authError.startsWith("callback_failed_")) {
      return `Google login failed inside backend callback (${authError}). Open /api/auth/diagnostics to view lastOAuthCallbackFailure and fix the reported internal error.`;
    }
    return `Google login failed (${authError}). Retry once, then check backend OAuth diagnostics.`;
  }, [authError]);

  useEffect(() => {
    const loadAuthConfig = async () => {
      try {
        const response = await fetch(apiUrl("/api/auth/config"), { credentials: "include" });
        if (!response.ok) {
          setOauthConfigured(false);
          setDevAuthEnabled(import.meta.env.DEV);
          setOauthIssueMessage(null);
          setGoogleStartUrl(apiUrl("/api/auth/google/start"));
          return;
        }
        const data = await response.json();
        setOauthConfigured(Boolean(data.oauthConfigured));
        setDevAuthEnabled(Boolean(data.devFallbackEnabled));
        const configuredStartUrl =
          typeof data?.oauthStartUrl === "string" && data.oauthStartUrl.length
            ? data.oauthStartUrl
            : apiUrl("/api/auth/google/start");
        setGoogleStartUrl(configuredStartUrl);

        const issueParts = [];
        if (data?.oauthIssue?.message) issueParts.push(String(data.oauthIssue.message));
        if (data?.oauthWarning?.message) issueParts.push(String(data.oauthWarning.message));
        setOauthIssueMessage(issueParts.length ? issueParts.join(" ") : null);
      } catch {
        setOauthConfigured(false);
        setDevAuthEnabled(import.meta.env.DEV);
        setOauthIssueMessage(null);
        setGoogleStartUrl(apiUrl("/api/auth/google/start"));
      }
    };

    loadAuthConfig();
  }, []);

  useEffect(() => {
    const shouldLoadDiagnostics =
      authError === "callback_failed" || (typeof authError === "string" && authError.startsWith("callback_failed_"));

    if (!shouldLoadDiagnostics) {
      setCallbackFailureDetail(null);
      return;
    }

    let active = true;
    const loadDiagnostics = async () => {
      try {
        const response = await fetch(apiUrl("/api/auth/diagnostics"), { credentials: "include" });
        if (!response.ok) return;
        const data = await response.json();
        if (!active) return;

        const failure = data?.lastOAuthCallbackFailure;
        const failureReason = typeof failure?.reason === "string" ? failure.reason : null;
        const failureMessage = typeof failure?.summary?.message === "string" ? failure.summary.message : null;
        const handlerVersion = typeof data?.oauthCallbackHandlerVersion === "string" ? data.oauthCallbackHandlerVersion : null;
        const pieces = [];
        if (handlerVersion) pieces.push(`handler=${handlerVersion}`);
        if (failureReason) pieces.push(`reason=${failureReason}`);
        if (failureMessage) pieces.push(`message=${failureMessage}`);
        setCallbackFailureDetail(pieces.length ? pieces.join(" | ") : null);
      } catch {
        if (!active) return;
        setCallbackFailureDetail(null);
      }
    };

    loadDiagnostics();
    return () => {
      active = false;
    };
  }, [authError]);

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, navigate]);

  const handleGoogleLogin = () => {
    if (oauthIssueMessage) {
      alert("Google login is currently blocked by backend OAuth configuration. Fix the warning shown on this page, then retry.");
      return;
    }
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

      <Button className="w-full" onClick={handleGoogleLogin} disabled={!oauthConfigured || Boolean(oauthIssueMessage)}>
        Continue with Google
      </Button>

      {authErrorMessage ? (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{authErrorMessage}</p>
      ) : null}

      {callbackFailureDetail ? (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          OAuth diagnostics: {callbackFailureDetail}
        </p>
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
            Dev auth mode is enabled. Use this only for local testing.
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
