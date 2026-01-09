ALTER TABLE "access_keys" DROP CONSTRAINT "access_keys_authorized_user_passkey_id_passkey_id_fk";
--> statement-breakpoint
DROP INDEX "idx_access_keys_authorized_user";--> statement-breakpoint
DROP INDEX "idx_access_keys_backend_wallet";--> statement-breakpoint
DROP INDEX "idx_access_keys_unique_active";--> statement-breakpoint
ALTER TABLE "access_keys" ALTER COLUMN "grantor_wallet_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "access_keys" ALTER COLUMN "authorized_wallet_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_access_keys_unique_active" ON "access_keys" USING btree ("user_id","authorized_wallet_id","network") WHERE "access_keys"."status" = 'active';--> statement-breakpoint
ALTER TABLE "access_keys" DROP COLUMN "backend_wallet_address";--> statement-breakpoint
ALTER TABLE "access_keys" DROP COLUMN "authorized_user_passkey_id";--> statement-breakpoint
ALTER TABLE "access_keys" DROP COLUMN "key_type";