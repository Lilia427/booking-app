import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';

import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationEntity } from './entities/reservation.entity';
import { ReservationNotificationService } from './reservation-notification.service';

const ACTIVE_BOOKING_STATUSES = ['new', 'confirmed', 'pending', 'booked'] as const;
const CANCELLED_STATUSES = ['cancel', 'cancelled', 'canceled'] as const;

const isCancelledStatus = (status: string) =>
  (CANCELLED_STATUSES as readonly string[]).includes(status);

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);

  constructor(
    @InjectRepository(ReservationEntity)
    private readonly reservationRepository: Repository<ReservationEntity>,
    private readonly reservationNotificationService: ReservationNotificationService,
  ) {}

  async getBookedDates(): Promise<{ checkIn: Date; checkOut: Date }[]> {
    return this.reservationRepository.find({
      select: ['checkIn', 'checkOut'],
      where: {
        status: In([...ACTIVE_BOOKING_STATUSES]),
        checkIn: Not(IsNull()),
        checkOut: Not(IsNull()),
      },
    });
  }

  async getBookedDatesByRoomType(roomType: number): Promise<{ checkIn: Date; checkOut: Date }[]> {
    return this.reservationRepository.find({
      select: ['checkIn', 'checkOut'],
      where: {
        roomType,
        status: In([...ACTIVE_BOOKING_STATUSES]),
        checkIn: Not(IsNull()),
        checkOut: Not(IsNull()),
      },
    });
  }

  async create(createReservationDto: CreateReservationDto) {
    const checkIn = this.toDate(createReservationDto.checkIn);
    const checkOut = this.toDate(createReservationDto.checkOut);

    const overlap = await this.reservationRepository
      .createQueryBuilder('r')
      .where('r.roomType = :roomType', { roomType: createReservationDto.roomType })
      .andWhere('r.status IN (:...statuses)', { statuses: [...ACTIVE_BOOKING_STATUSES] })
      .andWhere('r.checkIn < :checkOut AND r.checkOut > :checkIn', {
        checkIn,
        checkOut,
      })
      .getCount();

    if (overlap > 0) {
      throw new ConflictException('Selected dates are already booked for this room type');
    }

    const reservation = this.reservationRepository.create({
      ...createReservationDto,
      checkIn,
      checkOut,
      adults: createReservationDto.adults ?? 0,
      children: createReservationDto.children ?? 0,
      status: createReservationDto.status ?? 'pending',
    });

    const savedReservation = await this.reservationRepository.save(reservation);

    try {
      await this.reservationNotificationService.sendReservationCreatedEmail(savedReservation);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to trigger reservation confirmation email for reservation ${savedReservation.id}: ${message}`);
    }

    return savedReservation;
  }

  findAll() {
    return this.reservationRepository.find({
      order: {
        checkIn: 'ASC',
        id: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const reservation = await this.reservationRepository.findOneBy({ id });

    if (!reservation) {
      throw new NotFoundException(`Reservation with id ${id} not found`);
    }

    return reservation;
  }

  async update(id: number, updateReservationDto: UpdateReservationDto) {
    const reservation = await this.findOne(id);
    const { checkIn: checkInDto, checkOut: checkOutDto, ...rest } = updateReservationDto;
    const nextStatus = rest.status ?? reservation.status;
    const isCancelling = isCancelledStatus(nextStatus);

    const updatedReservation = this.reservationRepository.merge(reservation, {
      ...rest,
      checkIn: isCancelling
        ? null
        : this.resolveDateForUpdate(checkInDto, reservation.checkIn),
      checkOut: isCancelling
        ? null
        : this.resolveDateForUpdate(checkOutDto, reservation.checkOut),
    });

    return this.reservationRepository.save(updatedReservation);
  }

  async remove(id: number) {
    const reservation = await this.findOne(id);

    await this.reservationRepository.remove(reservation);

    return {
      deleted: true,
      id,
    };
  }

  private resolveDateForUpdate(value: string | undefined, fallback: Date | null): Date | null {
    if (value === undefined || value === null || String(value).trim() === '') {
      return fallback;
    }

    return this.toDate(value);
  }

  private toDate(value: string): Date {
    let iso = value;

    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      iso = `${match[3]}-${match[2]}-${match[1]}`;
    }

    const parsedDate = new Date(iso);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`Invalid date value: ${value}`);
    }

    return parsedDate;
  }
}
