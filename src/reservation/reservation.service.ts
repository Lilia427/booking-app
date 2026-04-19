import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationEntity } from './entities/reservation.entity';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(ReservationEntity)
    private readonly reservationRepository: Repository<ReservationEntity>,
  ) {}

  async create(createReservationDto: CreateReservationDto) {
    const reservation = this.reservationRepository.create({
      ...createReservationDto,
      checkIn: this.toDate(createReservationDto.checkIn),
      checkOut: this.toDate(createReservationDto.checkOut),
      adults: createReservationDto.adults ?? 0,
      children: createReservationDto.children ?? 0,
      status: createReservationDto.status ?? 'new',
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
    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`Invalid date value: ${value}`);
    }

    return parsedDate;
  }
}
