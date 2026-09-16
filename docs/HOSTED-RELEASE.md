# Hosted release status

## Implemented and tested locally

- Platform sign-in; server-side owner, customer and technician permissions.
- No demo bearer-token authentication in the hosted Worker.
- Customer booking isolation, assigned-technician isolation and staff revocation.
- Real visit dates, business setup, fee snapshots and customer estimate approval.
- Cash selected by the customer and confirmed by the assigned technician.
- Same-origin writes, input limits, rate limits, security headers and prepared SQL.
- Atomic version checks and retry receipts protect against duplicate or stale writes.
- Generated SQLite migration tested locally. Hosted activation is a deployment step.

## Scope of the first release

The Site retains its owner-only audience for setup. ChatGPT accounts are required for sign-in. Bookings start closed. No real customer, technician, price, service coverage or policy is seeded. The owner must enter actual details and grant technician access. Public customer launch is not complete.

## Remaining before customer launch

- Decide customer sign-in approach; phone OTP is not implemented.
- Enter and review real service areas, fees, contact details, terms and privacy notice.
- Add actual technicians and confirm visit capacity. One active job per technician per window.
- Test hosted sign-in and persistence with authorized customer and technician accounts.
- Configure and test automated backups, restore, error monitoring and operational response.
- Confirm platform firewall/abuse protections; no custom firewall has been configured.
- Contract a production map-search provider before scale; current Photon endpoint is a public demo service.
- Configure payment provider and signed payment webhooks if online payments are required.
- Configure SMS/WhatsApp notifications if required; current notifications are in-app only.
- Review mobile/Telugu usability and accessibility before wider release.

Manual business-data export is available to the owner. It is not a substitute for automated backups or a tested restore procedure.
