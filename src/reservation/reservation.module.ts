import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { ReservationEntity } from './entities/reservation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { ReservationNotificationService } from './reservation-notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReservationEntity]), AdminModule],
  controllers: [ReservationController],
  providers: [ReservationService, ReservationNotificationService],
})
export class ReservationModule {}
