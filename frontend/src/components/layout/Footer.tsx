import Link from 'next/link';
import Logo from '@/components/brand/Logo';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Link href="/" className="group">
            <Logo
              monogramClassName="h-8 w-8 transition-transform duration-300 group-hover:scale-110"
              wordmarkClassName="text-lg tracking-wide"
            />
          </Link>
          <p className="mt-3 text-sm text-gray-500">
            Premium footwear with cash on delivery across the country. Free returns within 7 days.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-500">
            <li>
              <Link href="/products?category=new-arrivals" className="hover:text-indigo-600">
                ✦ New Arrivals
              </Link>
            </li>
            <li>
              <Link href="/products" className="hover:text-indigo-600">
                All Products
              </Link>
            </li>
            <li>
              <Link href="/products?category=men-sneakers" className="hover:text-indigo-600">
                Men Sneakers
              </Link>
            </li>
            <li>
              <Link href="/products?category=women-sneakers" className="hover:text-indigo-600">
                Women Sneakers
              </Link>
            </li>
            <li>
              <Link href="/products?category=watches-jewellery" className="hover:text-indigo-600">
                Watches &amp; Jewellery
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900">Help</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-500">
            <li>Cash on Delivery</li>
            <li>Shipping &amp; Returns</li>
            <li>Size Guide</li>
            <li>Contact Support</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-500">
            <li>Phone: +880 1XXX-XXXXXX</li>
            <li>Email: support@footwear.example</li>
            <li>Mon–Sat, 9am–9pm</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Suzu BD. All rights reserved.
      </div>
    </footer>
  );
}
