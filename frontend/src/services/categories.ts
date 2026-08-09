import type { Category } from '@/types';

export const COLLECTIONS = [
  { key: 'MEN', label: 'Men Collection' },
  { key: 'WOMEN', label: 'Women Collection' },
  { key: 'ACCESSORIES', label: 'Accessories' },
] as const;

export type CollectionKey = (typeof COLLECTIONS)[number]['key'];

export interface CollectionGroup {
  key: CollectionKey;
  label: string;
  categories: Category[];
}

export function groupByCollection(categories: Category[]): CollectionGroup[] {
  const groups: CollectionGroup[] = COLLECTIONS.map((c) => ({
    key: c.key,
    label: c.label,
    categories: [],
  }));
  for (const category of categories) {
    const group = groups.find((g) => g.key === category.collection);
    if (group) group.categories.push(category);
  }
  return groups.filter((g) => g.categories.length > 0);
}

const ICONS: Record<string, string> = {
  'men-sneakers': '👟',
  'women-sneakers': '👟',
  'men-formal-shoe': '👞',
  'women-formal-shoe': '👠',
  'men-casual-shoe': '🥿',
  'women-casual-shoe': '🥿',
  'men-loafers-shoe': '👞',
  'women-loafers-shoe': '👡',
  'men-sports-shoe': '👟',
  'women-sports-shoe': '👟',
  'men-boots': '🥾',
  'women-boots': '🥾',
  'men-clothes': '👕',
  'women-clothes': '👗',
  'watches-jewellery': '⌚',
  bags: '👜',
};

export function categoryIcon(slug: string): string {
  return ICONS[slug] ?? '🛍️';
}
