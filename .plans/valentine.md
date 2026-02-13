Playful Valentine Webpage — Implementation Spec

Goal

Single-page “Will you be my Valentine?” web experience with escalating comedic resistance to clicking No.
	•	Presents Yes / No.
	•	She will try to click No.
	•	First 3 times: show a provided image + re-ask.
	•	From the 4th No onward: No moves closer to Yes and eventually goes behind it.
	•	Add: typewriter intro, “Yes grows powerful”, fine-print gag, heart confetti burst, achievement unlock.

⸻

Tech assumptions

Plain HTML/CSS/JS (no build step). Works on mobile + desktop.

Files
	•	index.html
	•	styles.css
	•	script.js
	•	assets/tease.png (user-provided image)
	•	optional decorative SVG/PNG assets

⸻

State machine

State variables
	•	noCount: number — starts 0. Increments on each No click.
	•	maxTease = 3 — number of “tease interstitials”.
	•	phase: 'intro' | 'ask' | 'tease' | 'success'
	•	chaseMoves: number — starts 0. Increments on each No click after noCount >= 3.

Screens
	1.	Intro: typewriter text “booting romance engine…” then reveal Ask UI.
	2.	Ask: question + Yes/No buttons + tiny “read the fine print”.
	3.	Tease interstitial (first 3 No clicks): show provided image + escalating copy + “Ask again” button.
	4.	Success: celebration message + heart/confetti.

⸻

DOM structure (suggested)

Ask view
	•	#question
	•	#subline (changes during escalation)
	•	#btnArea (position relative)
	•	#yesBtn
	•	#noBtn
	•	#finePrintLink (tiny)
	•	#finePrintPanel (collapsed/expand)
	•	#achievementToast (hidden, shows when unlocked)

Tease modal
	•	#modalBackdrop (hidden by default)
	•	#modal
	•	img#teaseImg (user-provided)
	•	#teaseText
	•	button#askAgainBtn

⸻

Copy assets

Tease lines (3)
	•	teaseLines[0]: “Bold choice. Let’s try that again 😇”
	•	teaseLines[1]: “The ‘No’ button is feeling unromantic today.”
	•	teaseLines[2]: “Achievement progress: 3…2…1… 💘”

Ask sublines (during chase)
	•	chaseSublines: rotate per click, e.g.
	•	“Interesting.”
	•	“Are you sure?”
	•	“That button is getting shy…”
	•	“Okay, now you’re just speedrunning.”

Fine print content

Collapsed link text: read the fine print
Expanded text example:

By clicking Yes you agree to:
	•	cuddles
	•	snacks
	•	a suspicious number of kisses
	•	and one (1) romantic date to be scheduled soon

⸻

Event handling

Intro (typewriter)
	•	On load: show #introText and typewriter animation.
	•	When complete (or after timeout): transition to Ask view.

Implementation hint: simple setInterval that reveals next character; respect prefers-reduced-motion.

Yes button
	•	Always clickable.
	•	On click:
	•	trigger heart confetti burst from the Yes button
	•	transition to Success view

No button — tease phase (first 3 No clicks)

Condition: noCount < 3
	•	On click:
	•	noCount++
	•	apply “Yes grows more powerful” effect (see below)
	•	if noCount === 3: unlock achievement toast
	•	show Tease modal:
	•	teaseImg.src = userProvidedImage
	•	teaseText = teaseLines[noCount-1]

Ask-again button (in modal)
	•	hides modal
	•	returns to Ask view

No button — chase phase (4th No onward)

Condition: noCount >= 3
	•	Stay on Ask view.
	•	On click:
	•	noCount++
	•	chaseMoves++
	•	apply “Yes grows more powerful” effect
	•	move No closer to Yes (position interpolation)
	•	after a few moves: put No behind Yes via z-index

⸻

“Yes grows more powerful” (size + sparkle)

Size

Each No click (any phase):
	•	increase Yes scale slightly, e.g. scale = 1 + noCount * 0.06 (cap at e.g. 1.5)
	•	animate with CSS transition: transform 200ms ease.

Sparkle
	•	Toggle a CSS class on Yes for 250ms adding:
	•	a glow box-shadow
	•	a subtle animated sparkle pseudo-element (::after) or small SVG sparkles.

⸻

Heart confetti (lightweight)

Goal: emit small hearts from the Yes button on hover and tap/click.

Trigger
	•	On mouseenter (desktop) and on click / touchstart (mobile)

Approach
	•	Create ~10–20 heart elements (divs or inline SVG) appended to document.body.
	•	Position at Yes button center using getBoundingClientRect().
	•	For each heart:
	•	random angle, distance, duration
	•	animate via CSS keyframes or Web Animations API
	•	remove element on animation end

Tip: Use 1 tiny heart SVG path reused for all particles.

⸻

No-button chase algorithm

Layout requirement

#btnArea { position: relative; }
#yesBtn, #noBtn { position: absolute; }

Initial placement
	•	Yes centered.
	•	No offset to the right/below.

On chase click

Compute centers (relative to container):
	•	yesRect, noRect, areaRect via getBoundingClientRect()
	•	yesCenter = (yesRect.left + yesRect.width/2 - areaRect.left, same for y)
	•	noCenter = ...

Move fraction toward Yes:
	•	step = min(0.35 + chaseMoves*0.15, 0.9)
	•	newCenter = noCenter + (yesCenter - noCenter) * step

Convert center -> top/left for No:
	•	newLeft = newCenter.x - noRect.width/2
	•	newTop = newCenter.y - noRect.height/2

Clamp to bounds:
	•	newLeft = clamp(newLeft, 0, areaRect.width - noRect.width)
	•	newTop = clamp(newTop, 0, areaRect.height - noRect.height)

Apply with transition:
	•	noBtn.style.left/top = ...
	•	CSS: transition: left 180ms ease, top 180ms ease.

Eventually behind Yes

After N moves (e.g. chaseMoves >= 3):
	•	noBtn.style.zIndex = 1
	•	yesBtn.style.zIndex = 2
	•	Optionally reduce No opacity to 0.85 or shrink slightly.

⸻

Achievement unlock (x3)

When noCount === 3 (third No click):
	•	Show toast: “Achievement unlocked: Persistent ‘No’ Clicker (x3)”
	•	Auto-hide after 2s.

⸻

Fine print gag
	•	#finePrintLink toggles #finePrintPanel.
	•	Animation: height/opacity transition.

⸻

Accessibility + UX
	•	Buttons are real <button> with focus styles.
	•	Respect prefers-reduced-motion:
	•	disable typewriter + heavy particle count
	•	use simple fade-ins.
	•	Mobile-safe hitboxes; don’t rely on hover only.

⸻

Quick test checklist
	•	Intro types then reveals question
	•	No click 1–3 shows modal with image + new line
	•	Third No triggers achievement toast
	•	No click >=4 stays on Ask view and moves No toward Yes
	•	After a few moves No is behind Yes (z-index)
	•	Yes hover/tap emits hearts
	•	Every No makes Yes slightly larger + sparkly
	•	Fine print expands/collapses
	•	Success screen triggers confetti/burst
