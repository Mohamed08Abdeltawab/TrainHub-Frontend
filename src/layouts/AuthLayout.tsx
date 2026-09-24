import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Badge, Separator } from '@/components/ui';

export default function AuthLayout({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground selection:bg-primary/25">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(79,70,229,0.18),_transparent_55%)]"
      />
      <Card className="relative w-full max-w-md border-border bg-card/90 p-0 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-2">
        <CardHeader className="px-6 pt-6 pb-2 sm:px-8 sm:pt-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary font-extrabold text-primary-foreground shadow-lg shadow-primary/25">
              TH
            </span>
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                TrainHub
                <Badge variant="default" className="px-1.5 py-0 text-[9px] uppercase tracking-wider">
                  SaaS
                </Badge>
              </p>
              <p className="text-[11px] text-muted-foreground">Training Center Engine</p>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">{title}</CardTitle>
          <CardDescription className="mt-1.5 text-sm text-muted-foreground">{description}</CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-4 sm:px-8">
          {children}
        </CardContent>
        <div className="px-6 sm:px-8">
          <Separator className="bg-border" />
        </div>
        <CardFooter className="justify-center border-t-0 px-6 py-4 text-center sm:px-8">
          <p className="text-[11px] text-muted-foreground">Multi-Tenant Training Suite</p>
        </CardFooter>
      </Card>
    </main>
  );
}
