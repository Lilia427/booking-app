import { IsEmail, IsNotEmpty } from "class-validator";

export class CreateAdminDto {
    @IsNotEmpty()
    readonly name: string;

    
    @IsNotEmpty()
    @IsEmail()
    readonly email: string;


    @IsNotEmpty()
    readonly password: string;
}
 