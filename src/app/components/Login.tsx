import React from "react";
import { Button } from "./ui/button";
import { apiUrl } from "../lib/api";

export default function Login() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleDevLogin = async () => {
    try {
      const res = await fetch(apiUrl("/api/auth/dev-login"), { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("dev login failed");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Dev login failed. Ensure the backend is running.");
    }
  };

  if (!googleClientId) {
    return (
      <div className="space-y-4">
        <p>Local dev: no Google OAuth configured.</p>
        <Button onClick={handleDevLogin}>Sign in (dev)</Button>
      </div>
    );
  }

  const oauthUrl = apiUrl("/api/auth/google/start");

  return (
    <div className="space-y-4">
      <p>Sign in with Google to continue.</p>
      <a href={oauthUrl}>
        <Button>Sign in with Google</Button>
      </a>
    </div>
  );
}
