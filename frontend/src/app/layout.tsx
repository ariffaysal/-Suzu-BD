import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { UIProvider } from '@/context/UIContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FloatingButtons from '@/components/layout/FloatingButtons';
import Toast from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: {
    default: 'Suzu BD — Premium Footwear, Cash on Delivery',
    template: '%s | Suzu BD',
  },
  description:
    'Suzu BD — shop premium sneakers, running shoes, formal footwear and more. Cash on delivery across the country.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-gray-50 text-gray-900 antialiased">
        <UIProvider>
          <AuthProvider>
            <CartProvider>
              <Header />
              <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
                {children}
              </main>
              <Footer />
              <FloatingButtons />
              <Toast />
            </CartProvider>
          </AuthProvider>
        </UIProvider>
      </body>
    </html>
  );
}
