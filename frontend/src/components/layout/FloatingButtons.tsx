// Replace with your real numbers / page handles.
const WHATSAPP_NUMBER = '8801XXXXXXXXX';
const MESSENGER_PAGE = 'yourpage';

const links = [
  {
    label: 'Chat on WhatsApp',
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      'Hi! I have a question about your products.',
    )}`,
    bg: 'bg-green-500 hover:bg-green-600',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
    ),
  },
  {
    label: 'Chat on Messenger',
    href: `https://m.me/${MESSENGER_PAGE}`,
    bg: 'bg-blue-600 hover:bg-blue-700',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
        <path d="M12 2C6.477 2 2 6.14 2 11.31c0 2.83 1.3 5.36 3.41 7.08V22l3.12-1.71c.81.22 1.66.34 2.47.34 5.523 0 10-4.14 10-9.32C22 6.14 17.523 2 12 2Zm1.07 12.46-2.54-2.71-4.96 2.71 5.46-5.8 2.6 2.71 4.9-2.71-5.46 5.8Z" />
      </svg>
    ),
  },
];

export default function FloatingButtons() {
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-3 sm:bottom-6 sm:right-6">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          className={`flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110 sm:h-12 sm:w-12 ${link.bg}`}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}
