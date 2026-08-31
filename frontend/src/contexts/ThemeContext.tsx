import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type ThemeOption = 'default-dark' | 'default-light' | 'midnight' | 'forest' | 'sunset' | 'ocean' | 'rose' | 'slate';

interface ThemeContextType {
  dark: boolean;
  toggle: () => void;
  theme: ThemeOption;
  setTheme: (t: ThemeOption) => void;
}

const THEME_COLORS: Record<ThemeOption, { primary: string; secondary: string; dark: boolean }> = {
  'default-dark': { primary: '#0EA5E9', secondary: '#10B981', dark: true },
  'default-light': { primary: '#0EA5E9', secondary: '#10B981', dark: false },
  'midnight': { primary: '#8B5CF6', secondary: '#06B6D4', dark: true },
  'forest': { primary: '#22C55E', secondary: '#10B981', dark: true },
  'sunset': { primary: '#F59E0B', secondary: '#EF4444', dark: false },
  'ocean': { primary: '#0EA5E9', secondary: '#06B6D4', dark: true },
  'rose': { primary: '#EC4899', secondary: '#8B5CF6', dark: false },
  'slate': { primary: '#64748B', secondary: '#94A3B8', dark: true },
};

function getDefaultTheme(): ThemeOption {
  const saved = localStorage.getItem('vitanexa_theme');
  if (saved && (saved in THEME_COLORS)) return saved as ThemeOption;
  const darkMode = localStorage.getItem('darkMode');
  return darkMode !== 'false' ? 'default-dark' : 'default-light';
}

const ThemeContext = createContext<ThemeContextType>({
  dark: true, toggle: () => {}, theme: 'default-dark', setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeOption>(getDefaultTheme);

  const applyTheme = useCallback((t: ThemeOption) => {
    const colors = THEME_COLORS[t];
    const root = document.documentElement;
    if (colors.dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    localStorage.setItem('vitanexa_theme', t);
    localStorage.setItem('darkMode', String(colors.dark));
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const dark = THEME_COLORS[theme].dark;

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const colors = THEME_COLORS[prev];
      if (dark) {
        const lightTheme = prev.replace('-dark', '-light') as ThemeOption;
        return THEME_COLORS[lightTheme] ? lightTheme : 'default-light';
      } else {
        const darkTheme = prev.replace('-light', '-dark') as ThemeOption;
        return THEME_COLORS[darkTheme] ? darkTheme : 'default-dark';
      }
    });
  }, [dark]);

  const setTheme = useCallback((t: ThemeOption) => {
    setThemeState(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, toggle, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
