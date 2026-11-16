import React from 'react';

export interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function AppLayout({ title, children }: AppLayoutProps) {
  return (
    <div className="min-h-dvh flex bg-background text-foreground">
      <aside className="w-64 border-r border-border p-4">Fleet Operations</aside>
      <div className="flex-1 flex flex-col">
        <nav className="h-14 border-b border-border px-6 flex items-center justify-between">
          <span className="font-semibold">{title}</span>
        </nav>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
