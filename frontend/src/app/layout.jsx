import './globals.css';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';

export const metadata = {
  title: 'AgriSlot - APMC Mandi Logistics & Gatekeeper OS',
  description:
    'Advanced APMC Mandi slot allocation, real-time weighbridge clearance, and logistics management system.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="text-navy-border antialiased font-sans min-h-screen selection:bg-saffron selection:text-navy-border">
        <LanguageProvider>
          <AuthProvider>
            {/* Global Pop-up Authentication Modal */}
            <AuthModal />

            {/* Fixed Left Sidebar */}
            <Sidebar />

            {/* Main Content Wrap Offset by 64 (256px) on Desktop */}
            <div className="lg:pl-64 flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1400px] w-full mx-auto">
                {children}
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
