CREATE TABLE "wallet" (
	"id" text PRIMARY KEY NOT NULL,
	"address" varchar(42) NOT NULL,
	"key_type" varchar(20) NOT NULL,
	"wallet_type" varchar(20) NOT NULL,
	"passkey_id" text,
	"user_id" text,
	"label" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_address_unique" UNIQUE("address"),
	CONSTRAINT "wallet_passkey_id_unique" UNIQUE("passkey_id")
);
--> statement-breakpoint
DROP TABLE "pending_payments" CASCADE;--> statement-breakpoint
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_passkey_id_passkey_id_fk" FOREIGN KEY ("passkey_id") REFERENCES "public"."passkey"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wallet_userId_idx" ON "wallet" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wallet_passkeyId_idx" ON "wallet" USING btree ("passkey_id");--> statement-breakpoint
CREATE INDEX "wallet_address_idx" ON "wallet" USING btree ("address");