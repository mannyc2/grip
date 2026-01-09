ALTER TABLE "access_keys" ADD COLUMN "grantor_wallet_id" text;--> statement-breakpoint
ALTER TABLE "access_keys" ADD COLUMN "authorized_wallet_id" text;--> statement-breakpoint
ALTER TABLE "access_keys" ADD CONSTRAINT "access_keys_grantor_wallet_id_wallet_id_fk" FOREIGN KEY ("grantor_wallet_id") REFERENCES "public"."wallet"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_keys" ADD CONSTRAINT "access_keys_authorized_wallet_id_wallet_id_fk" FOREIGN KEY ("authorized_wallet_id") REFERENCES "public"."wallet"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_access_keys_grantor_wallet" ON "access_keys" USING btree ("grantor_wallet_id");--> statement-breakpoint
CREATE INDEX "idx_access_keys_authorized_wallet" ON "access_keys" USING btree ("authorized_wallet_id");