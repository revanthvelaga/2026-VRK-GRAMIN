import {sqliteTable,text,integer,index,check} from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';
export const settings=sqliteTable('settings',{id:text('id').primaryKey(),data:text('data').notNull(),version:integer('version').notNull().default(1)});
export const technicians=sqliteTable('technicians',{id:text('id').primaryKey(),email:text('email').notNull().unique(),name:text('name').notNull(),skills:text('skills').notNull(),active:integer('active').notNull().default(1),version:integer('version').notNull().default(1)});
export const bookings=sqliteTable('bookings',{id:text('id').primaryKey(),customerId:text('customer_id').notNull(),technicianId:text('technician_id'),status:text('status').notNull(),data:text('data').notNull(),version:integer('version').notNull().default(1),createdAt:text('created_at').notNull()},t=>[index('idx_bookings_customer').on(t.customerId,t.createdAt),index('idx_bookings_technician').on(t.technicianId,t.createdAt)]);
export const operations=sqliteTable('operations',{id:text('id').primaryKey(),fingerprint:text('fingerprint').notNull(),result:text('result').notNull(),createdAt:text('created_at').notNull()});
export const events=sqliteTable('booking_events',{id:text('id').primaryKey(),bookingId:text('booking_id').notNull(),actorId:text('actor_id').notNull(),action:text('action').notNull(),createdAt:text('created_at').notNull()},t=>[index('idx_events_booking').on(t.bookingId,t.createdAt)]);
export const guards=sqliteTable('write_guards',{id:text('id').primaryKey(),valid:integer('valid').notNull()},t=>[check('valid_write',sql`${t.valid} = 1`)]);
export const limits=sqliteTable('rate_limits',{id:text('id').primaryKey(),count:integer('count').notNull(),expires:integer('expires').notNull()},t=>[index('idx_limits_expiry').on(t.expires)]);
