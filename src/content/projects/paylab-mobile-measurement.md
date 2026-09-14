---
featuredRank: 2
title: "PayLab — Mobile Measurement Lab"
category: "Engineering & AI"
summary: "A mock payments app built for one reason: to learn mobile measurement by instrumenting it properly, then deliberately breaking the tag configuration to see how each failure actually presents."
role: "Built the app and the measurement"
period: "2026"
stack: ["Kotlin", "Jetpack Compose", "Firebase Analytics", "Google Tag Manager", "GA4"]
metrics:
  - value: "4"
    label: "GTM failure modes reproduced"
  - value: "1,571"
    label: "events from one bad trigger"
thumb: "/images/covers/paylab.svg"
hasCaseStudy: true
featured: true
order: 3
---

I have written tracking specifications for years and handed them to developers.
This project was about closing the gap on the other side: building the app,
emitting the events, wiring the container, and finding out which of my
assumptions about mobile measurement were wrong.

PayLab is a demo banking app — login, dashboard, transfer, review, result. No
real bank, no real money, no real personal data, ever. Its only purpose is to
be an instrumented surface.

## The measurement architecture

Thirteen events flow through a single `AnalyticsTracker` interface. Screens
never touch Firebase; they call the tracker, which means the whole UI stays
previewable and the measurement stays swappable — a debug tracker that writes
to Logcat, a Firebase tracker, and a composite that does both.

Two rules are enforced in code rather than trusted to discipline:

- **Amounts are banded before they leave the device.** HKD 1,500 is emitted as
  `amount_band=1000_4999`. The exact value never enters an event, which is not
  a preference — it is the difference between analytics and a payments record.
- **A forbidden-key safety net rejects anything that looks like PII.** PIN,
  payee details, exact amounts. A tracker that *cannot* send the wrong thing is
  worth more than a specification saying it shouldn't.

## What broke, and what that taught

The valuable part was not making it work. It was making it fail on purpose, in
a container where the data does not matter, and watching how each failure shows
up.

**A runaway loop.** An unrestricted *All Events* trigger on a Modify tag
re-logged auto-collected events, which re-triggered the tag. One session
produced 1,571 events — 1,560 of them `screen_view`. Narrowing the trigger to
an allowlist of the app's own event names brought it back to 11 events and zero
errors.

**Silent event loss.** A parameter row whose variable resolved to `undefined`
made the tag throw. Because the tag owned the event, the event was *dropped*,
not passed through. Eight events fired; two arrived. Nothing anywhere said so.

**Duplicate events.** Two Modify tags matching the same event do not merge
their changes — they each emit their own copy. The rule that came out of it:
one tag per event, and that tag carries every transformation for it.

**Cold-start bypass.** The container load times out after five seconds. Events
in that window reach Firebase untransformed, and the session stays in bypass
even after the container arrives. A test on a warm app will never show you
this.

## The debugging lesson that transfers

**Not one of those four was visible in DebugView.** The runaway loop would have
shown the added parameter and hidden the flood. The dropped events looked
exactly like events that were never sent.

Logcat caught all of them, because it shows two things DebugView does not: the
tag's decision, and the exact payload that left the device.

```
adb shell setprop log.tag.GoogleTagManager VERBOSE
adb shell setprop log.tag.FA-SVC VERBOSE
adb logcat -s GoogleTagManager FA-SVC PayLabAnalytics
```

DebugView itself turned out to be unreliable for this property — working one
evening and dead the next on an identical setup, with debug mode confirmed,
clock skew at zero, and uploads returning HTTP 204. Ruling that out by
measurement rather than assumption was its own exercise.

## Where a transformation belongs

The most useful outcome was a decision rule I now apply at work:

| Need | Layer |
|---|---|
| Rename or derive events, change a value, exclude internal traffic | **GA4 native** — no SDK, none of the client-side failure modes above |
| Must act *before data leaves the device*, or send to a non-Google destination | **GTM** |
| Fix historical data, or join non-analytics sources | **Warehouse** — GTM and GA4 Modify are both non-retroactive |

Most of what people build in GTM belongs in GA4. The exceptions are real, but
they are narrower than the habit suggests.

## Governance is the unglamorous half

Registering custom dimensions is not retroactive. Neither is data retention,
which defaults to two months. Neither is a data filter, and switching one from
Testing to Active cannot be undone. Every one of those is a five-minute console
task that silently costs you months of data if it is done late — which is
exactly why the checklist for [this site's own
measurement](/portfolio/projects/portfolio-measurement) exists before the
traffic does.
