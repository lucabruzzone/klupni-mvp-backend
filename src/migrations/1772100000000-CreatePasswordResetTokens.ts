import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetTokens1772100000000
  implements MigrationInterface
{
  name = 'CreatePasswordResetTokens1772100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token" text NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "used_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_password_reset_tokens_token" UNIQUE ("token"),
        CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_tokens_user_id" ON "password_reset_tokens" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_tokens_token" ON "password_reset_tokens" ("token")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_tokens_expires_at" ON "password_reset_tokens" ("expires_at")`,
    );
    await queryRunner.query(`
      ALTER TABLE "password_reset_tokens"
      ADD CONSTRAINT "FK_password_reset_tokens_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_password_reset_tokens_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_password_reset_tokens_expires_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_password_reset_tokens_token"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_password_reset_tokens_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
  }
}
