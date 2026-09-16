# Gramin

Reviewable rural home-services app prototype with customer, technician and owner views.

## Run locally

Use Node.js 24 or a compatible current Node runtime. No package installation is needed.

```text
node server.mjs
```

Open http://127.0.0.1:4173. The server listens on loopback only. English is the default; Telugu is available for the main customer journey. Use sample data only.

## Review the complete journey

1. Customer: select a service and submit a sample request.
2. Owner: select the request and assign the matching technician.
3. Technician: select that technician, start journey, arrive and submit an estimate.
4. Customer: open the request and approve or decline.
5. Technician: start the approved repair and complete it with notes.
6. Customer: simulate a failed payment, retry successfully, or select cash.
7. Technician: confirm cash collection when applicable.

The role selector is explicitly a demo identity mechanism, not production authentication. Refresh reads the shared server state. Bookings persist in ignored data/demo.json; drafts stay in local browser storage. No live payment, GPS, notification or external deployment is connected.

## Checks

```text
node --check dist/app.js
node --check server.mjs
node --test tests/workflow.test.mjs
```

See [Architecture](docs/ARCHITECTURE.md). Browser test helpers use this machine's bundled Playwright and Edge and require adaptation on another machine.

## Important assumptions

Brand, technician names, prices, radius and areas are editable or code-defined samples. Narsipatnam is listed by India Post under 531116; the spoken 531113 refers to Makavarapalem. Confirm the intended base before setting production coverage.
