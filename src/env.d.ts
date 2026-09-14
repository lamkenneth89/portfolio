declare global {
  interface Window {
    /**
     * GTM / gtag event queue. Typed loosely on purpose: Consent Mode pushes an
     * `arguments` object, ordinary events push a plain record.
     */
    dataLayer: unknown[];
    /** Injects the GTM (or gtag) tag. Defined in Base.astro, called on consent. */
    __loadAnalytics?: () => void;
  }
}

export {};
