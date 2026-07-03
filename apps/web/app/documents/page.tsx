import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function DocumentsPage(): JSX.Element {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
        <p className="mt-2 text-muted-foreground">Správa dokumentů přijde v další fázi.</p>
      </div>
    </DashboardLayout>
  );
}
