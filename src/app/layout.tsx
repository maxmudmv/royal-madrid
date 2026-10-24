import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ROYAL MADRID — Historical & Statistical Archive of Real Madrid CF',
  description:
    'A premium independent historical and statistical archive dedicated exclusively to Real Madrid CF first-team men’s football: honours, official completed matches (2011/12+), player careers, seasons, legends, club records, comparisons, and transfers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#080808] text-[#F1EEE7] selection:bg-[#C9A64B] selection:text-[#080808]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
