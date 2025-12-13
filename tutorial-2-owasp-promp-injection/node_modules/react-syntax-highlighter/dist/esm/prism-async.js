import createAsyncLoadingHighlighter from './async-syntax-highlighter';
import supportedLanguages from './languages/prism/supported-languages';
export default createAsyncLoadingHighlighter({
  loader: function loader() {
    return import(/* webpackChunkName:"react-syntax-highlighter/refractor-import" */
    'refractor/all' // Import all languages from refractor
    ).then(function (module) {
      return module.refractor;
    });
  },
  noAsyncLoadingLanguages: true,
  supportedLanguages: supportedLanguages
});