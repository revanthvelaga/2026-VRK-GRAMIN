# Backup and recovery operations

The Owner can download a complete backup from the hosted app's Backup and service health section. The download includes settings, technicians, bookings, audit events, accounts, applications, support tickets, ratings, payments, and idempotency receipts.

Verify a downloaded file before storing it off-site:

```text
node scripts/verify-backup.mjs path/to/gramin-backup.json
```

The verifier checks the format, table shape, types, and checksum without connecting to production. Recovery uses a new SQLite path and never overwrites an existing file:

```text
node scripts/restore-backup.mjs path/to/gramin-backup.json path/to/restored.sqlite
```

For continuous protection, schedule `scripts/scheduled-backup.ps1` with Windows Task Scheduler (for example, daily). Set `GRAMIN_SIWC_BEARER_TOKEN` to the owner Sites token and choose a synced or encrypted off-site destination for `backups/scheduled`. The script downloads, verifies and timestamps each backup; the destination credential and storage account are the only external handoff.
