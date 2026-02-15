'use client';

import { Header } from '@/components/header';
import { MetricsSection } from '@/components/metrics-section';
import { HardwarePanel } from '@/components/hardware-panel';
import { ChartsSection } from '@/components/charts-section';
import { AIAdvisory } from '@/components/ai-advisory';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Metrics Cards */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Real-Time Metrics
          </h2>
          <MetricsSection />
        </section>

        {/* Hardware Status and Charts */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Hardware Status
            </h2>
            <HardwarePanel />
          </div>
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Historical Data
            </h2>
            <ChartsSection />
          </div>
        </div>

        {/* AI Advisory */}
        <section>
          <div className="grid gap-4">
            <AIAdvisory />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
