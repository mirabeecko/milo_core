import type { Metadata } from "next";
import { Toaster } from "sonner";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/app/globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { QueryProvider } from "@/components/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CommandPalette } from "@/components/common/command-palette";

export const metadata: Metadata = {
  title: "MiLO – osobní operační systém",
  description: "AI Chief of Staff pro řízení projektů, času a komunikace.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <QueryProvider>
            <AuthProvider>
              <DashboardLayout>
                <CommandPalette />
                {children}
              </DashboardLayout>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'hsl(240 10% 3.9%)',
              border: '1px solid hsl(240 3.7% 15.9%)',
              color: 'hsl(0 0% 98%)',
            }
          }}
        />
      </body>
    </html>
  );
}
