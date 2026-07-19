import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Control Center — MiLO",
  description: "Ovládací panel pro správu agentů a řízení systému",
};

export default function ControlLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
