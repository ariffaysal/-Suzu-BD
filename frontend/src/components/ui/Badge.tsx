import type { ReactNode } from 'react';

type BadgeColor = 'red' | 'green' | 'gray' | 'indigo';

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  className?: string;
}

const colorStyles: Record<BadgeColor, string> = {
  red: 'bg-red-600 text-white',
  green: 'bg-green-600 text-white',
  gray: 'bg-gray-200 text-gray-700',
  indigo: 'bg-indigo-600 text-white',
};

export default function Badge({ children, color = 'red', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorStyles[color]} ${className}`}
    >
      {children}
    </span>
  );
}
