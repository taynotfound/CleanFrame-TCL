/* Headlines add-on (addons/AGENTS.md): one headline at a time under the clock and on the screensaver. Fetched
   only when Headlines is switched on, and run inside main.js's scope: the functions assigned here replace
   main.js's stubs. The feeds, their names and Settings › News stay in main.js; the TV fetches natively
   (News.java) at most every 30 minutes, and this file shows the next headline every 20 seconds. */
  newsOn = function () { return S.c.cnews === 'on' && (!!NEWS || !!newsForced); };
  function loadNews() {
    var r = newsForced ? { items: newsForced } : NEWS ? NEWS.info() : { items: [] }, now = Date.now(), outlet = newsOutlet(S.c.nsrc);
    // A source change shows nothing old: the cache belongs to the previous feed until the new one arrives.
    if (!newsForced && (r.feed || '') !== newsFeed()) r = { items: [] };
    newsItems = r.items.filter(function (i) { return !i.time || now - i.time < NEWS_MAX_AGE; }).map(function (i) {
      // Outlet feeds name the channel ("tagesschau.de - die erste Adresse…"); show the outlet's own short name.
      return outlet ? { title: i.title, source: outlet.name, time: i.time } : { title: i.title, source: String(i.source || '').split(/ [-|–:] /)[0], time: i.time };
    });
  }
  function headline() { return newsOn() && newsItems.length ? newsItems[newsIdx % newsItems.length] : null; }
  headlineHtml = function (cls) {
    var h = headline();
    return h ? '<span class="' + cls + '">' + (h.source ? '<span class="news-src">' + escRaw(h.source) + '</span>' : '') + escRaw(h.title) + '</span>' : '';
  };
  function renderNews() {
    setHTML(capNews, headlineHtml('cap-news'));
    if (S.saver) setHTML(svNews, S.c.svdate === 'on' ? headlineHtml('sv-headline') : '');
  }
  /* Every 20 s the next headline, while Home or the screensaver is on screen; the TV fetches at most every 30 minutes. */
  newsTick = function (advance) {
    clearTimeout(newsTimer); newsTimer = 0;
    if (!newsOn()) { newsItems = []; renderNews(); return; }
    if (NEWS && !newsForced) NEWS.refresh(newsFeed(), false);
    var before = newsItems.length;
    loadNews();
    if (advance && !document.hidden && (top().id === 'home' || S.saver)) newsIdx++;
    if (!before && newsItems.length) newsIdx = 0;
    renderNews();
    newsTimer = setTimeout(function () { newsTick(true); }, newsItems.length ? NEWS_EVERY * (QA.slideScale || 1) : 8000);
  };
