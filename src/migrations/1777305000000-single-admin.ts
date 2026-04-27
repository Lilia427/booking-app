import { MigrationInterface, QueryRunner } from 'typeorm';

export class SingleAdmin1777305000000 implements MigrationInterface {
  name = 'SingleAdmin1777305000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UQ_admin_single_row" ON "admin" ((true))',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "public"."UQ_admin_single_row"');
  }
}
