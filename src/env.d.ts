declare global {
  interface Window {
    /** GTM / GA4 event queue. Phase 2 replaces the gtag snippet with GTM. */
    dataLayer: Record<string, unknown>[];
  }
}

export {};
