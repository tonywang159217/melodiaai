"use client";

import { useRouter } from "next/navigation";
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

export default function PricingGrid() {
  const router = useRouter();
  return (
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
  );
}