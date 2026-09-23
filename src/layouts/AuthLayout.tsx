import type { ReactNode } from 'react';

export default function AuthLayout({ children, title, description }: { children: ReactNode; title: string; description: string }) {
  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-12 text-zinc-100 selection:bg-indigo-500/30">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(79,70,229,0.18),_transparent_55%)]" />
    <section className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/85 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
      <div className="mb-7 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 font-extrabold text-white shadow-lg shadow-indigo-600/25">TH</span><div><p className="flex items-center gap-2 text-sm font-semibold text-white">TrainHub <span className="rounded border border-indigo-500/30 bg-indigo-500/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-indigo-300">SaaS</span></p><p className="text-[11px] text-zinc-500">Training Center Engine</p></div></div>
      <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1><p className="mt-1.5 text-sm text-zinc-400">{description}</p>
      <div className="mt-7">{children}</div>
      <p className="mt-7 border-t border-zinc-800 pt-5 text-center text-[11px] text-zinc-500">Multi-Tenant Training Suite</p>
    </section>
  </main>;
}
