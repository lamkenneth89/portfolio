---
featuredRank: 1
title: "Trilingual Audio Analyst"
category: "Engineering & AI"
summary: "Upload a recording, get back a speaker-labelled transcript and a structured summary — in a conversation that switches between Cantonese, Mandarin and English mid-sentence, the way people in Hong Kong actually talk."
role: "Built and deployed it"
period: "2026"
stack: ["Gemini 3 Flash", "React 19", "TypeScript", "Vite", "Cloud Run"]
restricted: "The live app runs on my own Gemini API key and the source is in a private repository, so it is not open to the public. Happy to demo it on a call."
thumb: "/images/covers/audio-analyst.svg"
hasCaseStudy: true
featured: true
order: 1
---

Hong Kong meetings do not happen in one language. A sentence starts in
Cantonese, the product name is in English, someone repeats the number in
Mandarin, and the action item at the end could be in any of the three. Every
transcription tool I tried made the same mistake: it picked a language, then
transcribed everything else badly through that choice.

This is a small web app that handles the mixture directly. Upload a recording;
get back a verbatim transcript with speakers labelled, an executive overview,
key topics, action items and overall sentiment — and download the lot.

## The language problem, and how it is actually solved

The interesting decision is not "call a speech API". It is what to do when a
speaker code-switches.

The app sends the audio to **Gemini 3 Flash** as a multimodal input with one
instruction set, rather than chaining a transcription service into a separate
summarisation step. That matters, because a two-step pipeline loses the
information that makes the second step good: by the time a transcript reaches a
summariser, the model can no longer hear that a phrase was hedged, or repeated
in a second language for emphasis.

Two rules do most of the work:

- **Script follows speech.** Cantonese is transcribed in Traditional Chinese,
  Mandarin in Simplified, English in English — within the same transcript, and
  within the same sentence when that is what happened. A single transcript with
  three scripts in it is correct; a single transcript forced into one script is
  a translation nobody asked for.
- **The summary follows the room.** The model determines the dominant language
  of the conversation and writes the overview, topics and action items in
  *that* language. A mostly-Cantonese meeting gets a Traditional Chinese
  summary, not an English one. The point is a document the participants can
  circulate, not an English report about a Chinese meeting.

## Structured output, not prose to be parsed

The response is constrained by a JSON schema — `overview`, `transcript`,
`languagesDetected`, `keyTopics`, `actionItems`, and `sentiment` as a fixed
enum. The app renders fields; it never parses prose looking for headings.

This is the part I would most want an analytics team to notice. Asking a model
for "a summary with action items" gives you text that *looks* structured and
breaks the moment the model formats it differently. Declaring the shape up
front makes the output something a program can rely on — and makes it obvious,
immediately, when a field comes back empty.

## What it cost to build

A React 19 + Vite front end, one service module of roughly a hundred lines, and
a container on Cloud Run that scales to zero. There is no database and no
account system, because the app has no reason to keep anything: the audio is
processed and the result is handed to the person who uploaded it.

That is also the honest answer to "how much of this did AI write". Most of the
typing. The decisions that make it work — single-pass multimodal instead of a
chained pipeline, the dominant-language rule, the response schema — are
judgement about the problem, and the model is happy to produce a perfectly
reasonable worse design if nobody makes those calls.

## Limits worth stating

It runs on a scale-to-zero container, so a first request after an idle period
waits for a cold start. Long recordings are bounded by the context window
rather than by any queueing the app does. And it is a personal deployment on a
personal key — not a service with an SLA, which is exactly why there is no
public link to it here: an open endpoint billed per request is an invitation
for someone else to spend the credit.
