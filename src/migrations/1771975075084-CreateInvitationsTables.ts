import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInvitationsTables1771975075084 implements MigrationInterface {
    name = 'CreateInvitationsTables1771975075084'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "activity_invitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "activity_id" uuid NOT NULL, "invited_by_user_id" uuid NOT NULL, "user_id" uuid, "external_contact_id" uuid, "email" text NOT NULL, "token" text NOT NULL, "status" text NOT NULL, "expires_at" TIMESTAMP NOT NULL, "responded_at" TIMESTAMP, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_724ddf9d8c990e2b8ee25dbbef6" UNIQUE ("token"), CONSTRAINT "PK_28113a76a55455c50df99b6af17" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bea08e65377e1ccfd1837204e3" ON "activity_invitations" ("activity_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_77caa3b07360e6b885ad8a4862" ON "activity_invitations" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_dd680af5acf8ba712013327146" ON "activity_invitations" ("external_contact_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_724ddf9d8c990e2b8ee25dbbef" ON "activity_invitations" ("token") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9939210e56602eb0d65311af4" ON "activity_invitations" ("deleted_at") `);
        await queryRunner.query(`ALTER TABLE "activity_invitations" ADD CONSTRAINT "FK_bea08e65377e1ccfd1837204e39" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity_invitations" ADD CONSTRAINT "FK_960f535b00aac9acb8fad27de74" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity_invitations" ADD CONSTRAINT "FK_77caa3b07360e6b885ad8a48626" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity_invitations" ADD CONSTRAINT "FK_dd680af5acf8ba7120133271464" FOREIGN KEY ("external_contact_id") REFERENCES "external_contacts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_invitations" DROP CONSTRAINT "FK_dd680af5acf8ba7120133271464"`);
        await queryRunner.query(`ALTER TABLE "activity_invitations" DROP CONSTRAINT "FK_77caa3b07360e6b885ad8a48626"`);
        await queryRunner.query(`ALTER TABLE "activity_invitations" DROP CONSTRAINT "FK_960f535b00aac9acb8fad27de74"`);
        await queryRunner.query(`ALTER TABLE "activity_invitations" DROP CONSTRAINT "FK_bea08e65377e1ccfd1837204e39"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b9939210e56602eb0d65311af4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_724ddf9d8c990e2b8ee25dbbef"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dd680af5acf8ba712013327146"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_77caa3b07360e6b885ad8a4862"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bea08e65377e1ccfd1837204e3"`);
        await queryRunner.query(`DROP TABLE "activity_invitations"`);
    }

}
