import { getExecutiveProviderAsync } from "@/lib/data/executive";
import type { Mission } from "@/lib/data/executive";
import { MissionsView } from "./missions-view";

export default async function MissionsPage() {
  const provider = await getExecutiveProviderAsync();
  const missions = await provider.getMissions();
  return <MissionsView missions={missions} />;
}
