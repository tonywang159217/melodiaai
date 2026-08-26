import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border/60 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 md:flex-row md:justify-between">
        <div>
          <div className="text-lg font-semibold">MelodiaAI</div>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Turn your ideas into one-of-a-kind music, in seconds. Powered by Suno AI.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-12 md:grid-cols-3">
          <div>
            <div className="mb-3 text-sm font-medium">Product</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/dashboard">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-sm font-medium">Company</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-sm font-medium">Legal</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/terms">Terms</Link></li>
              <li><Link href="/privacy">Privacy</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl px-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} MelodiaAI. All rights reserved.
      </div>
    </footer>
  );
}