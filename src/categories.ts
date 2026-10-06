export enum Category {
  Food = 'food',
  Transport = 'transport',
  Entertainment = 'entertainment',
  Other = 'other',
}

export const CATEGORIES: readonly { id: Category; label: string; color: string }[] = [
  { id: Category.Food, label: 'Food', color: '#e67e22' },
  { id: Category.Transport, label: 'Transport', color: '#3498db' },
  { id: Category.Entertainment, label: 'Entertainment', color: '#9b59b6' },
  { id: Category.Other, label: 'Other', color: '#7f8c8d' },
]

export function isCategory(v: unknown): v is Category {
  return typeof v === 'string' && (Object.values(Category) as string[]).includes(v)
}
