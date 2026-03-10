# claude-to-claude.md
*A running log of session handoffs — appended automatically by Claude Code at the end of every session. Bring this file to Claude Chat when you need context on recent sessions.*

---
2026-03-06 — Analytics session

## Process log draft
Title: We were flying blind. Now we're not.

The site had Amplitude in the project brief and in the stack tags of the process log, but zero actual tracking code on either active page. This session wired up the full analytics layer from scratch — pageviews, interaction events, and session recordings — and debugged two separate issues before anything actually worked.

Changelog:
– Audited all HTML files for Amplitude: confirmed 0 of 2 pages had any tracking code
– Added Amplitude browser SDK v2 (CDN snippet) to candidate.html and process-log.html
– Added pageview tracking on both pages with contextual properties (candidate_id, candidate_name, cycle on candidate page)
– Added interaction events on candidate page: Tab Switched, Cycle Switched, Committees Modal Opened, Committees Tab Switched — all guarded to fire only on user actions, not programmatic init calls
– Added Process Log View Toggled event on process-log.html
– Debugged broken SDK load caused by a bogus SRI integrity hash in the snippet (silent browser block, no console warning by default)
– Added candidate_id and candidate_name to all interaction events so they can be filtered or grouped by candidate in Amplitude without losing global visibility
– Added Amplitude Session Replay plugin (CDN, synchronous load) to both pages
– Debugged device ID mismatch error caused by adding the plugin before amplitude.init() — fixed by swapping order so init establishes device ID first
– Session Replay confirmed working in Amplitude dashboard

Field notes:
Two debugging detours in a row, both caused by the same pattern: code that ran without errors but produced no output. The SRI hash looked like a real hash. The session replay loaded without throwing. Both failures were silent until we knew where to look. The lesson isn't about analytics specifically — it's about how invisible failures in third-party integrations tend to be. The SDK either loads or it doesn't, and the only feedback is the absence of data. Having Amplitude's validation UI made the second bug visible in a way the browser console never would have.

Stack tags: Amplitude · Session Replay

## How Sloane steered the work
**Audit before action**
The opening instruction was explicit: don't add anything until you've checked what's already there. That discipline surfaces real information — the gap between "Amplitude" being in the stack tags and Amplitude actually being in the code is exactly the kind of drift that creates false confidence. Insisting on the audit first meant the implementation started from truth, not assumption.

**Keeping global visibility on interaction events**
When asked about adding candidate context to tab switches, Sloane flagged the concern directly: don't lose the ability to see tab switches globally across all candidates. That's a real product instinct — you want both the aggregate view ("which tabs get used most?") and the filtered view ("what does a Gillibrand visitor do differently?"). The reassurance that properties are additive in Amplitude, not restrictive, resolved the tension cleanly — but it was Sloane's question that made the tradeoff explicit.

**Knowing when to hand off debugging to the dashboard**
Rather than digging through the code for the session replay error, Sloane went to Amplitude's validation UI first and shared the specific error message. That's the right call — Amplitude's own tooling is better at diagnosing Amplitude configuration errors than code inspection is. The device ID mismatch message was precise enough to fix in two lines.

The through-line: Sloane consistently oriented toward "what does this data actually tell me?" rather than "does the code technically run?" That's a product-thinking lens applied to an engineering task, and it caught two silent failures that would have gone unnoticed otherwise.

## What to bring to Claude Chat
– Session Replay use cases: Now that replays are recording, how do you want to use them? Watching for UX confusion points on the candidate page? Sharing with John to show how people navigate the data? Worth having intent before the data accumulates.
– Analytics for future pages: As search and the committee page get built, what interactions will matter most to track? Good to decide event naming conventions now before there are more pages to retrofit.
– Remote Configuration Validation: Still showing a question mark in Amplitude's setup checker — worth investigating whether this requires any action or resolves on its own once more sessions accumulate.

---
2026-03-06 — AM session: Design System build (~11:00 AM – ~1:00 PM)

## Process log draft
Title: A living reference, not a dead document

The design system page didn't exist this morning. By noon it was a fully structured reference that uses the actual production CSS classes in its demos — not mockups, not approximations. The goal from the start was to build something honest: if a component changes in production, the design system reflects it automatically because they share the same CSS.

Changelog:
– Created design-system.html from scratch; links styles.css and main.js same as all other pages
– Built token documentation: Tier 1 primitive values table + Tier 2 semantic CSS vars table
– Built Color section with swatch groups (Backgrounds, Text, Partisan, Status); all swatches carry data-token/data-hex for Figma MCP
– Built Typography section with Syne + IBM Plex Mono specimens and size/weight scale
– Built Spacing section with visual scale bars
– Built Components section with 13 cards; each has: component name, data-status badge, class list, live demo using real CSS
– Component status lifecycle established: stable · candidate-only · log-only · planned · deprecated
– Interactive demos: tab bar switching, health banner state switcher (Green/Amber/Red/Closed), modal open/close trigger
– Added Design System link to Documentation section in sidebar + mobile nav on candidate.html and process-log.html
– Renamed "Dev" → "Documentation" nav section across all pages
– Added Process Log link to Documentation section
– Discovered .overspend-note and .ds-overlap-note were the same visual pattern defined twice under different names → unified as .callout in styles.css

Field notes:
The most revealing moment was asking where the overspend callout was "actually coming from." The answer was: the same place as the design system's overlap annotation — same amber tint, same border, same spacing, same intent — but defined separately in two files, neither documented as a component. The design system's job isn't just to document what exists. It's to notice when the same idea has been independently invented twice and quietly give it one name.

Stack tags: Design System · Component architecture · Figma MCP readiness

## How Sloane steered the work
**"Keep Figma MCP in mind but don't make it the focus" — a quiet architectural constraint**
Setting this direction at the start shaped every structural decision without turning the session into an integration project. The data-token, data-hex, id="comp-{name}", and data-status attributes are all in place — but zero time was spent on actual MCP wiring. That's exactly the right call: design for extensibility without overbuilding.

**"Dev" → "Documentation" — more than a rename**
This isn't just a label change. It signals something about the project's identity — a documentation hub, not a developer diary. The rename happened alongside adding both Process Log and Design System to that section, which clarified the nav's information architecture in one move.

**Insisting on the correct callout styling**
When the initial plan only changed font-size, Sloane pushed back: "Does this include the styling as it was with the background and stroked container?" That's a precision eye — noticing that amber + border + background together carry a specific meaning (important caveat, not just a footnote), and that stripping any of those elements would lose the signal.

**Adding "Closed" as the 4th health banner state**
The health banner demo originally had three interactive states. Sloane added the fourth — the closed-cycle summary state — during the build. This documents the actual state machine of the production component, which is the whole point of live demos over static screenshots.

**"Where is this coming from exactly?" — the question that broke open the audit**
Asking about the overspend callout on a closed cycle page was a small question with large consequences. It revealed that the same visual component had been independently invented twice under two different class names, neither documented. That instinct to investigate rather than accept the surface answer led directly to the callout unification — and eventually to the full CSS consolidation the following session.

The through-line: Sloane consistently treated the design system as infrastructure, not just documentation. Every call was oriented toward making the system honest and durable.

## What to bring to Claude Chat
– Figma MCP timing: data attributes are in place (data-token, data-hex, id="comp-{name}"). What needs to happen on the Figma side before the MCP integration makes sense?
– Process log voice: the entry above was drafted from notes and screenshots. Read it with Sloane and adjust first-person voice before publishing — field notes in particular should sound like Sloane wrote them.
– Spent tab is next priority. When it ships, components it introduces should be documented in design-system.html in the same session, not retroactively.

---
2026-03-06 — PM session: CSS consolidation + chart color tokens (~1:05 PM – ~1:40 PM)

## Process log draft
Title: The design system didn't share its own CSS

The design system page was supposed to be the canonical reference for production CSS. It wasn't. It was maintaining its own private copy — roughly 110 lines of component CSS duplicated from candidate.html's inline style block. If you changed a border-radius in production and forgot to update the design system, nothing would catch the drift. This session fixed the root cause.

Changelog:
– Identified ~110 lines of duplicated component CSS in design-system.html that mirrored candidate.html's inline style block
– Moved 10 component CSS groups to styles.css: tab bar, tags, health banner, chart card + legend, committee rows, data table, spend bars, donut, modal, choropleth map
– Added 10 --chart-* CSS custom properties to styles.css :root (raised, spent, CoH lines + overlay colors)
– Added CHART_COLORS JS constant to candidate.html script block — single source of truth for all chart rgba values
– Updated all raw rgba() references in chart configs to reference CHART_COLORS (timeline datasets, tooltips, axes, overlay lines, contributor donut)
– Updated HTML legend swatches in both pages to use var(--chart-raised/spent/coh) CSS vars
– Added Chart color swatch group to design-system.html Color section (6 swatches with data-token/data-hex)
– Added 11 --chart-* vars to Tier 2 token table in design-system.html
– Added choropleth map component card (comp-map, candidate-only) to design system
– Updated CLAUDE.md with CSS consolidation principle and CHART_COLORS pattern

Field notes:
The real problem this session solved wasn't CSS duplication — it was epistemological. When the design system maintains its own copy of production CSS, it's not a reference for production code; it's a parallel universe that can drift silently. The whole point of a design system is that there's one version of the truth. Now there is. Everything in design-system.html either comes from styles.css (shared) or is explicitly page-specific. The drift vector is closed.

Stack tags: CSS architecture · Design tokens · Chart.js

## How Sloane steered the work
**The investigative prompt that unlocked the audit**
"Where is this coming from exactly — and could there be other examples like this?" wasn't a request to fix one thing. It was a request to understand scope first. That discipline — audit before action — is what surfaces real problems rather than patching symptoms.

**Approving the comprehensive plan over a narrow fix**
When Claude proposed a full 4-part consolidation (10 CSS groups, chart tokens, DS docs, CLAUDE.md), Sloane approved without asking to scope it down. The narrow version would have been "just fix the callout." The right version was: close the drift vector, establish the pattern, document it for future sessions.

**Managing the rate limit without losing the thread**
Hitting a rate limit mid-implementation could have split the refactor across sessions, leaving the codebase in a partially-consolidated state. Upgrading and continuing kept the work atomic.

The through-line across both sessions today: Sloane consistently treated the design system as infrastructure. Every decision was oriented toward making the system honest and durable, not just visually complete.

## What to bring to Claude Chat
– Preventing the ritual gap: both today's sessions ended without proper log entries (rate limits/compaction). The screenshots saved it. What's the right habit going forward? Explicit /compact before limits hit, or a session-start check that looks at whether claude-to-claude.md is current?
– Figma MCP integration: now that the token and component architecture is solid, when is the right moment to do the actual MCP wiring? What would it require on the Figma side?
– Spent tab is the current build priority. New components it introduces should be documented in design-system.html in the same session they ship.

---
2026-03-06 — Light theme preview session

## Process log draft
Title: Testing the light switch

We knew the dark theme wasn't the only answer, just the first one. This session was a controlled experiment — three light theme palettes applied, screenshotted across three pages and two breakpoints, then fully reverted. No permanent changes. Just evidence to evaluate.

Changelog:
– Defined three light theme candidates: Option A (warm off-white, DM Sans), Option B (pure white, Inter), Option C (parchment/sepia, DM Sans)
– Wrote a preview workflow: apply token swap to styles.css :root + body font, add new web font to Google Fonts import in all three HTML files, screenshot, revert
– Discovered Chrome headless --screenshot CLI captures the page before web fonts render (Google Fonts uses font-display: swap — fonts load asynchronously after the load event)
– Solved with puppeteer-core + networkidle2 wait + 1500ms post-idle pause for font rendering
– Captured 18 screenshots: 3 options × 3 pages (candidate, process-log, design-system) × 2 breakpoints (1440×900 desktop, 390×844 mobile) — all at 2× deviceScaleFactor
– Confirmed full revert after each option; git status clean on exit
– Outputs saved to theme-previews/ (untracked, not committed)

Field notes:
The experiment surfaced something I didn't expect to care about: the design system page is the most honest preview surface. The candidate page is dominated by Syne headings and IBM Plex Mono data labels — both explicitly set, so they don't change between options. The font swap is nearly invisible there. The design system page, which has more body text, shows the font difference clearly. Option B (Inter) read the most neutral — almost indistinguishable from a default sans — while Options A and C had enough warmth in the background to make DM Sans feel more deliberate. Whether that warmth works for a data tool is the real question, and one screenshot session can't answer it.

Stack tags: puppeteer-core · CSS custom properties · light theme

## How Sloane steered the work
**Scope expansion before execution**
You added design-system.html and both desktop + mobile breakpoints before approving the plan. That brought the total from 6 screenshots to 18. The instinct was right — the design system page turned out to be the most revealing surface for comparing the body font swap, since candidate.html is heavily dominated by explicitly-set Syne and IBM Plex Mono.

**"Redo with proper font loading"**
When the first Option A screenshots came back using Chrome headless CLI, you flagged the load-timing issue immediately. That call led to the puppeteer-core approach, which gives a proper networkidle2 guarantee rather than hoping the timing works out.

**Pulling back at the end**
After seeing all three options, you didn't pick one — you called a timeout. "I might want to take a bigger step back and test more sweeping updates." That's the right read: a :root token swap is a preview, not a decision. The real design work — typographic scale, spacing, surface layering — needs its own session before committing to a direction.

The through-line: you're treating this session as evidence-gathering, not decision-making. You want to see the options before you know what questions to ask about them.

## What to bring to Claude Chat
– What's the actual design direction question? The three options were a controlled test, but the bigger fork is: does this tool stay dark-first, go light as primary, or offer both? That's a product positioning question as much as a design one.
– What would "more sweeping updates" mean? Token swaps are surface-level. A real light theme pass probably means revisiting typographic scale, surface layering depth, border weight, and spacing — worth scoping before the next session.
– Is the font pairing working in dark mode? DM Sans and Inter were only evaluated against light backgrounds. Worth asking whether the same pairing would hold in the dark theme before deciding if a font change is part of the direction at all.
– When is the Spent tab happening? This was a design exploration detour. The Spent tab (category breakdown, spend timeline) is still the top functional priority per CLAUDE.md. Worth reconfirming priority before the next session.

---
2026-03-09

## Process log draft
Title: The broadsheet lands — and the charts finally match the room

The dark theme is gone. This session replaced it entirely with the broadsheet light theme: warm parchment surfaces, Barlow Condensed headings, DM Sans body, IBM Plex Mono for labels and data. The decision had already been made in Claude Chat — this session was execution. Four files touched, all coordinated through a shared styles.css that makes the token change propagate everywhere.

The second half of the session closed the chart gap. CHART_COLORS still had nine hardcoded dark values — tooltips floating in dark boxes on a warm page, axis labels in dark gray. All updated to warm light equivalents. The raised and spent donut charts were also mismatched: the raised tab had visible segment borders (intentional, and kept), the spent tab had none, a wider cutout, and weaker animation. Aligned both to the same spec. Fixed a clipping bug where donut segments were getting cut off on hover — turned out to be overflow:hidden on the cell container, which was redundant given that min-width:0 already handles grid overflow.

Changelog:
– Replaced styles.css :root entirely with warm light token set; added --sidebar-bg, --sidebar-border, --sidebar-text, --sidebar-muted, --sidebar-active-bg, --border-strong, --accent-dim tokens
– Replaced Syne with Barlow Condensed across all pages; DM Sans replaces IBM Plex Mono as body font; IBM Plex Mono role narrows to labels only
– Sidebar, mobile header, mobile nav updated to --sidebar-bg and sidebar-specific tokens
– Nav dots: removed all inline style="background:..." attributes; CSS now drives all dot colors (--border-strong default, --accent active)
– Tab active indicator changed from --text (white) to --accent (blue)
– Health banner, chart card, modal, donut center, data table: all font-family updates
– Modal overlay lightened: rgba(26,21,16,0.65)
– Global top banner set to dark treatment (#1c1710 background) as intentional contrast element
– Choropleth map: no-data fill and state stroke updated from dark to light values
– Design system: token table, color swatches, Tier 1 primitives, and typography specimens all updated
– CHART_COLORS: all 9 hardcoded dark values updated to light theme equivalents
– Raised and spent donuts aligned: same cutout (68%), borderWidth (2), borderColor, hoverOffset (4), animation (600ms easeOutQuart), tooltip config
– Removed overflow:hidden from .raised-cell — fixes donut hover clipping
– Fixed hardcoded dark rgba in .donut-row border-bottom → var(--border)

Field notes:
The cache split was the first sign the retheme was working: Barlow Condensed appeared immediately (font import is per-page HTML), but the colors were still dark (styles.css was cached). That's a useful debugging signal — if the type changes but the palette doesn't, it's almost always a cache issue, not a broken stylesheet. The more interesting moment was the donut alignment ask. The raised donut had a design detail — the 2px border between segments — that the spent donut was missing. That kind of inconsistency is invisible until you see both charts on the same screen. Spotting it fast, and knowing it was intentional rather than accidental, is the kind of eye that makes a portfolio piece feel finished.

Stack tags: CSS custom properties · Barlow Condensed · DM Sans · Chart.js · Light theme

## How Sloane steered the work
**Direction already decided before the session started**
The retheme handoff doc arrived fully specified — fonts, tokens, hex values, contrast ratios, component-by-component decisions. Sloane had done the design work in Claude Chat and translated it into something a coder could execute without judgment calls. That's a disciplined handoff: design decisions happen in the right tool, implementation happens in the right tool.

**"Enter plan mode before touching any files"**
The explicit instruction to plan before acting kept the session organized. For a change touching four files and three font families, an unplanned execution would have introduced inconsistencies. The plan surfaced the donut row dark border, the modal overlay, the choropleth map — details that weren't in the handoff spec but needed resolution.

**Liking the raised donut's segment borders as a stylistic choice**
When reviewing the two donut charts, Sloane identified the dark borders between segments as something worth keeping — not a bug, a choice. That's a designer's read, not a developer's. It changed the brief from "fix the mismatch" to "preserve what works in one, apply it to the other." The spent donut now matches intentionally, not just technically.

**Cache diagnosis recognized without panic**
When the type changed but colors didn't, Sloane asked clearly what was happening rather than assuming the implementation was broken. The answer (browser cache split) was quick to identify and quick to resolve.

The through-line: Sloane came in with decisions made and a clear eye for what was working vs. what wasn't. The session was execution and calibration, not design exploration.

## What to bring to Claude Chat
– Typography refinement pass is still open. The handoff explicitly deferred sizing, weight, and tracking beyond the decisions already made. Now that the theme is live, what does a type pass look like? Which elements feel undersized or lacking hierarchy?
– Spent tab is still the top functional priority per the roadmap. The theme work was a prerequisite (portfolio piece needs to look right), but the feature backlog is waiting: category breakdown, spend timeline.
– Chart color pass: the --chart-* data colors (raised blue, spent red, CoH green) were carried over from the dark theme unchanged. They may need adjustment for legibility on a warm light background — worth evaluating once the theme is live.
– Data freshness indicators: every data display should show coverage dates and filing recency. Not yet built; should ship alongside the spent tab, not after.

---
