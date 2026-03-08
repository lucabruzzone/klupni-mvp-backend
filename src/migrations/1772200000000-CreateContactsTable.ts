import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContactsTable1772200000000 implements MigrationInterface {
  name = 'CreateContactsTable1772200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "contacts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "owner_user_id" uuid NOT NULL,
        "user_id" uuid,
        "external_contact_id" uuid,
        "deleted_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contacts_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_contacts_one_reference" CHECK (
          (user_id IS NOT NULL AND external_contact_id IS NULL) OR
          (user_id IS NULL AND external_contact_id IS NOT NULL)
        )
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_contacts_owner_user_id" ON "contacts" ("owner_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contacts_user_id" ON "contacts" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contacts_external_contact_id" ON "contacts" ("external_contact_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_contacts_deleted_at" ON "contacts" ("deleted_at")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_contacts_owner_user_id_user_id" ON "contacts" ("owner_user_id", "user_id") WHERE "user_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_contacts_owner_user_id_external_contact_id" ON "contacts" ("owner_user_id", "external_contact_id") WHERE "external_contact_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_contacts_owner_user_id" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_contacts_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_contacts_external_contact_id" FOREIGN KEY ("external_contact_id") REFERENCES "external_contacts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP CONSTRAINT "FK_contacts_external_contact_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP CONSTRAINT "FK_contacts_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP CONSTRAINT "FK_contacts_owner_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_contacts_owner_user_id_external_contact_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_contacts_owner_user_id_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_contacts_deleted_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_contacts_external_contact_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_contacts_user_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_contacts_owner_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "contacts"`);
  }
}
