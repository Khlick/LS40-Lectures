// More info https://github.com/hakimel/reveal.js#configuration
Reveal.initialize({
  margin: 0.1,
  minScale: 0.2,
  maxScale: 1.5,
  controls: false,
  progress: true,
  slideNumber: false,
  history: true,
  overview: true,
  center: false,
  transition: 'fade',
  touch: false,
  keyboard: true,
  width: '90%',
  height: '100%',
  // plugin config
  math: {
    mathjax: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js',
    config: 'TeX-MML-AM_CHTML'
  },
  // dependencies
  dependencies: [
    { src: 'lib/js/reveal.js/plugin/notes/notes.js', async: true },
    { src: 'lib/js/reveal.js/plugin/math/math.js', async: true },
    { src: 'lib/js/reveal.js/plugin/highlight/highlight.js', async: true, callback: function(){hljs.initHighlightingOnLoad();} },
    { src: 'lib/js/reveald3.js', async: true }
  ]
});