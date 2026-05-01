import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropReservationEmail1777800000000 implements MigrationInterface {
  name = 'DropReservationEmail1777800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "reservation" DROP COLUMN IF EXISTS "email"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "reservation" ADD COLUMN "email" character varying NOT NULL DEFAULT \'\'');
    await queryRunner.query('ALTER TABLE "reservation" ALTER COLUMN "email" DROP DEFAULT');
  }
}