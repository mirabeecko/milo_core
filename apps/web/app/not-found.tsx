import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <Card className="mx-auto w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-7 w-7 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Stránka nenalezena</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Stránka, kterou hledáte, neexistuje nebo byla přesunuta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">Zpět na úvod</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
