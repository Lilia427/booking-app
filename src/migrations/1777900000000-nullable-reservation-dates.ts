import { MigrationInterface, QueryRunner } from 'typeorm';

export class NullableReservationDates1777900000000 implements MigrationInterface {
  name = 'NullableReservationDates1777900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "reservation" ALTER COLUMN "checkIn" DROP NOT NULL');
    await queryRunner.query('ALTER TABLE "reservation" ALTER COLUMN "checkOut" DROP NOT NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "reservation" ALTER COLUMN "checkIn" SET NOT NULL');
    await queryRunner.query('ALTER TABLE "reservation" ALTER COLUMN "checkOut" SET NOT NULL');
  }
}
