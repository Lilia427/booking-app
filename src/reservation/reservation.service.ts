import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationEntity } from './entities/reservation.entity';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(ReservationEntity)
    private readonly reservationRepository: Repository<ReservationEntity>,
  ) {}

  async getBookedDates(): Promise<{ checkIn: Date; checkOut: Date }[]> {
    return this.reservationRepository.find({
      select: ['checkIn', 'checkOut'],
      where: { status: In(['new', 'confirmed', 'pending']) },
    });
  }

  async getBookedDatesByRoomType(roomType: number): Promise<{ checkIn: Date; checkOut: Date }[]> {
    return this.reservationRepository.find({
      select: ['checkIn', 'checkOut'],
      where: { roomType, status: In(['new', 'confirmed', 'pending']) },
    });
  }

  async create(createReservationDto: CreateReservationDto) {
    const checkIn = this.toDate(createReservationDto.checkIn);
    const checkOut = this.toDate(createReservationDto.checkOut);

    const overlap = await this.reservationRepository
      .createQueryBuilder('r')
      .where('r.roomType = :roomType', { roomType: createReservationDto.roomType })
      .andWhere('r.status IN (:...statuses)', { statuses: ['new', 'confirmed', 'pending'] })
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

    return this.reservationRepository.save(reservation);
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

    const updatedReservation = this.reservationRepository.merge(reservation, {
      ...updateReservationDto,
      checkIn: updateReservationDto.checkIn
        ? this.toDate(updateReservationDto.checkIn)
        : reservation.checkIn,
      checkOut: updateReservationDto.checkOut
        ? this.toDate(updateReservationDto.checkOut)
        : reservation.checkOut,
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

  private toDate(value: string): Date {
    let iso = value;

    // Accept DD/MM/YYYY (European format used by the frontend)
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
