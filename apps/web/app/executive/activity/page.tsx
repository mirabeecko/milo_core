import { getExecutiveProviderAsync } from "@/lib/data/executive";
import { ActivityView } from "./activity-view";

export default async function ActivityPage() {
  const provider = await getExecutiveProviderAsync();
  const activity = await provider.getActivity();
  return <ActivityView activity={activity} />;
}
