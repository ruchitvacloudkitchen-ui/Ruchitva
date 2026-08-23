# PocketSeeds — Telugu-first money app: differentiation & growth plan

## 1. Why another tracker fails, and what wins

Walnut, Money Manager, MoneyView, ET Money, Jupiter — all of them are built for the
same person: salaried, English-reading, bank-and-card first, wants charts. They compete
on the same 20 features. Entering that race with feature #21 loses.

Every Telugu household runs money that those apps **cannot record at all**:

| How money actually moves here | Any competitor handles it? |
|---|---|
| వడ్డీ — hand loans at "₹2 / ₹3 per 100 per month" | No. They only understand bank EMI at annual % |
| చిట్టీలు — chit fund instalments, when you took the chit | No |
| మొయి / కట్నం — the wedding gift notebook every family keeps | No. Nobody has ever built this |
| అరువు — kirana credit settled at month end | No |
| Festival saving — Sankranti, Ugadi, Dasara, a wedding in the family | No |
| Daily cash earning — shop, auto, tailoring, milk, కూలి | Weakly; they assume salary |

That table is the whole strategy. Not "a Telugu version of a tracker" — **a tracker for
things that only exist in Telugu households**, which happens to also do income and expenses.

## 2. Built already (in `money.html`)

1. **Telugu is the default language**, English is the toggle — not the reverse. Every
   label, hint, coach sentence and empty state is written in Telugu, not machine-translated.
2. **వడ్డీ loan tracker** — enter the rate the way it is spoken (₹2 or ₹3 per 100 per
   month); it shows interest per month, interest accumulated, total payable, and converts
   to the annual % so people can see ₹3 vaddi = 36% a year. Borrowed and lent, both sides.
   "Interest paid" posts to expenditure.
3. **చిట్టీ tracker** — instalment × months, how many paid, taken or not, prize received,
   and the net position (are you up or down on this chit).
4. **మొయి పుస్తకం** — per family: what they gave you, what you gave them, and what you
   should return when their function comes. This is the feature people will open the app for.
5. **పండుగ fund** — target and date; it computes how much to set aside every month so
   Sankranti is not funded by a hand loan.
6. **అరువు ledger** — shop credit pending, settle in one tap.
7. **Voice entry (te-IN)** — speak "రెండు వందలు కూరగాయలు"; it fills amount, note and
   category. Typing Telugu on a phone keyboard is the #1 reason people quit expense apps.
8. **Quick-add tiles** — పాలు, కూరగాయలు, టీ, ప్రయాణం, పెట్రోల్, రీఛార్జ్ at one tap.
9. Everything from before: auto income 1st–7th, UPI pay + SMS import, reminders,
   savings coach, ad slot.

## 3. Build next (in priority order)

1. **Native Android wrapper with SMS read permission.** This is the single biggest jump:
   real automatic UPI capture instead of paste. The web app cannot do it; a thin WebView
   APK with `READ_SMS` can, and it is the feature people compare apps on.
2. **Share the moyi book to WhatsApp as an image.** Before every wedding, families ask
   "వాళ్ళు ఎంత ఇచ్చారు?". A shareable card makes the app spread family to family — this is
   the organic loop, not a referral code.
3. **Gold loan tracker** — pledge amount, interest, renewal date. Extremely common, badly served.
4. **Chit auction tracking** — record each month's discount so the true return is visible.
5. **Multi-device backup** (₹99/year) — the only thing worth charging for.
6. **Farm mode** — crop input costs vs. sale, per acre. Opens the whole rural market.

## 4. Getting Telugu customers

**Content is the channel, not ads.** Ads cost money and teach nothing; a 40-second Telugu
Reel showing "₹3 వడ్డీ అంటే సంవత్సరానికి 36%" gets shared inside families.

- **Reels / Shorts in Telugu, 3 per week.** Formats that work: "వడ్డీ లెక్క ఇలా
  చూసుకోండి", "చిట్టీలో నష్టపోతున్నారా?", "మొయి ఎంత ఇవ్వాలి?", "సంక్రాంతికి ఇప్పటినుంచి
  ఎంత దాచాలి?". Every video ends on the app screen showing that exact calculation.
  Ruchitva Kitchen's existing YouTube and Instagram accounts are a warm start.
- **Play Store ASO in Telugu.** Title and description must carry the words people search:
  వడ్డీ, చిట్టీ, మొయి, ఖర్చు, పొదుపు, అప్పు — plus Roman-Telugu ("vaddi calculator",
  "chit fund tracker telugu"). Nobody is ranking on these.
- **Launch timing.** Ship before **Dasara/Deepavali** (function season → moyi book) and
  push hardest before **Sankranti** (festival fund + village weddings).
- **Districts before cities.** Warangal, Karimnagar, Guntur, Vijayawada, Nizamabad —
  where chits and vaddi are universal and app competition is zero. Hyderabad-only marketing
  puts you against every fintech's ad budget.
- **Kirana shops as distribution.** A QR sticker at the counter: "మీ అరువు ఇక్కడ
  రాసుకోండి". The shop benefits from customers who track what they owe.
- **Telugu WhatsApp groups and community pages** — the moyi share card does the work.

## 5. Revenue

1. **AdSense banner** (already in, same size as the balance card — configure IDs in Settings).
2. **Local advertisers** beat AdSense CPM here: jewellers, chit companies, kirana chains,
   and Ruchitva Kitchen's own promos. Sell the slot directly.
3. **₹99/year backup + multi-device.** Keep every money feature free — charge for safety, not function.
4. Never sell or upload transaction data. It stays on the device; say so loudly, because
   trust is the reason people will type their vaddi into your app and not a bank's.

## 6. What to measure

Not downloads. **Entries per user per week** (below 3 = the app is not part of their day),
**D7 and D30 retention**, and **% of users who added a loan, chit or moyi entry** — that
last one is the number that says the differentiation is real and not decoration.
