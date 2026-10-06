// Page frame: header, page tabs, content area, footer and the arrow dock.
export const SHELL = `<header class="top">
  <a class="skip" href="./" data-act="skip">Skip to content</a>
  <div class="wrap bar">
    <a class="brand" href="./" data-go="overview">
      <svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#143a8f"/><path d="M50.4 18.2A23 23 0 1 1 36.8 9.5" fill="none" stroke="#f2b705" stroke-width="3" stroke-linecap="round"/><circle cx="46.5" cy="12.6" r="3.2" fill="#fff"/><path fill="#fff" d="M19 34.6h6V45h-6zM28 27h6v18h-6zM37 19.4h6V45h-6z"/></svg>
      <span><b>EU Stability Compass</b><small>Economic decision support for the 27 member states</small></span>
    </a>
    <div class="tools">
      <span id="status" class="status s-info" role="status">Starting…</span>
      <button id="install" class="btn gold" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>Install<span class="wide">&nbsp;app</span></button>
      <button id="theme" class="btn ghost" type="button" aria-label="Switch between light and dark"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor"/></svg></button>
    </div>
  </div>
  <div class="wrap ctx">
    <label><span>Country</span><select id="csel" aria-label="Country"></select></label>
    <label><span>Viewpoint</span><select id="rsel" aria-label="Viewpoint"></select></label>
  </div>
</header>
<nav id="nav" class="tabs" aria-label="Pages"></nav>
<main id="app" class="wrap" tabindex="-1">
  <div class="loading"><div class="spin"></div><p>Opening EU Stability Compass…</p></div>
</main>
<footer class="foot wrap">
  <p id="printnote" class="printonly"></p>
  <p>Independent tool, not affiliated with the European Union or the European Central Bank. Statistics: Eurostat and ECB open data. Estimates are illustrative; see <a href="#method/how" data-go="method/how">Data &amp; Method</a>.</p>
  <p>© 2026 Samuel Akosa Onyejekwe</p>
</footer>
<nav id="pager" class="pager" aria-label="Previous and next page"></nav>
<div id="modal" class="modal" hidden></div>
<div id="toast" class="toast" role="status" hidden></div>`;
