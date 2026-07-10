import { getExecutiveProviderAsync } from "@/lib/data/executive";
import { ApprovalsView } from "./approvals-view";

export default async function ApprovalsPage() {
  const provider = await getExecutiveProviderAsync();
  const approvals = await provider.getApprovals();
  return <ApprovalsView approvals={approvals} />;
}
