import { h } from "preact"
import { DarkmodeButton, ReaderModeButton, MusicButton } from "./buttons.js"
import { darkmodeCss, readermodeCss } from "./vendor.js"

const defaultOptions = {
  // slugified file name of content/imgs/Aleksander Vinter - Highlander Single.mp3
  src: "/imgs/aleksander-vinter---highlander-single.mp3",
  loop: true,
  volume: 0.35,
  playLabel: "Musik abspielen",
  muteLabel: "Musik stummschalten",
  title: "Wolke 7000",
}

/** Resolve an absolute site path relative to the currently rendered page. */
function relativeToPage(props, target) {
  const slug = props?.fileData?.slug ?? ""
  const depth = slug.split("/").length - 1
  const clean = target.startsWith("/") ? target.slice(1) : target
  return depth === 0 ? clean : "../".repeat(depth) + clean
}

const toolbarCss = `
.wolke-toolbar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0.75rem 0 1.25rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--lightgray);
  border-radius: 0.9rem;
  background: color-mix(in srgb, var(--lightgray) 22%, transparent);
}
.wolke-toolbar-title {
  font-family: var(--headerFont);
  font-size: 0.65rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gray);
  margin-right: auto;
  padding-left: 0.35rem;
  white-space: nowrap;
}
.wolke-toolbar .darkmode,
.wolke-toolbar .readermode,
.wolke-toolbar .wolke-music {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 0.45rem;
  background: none;
  cursor: pointer;
  color: var(--darkgray);
  transition: background 0.15s ease, color 0.15s ease;
}
.wolke-toolbar .darkmode svg,
.wolke-toolbar .readermode svg,
.wolke-toolbar .wolke-music svg {
  position: static;
  top: auto;
  display: block;
  width: 1.2rem;
  height: 1.2rem;
  fill: currentColor;
  stroke: currentColor;
}
.wolke-toolbar .darkmode:hover,
.wolke-toolbar .readermode:hover,
.wolke-toolbar .wolke-music:hover,
.wolke-toolbar .wolke-music.is-playing {
  background: var(--highlight);
  color: var(--secondary);
}
`

/**
 * Scripts for the three controls.
 *
 * These deliberately do not rely on the "nav"/"render" events alone: with SPA
 * enabled those are only dispatched after a client side navigation, so the
 * controls would stay dead on the first page view. Everything is initialised
 * immediately as well, and re-initialised after each navigation.
 */
const themeScript = `
(function () {
  const KEY = "theme";
  // window.addCleanup is provided by the SPA router, which loads after this script
  const cleanup = (fn) => (typeof window.addCleanup === "function" ? window.addCleanup(fn) : undefined);

  const current = () => document.documentElement.getAttribute("saved-theme") ?? "light";

  const applyClasses = (theme) => {
    document.body?.classList.remove("theme-dark", "theme-light");
    document.body?.classList.add("theme-" + theme);
  };

  const announce = (theme) => {
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: theme } }));
  };

  const setTheme = (theme) => {
    document.documentElement.setAttribute("saved-theme", theme);
    localStorage.setItem(KEY, theme);
    applyClasses(theme);
    announce(theme);
  };

  // initial theme (before DOM ready so there is no flash)
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  setTheme(localStorage.getItem(KEY) ?? (prefersLight ? "light" : "dark"));

  if (!window.__wolkeSystemThemeBound) {
    window.__wolkeSystemThemeBound = true;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", (e) => setTheme(e.matches ? "dark" : "light"));
  }

  const init = () => {
    for (const el of document.getElementsByClassName("darkmode")) {
      if (el.dataset.wolkeBound === "true") continue;
      el.dataset.wolkeBound = "true";
      const toggle = () => setTheme(current() === "dark" ? "light" : "dark");
      el.addEventListener("click", toggle);
      cleanup(() => el.removeEventListener("click", toggle));
    }
  };

  document.addEventListener("nav", init);
  document.addEventListener("render", init);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
`

const readerScript = `
(function () {
  const cleanup = (fn) => (typeof window.addCleanup === "function" ? window.addCleanup(fn) : undefined);
  let enabled = document.documentElement.getAttribute("reader-mode") === "on";

  const set = (on) => {
    enabled = on;
    const mode = on ? "on" : "off";
    document.documentElement.setAttribute("reader-mode", mode);
    document.dispatchEvent(new CustomEvent("readermodechange", { detail: { mode: mode } }));
  };

  const init = () => {
    for (const el of document.getElementsByClassName("readermode")) {
      if (el.dataset.wolkeBound === "true") continue;
      el.dataset.wolkeBound = "true";
      const toggle = () => set(!enabled);
      el.addEventListener("click", toggle);
      cleanup(() => el.removeEventListener("click", toggle));
    }
    document.documentElement.setAttribute("reader-mode", enabled ? "on" : "off");
  };

  document.addEventListener("nav", init);
  document.addEventListener("render", init);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
`

/**
 * Soundtrack.
 *
 * Design notes:
 *
 *  - The player is a single controller instance for the whole browsing session,
 *    owning exactly one <audio> element that is appended to <body> with
 *    data-persist so the SPA's micromorph(document.body, ...) keeps it alive.
 *    That is what lets the soundtrack survive page changes.
 *
 *  - Click handling uses ONE delegated listener on `document`, attached once
 *    behind the singleton guard. The previous version bound a listener to each
 *    individual button and removed it again via the SPA's addCleanup on every
 *    navigation. Because cleanup ran on the *old* button while init() ran on
 *    the *new* one, the replacement button could keep its
 *    data-wolke-bound="true" marker while its listener was already gone -
 *    leaving a button that looked live but could no longer be muted. A single
 *    delegated listener has no per-element lifetime and cannot be orphaned.
 *
 *  - Looping is handled from the "ended" event with a re-entrancy guard rather
 *    than audio.loop. Native loop restarts this VBR file while the previous
 *    tail is still draining, so the two passes overlap audibly. Ending and
 *    restarting deliberately avoids that overlap.
 */
const musicScript = `
(function () {
  if (window.__wolkeMusic) return;

  const audio = document.createElement("audio");
  audio.preload = "none";
  audio.loop = false;
  audio.setAttribute("data-persist", "");
  audio.style.display = "none";
  document.body.appendChild(audio);

  const state = { src: "", loop: true, volume: 0.35, playing: false, restarting: false };
  const player = window.__wolkeMusic = {
    audio,
    state,
    configure(opts) {
      if (opts.src && opts.src !== state.src) {
        state.src = opts.src;
        audio.src = opts.src;
        audio.load();
      }
      if (typeof opts.loop === "boolean") state.loop = opts.loop;
      if (typeof opts.volume === "number" && !Number.isNaN(opts.volume)) {
        state.volume = Math.min(1, Math.max(0, opts.volume));
        audio.volume = state.volume;
      }
    },
    play() {
      state.playing = true;
      render();
      const resume = audio.play();
      if (resume && resume.catch) resume.catch(() => {});
    },
    pause() {
      state.playing = false;
      audio.pause();
      render();
    },
    toggle() {
      if (state.playing) this.pause();
      else this.play();
    },
  };

  audio.addEventListener("ended", () => {
    if (!state.loop) {
      state.playing = false;
      render();
      return;
    }
    state.restarting = true;
    audio.currentTime = 0;
    const resume = audio.play();
    const settle = () => {
      state.restarting = false;
      render();
    };
    if (resume && resume.then) resume.then(settle, settle);
    else settle();
  });

  for (const event of ["play", "pause"]) {
    audio.addEventListener(event, () => {
      state.playing = !audio.paused && !audio.ended;
      render();
    });
  }

  function render() {
    const playing = state.playing && !audio.paused;
    for (const btn of document.querySelectorAll("[data-wolke-music-toggle]")) {
      btn.classList.toggle("is-playing", playing);
      btn.setAttribute("aria-pressed", String(playing));
      const label = playing ? btn.dataset.muteLabel : btn.dataset.playLabel;
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
      for (const icon of btn.querySelectorAll("[data-icon]")) {
        icon.style.display = icon.dataset.icon === (playing ? "playing" : "muted") ? "" : "none";
      }
    }
  }

  const optionsFrom = (btn) => ({
    src: btn.dataset.src,
    loop: btn.dataset.loop === "true",
    volume: parseFloat(btn.dataset.volume),
  });

  // One delegated listener, attached exactly once for the session.
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const btn = event.target.closest("[data-wolke-music-toggle]");
    if (!btn) return;
    player.configure(optionsFrom(btn));
    player.toggle();
  });

  // Re-read options and refresh the button state after each morph, but never
  // attach listeners here - that is the delegated handler's job.
  function refresh() {
    const btn = document.querySelector("[data-wolke-music-toggle]");
    if (btn) player.configure(optionsFrom(btn));
    render();
  }

  document.addEventListener("nav", refresh);
  document.addEventListener("render", refresh);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh);
  } else {
    refresh();
  }
})();
`

/**
 * Turn changes to rendered fenced blocks into a small, application-facing
 * event stream. The item system can listen for the named events without
 * knowing anything about DOM mutations:
 *
 *   document.addEventListener("item_placed", (event) => ...)
 *
 * A block's first non-empty line is its item name. When only the details of a
 * block change, the name remains stable and the event still identifies the
 * item. Replacing an item emits both sides of the exchange.
 */
const rucksackEventScript = `
(function () {
  const BLOCK_SELECTOR = "pre";
  const tracked = new Map();
  let observer;

  function loggingEnabled() {
    const setting = document.querySelector("[data-event-logging]")?.getAttribute("data-event-logging");
    return setting === null || setting === undefined || setting === "true";
  }

  function contentOf(block) {
    const code = block.querySelector("code");
    return (code?.textContent ?? block.textContent ?? "")
      .replace(/\\r\\n/g, "\\n")
      .trim();
  }

  function nameOf(content) {
    return content.split("\\n").map((line) => line.trim()).find(Boolean) ?? "";
  }

  function languageOf(block) {
    return block.getAttribute("data-language")
      ?? block.querySelector("[data-language]")?.getAttribute("data-language")
      ?? "";
  }

  function emit(type, item, before, after, block) {
    if (!item) return;

    const detail = {
      type,
      item,
      before,
      after,
      language: languageOf(block),
      source: window.location.pathname,
      timestamp: new Date().toISOString(),
    };

    document.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
    if (loggingEnabled()) console.log("[rucksack] emitted", detail);
  }

  function compare(block, previous) {
    if (!document.contains(block)) return;

    const current = contentOf(block);
    if (current === previous) return;

    const previousName = nameOf(previous);
    const currentName = nameOf(current);

    if (!current) {
      emit("item_taken", previousName, previous, current, block);
    } else if (!previous) {
      emit("item_placed", currentName, previous, current, block);
    } else if (currentName !== previousName) {
      emit("item_taken", previousName, previous, current, block);
      emit("item_placed", currentName, previous, current, block);
    } else if (current.length > previous.length) {
      emit("item_placed", currentName, previous, current, block);
    } else {
      emit("item_taken", previousName, previous, current, block);
    }

    tracked.set(block, current);
  }

  function prime() {
    tracked.clear();
    document.querySelectorAll(BLOCK_SELECTOR).forEach((block) => {
      tracked.set(block, contentOf(block));
    });
  }

  function changedBlocks(mutations) {
    const blocks = new Set();

    for (const mutation of mutations) {
      const target = mutation.target.nodeType === Node.ELEMENT_NODE
        ? mutation.target
        : mutation.target.parentElement;
      const block = target?.closest?.(BLOCK_SELECTOR);
      if (block) blocks.add(block);

      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          if (node.matches(BLOCK_SELECTOR)) blocks.add(node);
          node.querySelectorAll?.(BLOCK_SELECTOR).forEach((child) => blocks.add(child));
        }
      }
    }

    return blocks;
  }

  function start() {
    if (observer) return;
    prime();
    observer = new MutationObserver((mutations) => {
      for (const block of changedBlocks(mutations)) {
        if (!tracked.has(block)) {
          tracked.set(block, contentOf(block));
          continue;
        }
        compare(block, tracked.get(block));
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  }

  function navigation() {
    // SPA navigation replaces the document content rather than changing an
    // existing item. Prime the new page so navigation itself emits nothing.
    prime();
  }

  document.addEventListener("nav", navigation);
  document.addEventListener("render", navigation);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
`

const WolkeToolbar = (opts) => {
  const options = { ...defaultOptions, ...(opts ?? {}) }

  const Component = (props) =>
    h(
      "div",
      {
        class: "wolke-toolbar",
        role: "group",
        "aria-label": "Wolke 7000 controls",
        "data-event-logging": String(props.cfg?.eventlogging ?? true),
      },
      options.title ? h("span", { class: "wolke-toolbar-title" }, options.title) : null,
      DarkmodeButton(),
      ReaderModeButton(),
      MusicButton({ ...options, src: relativeToPage(props, options.src) }),
    )

  Component.displayName = "WolkeToolbar"
  Component.css = [darkmodeCss, readermodeCss, toolbarCss].filter(Boolean).join("\n")
  Component.beforeDOMLoaded = [themeScript, readerScript].filter(Boolean).join("\n")
  Component.afterDOMLoaded = [musicScript, rucksackEventScript].join("\n")

  return Component
}

export { WolkeToolbar }
export default WolkeToolbar
