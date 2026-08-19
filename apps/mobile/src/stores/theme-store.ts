import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';

interface ThemeState {
  isDarkMode: boolean;
  setDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
  getColors: () => typeof Colors.light;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      
      setDarkMode: (value: boolean) => set({ isDarkMode: value }),
      
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      getColors: () => {
        return get().isDarkMode ? Colors.dark : Colors.light;
      }
    }),
    {
      name: 'plataforma-theme-mobile',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ isDarkMode: state.isDarkMode }),
    }
  )
);

export const useTheme = () => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const colors = useThemeStore((state) => state.getColors());
  return { isDarkMode, colors };
};
