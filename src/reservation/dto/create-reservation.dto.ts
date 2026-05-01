import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReservationDto {
    @IsNotEmpty()
    checkIn!: string;

    @IsNotEmpty()
    checkOut!: string;

    @IsNotEmpty()
    adults?: number;

    @IsNotEmpty()
    children?: number;

    @IsNotEmpty()
    roomType!: number;

    @IsNotEmpty()
    @IsString()
    roomName!: string;

    @IsNotEmpty()
    name!: string;
    
    @IsNotEmpty()
    phone!: string;

    @IsOptional()
    @IsString()
    status?: string;
}
