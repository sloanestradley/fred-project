# Claude Code Brief — ledger.fec
*Hand this to Claude Code at the start of each session.*

---

## What this is

A web-based campaign finance visualization tool built on the FEC public API. The goal: give political strategists, journalists, and researchers a faster, clearer window into where money is flowing in a race than the FEC website provides.

This is also a portfolio piece for a staff-level product designer (Sloane). It needs to look and feel like a designer built it — not a developer prototype.

**Live URL:** sloanestradley.netlify.app  
**Repo:** GitHub (ask Sloane for the repo URL if you don't have it)  
**Deployment:** Netlify, auto-deploys on push to main  
**Analytics:** Amplitude (already integrated)

---

## Tech stack

- Vanilla HTML/CSS/JS — no framework, intentional for this stage
- Chart.js 4.4.0 + chartjs-adapter-date-fns 3.0.0 (time scale support)
- Google Fonts: Syne (headings) + IBM Plex Mono (body/data)
- FEC public API: `https://api.open.fec.gov/v1`
- Netlify Functions for any server-side API proxying needed
- No build step — files are served directly

---

## Design system

Dark theme. Key CSS variables (defined in `:root` on every page):

```
--bg: #0d0f12        (page background)
--surface: #141720   (cards, sidebar)
--surface2: #1c2030  (hover states)
--border: #252a38
--text: #e8eaf0
--muted: #5a6070
--subtle: #8890a0
--dem: #4a90d9       (Democrat)
--rep: #d94a4a       (Republican)
--green: #3dbf7a     (healthy)
--amber: #e8a020     (watch / warning)
--red: #d94a4a       (stressed)
```

Typography: Syne 800 for display/headings, IBM Plex Mono 300–500 for everything else.

---

## Current files

```
candidate.html    — Candidate profile page (primary active file)
process-log.html  — Living case study / dev diary
project-brief.md  — Full product vision and open questions
```

A homepage (`index.html`) doesn't exist yet — candidate.html is the entry point for now.

---

## Candidate page: current state

The candidate page (`candidate.html`) is the main work in progress. It accepts any candidate via `?id=` URL param (e.g. `candidate.html?id=H2WA03217`). MGP is the default fallback for development.

- **Test candidate:** Marie Gluesenkamp Perez — `H2WA03217` (House, WA-03)
- **Also verified with:** Kirsten Gillibrand — `S0NY00410` (Senate, NY)
- **Local dev:** `python3 -m http.server 8080` from project root, then `localhost:8080/candidate.html?id=H2WA03217`

### What's working
- Profile header with initials avatar, party tag, office/district tag, incumbency tag
- Cycle switcher (buttons to toggle between cycles, re-fetches data)
- URL anchor encodes cycle + tab: `candidate.html#2024#summary`
- Tab navigation: Summary, Raised, Spent, Committees
- Stats row: Total Raised, Total Spent, Cash on Hand, Raised-to-Spent Ratio
- Cycle-aware banner: health signal (green/amber/red) for active cycles; "Cycle Complete" summary for closed cycles
- Committees tab: lists associated committees with type labels
- Responsive layout: desktop sidebar nav, mobile scroll-aware header + hamburger drawer
- Smooth fade-in animations on load

### What's broken / in progress
1. **Chart data showing $0** — ✅ Fixed. Using `total_receipts_ytd` / `total_disbursements_ytd` with year-boundary accumulation.

2. **Election date markers** — ✅ Mostly working. Current cycle shows primary only (general not yet scheduled in FEC system — expected behavior). Past cycles show both. Field name confirmed: `election_date`.

3. **Filing deadline markers** — ✅ Fixed and verified live. `due_date_gte`/`due_date_lte` are silently ignored by the API — returns all 4,896 records if used. Fix: 4 parallel calls per cycle year, one each for Q1, Q2, Q3, YE using `report_year` + `report_type`. Each returns exactly 1 record.

### Chart architecture
- Type: line chart with `type: 'time'` x-axis (requires date-fns adapter)
- X-axis spans full election cycle, office-aware: House = 2yr, Senate = 6yr, President = 4yr
- Points only at actual filing dates (quarterly cadence = 4–8 points per cycle)
- Raised and Spent: `stepped: 'before'` (cumulative, stair-step between filing dates)
- Cash on Hand: linear connect (snapshot value, not cumulative)
- Overlay plugin draws vertical lines: grey dashed = filing deadlines, amber dotted = election dates, subtle = "today" (active cycles only)

### Key FEC API endpoints in use
```
GET /candidate/{id}/                          — candidate metadata
GET /candidate/{id}/totals/?cycle={year}      — cycle-level financial totals
GET /candidate/{id}/committees/?cycle={year}  — associated committees
GET /committee/{id}/reports/?cycle={year}     — per-period filing reports (chart data)
GET /reporting-dates/?report_year={year}&report_type={type} — filing deadlines (one call per type)
GET /election-dates/?election_state=&office_sought=&election_year= — actual election dates
```

### Key FEC API field names (verified from live response)
Reports endpoint (`/committee/{id}/reports/`) returns per-filing objects with:
- `total_receipts_period` — raised this filing period only
- `total_disbursements_period` — spent this filing period only
- `total_receipts_ytd` — cumulative raised, resets Jan 1 each year
- `total_disbursements_ytd` — cumulative spent, resets Jan 1 each year
- `cash_on_hand_end_period` — COH snapshot at end of period
- `coverage_start_date` / `coverage_end_date` — in format `"2025-03-31T00:00:00"` (strip `T` and after)
- `report_form` — e.g. `"Form 3"` (use this to filter deadlines)

Reporting-dates endpoint (`/reporting-dates/`) returns:
- `report_type` — short code e.g. `"Q1"`, `"YE"`, `"12G"`, `"M6"`
- `report_type_full` — human label e.g. `"APRIL QUARTERLY"`, `"YEAR-END"`
- `due_date` — e.g. `"2027-01-31"` (no timestamp, safe to use directly)
- No `report_form` or `form_type` field exists on this endpoint
- **Critical:** `due_date_gte` / `due_date_lte` are silently ignored — API returns all 4,896 records across all time if used
- **Critical:** Correct filter is `report_year=<year>` (one value per call)
- **Critical:** Default sort is by creation date descending — always pass `sort=due_date`
- **Critical:** `per_page` max is 100; 2026 has 182 records so unfiltered fetch cuts off Q3 and YE
- **Critical:** `MY` (mid-year) appears in results but is a PAC type, not a Form 3 quarterly deadline — exclude it
- **Correct approach:** 4 parallel calls per cycle year, one each for Q1, Q2, Q3, YE — each returns exactly 1 record, sidestepping pagination and false positives entirely

Candidate totals endpoint returns:
- `receipts` — cycle total raised
- `disbursements` — cycle total spent
- `last_cash_on_hand_end_period` — most recent COH
- `coverage_end_date` — most recent coverage date

---

## What to build next

See `project-brief.md` for the full phased roadmap. Short version:

**Phase 1 (current):** Finish the candidate page before building anything new.
- Raised tab (contributor breakdown, geography, top donors)
- Spent tab (category breakdown, spend timeline)
- Associated committees — header-level modal, not cycle-scoped
- Data freshness indicators on all data displays
- Empty and error states
- Design system documentation page
- Mobile chart pass

**Phase 2:** Search and navigation.
**Phase 3:** Committee page, race page (which is also the compare feature — two modes, one UI).
**Phase 4:** Early signal data (48/24hr reports), AI insights.

## Remaining architectural debt

- **YTD per_page limit:** Reports currently fetched with `per_page=20` per sub-cycle — verify this is sufficient for Senate candidates with dense filing histories. Some cycles may have more than 20 reports.
- **Presidential cycle untested:** 4-year cycle is architecturally supported via `getCycleSpanYears()` / `getSubCycles()` but has not been tested with a real presidential candidate.
- **Multi-cycle stat labels:** Stats row (Raised, Spent, COH) doesn't yet indicate when figures represent a multi-sub-cycle sum (e.g. "6-year total" vs. "cycle total"). Needs a label or caveat for Senate candidates.

## Senate multi-sub-cycle architecture

Senate 6-year cycles introduce a multi-sub-cycle pattern worth understanding before modifying:

- `getSubCycles(cycle)` returns `[cycle-4, cycle-2, cycle]` — three FEC 2-year periods
- Reports are fetched from all three in parallel and combined
- **Raised / Spent totals:** summed across all sub-cycles
- **COH and debt:** use most recent sub-cycle only
- **YTD stitching:** carries cumulative base forward across each calendar year reset within each sub-cycle, then chains sub-cycles together

---

## Product decisions already made (don't re-litigate)

- **Stepped line chart** (not smooth) for Raised and Spent — honest to the quarterly reporting rhythm
- **Full cycle x-axis** — even for active cycles where future quarters are empty; shows where we are in the cycle
- **"Raised-to-spent ratio"** — not "burn rate" (domain expert feedback from Tim, a congressional campaign manager)
- **Health indicator hidden for closed cycles** — replaced with "Cycle Complete" contextual summary
- **Points only at filing dates** — no interpolation between quarters
- **YTD field strategy** — use `_ytd` fields from reports and carry year-1 total as base for year-2 (avoids per-period accumulation errors)
- **Election dates from `/election-dates/`** — not `/elections/` (which returns candidate financial summaries, not actual dates)
- **Mobile nav search icon** — at smaller breakpoints, search does not collapse into the hamburger drawer. A search icon remains exposed left of the menu icon at all times.
- **Global nav links** — Home, Candidates, Committees, Races present from launch as stubs; activated as pages are built per phase plan.
- **Race page = compare feature** — two modes, one shared UI. Curated mode: a specific contest auto-populates all declared candidates. Ad hoc mode: user selects any candidates across races (designed for consultants tracking multiple frontline races). No editorial curation required.

---

## Domain context

- FEC "cycle" ends Dec 31 of the election year, not on election day
- House candidates file Form 3, quarterly + pre/post election reports
- Senate = 6-year terms; presidential = 4-year. X-axis logic must account for this
- `_ytd` fields reset each January 1, so a two-year cycle requires stitching year 1 final YTD + year 2 running YTD
- Memoed transactions must be excluded from any manual totals (we avoid this by using FEC-computed `_ytd` fields)
- The FEC API silently ignores unrecognized query parameters — always verify a filter is working by checking total result counts, not just response shape
- The FEC `/reporting-dates/` endpoint ignores date range params; use `report_year` + `report_type` for targeted queries
- Tim (domain expert, congressional campaign manager) is available for validation questions

---

## What "done" looks like for the candidate page

- [x] Chart renders real data (not $0)
- [x] Stepped lines visible between quarterly filing points
- [x] Full cycle x-axis with future quarters shown as empty space — office-aware (H=2yr, S=6yr, P=4yr)
- [x] Filing deadline markers: Form 3 quarterly only, correctly positioned, verified live
- [x] Election date markers: primary + general, amber dotted lines (current cycle: primary only — general not yet in FEC system)
- [x] Health banner: active vs. closed cycle logic working
- [x] All hardcoded candidate values derived from API response (state, district, office, cycle list from `election_years`)
- [x] Page works for any candidate ID passed as a URL param (`?id=H2WA03217`) — verified with MGP (House) and Gillibrand (Senate)
- [x] Responsive: mobile header, hamburger nav, chart doesn't overflow viewport
- [ ] Search / homepage
- [ ] Raised tab: contributor breakdown, geography heatmap, top donors
- [ ] Spent tab: category breakdown, spend timeline
- [ ] Committees tab: full ecosystem view (currently lists only, no detail)

---

## Design reference

The process log (`process-log.html`) has the full project history including domain research notes, Tim's feedback, and all key decisions with rationale. Read it for context on *why* things are the way they are.

The full product brief (`project-brief.md`) has MVP scope, audience definition, backlog, open questions, and definitions.

---

## How to start a session

```bash
cd ~/Vibecoding/fred-project
claude
```

First thing: read this file. Then read `candidate.html` for current implementation state.

Before diving in, note what's been updated since the last session:
- `CLAUDE.md` — updated with verified API behavior, remaining debt items, Senate architecture notes
- `project-brief.md` — significantly expanded: now includes a phased roadmap, global nav spec (including mobile search icon behavior), race page / compare architecture, and new open questions on associated committees and unserious candidates
- `process-log.html` — updated with Mar 3 session entry and a new Mar 4 entry stub

Ask Sloane what's been tested since the last session and what the current priority is. Don't assume the latest file in the repo matches what's been deployed — ask.

**Suggested opening prompt for Sloane to paste at session start:**
```
Read CLAUDE.md and project-brief.md, then summarize: what's the current state of the candidate page, what's the top Phase 1 priority, and what do you need from me to get started?
```
