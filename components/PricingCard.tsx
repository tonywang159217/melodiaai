"use client";

import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "./Button";
import type { PricingTier } from "@/types";

interface Props {
  tier: PricingTier;
  yearly?: boolean;
  onSubscribe?: (slug: string) => void;
}

export default function PricingCard({ tier, yearly, onSubscribe }: Props) {
  const price = yearly ? tier.priceYearly : tier.priceMonthly;
  const per = yearly ? "/mo, billed yearly" : "/month";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl border p-8 transition",
        tier.highlight
          ? "border-violet-500/50 bg-gradient-to-b from-violet-500/10 via-transparent to-transparent shadow-[0_0_0_1px_rgba(139,92,246,0.25),0_20px_80px_-20px_rgba(139,92,246,0.35)] scale-[1.02]"
          : "border-border/70 bg-card",
      )}
    >
      {tier.highlight && (
        <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1 text-xs font-medium text-white">
          <Sparkles size={12} />
          Most popular
        </div>
      )}

      <div className="text-lg font-semibold">{tier.name}</div>
      <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight">${price}</span>
        <span className="text-sm text-muted-foreground">{per}</span>
      </div>

      <ul className="mt-6 space-y-3 text-sm">
        {tier.features.map((f, i) => {
          const on = Boolean(f[tier.slug]);
          return (
            <li key={i} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                  on ? "bg-violet-500/15 text-violet-600" : "bg-muted text-muted-foreground/60",
                )}
              >
                <Check size={12} strokeWidth={3} />
              </span>
              <span className={on ? "text-foreground" : "text-muted-foreground/70 line-through"}>
                {f.label}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 pt-6 border-t border-border/60">
        <Button
          full
          variant={tier.highlight ? "primary" : "outline"}
          onClick={() => onSubscribe?.(tier.slug)}
          disabled={!tier.variantId && tier.slug !== "free"}
        >
          {tier.cta}
        </Button>
      </div>
    </div>
  );
}