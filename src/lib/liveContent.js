import { useSyncExternalStore } from "react";
import { projects as bundledProjects } from "../data/projects";
import { updates as bundledUpdates } from "../data/updates";

// Projects and updates as the owner last saved them in /admin. Pages render the lists bundled at
// build time first, then swap in the live lists from /api/content once (one request per visit).
// If the API isn't reachable (vite preview, or the editor isn't set up yet) the bundled lists stay.
let snapshot = { projects: bundledProjects, updates: bundledUpdates };
const listeners = new Set();
let started = false;

export function loadLiveContent() {
  if (started) return;
  started = true;
  fetch("/api/content", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (!Array.isArray(data?.projects) || !Array.isArray(data?.updates)) return;
      snapshot = { projects: data.projects, updates: data.updates };
      listeners.forEach((listener) => listener());
    })
    .catch(() => {});
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getLiveContent = () => snapshot;

export function useLiveContent() {
  loadLiveContent();
  return useSyncExternalStore(subscribe, getLiveContent);
}
