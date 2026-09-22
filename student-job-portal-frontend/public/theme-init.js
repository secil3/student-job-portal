(function () {
  const storageKey = "studentjob-theme";
  const root = document.documentElement;
  const listeners = new Set();
  let mediaQuery;
  let preference = null;

  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") preference = saved;
  } catch {
    // Private browsing or blocked storage must not prevent rendering.
  }

  try {
    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  } catch {
    // Browsers without matchMedia use the light theme by default.
  }

  function resolveTheme() {
    return preference || (mediaQuery?.matches ? "dark" : "light");
  }

  function applyTheme() {
    const theme = resolveTheme();
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    listeners.forEach((listener) => listener(theme));
    return theme;
  }

  function setPreference(nextPreference) {
    if (nextPreference !== "light" && nextPreference !== "dark" && nextPreference !== null) {
      return false;
    }
    preference = nextPreference;
    try {
      if (preference === null) window.localStorage.removeItem(storageKey);
      else window.localStorage.setItem(storageKey, preference);
    } catch {
      // The in-memory choice still works for the current visit.
    }
    applyTheme();
    return true;
  }

  if (mediaQuery) {
    const onSystemChange = () => {
      if (preference === null) applyTheme();
    };
    if (mediaQuery.addEventListener) mediaQuery.addEventListener("change", onSystemChange);
    else mediaQuery.addListener?.(onSystemChange);
  }

  window.StudentJobTheme = {
    getTheme: () => root.dataset.theme,
    getPreference: () => preference,
    setPreference,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  applyTheme();
})();
