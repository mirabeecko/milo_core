import { getExecutiveProviderAsync } from "@/lib/data/executive";
import { RisksView } from "./risks-view";

export default async function RisksPage() {
  const provider = await getExecutiveProviderAsync();
  const risks = await provider.getRisks();
  const blockers = await provider.getBlockers();
  return <RisksView risks={risks} blockers={blockers} />;
}
