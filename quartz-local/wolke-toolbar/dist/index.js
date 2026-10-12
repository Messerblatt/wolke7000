// Entry point for the local plugin loader. The component itself is plain ESM,
// so this simply re-exports it under the conventional dist/ layout.
export * from "../components/index.js"
export { default } from "../components/index.js"