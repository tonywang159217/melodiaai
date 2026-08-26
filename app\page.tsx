"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import MusicGenerator from "@/components/MusicGenerator";
import PricingCard from "@/components/PricingCard";
import type { PricingTier } from "@/types";

const PRICING: PricingTier[] = [
  {
    slug: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    description: "Try MelodiaAI risk-free.",
    cta: "Create free account",
    features: [
      { label: "5 generations / month", free: true, basic: true, pro: true },
      { label: "MP3 download", free: true, basic: true, pro: true },
      { label: "Personal license", basic: true, pro: true },
      { label: "Commercial license", pro: true },
      { label: "Priority generation", pro: true },
      { label: "Unlimited generations", pro: true },
    ],
  },
  {
    slug: "basic",
    name: "Creator",
    priceMonthly: 9,
    priceYearly: 7,
    highlight: true,
    variantId: process.env.NEXT_PUBLIC_BASIC_PLAN_VARIANT_ID,
    description: "Perfect for hobbyists & indie creators.",
    cta: "Start Creator plan",
    features: [
      { label: "200 generations / month", basic: true, pro: true },
      { label: "MP3 + WAV download", basic: true, pro: true },
      { label: "Personal license", basic: true, pro: true },
      { label: "Commercial license", pro: true },
      { label: "Priority generation", pro: true },
      { label: "Unlimited generations", pro: true },
    ],
  },
  {
    slug: "pro",
    name: "Pro",
    priceMonthly: 29,
    priceYearly: 23,
    variantId: process.env.NEXT_PUBLIC_PRO_PLAN_VARIANT_ID,
    description: "For studios, brands and power users.",
    cta: "Upgrade to Pro",
    features: [
      { label: "Unlimited generations", pro: true },
      { label: "MP3 + WAV + Stems download", pro: true },
      { label: "Full commercial license", pro: true },
      { label: "Priority generation queue", pro: true },
      { label: "API access (coming)", pro: true },
      { label: "Early access to new models", pro: true },
    ],
  },
];

export default function HomePage() {
  const router = useRouter();
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(139,92,246,0.18), transparent 60%)",
          }}
        />
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 pb-16 pt-24 text-center md:pt-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1 text-xs font-medium text-violet-600 dark:text-violet-300">
            <Sparkles size={13} />
            Powered by the latest Suno AI model
          </span>

          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Make{" "}
            <span className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent">
              original music
            </span>{" "}
            by typing an idea.
          </h1>

          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Describe the mood, genre and story — MelodiaAI composes, performs and
            masters a unique track you can instantly own and monetize.
          </p>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row">
            <Link href="/auth/signup">
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-foreground px-6 text-base font-medium text-background transition hover:bg-foreground/90">
                Start creating free
                <ArrowRight size={18} />
              </button>
            </Link>
            <Link href="#pricing">
              <button className="inline-flex h-12 items-center justify-center rounded-xl border border-border/80 bg-background px-6 text-base font-medium transition hover:bg-accent/60">
                View pricing
              </button>
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-violet-500" />
              SSL encrypted
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap size={14} className="text-violet-500" />
              30-second average generation
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={14} className="text-violet-500" />
              Commercial licenses available
            </span>
          </div>
        </div>
      </section>

      {/* DEMO GENERATOR */}
      <section className="mx-auto w-full max-w-3xl px-6 pb-24">
        <MusicGenerator demo />
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything a music maker needs
          </h2>
          <p className="mt-3 text-muted-foreground">
            From first note to final delivery — we handle the boring parts.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Unique, copyright-safe",
              desc: "Every track is generated just for you — no samples, no copyright claims on YouTube or Spotify.",
            },
            {
              title: "Cloud library that syncs",
              desc: "All your tracks stored securely in the cloud, playable from anywhere with instant share links.",
            },
            {
              title: "Simple subscriptions",
              desc: "Transparent pricing, cancel anytime. Taxes and VAT handled globally via Lemon Squeezy.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-3xl border border-border/60 bg-card p-7 transition hover:border-border"
            >
              <div className="text-lg font-semibold">{f.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 pb-28">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-muted-foreground">
            Pick a plan that matches your creative output. Upgrade, downgrade, or cancel at any time.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {PRICING.map((tier) => (
            <PricingCard
              key={tier.slug}
              tier={tier}
              onSubscribe={(slug) => {
                if (slug === "free") router.push("/auth/signup");
                else router.push("/api/checkout?plan=" + slug);
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}