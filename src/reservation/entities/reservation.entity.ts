import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'reservation' })
export class ReservationEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'date', nullable: true })
    checkIn!: Date | null;

    @Column({ type: 'date', nullable: true })
    checkOut!: Date | null;

    @Column({ default: 0 })
    adults!: number;

    @Column({ default: 0 })
    children!: number;

    @Column()
    roomType!: number;

    @Column()
    roomName!: string;

    @Column()
    name!: string;


    @Column()
    phone!: string;

    @Column()
    status!: string;

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;
}
