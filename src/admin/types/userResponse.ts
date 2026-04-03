import { AdminEntity } from "../entities/admin.entity";
import { userType } from "./user.types";

export interface UserResponse {
    user: userType & { token: string };
}

export type UserProfile = Omit<AdminEntity, 'password' | 'hashPassword'>;

export interface UserProfileResponse {
    user: UserProfile;
}