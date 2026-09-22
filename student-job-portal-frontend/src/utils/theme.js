// The early head script owns theme resolution; React only consumes this API.
export const getTheme = () => window.StudentJobTheme.getTheme();
export const getThemePreference = () => window.StudentJobTheme.getPreference();
export const setThemePreference = (theme) => window.StudentJobTheme.setPreference(theme);
export const subscribeToTheme = (listener) => window.StudentJobTheme.subscribe(listener);
