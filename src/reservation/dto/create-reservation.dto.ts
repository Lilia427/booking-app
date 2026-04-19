import { IsNotEmpty } from "class-validator";

export class CreateReservationDto {
    @IsNotEmpty()
    checkIn: string;

    @IsNotEmpty()
    checkOut: string;

    @IsNotEmpty()
    adults?: number;

    @IsNotEmpty()
    children?: number;

    @IsNotEmpty()
    roomType: string;

    @IsNotEmpty()
    name: string;
    
    @IsNotEmpty()
    phone: string;

    status?: string;
}
