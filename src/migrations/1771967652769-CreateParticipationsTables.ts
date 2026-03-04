import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateParticipationsTables1771967652769 implements MigrationInterface {
    name = 'CreateParticipationsTables1771967652769'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "external_contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_user_id" uuid NOT NULL, "alias" text NOT NULL, "email" text, "phone_number" text, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d7f560d24c6bd6ce79a8ca28431" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97e3c3520037ef353addd059cb" ON "external_contacts" ("owner_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_efb48847e4ba0b9be646f1579a" ON "external_contacts" ("deleted_at") `);
        await queryRunner.query(`ALTER TABLE "external_contacts" ADD CONSTRAINT "FK_97e3c3520037ef353addd059cb4" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity_participations" ADD CONSTRAINT "FK_7fbafac3d567a57443e61811e99" FOREIGN KEY ("external_contact_id") REFERENCES "external_contacts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_participations" DROP CONSTRAINT "FK_7fbafac3d567a57443e61811e99"`);
        await queryRunner.query(`ALTER TABLE "external_contacts" DROP CONSTRAINT "FK_97e3c3520037ef353addd059cb4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_efb48847e4ba0b9be646f1579a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97e3c3520037ef353addd059cb"`);
        await queryRunner.query(`DROP TABLE "external_contacts"`);
    }

}
