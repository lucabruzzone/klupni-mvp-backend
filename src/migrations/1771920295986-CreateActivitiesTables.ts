import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateActivitiesTables1771920295986 implements MigrationInterface {
    name = 'CreateActivitiesTables1771920295986'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "activity_open" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "activity_id" uuid NOT NULL, "sport_name" text, "location_text" text, "max_participants" integer NOT NULL, "min_participants" integer NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5a951d98605386bb38d2cbc0e37" UNIQUE ("activity_id"), CONSTRAINT "REL_5a951d98605386bb38d2cbc0e3" UNIQUE ("activity_id"), CONSTRAINT "PK_99ac1cc0113ffc6e5220457e036" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8b3b2478cd111bc312a81258eb" ON "activity_open" ("deleted_at") `);
        await queryRunner.query(`CREATE TABLE "activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_by_user_id" uuid NOT NULL, "title" text NOT NULL, "description" text, "start_at" TIMESTAMP NOT NULL, "end_at" TIMESTAMP, "status" text NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7f4004429f731ffb9c88eb486a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c47ce66caaf970ba5d2bf5cb0c" ON "activities" ("created_by_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_dac578254ee6df62b6acc6e630" ON "activities" ("start_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_146a66975e0a017af25c63c665" ON "activities" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_428d9025ae9ccdf2af6eaa1c7f" ON "activities" ("deleted_at") `);
        await queryRunner.query(`CREATE TABLE "activity_participations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "activity_id" uuid NOT NULL, "user_id" uuid, "external_contact_id" uuid, "alias" text, "role" text NOT NULL, "status" text NOT NULL, "joined_at" TIMESTAMP NOT NULL, "confirmed_at" TIMESTAMP, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_activity_participations_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c33cdc666e7b4c0ae07b5c8f8e" ON "activity_participations" ("activity_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_67c22634c6602fc1b02ca75650" ON "activity_participations" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7fbafac3d567a57443e61811e9" ON "activity_participations" ("external_contact_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b2e65a0f3ba57fca543b9eea1f" ON "activity_participations" ("deleted_at") `);
        await queryRunner.query(`ALTER TABLE "activity_open" ADD CONSTRAINT "FK_5a951d98605386bb38d2cbc0e37" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activities" ADD CONSTRAINT "FK_c47ce66caaf970ba5d2bf5cb0c6" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity_participations" ADD CONSTRAINT "FK_c33cdc666e7b4c0ae07b5c8f8e8" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity_participations" ADD CONSTRAINT "FK_67c22634c6602fc1b02ca756509" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_participations" DROP CONSTRAINT "FK_67c22634c6602fc1b02ca756509"`);
        await queryRunner.query(`ALTER TABLE "activity_participations" DROP CONSTRAINT "FK_c33cdc666e7b4c0ae07b5c8f8e8"`);
        await queryRunner.query(`ALTER TABLE "activities" DROP CONSTRAINT "FK_c47ce66caaf970ba5d2bf5cb0c6"`);
        await queryRunner.query(`ALTER TABLE "activity_open" DROP CONSTRAINT "FK_5a951d98605386bb38d2cbc0e37"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b2e65a0f3ba57fca543b9eea1f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7fbafac3d567a57443e61811e9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_67c22634c6602fc1b02ca75650"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c33cdc666e7b4c0ae07b5c8f8e"`);
        await queryRunner.query(`DROP TABLE "activity_participations"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_428d9025ae9ccdf2af6eaa1c7f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_146a66975e0a017af25c63c665"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dac578254ee6df62b6acc6e630"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c47ce66caaf970ba5d2bf5cb0c"`);
        await queryRunner.query(`DROP TABLE "activities"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8b3b2478cd111bc312a81258eb"`);
        await queryRunner.query(`DROP TABLE "activity_open"`);
    }

}
