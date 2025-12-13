import createAsyncLoadingHighlighter from './async-syntax-highlighter';
import languageLoaders from './async-languages/prism';
export default createAsyncLoadingHighlighter({
  loader: function loader() {
    return import(/* webpackChunkName:"react-syntax-highlighter/refractor-core-import" */
    'refractor/core').then(function (module) {
      return module.refractor;
    });
  },
  isLanguageRegistered: function isLanguageRegistered(instance, language) {
    return instance.registered(language);
  },
  languageLoaders: languageLoaders,
  registerLanguage: function registerLanguage(instance, name, language) {
    return instance.register(language);
  }
});