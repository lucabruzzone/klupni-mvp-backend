import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivityTeamsTables1772300000000
  implements MigrationInterface
{
  name = 'CreateActivityTeamsTables1772300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "activity_teams" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "activity_id" uuid NOT NULL,
        "name" text NOT NULL,
        "color" text,
        "photo_url" text,
        "display_order" integer,
        "deleted_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activity_teams_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_teams_activity_id" ON "activity_teams" ("activity_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_teams_deleted_at" ON "activity_teams" ("deleted_at")`,
    );
    await queryRunner.query(`
      ALTER TABLE "activity_teams"
      ADD CONSTRAINT "FK_activity_teams_activity_id"
      FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "activity_team_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "team_id" uuid NOT NULL,
        "activity_participation_id" uuid NOT NULL,
        "is_captain" boolean NOT NULL DEFAULT false,
        "deleted_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activity_team_members_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_activity_team_members_participation_id" UNIQUE ("activity_participation_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_team_members_team_id" ON "activity_team_members" ("team_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_team_members_participation_id" ON "activity_team_members" ("activity_participation_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_team_members_deleted_at" ON "activity_team_members" ("deleted_at")`,
    );
    await queryRunner.query(`
      ALTER TABLE "activity_team_members"
      ADD CONSTRAINT "FK_activity_team_members_team_id"
      FOREIGN KEY ("team_id") REFERENCES "activity_teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "activity_team_members"
      ADD CONSTRAINT "FK_activity_team_members_participation_id"
      FOREIGN KEY ("activity_participation_id") REFERENCES "activity_participations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activity_team_members" DROP CONSTRAINT "FK_activity_team_members_participation_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_team_members" DROP CONSTRAINT "FK_activity_team_members_team_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_activity_team_members_deleted_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_activity_team_members_participation_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_activity_team_members_team_id"`,
    );
    await queryRunner.query(`DROP TABLE "activity_team_members"`);

    await queryRunner.query(
      `ALTER TABLE "activity_teams" DROP CONSTRAINT "FK_activity_teams_activity_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_activity_teams_deleted_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_activity_teams_activity_id"`,
    );
    await queryRunner.query(`DROP TABLE "activity_teams"`);
  }
}
