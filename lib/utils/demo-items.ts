import type { Item } from '@/lib/types';

const DEMO_ITEMS_KEY = 'balik_demo_items';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readPrototypeItems(): Item[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(DEMO_ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writePrototypeItems(items: Item[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(DEMO_ITEMS_KEY, JSON.stringify(items));
}

export function mergePrototypeItems(baseItems: Item[]) {
  const prototypeItems = readPrototypeItems();
  if (prototypeItems.length === 0) return baseItems;

  const merged = [...baseItems];
  for (const item of prototypeItems) {
    const existingIndex = merged.findIndex((candidate) => candidate.id === item.id);
    if (existingIndex >= 0) merged[existingIndex] = { ...merged[existingIndex], ...item };
    else merged.unshift(item);
  }
  return merged;
}

export function savePrototypeItem(item: Item) {
  const items = readPrototypeItems();
  const existingIndex = items.findIndex((candidate) => candidate.id === item.id);
  if (existingIndex >= 0) items[existingIndex] = { ...items[existingIndex], ...item };
  else items.unshift(item);
  writePrototypeItems(items);
}

export function updatePrototypeItem(id: string, changes: Partial<Item>) {
  const items = readPrototypeItems();
  const nextItems = items.map((item) => (item.id === id ? { ...item, ...changes } : item));
  writePrototypeItems(nextItems);
}

export function removePrototypeItem(id: string) {
  writePrototypeItems(readPrototypeItems().filter((item) => item.id !== id));
}
