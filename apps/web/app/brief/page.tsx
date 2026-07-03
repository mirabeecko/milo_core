import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { BriefView } from "@/components/views/brief-view";

export default function BriefPage(): JSX.Element {
  return (
    <DashboardLayout>
      <BriefView />
    </DashboardLayout>
  );
}
