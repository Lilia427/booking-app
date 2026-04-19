import { MigrationInterface, QueryRunner } from "typeorm";

export class Test1776626147286 implements MigrationInterface {
    name = 'Test1776626147286'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservation" ADD COLUMN IF NOT EXISTS "roomName" character varying`);
        await queryRunner.query(`UPDATE "reservation" SET "roomName" = 'Cottage' WHERE "roomName" IS NULL`);
        await queryRunner.query(`ALTER TABLE "reservation" ALTER COLUMN "roomName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reservation" ALTER COLUMN "roomType" TYPE integer USING CASE WHEN "roomType" ~ '^[0-9]+$' THEN "roomType"::integer ELSE 0 END`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservation" ALTER COLUMN "roomType" TYPE character varying`);
        await queryRunner.query(`ALTER TABLE "reservation" DROP COLUMN IF EXISTS "roomName"`);
    }

}
