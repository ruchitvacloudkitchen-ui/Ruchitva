# Ruchitva Kitchen — Day Planner & Reminders

A single-file app: `kitchen.html`. Open it in any browser, or host it and
"Add to Home Screen" to use it like a phone app. All data stays on the device in
localStorage — no server, no login, works offline.

Built for one owner running one cloud kitchen: who reports when, who did not turn
up, how much money is in hand, and what has to be bought for tomorrow.

## The five tabs

| Tab | What happens |
|---|---|
| **Today** | The day at a glance: who is due next, an alert list that needs action, every person's status (to confirm / confirmed / arrived / not coming), the time slots, and today's reminders. |
| **Team** | Each person's role, duty time, WhatsApp number and **alternate person**. Also a 7-day attendance strip so absence patterns are visible. |
| **Money** | Balance in hand, money in / money out, and a needs planner split into **tomorrow, this week, this month**. |
| **Material** | Stock in hand against the daily requirement. What is short becomes tomorrow's buying list, priced, ready to send. |
| **Settings** | Kitchen name, country code, your own number, warning lead time, the WhatsApp message templates, and backup export / import. |

## Time slots

Three slots are set up to start with — 7 AM–9 AM, 11 AM–1 PM and 3 PM–10 PM.
Each has a name, a time range and a note on what happens in it. The slot running
right now is highlighted, finished slots fade. Team members appear as chips on the
slot their duty time falls into, and **Alert slot team** opens a WhatsApp message
for each of them.

Add, edit or delete slots freely — nothing else in the app depends on there being
exactly three.

## Duty times and the 30-minute warning

Every person has a duty time. The starting three are Manager 6:30 AM, Batter
Preparation 9:30 AM and Cleaner 4:30 PM — change any of them in the Team tab.

- **30 minutes before** a duty time (the lead time is adjustable in Settings), if
  the person is still unconfirmed, an amber alert appears at the top of Today with
  one-tap buttons: message them, mark *Coming*, mark *Not coming*.
- The moment someone is marked **not coming**, a red alert says so and offers
  **Call in `<alternate>`** — the message to the alternate person is pre-written
  with who is missing and what time to come. *Someone else* lets you pick anybody
  from the team instead.
- Once an alternate agrees, the person's row reads "*X covering*" and the red
  alert clears.

If the browser has notification permission (the 🔔 button in the header), the same
alerts also arrive as phone notifications. **There is no server**, so notifications
fire while the app is open. The alert list on Today is always correct whenever you
open the app, whether or not notifications are switched on.

## WhatsApp messages

Numbers are stored plain (10 digits is enough — the country code from Settings is
added automatically) and messages open in WhatsApp through a `wa.me` link, already
typed out. Browsers open one chat per tap, so **Send today's plan to all** shows
the team as a queue: tap Send next to each person, each one turns to *Sent*.

Five templates, all editable in Settings, with `{name} {role} {time} {date} {slot}
{note} {who} {items} {total} {kitchen}` placeholders:

1. **Daily duty message** — good morning, your duty time is X, reach 10 minutes early.
2. **Are you coming?** — reply YES or NO now.
3. **Call the alternate person** — X is not coming, can you come at this time.
4. **Time slot alert** — the slot, its hours and what has to be ready.
5. **Buying list** — tomorrow's short items and the total.

## Money

Balance in hand = opening balance + money in − money out. Expenses and income are
entered by hand, with a category and a note.

The needs planner is the part that answers "how much do I need?": add what has to
be paid **tomorrow, this week or this month** and each bucket totals itself. The
tomorrow figure automatically includes the material shortfall from the Material
tab, and says plainly whether the balance covers it or how much is short. Marking
a need paid moves the amount into expenses.

## Material balance

Each item has a unit, a rate, how much is **in hand** and how much is **needed per
day**. Short = needed − in hand. The − and + buttons update stock in one tap at
closing time.

Everything short becomes the buying list, priced per item and totalled.
**Send buying list** WhatsApps it to the manager (the first team member with
"manager" in their role, else the first person with a number, else your own
number). **Mark all bought** tops every short item up to its daily requirement and
records the total as a Material expense.

## Backup

Everything is on that one phone. Export writes a JSON file; import reads it back on
a new phone. Erase all clears the device.
