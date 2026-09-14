---
title: "Kana's Stage Dive"
category: "Engineering & AI"
summary: "A one-button stair-descent game, built in Godot 4 and shipped to the web — including the part where the WebAssembly binary was too large for the host and had to be taken apart."
role: "Designed, built and deployed it"
period: "2026"
stack: ["Godot 4", "GDScript", "WebAssembly", "Cloudflare Workers"]
demo:
  type: "iframe"
  url: "https://kana-stage-dive.lamkenneth89.workers.dev"
  label: "Play it in a new tab"
  fallbackImage: "/images/thumbs/kana-stage-dive.jpg"
thumb: "/images/thumbs/kana-stage-dive.jpg"
repo: "https://github.com/lamkenneth89/godot-game"
hasCaseStudy: true
order: 4
---

Descend as far as you can. Left and right, nothing else. Kana stays standing on
each platform until you walk her past an edge, and landing on the next platform
stops the fall rather than bouncing her onward — two small rules that decide
whether the game feels like control or like a toy reacting to you.

It is a first game project, and the reason it is here is not the design. It is
that shipping it to the web turned out to be a genuine engineering problem.

## The 25 MiB problem

Godot's Web export produces a single WebAssembly binary. Cloudflare's static
assets have a **25 MiB per-file limit**, and the binary is larger than that.
There is no export setting for this; the file is the size it is.

The build pipeline therefore splits `index.wasm` into sub-25 MiB chunks and
injects a browser loader that reassembles them in memory before Godot starts.
The original export in `build/web/` is left untouched for local testing, and a
separate `build/cloudflare/` directory holds the chunked, deployable version —
so the thing being debugged locally is never the thing that has been taken
apart.

It is an unglamorous fix for a constraint that is entirely someone else's, and
that is most of what deployment work is.

## Why this is embedded lazily

The demo below loads only when you ask it to, and that is a decision the
constraint above forces. A WebAssembly payload of that size has no business
being fetched by anyone who merely scrolled past a case study — on a phone, on
mobile data, it would be the most expensive thing on this entire site.

So the page ships a still frame of the game's own art, and fetches the runtime
on a click. The same principle governs every embed here: **an interactive demo
should cost nothing until someone chooses to interact with it.**

## What was made, versus what was generated

The pixel art — the stage, the lanterns, the cherry blossoms above — was
generated locally and then cut into sprite sheets and a background. The game
logic, the pacing tests, the export tooling and the chunking loader were
written.

That split is worth being explicit about, because "made with AI" is doing a lot
of unexamined work in most portfolios. Generation is good at producing an asset
to a description. It is not what decides that Kana should keep her footing
until she is walked off an edge, and that is the decision the game is actually
made of.

The character and theme are a non-commercial fan-made prototype.
