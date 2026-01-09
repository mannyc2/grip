ALTER TABLE "access_keys" RENAME COLUMN "grantor_wallet_id" TO "root_wallet_id";--> statement-breakpoint
ALTER TABLE "access_keys" RENAME COLUMN "authorized_wallet_id" TO "key_wallet_id";--> statement-breakpoint
ALTER TABLE "access_keys" DROP CONSTRAINT "access_keys_grantor_wallet_id_wallet_id_fk";
--> statement-breakpoint
ALTER TABLE "access_keys" DROP CONSTRAINT "access_keys_authorized_wallet_id_wallet_id_fk";
--> statement-breakpoint
DROP INDEX "idx_access_keys_grantor_wallet";--> statement-breakpoint
DROP INDEX "idx_access_keys_authorized_wallet";--> statement-breakpoint
DROP INDEX "idx_access_keys_unique_active";--> statement-breakpoint
ALTER TABLE "access_keys" ADD CONSTRAINT "access_keys_root_wallet_id_wallet_id_fk" FOREIGN KEY ("root_wallet_id") REFERENCES "public"."wallet"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_keys" ADD CONSTRAINT "access_keys_key_wallet_id_wallet_id_fk" FOREIGN KEY ("key_wallet_id") REFERENCES "public"."wallet"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_access_keys_root_wallet" ON "access_keys" USING btree ("root_wallet_id");--> statement-breakpoint
CREATE INDEX "idx_access_keys_key_wallet" ON "access_keys" USING btree ("key_wallet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_access_keys_unique_active" ON "access_keys" USING btree ("user_id","key_wallet_id","network") WHERE "access_keys"."status" = 'active';