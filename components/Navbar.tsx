"use client";

import Link from "next/link";
import { Music, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Button from "./Button";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
            <Music size={18} />
          </span>
          <span className="tracking-tight">MelodiaAI</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={cn("md:hidden overflow-hidden border-t border-border/60 transition-[max-height]", open ? "max-h-96" : "max-h-0")}>
        <div className="flex flex-col gap-4 p-6">
          <Link href="/pricing" onClick={() => setOpen(false)}>Pricing</Link>
          <Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/auth/login" onClick={() => setOpen(false)}>
              <Button variant="ghost" full>Sign in</Button>
            </Link>
            <Link href="/auth/signup" onClick={() => setOpen(false)}>
              <Button full>Get started</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}