'use client';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card py-8 mt-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Smart Onion Storage Monitoring System
            </p>
            <p className="text-xs text-muted-foreground">
              Real-time environmental monitoring with AI-powered recommendations
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>Designed for Final Year Project • {currentYear}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
