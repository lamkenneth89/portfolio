/**
 * The site's only analytics surface: it pushes to dataLayer and nothing else.
 * Tags, destinations and transformations live in the GTM web container.
 *
 * The validation here is the same idea as PayLab's AnalyticsValidator — catch
 * a malformed event at the point it is written, not a month later when a GA4
 * report has a column nobody can explain. See docs/tracking-spec.md.
 */

const SNAKE_CASE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

/** Keys this site must never collect, whatever the caller intended. */
const FORBIDDEN_KEY = /(email|e_mail|name|phone|address|user_id|ip_|password|token)/;

const ALLOWED_EVENTS = [
  'section_view',
  'project_card_click',
  'case_study_read',
  'demo_interaction',
  'outbound_click',
  'resume_download',
  'contact_submit',
] as const;

export type TrackedEvent = (typeof ALLOWED_EVENTS)[number];

type Params = Record<string, string | number | boolean>;

const isProduction = () =>
  typeof location !== 'undefined' &&
  location.hostname === 'lamkenneth89.github.io';

function reject(reason: string, event: string, params: Params): false {
  // Loud in development, silent in production — a broken event should never
  // be the reason a visitor sees a console full of noise.
  if (!isProduction()) {
    console.warn(`[track] dropped "${event}": ${reason}`, params);
  }
  return false;
}

export function track(event: string, params: Params = {}): boolean {
  if (typeof window === 'undefined') return false;

  if (!SNAKE_CASE.test(event)) {
    return reject('event name is not snake_case', event, params);
  }
  if (!(ALLOWED_EVENTS as readonly string[]).includes(event)) {
    return reject('event is not in the tracking spec', event, params);
  }

  for (const [key, value] of Object.entries(params)) {
    if (!SNAKE_CASE.test(key)) {
      return reject(`parameter "${key}" is not snake_case`, event, params);
    }
    if (FORBIDDEN_KEY.test(key)) {
      return reject(`parameter "${key}" looks like PII`, event, params);
    }
    if (typeof value === 'string' && value.length > 100) {
      return reject(`parameter "${key}" is suspiciously long`, event, params);
    }
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    environment: isProduction() ? 'production' : 'development',
    ...params,
  });
  return true;
}

/**
 * Wires every declarative `data-track` attribute plus the three behavioural
 * events (section views, read depth, outbound clicks). Called once per page.
 */
export function initTracking(): void {
  const firedOnce = new Set<string>();

  const once = (key: string, event: TrackedEvent, params: Params = {}) => {
    if (firedOnce.has(key)) return;
    firedOnce.add(key);
    track(event, params);
  };

  // ── Declarative clicks ────────────────────────────────────────────────
  document.addEventListener(
    'click',
    (rawEvent) => {
      const target = rawEvent.target as Element | null;
      const el = target?.closest<HTMLElement>('[data-track]');

      if (el) {
        const name = el.dataset.track ?? '';
        const params: Params = {};
        for (const [key, value] of Object.entries(el.dataset)) {
          if (key === 'track' || value === undefined) continue;
          // data-project-id -> project_id
          params[key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)] = value;
        }
        track(name, params);
      }

      // ── Outbound links, detected rather than annotated ──────────────────
      const link = target?.closest<HTMLAnchorElement>('a[href]');
      if (!link) return;
      const href = link.href;
      if (!/^https?:/.test(href)) return;
      if (new URL(href).hostname === location.hostname) return;

      const destination = new URL(href);
      track('outbound_click', {
        link_domain: destination.hostname.replace(/^www\./, ''),
        // Origin + path only: the query string carries nothing worth keeping
        // and pushes long URLs past the length guard mid-word.
        link_url: `${destination.origin}${destination.pathname}`.slice(0, 100),
      });
    },
    { capture: true },
  );

  // ── Section views ─────────────────────────────────────────────────────
  const sections = document.querySelectorAll<HTMLElement>('[data-section]');
  if (sections.length > 0) {
    // Ratio thresholds are useless here: these sections are several times
    // taller than the viewport, so intersectionRatio never reaches 0.4 and the
    // observer stops calling back. Shrinking the root to a band across the
    // middle of the screen instead means "the visitor scrolled this section
    // past their eyeline", which is what we actually want to count.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).dataset.section ?? '';
          once(`section:${id}`, 'section_view', { section_id: id });
          observer.unobserve(entry.target);
        }
      },
      // A 30% band, not a hairline: a quick trackpad flick should not be able
      // to jump a whole section without registering it.
      { rootMargin: '-35% 0px -35% 0px', threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
  }

  // ── Case-study read depth ─────────────────────────────────────────────
  const article = document.querySelector<HTMLElement>('[data-case-study]');
  if (article) {
    const projectId = article.dataset.caseStudy ?? '';
    const thresholds = [50, 90];

    const onScroll = () => {
      const box = article.getBoundingClientRect();
      const readable = box.height - window.innerHeight;
      if (readable <= 0) return;
      const pct = Math.min(100, Math.round((-box.top / readable) * 100));

      for (const threshold of thresholds) {
        if (pct >= threshold) {
          once(`read:${threshold}`, 'case_study_read', {
            project_id: projectId,
            scroll_pct: threshold,
          });
        }
      }
      if (firedOnce.has('read:90')) {
        window.removeEventListener('scroll', onScroll);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}
