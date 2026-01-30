import SchoolMatch from "../components/SchoolMatch";
import { useAppData } from "../state/appData";

export default function SchoolMatchPage() {
  const { matches } = useAppData();
  return <SchoolMatch matches={matches} />;
}
