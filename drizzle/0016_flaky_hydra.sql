ALTER TABLE "access_keys" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "access_keys" ALTER COLUMN "backend_wallet_address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bounty_funders" ALTER COLUMN "funder_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payouts" ALTER COLUMN "payer_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "pending_payments" ALTER COLUMN "funder_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "access_keys" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "access_keys" ADD COLUMN "authorized_user_passkey_id" text;--> statement-breakpoint
ALTER TABLE "bounties" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "bounty_funders" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN "payer_organization_id" text;--> statement-breakpoint
ALTER TABLE "pending_payments" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "access_keys" ADD CONSTRAINT "access_keys_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_keys" ADD CONSTRAINT "access_keys_authorized_user_passkey_id_passkey_id_fk" FOREIGN KEY ("authorized_user_passkey_id") REFERENCES "public"."passkey"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounties" ADD CONSTRAINT "bounties_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_funders" ADD CONSTRAINT "bounty_funders_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_payer_organization_id_organization_id_fk" FOREIGN KEY ("payer_organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_payments" ADD CONSTRAINT "pending_payments_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_access_keys_org" ON "access_keys" USING btree ("organization_id","network");--> statement-breakpoint
CREATE INDEX "idx_access_keys_authorized_user" ON "access_keys" USING btree ("authorized_user_passkey_id");--> statement-breakpoint
CREATE INDEX "idx_bounties_org" ON "bounties" USING btree ("organization_id","network");--> statement-breakpoint
CREATE INDEX "idx_bounty_funders_org" ON "bounty_funders" USING btree ("organization_id","network");--> statement-breakpoint
CREATE INDEX "idx_payouts_payer_org" ON "payouts" USING btree ("payer_organization_id","network");--> statement-breakpoint
CREATE INDEX "idx_pending_payments_org" ON "pending_payments" USING btree ("organization_id","network","status");--> statement-breakpoint
ALTER TABLE "access_keys" ADD CONSTRAINT "chk_access_keys_owner" CHECK (("user_id" IS NOT NULL AND "organization_id" IS NULL) OR ("user_id" IS NULL AND "organization_id" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "bounties" ADD CONSTRAINT "chk_bounties_funder" CHECK (("primary_funder_id" IS NOT NULL AND "organization_id" IS NULL) OR ("primary_funder_id" IS NULL AND "organization_id" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "bounty_funders" ADD CONSTRAINT "chk_bounty_funders_funder" CHECK (("funder_id" IS NOT NULL AND "organization_id" IS NULL) OR ("funder_id" IS NULL AND "organization_id" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "pending_payments" ADD CONSTRAINT "chk_pending_payments_funder" CHECK (("funder_id" IS NOT NULL AND "organization_id" IS NULL) OR ("funder_id" IS NULL AND "organization_id" IS NOT NULL));