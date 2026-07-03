import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { HomeView } from "@/components/views/home-view";

export default function HomePage(): JSX.Element {
  return (
    <DashboardLayout>
      <HomeView />
    </DashboardLayout>
  );
}
