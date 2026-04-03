import { MigrationInterface, QueryRunner } from "typeorm";

export class Reservation1775233075165 implements MigrationInterface {
    name = 'Reservation1775233075165'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "reservation" ("id" SERIAL NOT NULL, "checkIn" date NOT NULL, "checkOut" date NOT NULL, "adults" integer NOT NULL DEFAULT '0', "children" integer NOT NULL DEFAULT '0', "roomType" character varying NOT NULL, "name" character varying NOT NULL, "phone" character varying NOT NULL, "status" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_48b1f9922368359ab88e8bfa525" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "admin" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "PK_e032310bcef831fb83101899b10" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "admin"`);
        await queryRunner.query(`DROP TABLE "reservation"`);
    }

}
