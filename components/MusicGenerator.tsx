"use client";

import { useState } from "react";
import { Wand2, Music2 } from "lucide-react";
import Button from "./Button";
import { cn } from "@/lib/utils";

const STYLES = [
  "Pop", "Hip-Hop", "EDM", "Rock", "Lo-Fi",
  "Jazz", "Ambient", "Cinematic", "R&B", "Country",
];

export default function MusicGenerator({ demo = false }: { demo?: boolean }) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Pop");
  const [withVocal, setWithVocal] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (demo) {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1400));
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, withVocal }),
      });
      if (!res.ok) throw new Error("Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-border/70 bg-card/50 p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_20px_60px_-30px_rgba(0,0,0,0.3)] md:p-8">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
          <Music2 size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold">AI Music Generator</h3>
          <p className="text-sm text-muted-foreground">
            Describe the vibe — we&apos;ll handle the melody, rhythm and mix.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            Your idea
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="E.g. upbeat pop anthem about summer nights with nostalgic piano and a warm chorus"
            className="w-full resize-none rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            Style
          </label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition",
                  style === s
                    ? "border-violet-500 bg-violet-500 text-white shadow-sm"
                    : "border-border/70 bg-background hover:bg-accent/60",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <span className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-border transition">
            <input
              type="checkbox"
              checked={withVocal}
              onChange={(e) => setWithVocal(e.target.checked)}
              className="peer sr-only"
            />
            <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5 peer-checked:bg-violet-500" />
          </span>
          <span className="select-none">Include vocals &amp; lyrics (auto-generated)</span>
        </label>

        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="text-xs text-muted-foreground">
            {demo ? "This is a live demo" : "1 generation will be used"}
          </div>
          <Button onClick={handleGenerate} loading={loading} size="lg">
            <Wand2 size={18} />
            Generate music
          </Button>
        </div>
      </div>
    </div>
  );
}