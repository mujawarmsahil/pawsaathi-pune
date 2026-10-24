import { PawPrint } from 'lucide-react';
import type { ReactNode } from 'react';

export function AuthCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="brand-mark large">
          <PawPrint />
        </span>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="auth-copy">{description}</p>
        {children}
      </section>
    </main>
  );
}
