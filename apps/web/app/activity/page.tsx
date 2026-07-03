import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function ActivityPage(): JSX.Element {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <h2 className="text-3xl font-bold tracking-tight">Activity</h2>
        <p className="mt-2 text-muted-foreground">Activity feed přijde v další fázi.</p>
      </div>
    </DashboardLayout>
  );
}
