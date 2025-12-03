export const applyTheme = () => {
  if (typeof window === "undefined") return;

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  if (prefersDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

export const watchTheme = () => {
  if (typeof window === "undefined") return;

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  
  const handleChange = (e: MediaQueryListEvent) => {
    if (e.matches) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  mediaQuery.addEventListener("change", handleChange);
  
  return () => {
    mediaQuery.removeEventListener("change", handleChange);
  };
};





