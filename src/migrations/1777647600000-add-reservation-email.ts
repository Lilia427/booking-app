import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReservationEmail1777647600000 implements MigrationInterface {
  name = 'AddReservationEmail1777647600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "reservation" ADD COLUMN "email" character varying NOT NULL DEFAULT \'\'',
    );
    await queryRunner.query(
      'ALTER TABLE "reservation" ALTER COLUMN "email" DROP DEFAULT',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "reservation" DROP COLUMN "email"');
  }
}