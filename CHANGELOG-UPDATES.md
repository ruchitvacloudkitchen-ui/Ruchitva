# PocketSeeds — feature update

Everything is in `money.html` (single file, offline, data on the device).

## Tier 1

**1. Bilingual UI — both languages at once.** Not a toggle: every label shows
`తెలుగు | English` together, exactly as specced. Applies to the dashboard, tiles,
nav, category names, month names (జనవరి), buttons and form labels. Long help
sentences stay in one language on purpose — doubling prose makes it unreadable.
The header button cycles **both → తెలుగు → English**, and Settings has the same
three-way preference. Noto Sans Telugu with system fallback.

**2. Bank SMS parsing + review queue.** Recognises SBI, HDFC, ICICI, Axis,
IndusInd, Kotak, Union, PNB, Canara and BOB formats, including "A sum of Rs.X has
been debited", "Rs X debited for ATM/POS" and "INR X deducted". Auto-categorises
(ATM → cash withdrawal, BigBasket/DMart/Reliance Fresh → groceries, Swiggy/Zomato
→ food, petrol → fuel, rent → rent, electricity → utilities). Parsed rows land in
a **review queue** where each can be edited or removed before "Add all", and a
"last read" timestamp shows on the expenses screen.
*Limitation:* browsers cannot read SMS. The Android WebView build with `READ_SMS`
feeds this same parser — the UI and logic are already done.

**3. Family sharing.** Members, per-expense `paidBy` and `splitWith`, equal
splits, per-person paid-vs-share totals and a **settlement** view that nets
everyone off ("అమ్మ → నాన్నకి ఇవ్వాలి ₹6,000"). WhatsApp invite via `wa.me`.
*Limitation:* stored on the device; live sync between phones needs the server build.

**4. Voice entry with confirm step.** Mic button → speak → a confirm sheet shows
the parsed amount, category and note with **Confirm / Change**, matching the
specced flow. Telugu (te-IN) and English (en-IN), with Telugu number words
(వంద, వెయ్యి, రెండు వందలు) as well as digits.

## Tier 2

**5. Credit health.** Score with 300–900 range bar, colour band (poor/fair/good/
excellent), point change since last check, an 8-point trend chart and the
five factors with their weights.
*Limitation:* auto-fetch needs a bureau API, server and KYC. Manual entry now,
with a link to the free CIBIL check; the screen and history are ready for the API.

**6. Tax deduction insights.** Maps entries to 80D (health), 80E (education),
24 (rent) and 80C (savings/chits) across the Indian financial year, with a
selectable 5/20/30% slab. Verified: ₹25,500 deductible → ₹5,100 saved at 20%,
₹7,650 at 30%.

**7. 50/30/20 budget.** Set monthly income; needs/wants/savings caps computed and
tracked live against real categories, with over-limit warnings in red.

## Tier 3

**8. Emergency fund** — 6× average spending target, progress bar, monthly amount
needed to get there in a year.
**9. Search + filters** — text, date range, min/max amount, category and method,
with a live count and total.
**10. Monthly report** — summary, top categories, month-over-month comparison,
**Save as PDF** (browser print, no library needed) and **WhatsApp share**.

## Navigation

Bottom nav stays at five: హోమ్ | ఆదాయం | ఖర్చులు | అప్పులు | మరిన్ని.
"More" is a hub for Savings, Budget, Family, Credit, Tax, Reports, Search and
Settings — eight tabs would not fit a phone.
