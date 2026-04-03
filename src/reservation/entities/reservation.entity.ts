import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'reservation' })
export class ReservationEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'date' })
    checkIn: Date;

    @Column({ type: 'date' })
    checkOut: Date;

    @Column({ default: 0 })
    adults: number;

    @Column({ default: 0 })
    children: number;

    @Column()
    roomType: string;

    @Column()
    name: string;

    @Column()
    phone: string;

    @Column()
    status: string;

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}
