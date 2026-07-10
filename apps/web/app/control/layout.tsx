import Link from "next/link";

export default function ControlLayout({ children }: { children: React.ReactNode }) {
  const links = [
    { href: "/control", label: "Přehled" },
    { href: "/control/agents", label: "Agenti" },
    { href: "/control/use-cases", label: "Use Cases" },
    { href: "/control/capabilities", label: "Capabilities" },
  ];

  return (
    <div className="min-h-screen">
      <nav className="border-b px-6 py-3 flex gap-6 text-sm">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground transition-colors">
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
