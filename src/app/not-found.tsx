import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="mb-2 font-mono text-sm text-ink-soft">404</p>
      <h1 className="mb-4 text-lg font-semibold">That page doesn&apos;t exist</h1>
      <Link href="/" className="text-sm text-common hover:underline">
        Back to dashboard
      </Link>
    </main>
  );
}
