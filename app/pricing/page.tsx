import PricingGrid from "@/components/PricingGrid";

export const metadata = { title: "Pricing — MelodiaAI" };

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-14 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Pricing</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Start free. Upgrade when your creativity (or audience) grows.
        </p>
      </div>
      <PricingGrid />
    </section>
  );
}