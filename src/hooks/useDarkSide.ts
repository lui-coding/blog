import { useState, useEffect } from 'react';
import { useUpdateEffect } from 'react-use';

const initTheme = () => {
  const theme = localStorage.getItem('theme');

  switch (theme) {
    case 'light':
    case 'dark':
      return theme;
    default:
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
      return 'light';
  }
};

type Theme = 'dark' | 'light';

export default function useDarkSide():[Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(initTheme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useUpdateEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const switchTheme = () => {
    setTheme((state) => (state === 'dark' ? 'light' : 'dark'));
  };
  return [theme, switchTheme];
}
