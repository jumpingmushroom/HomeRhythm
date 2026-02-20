# HomeRhythm

## i18n / Translations

**All user-facing strings must have both English and Norwegian translations.**

- Translation files: `frontend/src/i18n/locales/en.json` and `frontend/src/i18n/locales/no.json`
- Use the `t()` function from `react-i18next` for all UI text — never hardcode English strings
- When adding new features or fixing bugs that touch UI text, always add keys to **both** locale files
- Follow existing key naming conventions (e.g., `taskForm.fieldName`, `dashboard.label`)
