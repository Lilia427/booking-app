import { MigrationInterface, QueryRunner } from 'typeorm';

export class Cottage1777304000000 implements MigrationInterface {
  name = 'Cottage1777304000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cottage" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text, "pricePerNight" numeric(10,2) NOT NULL, "maxGuests" integer NOT NULL, "imageKeys" text array NOT NULL DEFAULT '{}', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7fcf12370f8de1ea3d2f827bbda" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "cottage"`);
  }
}
