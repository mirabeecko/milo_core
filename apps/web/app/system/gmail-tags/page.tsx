"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { Tag, Mail, Filter, Inbox } from "lucide-react";

const TAGS = [
  {
    icon: "🐕", name: "Drakobijec", color: "green",
    desc: "Tractive GPS tracker pro psa",
    filter: "from:tractive.com",
    inbox: false,
    examples: ["Mazlíček Drakobijec vstoupil za virtuální plot", "Tracker má vybitou baterii", "Mazlíček opustil virtuální plot"],
  },
  {
    icon: "📅", name: "Kalendář", color: "blue",
    desc: "Notifikace Google Kalendáře",
    filter: "from:calendar-notification@google.com",
    inbox: false,
    examples: ["Připomenutí události", "Pozvánka na schůzku", "Změna času události"],
  },
  {
    icon: "💻", name: "GitHub", color: "gray",
    desc: "Notifikace z GitHub repozitářů",
    filter: "from:notifications@github.com",
    inbox: false,
    examples: ["Issue otevřen", "Pull request", "Action failed", "Release"],
  },
  {
    icon: "🚀", name: "Vercel", color: "slate",
    desc: "Deployment notifikace",
    filter: "from:vercel.com",
    inbox: false,
    examples: ["Deployment completed", "Build failed", "Production alias"],
  },
  {
    icon: "💼", name: "INIZIO", color: "purple",
    desc: "Komunikace s INIZIO týmem",
    filter: "from:inizio.cz",
    inbox: false,
    examples: ["Newslettery", "Nabídky spolupráce", "Kontakty Standa Holý, Jan Nedvěd"],
  },
  {
    icon: "📰", name: "Newslettery", color: "amber",
    desc: "Automaticky podle List-Unsubscribe hlavičky",
    filter: "from:inizio.cz OR from:streetgame.cz OR from:taskade.com OR from:temuemail.com OR from:facebookmail.com OR from:email.decathlon.com OR from:members.netflix.com OR from:genesis-eshop.cz OR from:reas.cz OR from:semalt.org OR from:allegro.cz OR from:gopro.com OR from:influxdata.com OR from:ebay.co.uk OR from:mail.beehiiv.com OR from:meziweby.cz OR from:mp.cz OR from:nordvpn.com OR from:postovnezakorunu.cz OR from:dribbble.com OR from:supabase.com OR from:remixshop.com OR from:naoperak.cz OR from:pelikan.cz OR from:driveto.cz OR from:spokojenypes.cz OR from:growjob.com OR from:n8n.io (29 domén)",
    inbox: false,
    examples: ["Petr Ludwig — AI shrnutí", "n8n Security Update", "Netflix novinky", "Decathlon nabídky"],
  },
  {
    icon: "🛒", name: "Nákupy", color: "orange",
    desc: "Objednávky, tracking, nabídky e-shopů",
    filter: "from:alibaba.com OR from:aliexpress.com OR from:decathlon.com OR from:temu.com OR from:temuemail.com OR from:ebay.co.uk OR from:alza.cz OR from:mall.cz OR from:rohlik.cz OR from:kosik.cz OR from:notino.cz OR from:driveta.cz OR from:zooplus.cz OR from:tugedr.eu OR from:shein.com OR from:wish.com (16 domén)",
    inbox: false,
    examples: ["AliExpress — objednávka odeslána", "Alibaba — supplier message", "Decathlon — potvrzení objednávky", "Alza — faktura"],
  },
  {
    icon: "💳", name: "Finance", color: "emerald",
    desc: "Platby, banky, transakce",
    filter: "from:revolut.com OR from:gopay.com OR from:bolt.eu",
    inbox: false,
    examples: ["Revolut — platba přijata", "GoPay — potvrzení transakce", "Bolt — účtenka"],
  },
  {
    icon: "🌐", name: "Domény", color: "cyan",
    desc: "Forpsi — hosting, domény, faktury",
    filter: "from:forpsi.com",
    inbox: false,
    examples: ["Prodloužení domény", "Faktura za hosting", "Technická oznámení"],
  },
  {
    icon: "📬", name: "Datovky", color: "red",
    desc: "Zprávy z datových schránek",
    filter: "from:posta.sys.cz OR from:mojedatovaschranka.cz OR from:isds.czechpoint.cz",
    inbox: true,
    examples: ["Datová zpráva — úřad", "ISDS — nová zpráva"],
  },
  {
    icon: "📮", name: "Adresováno mně", color: "indigo",
    desc: "Osobní emaily od skutečných lidí (ruční třídění)",
    filter: "— ruční štítek, žádný automatický filtr —",
    inbox: true,
    examples: ["Zprávy od kolegů, klientů, přátel"],
  },
];

const colorMap: Record<string, string> = {
  green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  gray: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  slate: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  red: "bg-red-500/10 text-red-400 border-red-500/30",
  indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
};

export default function GmailTagsPage() {
  const inboxTags = TAGS.filter((t) => t.inbox);
  const archiveTags = TAGS.filter((t) => !t.inbox);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="📬 Gmail TAGS"
        description={`${TAGS.length} štítků — ${archiveTags.length} automaticky archivovaných, ${inboxTags.length} zůstává v inboxu`}
      />

      {/* Statistiky */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {TAGS.map((tag) => (
          <Card key={tag.name} className="text-center">
            <CardContent className="p-3">
              <div className="text-2xl">{tag.icon}</div>
              <div className="text-xs font-medium mt-1">{tag.name}</div>
              {tag.inbox ? (
                <Badge variant="outline" className="mt-1 text-[10px] border-green-500/30 text-green-400">INBOX</Badge>
              ) : (
                <Badge variant="outline" className="mt-1 text-[10px] border-zinc-500/30 text-zinc-400">ARCHIV</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail karet */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Filter className="h-4 w-4" /> Automaticky archivované (zmizí z inboxu)
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {archiveTags.map((tag) => (
            <TagDetail key={tag.name} tag={tag} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Inbox className="h-4 w-4" /> Zůstávají v inboxu
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {inboxTags.map((tag) => (
            <TagDetail key={tag.name} tag={tag} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TagDetail({ tag }: { tag: typeof TAGS[0] }) {
  return (
    <Card className="group hover:border-primary/20 transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-xl">{tag.icon}</span>
            <span>{tag.name}</span>
          </CardTitle>
          <Badge variant="outline" className={colorMap[tag.color] ?? "border-border"}>
            {tag.inbox ? "Zůstává" : "Archivováno"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{tag.desc}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Filtr */}
        <div>
          <div className="text-[10px] text-muted-foreground uppercase mb-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Filtr
          </div>
          <code className="block text-[11px] bg-muted/50 p-2 rounded text-muted-foreground break-all font-mono">
            {tag.filter}
          </code>
        </div>

        {/* Příklady */}
        <div>
          <div className="text-[10px] text-muted-foreground uppercase mb-1 flex items-center gap-1">
            <Mail className="h-3 w-3" /> Příklady
          </div>
          <ul className="space-y-0.5">
            {tag.examples.map((ex) => (
              <li key={ex} className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="text-[10px] opacity-50">•</span>
                {ex}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
