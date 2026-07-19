"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Chrome,
  LogIn,
  ArrowRight,
  AlertCircle,
  Loader2,
  Shield,
  Calendar,
  Mail,
  HardDrive,
} from "lucide-react";

type OAuthState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "not-configured" };

const benefits = [
  { icon: Calendar, label: "Kalendář" },
  { icon: Mail, label: "Gmail" },
  { icon: HardDrive, label: "Disk" },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<OAuthState>({ kind: "idle" });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState({ kind: "not-configured" });
      return;
    }

    const supabase = createSupabaseClient();
    if (!supabase) {
      setState({ kind: "not-configured" });
      return;
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace("/");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router, searchParams]);

  async function initiateGoogleLogin(): Promise<void> {
    setState({ kind: "loading" });

    if (!isSupabaseConfigured) {
      setState({ kind: "not-configured" });
      return;
    }

    const supabase = createSupabaseClient();
    if (!supabase) {
      setState({ kind: "not-configured" });
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      setState({ kind: "error", message: error.message });
    }
  }

  function renderContent(): JSX.Element {
    switch (state.kind) {
      case "not-configured":
        return (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
              <AlertCircle className="h-6 w-6 text-amber-500" />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium">
                Google OAuth není nakonfigurováno
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                Pro nasazení na VPS nastavte{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                  GOOGLE_CLIENT_ID
                </code>
                ,{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                  GOOGLE_CLIENT_SECRET
                </code>{" "}
                a{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
                  GOOGLE_REDIRECT_URI
                </code>{" "}
                v <code className="rounded bg-muted px-1 py-0.5 text-[11px]">.env</code>.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState({ kind: "idle" })}
            >
              Zkusit znovu
            </Button>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-sm text-center text-destructive max-w-xs">
              {state.message}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState({ kind: "idle" })}
            >
              Zkusit znovu
            </Button>
          </div>
        );

      default:
        return (
          <div className="space-y-5">
            <Button
              className="w-full h-11 gap-2.5 bg-white text-gray-800 hover:bg-gray-100 border border-gray-200 shadow-sm font-medium"
              onClick={initiateGoogleLogin}
              disabled={state.kind === "loading"}
            >
              {state.kind === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Chrome className="h-4 w-4 text-[#4285F4]" />
              )}
              Přihlásit se přes Google
              {state.kind !== "loading" && (
                <ArrowRight className="h-4 w-4 ml-auto" />
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Propojte svůj Google účet pro přístup ke Kalendáři, Gmailu,
                Disku a dalším službám.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
              {benefits.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1"
                >
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <Card className="w-full max-w-sm border-border/40 shadow-xl animate-fade-in-up">
        <CardHeader className="items-center space-y-3 pb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <LogIn className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1 text-center">
            <CardTitle className="text-xl tracking-tight">MiLO OS</CardTitle>
            <CardDescription>
              Přihlaste se ke svému účtu
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
