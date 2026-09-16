# Gramin launch readiness

## Current state

The local prototype runs at http://127.0.0.1:4173. Customer, technician and owner journeys are implemented against a shared local API. No public deployment has been created.

Village autocomplete is now connected to Photon search using OpenStreetMap data. Typing G Kod was verified to return G.Koduru in Makavarapalem. Selecting a result saves its name and coordinates; a PIN is filled only when present in map data. Missing PINs require customer entry. Search handles provider outages, keyboard selection and stale results. This does not confirm business coverage, calculate travel distance or enable live technician tracking.

## Public preview requirements

- Clearly identify the app as a demonstration with no actual bookings or payments.
- Isolate each visitor's demo records; do not publish the local JSON data or share customer details between unrelated visitors.
- Keep the demo role switch confined to that visitor's sandbox.
- Adapt the Node-only filesystem API to the selected hosting runtime.
- Confirm the hosted booking journey, location search, error handling and mobile layout.

## Real customer launch requirements

- Replace public demo tokens and the role selector with authenticated sessions and server-enforced owner, technician and customer roles.
- Use transactional durable storage with migrations, backups, tenant scoping and audit records.
- Confirm the hub and PIN, served villages, technician accounts, operating hours and fees.
- Replace relative demo visit windows with dated scheduling and capacity checks.
- Choose a real payment strategy: cash first or a configured payment provider with signed server-side verification and reconciliation.
- Configure customer notifications and a reachable support contact.
- Approve cancellation, privacy, repair warranty and refund terms appropriate to the business.
- Use a production map-search service or a self-hosted Photon instance; the public Photon demo has no availability guarantee.
- Test access isolation, retries, provider outages, scheduling conflicts, backup restoration and real-device behaviour before accepting bookings.

## Decision pending

Public feedback preview versus live customer service. No deployment will be represented as a live business launch while demo authentication and payment behaviour remain in place.

## Validation completed

- Domain workflow tests: ownership, approval gates, assignment skills, fee snapshots, cancellation, declined estimates, cash confirmation and payment retries.
- Browser workflow: request, dispatch, estimate, customer approval, completion and simulated failed-payment retry.
- Live village search: G Kod to G.Koduru, map selection saved, outage fallback, keyboard selection, PIN autofill and stale-PIN clearing, mobile layout and no browser page errors.

Provider documentation: https://github.com/komoot/photon and https://github.com/komoot/photon/blob/master/docs/api-v1.md
