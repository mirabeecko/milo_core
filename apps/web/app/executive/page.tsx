import { getExecutiveProviderAsync } from "@/lib/data/executive";
import type { Mission, Decision, Risk, Blocker, Approval, ActivityItem } from "@/lib/data/executive";
import { DailyCommandCenterView } from "./overview-view";

export default async function ExecutivePage() {
  const provider = await getExecutiveProviderAsync();
  const overview = await provider.getOverview();
  const departments = await provider.getDepartments();
  const missions: Mission[] = await provider.getMissions();
  const decisions: Decision[] = await provider.getDecisions();
  const risks: Risk[] = await provider.getRisks();
  const blockers: Blocker[] = await provider.getBlockers();
  const approvals: Approval[] = await provider.getApprovals();
  const activity: ActivityItem[] = await provider.getActivity();

  return (
    <DailyCommandCenterView
      overview={overview}
      departments={departments}
      missions={missions}
      decisions={decisions}
      risks={risks}
      blockers={blockers}
      approvals={approvals}
      activity={activity}
    />
  );
}
