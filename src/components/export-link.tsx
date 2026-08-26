export function ExportLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      Excel&apos;e Aktar
    </a>
  );
}
