import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <p className="text-6xl font-bold text-indigo-600">404</p>
      <p className="text-slate-600">Pagina non trovata · Page not found</p>
      <Link href="/" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
        Home
      </Link>
    </div>
  );
}
