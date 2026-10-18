const TYPING_INTERVAL = 16

let typingTimer: number | undefined
let typingCharacters: HTMLSpanElement[] = []

function unwrapTypingCharacters() {
  document.querySelectorAll<HTMLSpanElement>(".typewriter-character").forEach((character) => {
    character.replaceWith(document.createTextNode(character.textContent ?? ""))
  })
}

function stopTyping() {
  if (typingTimer !== undefined) {
    window.clearInterval(typingTimer)
    typingTimer = undefined
  }

  unwrapTypingCharacters()
  typingCharacters = []
}

function markTypingReady() {
  document.documentElement.classList.add("typewriter-ready")
}

function prepareForNavigation() {
  stopTyping()
  document.documentElement.classList.remove("typewriter-ready")
}

function revealAll() {
  typingCharacters.forEach((character) => character.classList.add("is-visible"))
  stopTyping()
}

function shouldSkipTextNode(node: Text) {
  const parent = node.parentElement
  if (!parent || !node.textContent?.trim()) return true
  if (parent.closest("script, style, noscript, template, route-announcer")) return true
  if (parent.closest("[hidden], [aria-hidden='true']")) return true

  const style = window.getComputedStyle(parent)
  return style.display === "none" || style.visibility === "hidden"
}

function startTyping() {
  stopTyping()
  document.documentElement.classList.remove("typewriter-ready")

  const page = document.querySelector<HTMLElement>("#quartz-root")
  if (!page || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    markTypingReady()
    return
  }

  const textNodes: Text[] = []
  const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    if (!shouldSkipTextNode(node as Text)) textNodes.push(node as Text)
  }

  const characters: HTMLSpanElement[] = []
  textNodes.forEach((textNode) => {
    const fragment = document.createDocumentFragment()
    for (const character of textNode.data) {
      const span = document.createElement("span")
      span.className = "typewriter-character"
      span.textContent = character
      fragment.appendChild(span)
      characters.push(span)
    }
    textNode.replaceWith(fragment)
  })

  if (characters.length === 0) {
    markTypingReady()
    return
  }

  typingCharacters = characters
  markTypingReady()
  let revealed = 0
  const revealNext = () => {
    const character = typingCharacters[revealed++]
    if (!character) {
      stopTyping()
      return
    }
    character.classList.add("is-visible")
  }

  revealNext()
  typingTimer = window.setInterval(revealNext, TYPING_INTERVAL)
}

function skipTyping(event: KeyboardEvent) {
  if (event.code !== "Space" || typingTimer === undefined) return

  const target = event.target as HTMLElement | null
  if (
    target?.isContentEditable ||
    target?.tagName === "INPUT" ||
    target?.tagName === "TEXTAREA" ||
    target?.tagName === "SELECT"
  ) {
    return
  }

  event.preventDefault()
  revealAll()
}

document.addEventListener("keydown", skipTyping)
document.addEventListener("prenav", prepareForNavigation)
document.addEventListener("nav", startTyping)
