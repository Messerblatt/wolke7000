import { Graph } from "@quartz-community/graph"

/**
 * The graph explorer navigates by assigning `window.location.href = slug`,
 * which is a full document load. That tears down the page (and therefore the
 * soundtrack, any SPA state, etc.) even though Quartz's SPA router is enabled.
 *
 * `window.location` cannot be intercepted from user script - the `href`
 * accessor lives on the `Location` prototype as an unforgeable own property of
 * the `location` instance, so redefining it is a no-op. The only reliable fix
 * is to rewrite the navigation call in the plugin's own inline script before it
 * is emitted, which is what this wrapper does.
 *
 * The patched call routes through `window.spaNavigate`, so clicking a node
 * morphs the document instead of reloading it.
 */
const NAVIGATOR = `
(function () {
  const go = (url) => {
    if (typeof window.spaNavigate === "function") {
      window.spaNavigate(new URL(url, window.location.href));
      return true;
    }
    return false;
  };
  window.__wolkeSpaNavigate = go;
  // Hard navigations performed by third party scripts land here first.
  window.addEventListener("wolke:navigate", (event) => {
    if (go(event.detail.url)) event.preventDefault();
  });
})();
`

/** Replace `window.location.href=<expr>` with an SPA navigation to the same target. */
function patchNavigation(script) {
  if (typeof script !== "string") return script
  return script.replace(
    /window\.location\.href\s*=\s*([A-Za-z_$][\w$]*)/g,
    "window.__wolkeSpaNavigate($1)",
  )
}

/**
 * Progressive reveal of the graph explorer.
 *
 * The explorer ships on every page - it is never conditionally built - but stays
 * out of sight until the reader opens it for the first time on the "Geschenk"
 * page. From that moment on it is visible site-wide.
 *
 * Three things make this work, and all three matter:
 *
 *  1. Only the *local* graph is hidden. `.global-graph-outer` is a direct child
 *     of `.graph`, not of `.graph-outer`, so hiding the local canvas leaves the
 *     modal overlay untouched and able to open.
 *
 *  2. The modal is opened by dispatching a click on `.global-graph-icon`, which
 *     is the button the graph plugin already binds to its own `X()` toggle. That
 *     reuses the plugin's own logic instead of duplicating it: it adds the
 *     `active` class, lifts the sidebar z-index and renders the global graph.
 *
 *  3. No `render`/`nav` event is dispatched on unlock. Those events make the
 *     graph script re-run its own init (`T()`), which re-queries the modal
 *     elements and can race with the programmatic open below. The local canvas
 *     was already laid out by the time the user can click, so there is nothing
 *     to redraw.
 */
const UNLOCK = `
(function () {
  const KEY = "wolke:graph-unlocked";
  const root = document.documentElement;

  const isUnlocked = () => {
    try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
  };
  const persist = () => {
    try { localStorage.setItem(KEY, "1"); } catch {}
  };

  const apply = () => {
    if (isUnlocked()) root.setAttribute("data-graph-unlocked", "");
    else root.removeAttribute("data-graph-unlocked");
  };

  const openModal = () => {
    const icon = document.querySelector(".global-graph-icon");
    if (icon) icon.click();
  };

  // Clicking the "Klick" text on the Geschenk page reveals the graph: unlock it
  // site-wide so the local canvas becomes visible, then pop the modal so the
  // reader actually sees what they just unlocked.
  //
  // The click is deferred by a frame so the browser has recomputed layout after
  // the CSS un-hides the canvas. The graph's own toggle reads the element's
  // measured size when it renders, and it must not measure a stale 0x0 box.
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    if (!event.target.closest(".wolke-unlock-graph")) return;

    persist();
    apply();
    requestAnimationFrame(() => requestAnimationFrame(openModal));
  }, true);

  // Once unlocked the reader can reopen the modal with the graph's own button,
  // so nothing else is needed here.
  apply();
})();
`

/**
 * Hide the local graph until it has been unlocked. Deliberately scoped to the
 * two direct children of `.graph` rather than `.graph` itself, so the modal
 * overlay keeps working.
 */
const UNLOCK_CSS = `
html:not([data-graph-unlocked]) .graph > h3,
html:not([data-graph-unlocked]) .graph > .graph-outer {
  display: none;
}
`

/**
 * Thin wrapper around `@quartz-community/graph` that keeps its rendering and
 * styling untouched but performs client-side navigation on node click, and
 * reveals the explorer on first use.
 */
const GraphSpa = (opts) => {
  const instance = Graph(opts)

  const Component = (props) => instance(props)
  Component.displayName = "GraphSpa"

  Component.css = [instance.css, UNLOCK_CSS].filter(Boolean).join("\n")
  // NAVIGATOR and UNLOCK first: the helpers must exist before the graph script
  // can call them, and the unlock flag must be applied before the graph renders
  // so an already-unlocked reader never sees a 0x0 canvas.
  Component.afterDOMLoaded = [NAVIGATOR, UNLOCK, patchNavigation(instance.afterDOMLoaded)]
    .filter(Boolean)
    .join("\n")

  return Component
}

export { GraphSpa }
export default GraphSpa