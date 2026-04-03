import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import {hash} from 'bcrypt';

@Entity({ name: 'admin'})
export class AdminEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column({select: false})
    password: string;

    @BeforeInsert()
    async hashPassword() {
        this.password = await hash(this.password, 10);
    }
}
