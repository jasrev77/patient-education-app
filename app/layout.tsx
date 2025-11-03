export const metadata = {
  title: 'Patient Education',
  description: 'Multi-tenant patient education for pharmacies',
};

import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="mx-auto max-w-5xl p-4">{children}</div>
      </body>
    </html>
  );
}
