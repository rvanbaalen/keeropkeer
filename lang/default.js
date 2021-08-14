let lang = 'nl';
document.querySelector('body').classList.add('lang-' + lang);
const language = (
    await import(`./${lang}.js`)
).default

export default language;
