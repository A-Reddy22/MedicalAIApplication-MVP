import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiUrl } from "../lib/api";
import { useAuth } from "../../auth/useAuth";
import { MatchResult, SubmittedProfilePayload } from "../types";

type ProfileRecord = SubmittedProfilePayload & { id?: string };

type AppDataContextValue = {
  matches: MatchResult[];
  setMatches: React.Dispatch<React.SetStateAction<MatchResult[]>>;
  profile: ProfileRecord | null;
  setProfile: React.Dispatch<React.SetStateAction<ProfileRecord | null>>;
  refreshProfile: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);

  const fetchMatchesForProfile = useCallback(
    async (profileId: string) => {
      try {
        const params = new URLSearchParams({ profileId, limit: "30" });
        const res = await fetch(apiUrl(`/api/match?${params.toString()}`), {
          credentials: "include",
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
    },
    []
  );

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(apiUrl(`/api/profile/user/${user.id}`), {
        credentials: "include",
      });
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      const savedProfile = data.profile as ProfileRecord;
      setProfile(savedProfile);
      if (savedProfile?.id) {
        await fetchMatchesForProfile(savedProfile.id);
      }
    } catch (err) {
      console.error("Failed to fetch latest profile", err);
    }
  }, [user?.id, fetchMatchesForProfile]);

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setMatches([]);
      return;
    }
    refreshProfile();
  }, [user?.id, refreshProfile]);

  const value = useMemo(
    () => ({
      matches,
      setMatches,
      profile,
      setProfile,
      refreshProfile,
    }),
    [matches, profile, refreshProfile]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
}
