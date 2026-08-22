# PocketSeeds — Money Manager

A single-file money management app: `money.html`. Open it in any browser, or host it
and "Add to Home Screen" to use it like a phone app. All data stays on the device in
localStorage — no server, no login, works offline.

## What it does

| Section | What happens |
|---|---|
| **Current Balance** | Income − expenditure − money set aside. Carries forward each month (switchable in Settings). |
| **Ad banner** | Sits under the balance card at exactly the same size. Shows a house ad until you add your Google AdSense client + slot ID in Settings, then it serves real ads. |
| **Income** | Add entries manually, or set up an **auto monthly income** that credits itself on any day from the **1st to the 7th**. Open the app on or after that day and the money is already in — it even backfills months you missed. |
| **Expenditure** | Every expense is deducted from income immediately. Three ways in: manual entry, **Pay by UPI**, and **Import UPI messages**. |
| **Reminders** | Loans, EMIs and bills with due dates. Monthly repeat, days-left / overdue badges, a home-screen banner, and browser notifications a few days before (configurable). "Mark paid" can post the amount straight to expenditure. |
| **Savings** | Tells you how much to save this month (your chosen % of income), how much is still to set aside, a realistic figure if the target is out of reach at current spending, a daily spending limit, and an emergency-fund goal of 6 months' average spending. |

## About UPI capture

No web app can silently read PhonePe / Google Pay / bank transactions — browsers give
no such access, and any app claiming otherwise needs SMS-reading permissions only a
native Android app can request. The two supported routes:

1. **Pay by UPI** — enter amount, UPI ID and note, pick the app. The expense is recorded
   first, then a button hands over to PhonePe / GPay / Paytm with the amount pre-filled.
   Cancel removes the entry if the payment does not go through.
2. **Import UPI messages** — paste any number of bank/UPI SMS messages. Amount, date,
   payee, app and reference number are read automatically; debits become expenditure,
   credits become income, and categories are guessed from the payee. Duplicates are skipped.

## Settings

Savings rate, reminder lead time, balance style (carry forward or fresh each month),
AdSense IDs, plus JSON export/import for backups and moving to a new phone.
