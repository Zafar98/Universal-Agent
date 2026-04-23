import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800 bg-slate-950 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <span>© {new Date().getFullYear()} Asistoria</span>
          <span className="hidden md:inline">|</span>
          <Link href="/trust" className="hover:underline text-blue-300">Trust & Compliance</Link>
        </div>
        <div className="flex gap-3 items-center text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-green-400 font-semibold">✔ SOC 2</span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-blue-300 font-semibold">GDPR</span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-yellow-300 font-semibold">99.99% Uptime</span>
        </div>
      </div>
    </footer>
  );
}
