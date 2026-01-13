ALTER TABLE "organization" ALTER COLUMN "visibility" SET DEFAULT 'private';--> statement-breakpoint
ALTER TABLE "repo_settings" ADD COLUMN "verified_owner_organization_id" text;--> statement-breakpoint
ALTER TABLE "repo_settings" ADD COLUMN "auto_pay_access_key_id" text;--> statement-breakpoint
ALTER TABLE "repo_settings" ADD CONSTRAINT "repo_settings_verified_owner_organization_id_organization_id_fk" FOREIGN KEY ("verified_owner_organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_repo_settings_org_owner" ON "repo_settings" USING btree ("verified_owner_organization_id");--> statement-breakpoint
ALTER TABLE "repo_settings" ADD CONSTRAINT "chk_repo_owner_xor" CHECK ("verified_owner_user_id" IS NULL OR "verified_owner_organization_id" IS NULL);