import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ReservationService } from './reservation.service';
import { ReservationEntity } from './entities/reservation.entity';

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepo = <T = any>(): MockRepo<T> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  merge: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('ReservationService', () => {
  let service: ReservationService;
  let repo: MockRepo<ReservationEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        {
          provide: getRepositoryToken(ReservationEntity),
          useValue: createMockRepo<ReservationEntity>(),
        },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
    repo = module.get(getRepositoryToken(ReservationEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Utility: stub QueryBuilder for overlap check
  const mockQb = (overlapCount: number) => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(overlapCount),
    };
    repo.createQueryBuilder!.mockReturnValue(qb);
    return qb;
  };

  describe('getBookedDates', () => {
    it('returns checkIn/checkOut for active reservations', async () => {
      const list = [{ checkIn: new Date('2026-05-01'), checkOut: new Date('2026-05-03') }];
      repo.find!.mockResolvedValue(list);

      const result = await service.getBookedDates();

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ select: ['checkIn', 'checkOut'] }),
      );
      expect(result).toBe(list);
    });
  });

  describe('getBookedDatesByRoomType', () => {
    it('filters by roomType number', async () => {
      const list = [{ checkIn: new Date('2026-05-01'), checkOut: new Date('2026-05-03') }];
      repo.find!.mockResolvedValue(list);

      const result = await service.getBookedDatesByRoomType(1);

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ roomType: 1 }) }),
      );
      expect(result).toBe(list);
    });
  });

  describe('create', () => {
    it('creates a reservation when no date overlap', async () => {
      mockQb(0);
      const dto = {
        checkIn: '2026-04-01',
        checkOut: '2026-04-05',
        roomType: 1,
        name: 'John Doe',
        phone: '+380991234567',
      } as any;
      const built = { id: 1, ...dto, adults: 0, children: 0, status: 'pending' };
      repo.create!.mockReturnValue(built);
      repo.save!.mockResolvedValue(built);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          roomType: 1,
          adults: 0,
          children: 0,
          status: 'pending',
          checkIn: expect.any(Date),
          checkOut: expect.any(Date),
        }),
      );
      expect(repo.save).toHaveBeenCalledWith(built);
      expect(result).toBe(built);
    });

    it('throws ConflictException when dates overlap for the same room', async () => {
      mockQb(1);
      const dto = {
        checkIn: '2026-04-01',
        checkOut: '2026-04-05',
        roomType: 1,
        name: 'Jane',
        phone: '+380001',
      } as any;

      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('parses DD/MM/YYYY date format', async () => {
      mockQb(0);
      const dto = {
        checkIn: '01/05/2026',
        checkOut: '05/05/2026',
        roomType: 2,
        name: 'John',
        phone: '+380501234567',
      } as any;
      const built = { id: 1, ...dto, adults: 0, children: 0 };
      repo.create!.mockReturnValue(built);
      repo.save!.mockResolvedValue(built);

      await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          checkIn: new Date('2026-05-01'),
          checkOut: new Date('2026-05-05'),
        }),
      );
    });

    it('defaults status to pending when not provided', async () => {
      mockQb(0);
      const dto = {
        checkIn: '2026-05-01',
        checkOut: '2026-05-03',
        roomType: 1,
        name: 'Alice',
        phone: '+380991234567',
      } as any;
      const built = { id: 2, ...dto, status: 'pending' };
      repo.create!.mockReturnValue(built);
      repo.save!.mockResolvedValue(built);

      await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' }),
      );
    });

    it('throws BadRequestException for invalid date string', async () => {
      mockQb(0);
      const dto = {
        checkIn: 'not-a-date',
        checkOut: '2026-04-05',
        roomType: 1,
        name: 'John',
        phone: '+380001',
      } as any;

      await expect(service.create(dto)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('returns a list ordered by checkIn asc, id desc', async () => {
      const list = [{ id: 1 }, { id: 2 }];
      repo.find!.mockResolvedValue(list);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({
        order: { checkIn: 'ASC', id: 'DESC' },
      });
      expect(result).toBe(list);
    });
  });

  describe('findOne', () => {
    it('returns reservation when found', async () => {
      const r = { id: 7, roomType: 1 } as any;
      repo.findOneBy!.mockResolvedValue(r);

      const result = await service.findOne(7);

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 7 });
      expect(result).toBe(r);
    });

    it('throws NotFoundException when not found', async () => {
      repo.findOneBy!.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('merges new values and saves', async () => {
      const existing = {
        id: 1,
        checkIn: new Date('2026-04-01'),
        checkOut: new Date('2026-04-05'),
      } as any;
      const merged = { ...existing, status: 'confirmed' };

      repo.findOneBy!.mockResolvedValue(existing);
      repo.merge!.mockReturnValue(merged);
      repo.save!.mockResolvedValue(merged);

      const result = await service.update(1, { status: 'confirmed' } as any);

      expect(repo.merge).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(merged);
      expect(result).toBe(merged);
    });
  });

  describe('remove', () => {
    it('removes an existing reservation and returns deleted flag', async () => {
      const existing = { id: 1 } as any;
      repo.findOneBy!.mockResolvedValue(existing);
      repo.remove!.mockResolvedValue(existing);

      const result = await service.remove(1);

      expect(repo.remove).toHaveBeenCalledWith(existing);
      expect(result).toEqual({ deleted: true, id: 1 });
    });
  });
});
