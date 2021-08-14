let lang = 'nl';
const language = (
    await import(`./${lang}.js`)
).default

export default language;
