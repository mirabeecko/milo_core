import { getExecutiveProviderAsync } from "@/lib/data/executive";
import { ArtifactsView } from "./artifacts-view";

export default async function ArtifactsPage() {
  const provider = await getExecutiveProviderAsync();
  const artifacts = await provider.getArtifacts();
  const decisions = await provider.getDecisions();
  return <ArtifactsView artifacts={artifacts} decisions={decisions} />;
}
