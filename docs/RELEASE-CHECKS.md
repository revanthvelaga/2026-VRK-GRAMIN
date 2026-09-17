# Verified launch checks — 17 September 2026

- Hosted database binding DB and all seven application tables verified using Sites database tools.
- Owner signed in through the normal ChatGPT flow. Business settings and four technician records remained saved.
- Hosted database-health button returned Connected.
- Ten automated tests cover lifecycle approval, cash receipts, roles, revocation, stale updates, retry handling, backups, restore integrity and request bounds.
- Database inspection is a local developer surface at `http://127.0.0.1:4173/database.html`. Its generated snapshot is ignored by Git and excluded from the hosted Worker. The Owner dashboard contains no database table browser.
- Current hosted data was copied using Sites database reads. The operations table was unchanged before and after the copy, checking that no application writes occurred during the read. Snapshot: one settings row, four technicians, eight operations, zero bookings/events.
- Restored that snapshot into a new local SQLite file. Integrity passed. No existing or live database was overwritten. Private files are in the ignored backups directory.
- The application exports an atomic complete snapshot using a D1 batch. Browser download completion was not observable through the browser automation API; the live-data restore above used Sites database reads instead.
- Phone-width owner UI: no horizontal overflow. Form controls, backup controls and Telugu skill labels visually inspected. This does not substitute for real customer/technician mobile journey tests.
- A Sites dispatch credential without the required owner identity was rejected with HTTP 401. Browser owner authentication works. The command-line hosted checker therefore cannot be used as an unattended monitor with that credential.

## Not complete

- Site remains owner-only; real customer and technician sign-in journeys need authorized accounts and viewer access.
- Service terms and privacy text still contain SAMPLE wording. Business owner review remains required.
- Phone OTP, online payments and SMS/WhatsApp are not configured. First-release acceptance of ChatGPT sign-in, cash and in-app updates awaits the user's answer.
- Automatic off-site backups, retention, always-on alerts and a hosted restore/switchover need provider/operator configuration.
- Available hosting tools do not expose custom firewall configuration. App-level checks do not prove a provider firewall configuration.
- The local progress-report automation was found PAUSED and was left unchanged. No claim is made that background work or alerts run continuously.
