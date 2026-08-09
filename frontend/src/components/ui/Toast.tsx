'use client';

import { useUI } from '@/context/UIContext';

export default function Toast() {
  const { toast } = useUI();
  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg">
        {toast}
      </div>
    </div>
  );
}
