import ProfileIntake from "../components/ProfileIntake";
import { useAuth } from "../../auth/useAuth";
import { useAppData } from "../state/appData";

export default function ProfilePage() {
  const { user } = useAuth();
  const { setMatches, profile, setProfile } = useAppData();
  const defaultName = profile?.applicantProfile?.academic?.fullName || user?.name || user?.email || "";

  return (
    <ProfileIntake
      defaultName={defaultName}
      profile={profile}
      onMatchesGenerated={(nextMatches) => {
        setMatches(nextMatches);
      }}
      onProfileSaved={(savedProfile) => {
        setProfile(savedProfile);
      }}
    />
  );
}
