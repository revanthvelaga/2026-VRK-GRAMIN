# Gramin backup and recovery

## Download

Sign in as owner and choose **Download complete backup**. This creates one consistent database snapshot containing business settings, technicians, bookings, booking audit events and retry receipts. A checksum detects accidental changes. The backup contains personal information: keep it private and outside the source repository. It does not contain hosting secrets.

The readable business export remains available, but only the complete backup can be used with the restore tool.

## Restore rehearsal

Run `node scripts/restore-backup.mjs BACKUP.json NEW-DATABASE.sqlite` from this project. The destination must not exist. The tool validates the format and checksum, applies the checked-in migrations, inserts rows in a transaction and checks SQLite integrity. It refuses to overwrite an existing file. An invalid database import is rolled back; use a new filename after correcting the source backup.

This creates a separate local recovery database. It does not overwrite the hosted database, publish the restored database, or restore hosting secrets. Retain the exact source revision and schema alongside a backup. The tool currently supports backup format version 1 and the current schema.

## Production recovery

Close booking intake, preserve the affected database, verify a backup in isolation, and coordinate restoration into a separate hosted environment through the hosting provider before switching traffic. Re-test owner, customer and technician permissions, pending approvals and payment records before reopening. A complete hosted recovery/switchover rehearsal has not yet been performed.

## Monitoring

The owner can use **Check database connection** to verify the application can read its database. Recent server failures can be inspected through Sites worker logs. Do not log customer addresses, phone numbers, credentials or raw backup contents.

## Outstanding infrastructure

Automatic off-site backups, retention, always-on outage alerts and hosted recovery require an operator/provider configuration. A local Codex automation depends on the computer and account being available and is not an always-on hosting service. No such backup service is claimed as configured.
