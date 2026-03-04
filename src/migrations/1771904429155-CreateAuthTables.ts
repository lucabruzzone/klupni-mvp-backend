import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuthTables1771904429155 implements MigrationInterface {
    name = 'CreateAuthTables1771904429155'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "password_hash" text NOT NULL, "email_verified_at" TIMESTAMP, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_users_email" UNIQUE ("email"), CONSTRAINT "PK_users_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_users_deleted_at" ON "users" ("deleted_at")`);
        await queryRunner.query(`CREATE TABLE "user_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "first_name" text, "last_name" text, "username" text, "avatar_url" text, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_user_profiles_username" UNIQUE ("username"), CONSTRAINT "UQ_user_profiles_user_id" UNIQUE ("user_id"), CONSTRAINT "PK_user_profiles_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_user_profiles_user_id" ON "user_profiles" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_user_profiles_deleted_at" ON "user_profiles" ("deleted_at")`);
        await queryRunner.query(`CREATE TABLE "email_verification_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token" text NOT NULL, "expires_at" TIMESTAMP NOT NULL, "used_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_email_verification_tokens_token" UNIQUE ("token"), CONSTRAINT "PK_email_verification_tokens_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_email_verification_tokens_user_id" ON "email_verification_tokens" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_email_verification_tokens_token" ON "email_verification_tokens" ("token")`);
        await queryRunner.query(`CREATE INDEX "IDX_email_verification_tokens_expires_at" ON "email_verification_tokens" ("expires_at")`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_user_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "FK_email_verification_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "FK_email_verification_tokens_user_id"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_user_profiles_user_id"`);
        await queryRunner.query(`DROP TABLE "email_verification_tokens"`);
        await queryRunner.query(`DROP TABLE "user_profiles"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}