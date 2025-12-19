CREATE TABLE "pending_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"network" varchar(10) NOT NULL,
	"bounty_id" uuid,
	"submission_id" uuid,
	"funder_id" text NOT NULL,
	"recipient_github_user_id" bigint NOT NULL,
	"recipient_github_username" varchar(39) NOT NULL,
	"amount" numeric(78, 0) NOT NULL,
	"token_address" varchar(42) NOT NULL,
	"dedicated_access_key_id" uuid NOT NULL,
	"claim_token" varchar(64) NOT NULL,
	"claim_expires_at" timestamp NOT NULL,
	"claimed_at" timestamp,
	"claimed_by_user_id" text,
	"payout_id" uuid,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pending_payments_claim_token_unique" UNIQUE("claim_token")
);
--> statement-breakpoint
DROP TABLE "custodial_wallets" CASCADE;--> statement-breakpoint
ALTER TABLE "access_keys" ADD COLUMN "is_dedicated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pending_payments" ADD CONSTRAINT "pending_payments_bounty_id_bounties_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."bounties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_payments" ADD CONSTRAINT "pending_payments_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_payments" ADD CONSTRAINT "pending_payments_funder_id_user_id_fk" FOREIGN KEY ("funder_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_payments" ADD CONSTRAINT "pending_payments_dedicated_access_key_id_access_keys_id_fk" FOREIGN KEY ("dedicated_access_key_id") REFERENCES "public"."access_keys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_payments" ADD CONSTRAINT "pending_payments_claimed_by_user_id_user_id_fk" FOREIGN KEY ("claimed_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_payments" ADD CONSTRAINT "pending_payments_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_payments" ADD CONSTRAINT "pending_payments_token_address_network_tokens_address_network_fk" FOREIGN KEY ("token_address","network") REFERENCES "public"."tokens"("address","network") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pending_payments_github_user" ON "pending_payments" USING btree ("network","recipient_github_user_id","status");--> statement-breakpoint
CREATE INDEX "idx_pending_payments_funder" ON "pending_payments" USING btree ("funder_id","status","network");--> statement-breakpoint
CREATE INDEX "idx_pending_payments_claim_token" ON "pending_payments" USING btree ("claim_token");