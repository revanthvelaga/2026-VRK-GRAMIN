CREATE TABLE preview_sessions (
 token text PRIMARY KEY NOT NULL,
 owner_id text NOT NULL,
 role text NOT NULL,
 subject_id text,
 expires_at integer NOT NULL,
 created_at text NOT NULL
);
--> statement-breakpoint
CREATE TABLE preview_events (
 id text PRIMARY KEY NOT NULL,
 owner_id text NOT NULL,
 action text NOT NULL,
 role text,
 subject_id text,
 created_at text NOT NULL
);
