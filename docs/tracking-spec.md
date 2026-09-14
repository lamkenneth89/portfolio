# Tracking specification

The measurement contract for lamkenneth89.github.io/portfolio. The site pushes
to `dataLayer` and nothing else; every tag, filter and destination is
configured in the GTM web container. Changing what is *collected* means
changing this document and `src/lib/track.ts`; changing what is *sent* means
changing GTM, with no deploy.

**Property:** GA4 `G-5LS37NMPYN`
**Container:** set `gtm` in `src/lib/site.ts`. While it is empty the site falls
back to the plain gtag snippet, so analytics never goes dark mid-migration.

---

## Events

Every event carries `environment` (`production` on the live host, `development`
anywhere else) so dev traffic can be filtered without guessing at hostnames.

| Event | Parameters | Fires when |
|---|---|---|
| `section_view` | `section_id` | A top-level section reaches 40% visibility. Once per section per page view. |
| `project_card_click` | `project_id`, `project_category`, `destination_type` | Any project entry is clicked, in the featured block or the index. |
| `case_study_read` | `project_id`, `scroll_pct` | A case study passes 50% and 90% read depth. Once per threshold per page view. |
| `demo_interaction` | `demo_id`, `demo_action` | A visitor loads an embedded demo, plays a video, or opens one in a new tab. |
| `outbound_click` | `link_domain`, `link_url` | Any link to another host is clicked. Auto-detected; no markup needed. |
| `resume_download` | — | The résumé button is used, on either page. |
| `contact_submit` | `contact_method` | The contact form is submitted (`form`) or the email address is clicked (`mailto_link`). |

`destination_type` is one of `case_study`, `external`, `image` — it separates
"read the write-up" from "went to look at the Tableau viz", which are different
kinds of interest.

`demo_action` is one of `load_embed`, `open_in_new_tab`, `play_video`.

---

## Rules the helper enforces

`track()` in `src/lib/track.ts` refuses to push anything that breaks these, and
says why in the console during development:

1. **snake_case only** — event names and parameter keys. A stray camelCase key
   becomes a second dimension in GA4 that nobody notices for a month.
2. **No PII.** Keys matching `email`, `name`, `phone`, `address`, `user_id`,
   `ip`, `password` are blocked outright. A portfolio has no business
   collecting any of them, and `contact_submit` deliberately records only
   *which* channel was used.
3. **No free-text values.** Parameters come from a fixed vocabulary or from
   content IDs, never from anything a visitor typed.
4. **Deduplicated by design.** `section_view` and `case_study_read` are guarded
   per page view so a slow scroll cannot inflate them.

## Rules for the GTM side

Carried over from the PayLab Android container (project P2-E), where each of
these was learned by breaking it:

1. **One GA4 Event tag per event name.** Two tags matching the same event each
   emit their own copy — that is duplicate events, not merged parameters.
2. **Never use an unrestricted All Events trigger** with a tag that also pushes
   to `dataLayer`. That loop produced 1,571 events in a single session.
3. **A parameter whose variable resolves to undefined can drop the whole
   event**, silently. Prefer a constant default over an unresolved lookup.
4. **Publish, then verify on the real site** — the container is cached, so a
   published change is not immediately live for existing visitors.

---

## GA4 configuration (console work, not code)

These are not retroactive. They must be in place *before* the new site starts
drawing traffic.

- [ ] **Data retention → 14 months.** Default is 2. Changing it later does not
      recover the months already discarded.
- [ ] **Register custom dimensions** (event-scoped): `project_id`,
      `project_category`, `destination_type`, `demo_id`, `demo_action`,
      `section_id`, `contact_method`, `environment`.
      A parameter missing from the dropdown can be typed in by hand — GA4 only
      lists parameters it has already processed, which takes 24–48 h.
- [ ] **Key events:** `contact_submit`, `demo_interaction`.
- [ ] **Dev traffic filter** on `environment = development`. Create it in
      **Testing** mode first; switching a filter to Active is irreversible.
- [ ] Leave **Google Signals off.** On a dataset this small, thresholding would
      hide most rows.

## Verifying a change

1. GTM **Preview** against the deployed site — check the event fires once, with
   every expected parameter, and no others.
2. GA4 **Realtime** and **DebugView**. DebugView is intermittent; when the two
   disagree, believe Preview.
3. With consent not yet granted, confirm **zero** GA4 network requests.
