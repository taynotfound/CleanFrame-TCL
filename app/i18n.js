/* Shore interface language. Follows the TV's system language (the WebView reports it as
   navigator.language); English is the source text and the fallback. ?lang=de overrides it in previews.
   Built in: de, fr, es, nl, pl, uk, it, tr, each in i18n/<lang>.js and loaded only for that language.
   T(s) translates a whole English string; composite messages are matched by RULES. */
(function (root) {
  var LANGS = ['de', 'fr', 'es', 'nl', 'pl', 'uk', 'it', 'tr'];
  function pick() {
    var forced = /[?&]lang=([a-z]{2})/i.exec(root.location ? root.location.search : '');
    var nav = root.navigator || {}, tag = forced ? forced[1] : (nav.languages && nav.languages[0]) || nav.language || 'en';
    return String(tag).toLowerCase().split(/[-_]/)[0];
  }
  var lang = pick(), dict = null, rules = [], has = Object.prototype.hasOwnProperty;
  function T(s) {
    if (!dict || typeof s !== 'string' || !s) return s;
    if (has.call(dict, s)) return dict[s];
    for (var i = 0; i < rules.length; i++) {
      var m = rules[i][0].exec(s);
      if (m) return rules[i][1].replace(/\$(\d)/g, function (all, n) { return T(m[+n]); });
    }
    // Summaries such as "Glass, Soft" translate part by part.
    if (s.indexOf(', ') > 0) return s.split(', ').map(T).join(', ');
    return s;
  }
  root.CleanFrameI18n = {
    lang: 'en', T: T,
    /* Called by i18n/<lang>.js. */
    load: function (id, d, r) {
      if (id !== lang) return;
      dict = d; rules = r || []; root.CleanFrameI18n.lang = lang;
      if (root.document) root.document.documentElement.lang = lang;
    }
  };
  // English is the source text: only another language's file is read, right after this script and before main.js.
  if (LANGS.indexOf(lang) >= 0 && root.document && root.document.write) root.document.write('<script src="i18n/' + lang + '.js"><\/script>');
})(this);
