'use client';

import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';

const STORAGE_KEY = 'search_history';
const MAX_HISTORY = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    storage.get(STORAGE_KEY).then((val) => {
      if (val) setHistory(JSON.parse(val));
    });
  }, []);

  const save = async (next: string[]) => {
    setHistory(next);
    await storage.set(STORAGE_KEY, JSON.stringify(next));
  };

  const add = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    const next = [trimmed, ...history.filter((h) => h !== trimmed)].slice(0, MAX_HISTORY);
    save(next);
  };

  const remove = (keyword: string) => {
    save(history.filter((h) => h !== keyword));
  };

  const clear = async () => {
    setHistory([]);
    await storage.remove(STORAGE_KEY);
  };

  return { history, add, remove, clear };
}
