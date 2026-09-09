import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Code for Community Hackathon | CMP × GDG',
  description:
    'Official Hackathon Entry Pass Generator and QR Verification System. Organized by CMP Hack Squad in collaboration with GDG Prayagraj.',
  keywords: ['Hackathon', 'Code for Community', 'CMP', 'GDG Prayagraj', 'Entry Pass', 'QR Verification'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-brand-black text-white antialiased selection:bg-brand-red selection:text-white flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
