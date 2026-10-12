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
 * Thin wrapper around `@quartz-community/graph` that keeps its rendering and
 * styling untouched but performs client-side navigation on node click.
 */
const GraphSpa = (opts) => {
  const instance = Graph(opts)

  const Component = (props) => instance(props)
  Component.displayName = "GraphSpa"

  Component.css = instance.css
  // NAVIGATOR first so the helper exists before the graph script can call it.
  Component.afterDOMLoaded = [NAVIGATOR, patchNavigation(instance.afterDOMLoaded)]
    .filter(Boolean)
    .join("\n")

  return Component
}

export { GraphSpa }
export default GraphSpa