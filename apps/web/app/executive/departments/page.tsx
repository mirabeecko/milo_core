import { getExecutiveProviderAsync } from "@/lib/data/executive";
import { DepartmentsView } from "./departments-view";

export default async function DepartmentsPage() {
  const provider = await getExecutiveProviderAsync();
  const departments = await provider.getDepartments();
  return <DepartmentsView departments={departments} />;
}
