import { AdminEntity } from "../entities/admin.entity";

export type userType = Omit<AdminEntity, 'password' | 'hashPassword'>;