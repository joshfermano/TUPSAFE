/**
 * Dark Mode Detection Hook
 *
 * Watches for changes to the 'dark' class on the document root element
 * via MutationObserver, enabling components to use inline styles that
 * respond to theme changes without Tailwind v4 specificity issues.
 */

import { useEffect, useState } from 'react';

export function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
