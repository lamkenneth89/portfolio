---
title: "Measuring This Portfolio"
category: "Engineering & AI"
summary: "The analytics layer of this site, designed as a measurement exercise rather than a default install — a tracking spec, a validating dataLayer helper, and a consent model that requests nothing until you say yes."
role: "Designed and built it"
period: "2026"
stack: ["GA4", "Google Tag Manager", "TypeScript", "Consent Mode v2"]
hasCaseStudy: true
featured: true
order: 2
---

Most portfolios carry an analytics snippet somebody pasted in once. This one is
instrumented deliberately, because measurement design is the job — and a site
that claims analytics skill while collecting nothing but default page views is
making an argument it cannot support.

## The problem with the site this replaced

The previous portfolio had a GA4 tag and nothing else. Eighteen projects, no
way to know which one anybody opened. Every visitor produced one page view and
a bounce, which is what a single-page site produces by construction. The data
was not wrong; it simply could not answer any question worth asking.

The questions I actually wanted answered were narrow:

- Which projects do people open, and do they open the write-up or jump straight
  to the Tableau viz? Those are different signals about different audiences.
- Does anyone reach the bottom of a case study, or do they leave at the demo?
- Does the résumé get downloaded before or after someone looks at the work?

## Design

**The site pushes to `dataLayer` and nothing else.** No tag configuration lives
in the codebase. That separation is the whole point of a container: what gets
*collected* is a code change and a deploy; what gets *sent*, and where, is a
container change with no deploy at all.

Seven events carry the model. Each one exists because a specific question needs
it, and nothing is collected "in case it is useful later":

| Event | Answers |
|---|---|
| `section_view` | How far down the page attention actually travels |
| `project_card_click` | Which work gets opened, and what kind of destination was chosen |
| `case_study_read` | Whether a write-up gets finished |
| `demo_interaction` | Whether the live demos are used or just noted |
| `outbound_click` | Where the site sends people |
| `resume_download` | The intent signal that matters most |
| `contact_submit` | The outcome |

### A validator, not a convention

`src/lib/track.ts` refuses to push anything that breaks the spec, and explains
why in the console during development. Event names and parameter keys must be
snake_case; the event must already exist in the spec; keys that look like
personal data are rejected outright.

That last rule does real work. `contact_submit` records *which* channel was
used and nothing else — never the name, address or message typed into the form.
The form has no backend at all; it hands the draft to the visitor's own mail
client.

The idea is borrowed from the Android app I built to learn mobile measurement,
where a central tracker enforced the same rules. Catching a malformed event at
the point it is written costs a second. Catching it in a GA4 report costs a
month, and by then the data is already wrong.

### Consent that means something

Consent Mode v2 defaults everything to denied before any container loads. But
Consent Mode alone still lets a denied-state cookieless ping leave the browser,
so this site goes further: **the tag is not requested at all until a visitor
opts in.** Decline, and nothing Google-owned is ever fetched.

That is the version I would want as a visitor, and it costs nothing but a
function call deferred behind a button.

## Two things that went wrong

**Section views fired for one section out of four.** The observer used a
ratio threshold — count a section as seen when 40% of it is on screen. But
these sections are several times taller than the viewport, so the ratio tops
out around 7% and `IntersectionObserver` simply stops calling back. The fix was
to stop measuring the element and start measuring attention: shrink the
observer's root to a band across the middle of the screen, and count a section
when it crosses the visitor's eyeline. The metric got more honest as a
side effect of the bug.

**Outbound URLs were truncated mid-word** by the length guard, which produced
parameter values that looked like data but could not be grouped. Recording
origin and path, and dropping the query string, fixed both the length and the
usefulness.

Neither was visible in a report. Both were obvious watching `dataLayer`
directly — which is the habit worth having.

## What this does not do

No user IDs, no cross-site identity, no advertising signals, no Google Signals.
On a dataset this size, Signals would trigger GA4 thresholding and hide most
rows, so enabling it would cost data and buy nothing.

The tracking specification lives in the repository next to the code it
governs, because a measurement contract that lives in someone's inbox is not a
contract.
