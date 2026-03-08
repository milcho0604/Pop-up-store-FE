/**
 * 스토리지 추상화 레이어
 *
 * 현재: localStorage (웹)
 * Capacitor 전환 시: 아래 주석 처리된 코드로 교체
 *   import { Preferences } from '@capacitor/preferences';
 *   get:    const { value } = await Preferences.get({ key }); return value;
 *   set:    await Preferences.set({ key, value });
 *   remove: await Preferences.remove({ key });
 */
export const storage = {
  get: async (key: string): Promise<string | null> => {
    return localStorage.getItem(key);
  },

  set: async (key: string, value: string): Promise<void> => {
    localStorage.setItem(key, value);
  },

  remove: async (key: string): Promise<void> => {
    localStorage.removeItem(key);
  },
};
