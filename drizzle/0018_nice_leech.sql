CREATE TABLE "notification_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"email_bounty_funded" boolean DEFAULT true NOT NULL,
	"email_submission_received" boolean DEFAULT true NOT NULL,
	"email_bounty_completed" boolean DEFAULT true NOT NULL,
	"email_payout_received" boolean DEFAULT true NOT NULL,
	"email_weekly_digest" boolean DEFAULT false NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"quiet_hours_start" text,
	"quiet_hours_end" text,
	"quiet_hours_timezone" text DEFAULT 'UTC',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;