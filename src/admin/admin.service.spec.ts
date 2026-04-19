import {
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

const bcrypt = require("bcrypt") as { compare: jest.Mock; hash: jest.Mock };

const jwt = require("jsonwebtoken") as { sign: jest.Mock; verify: jest.Mock };

import { UserService } from "./admin.service";
import { AdminEntity } from "./entities/admin.entity";
import { TokenBlacklistService } from "./token-blacklist.service";

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepo = <T = any>(): MockRepo<T> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
});

describe("UserService (admin)", () => {
  let service: UserService;
  let repo: MockRepo<AdminEntity>;
  let blacklist: jest.Mocked<TokenBlacklistService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(AdminEntity),
          useValue: createMockRepo<AdminEntity>(),
        },
        {
          provide: TokenBlacklistService,
          useValue: {
            revoke: jest.fn(),
            isRevoked: jest.fn().mockReturnValue(false),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repo = module.get(getRepositoryToken(AdminEntity));
    blacklist = module.get(TokenBlacklistService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.JWT_SECRET;
  });

  describe("create", () => {
    it("creates a new admin when email and name are unique", async () => {
      const dto = {
        name: "Alice",
        email: "a@a.com",
        password: "secret",
      } as any;
      (repo.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // by email
        .mockResolvedValueOnce(null); // by name
      (repo.save as jest.Mock).mockImplementation(async (entity: any) => ({
        ...entity,
        id: 1,
      }));

      const result = await service.create(dto);

      expect(repo.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 1, email: "a@a.com", name: "Alice" });
    });

    it("throws when email already in use", async () => {
      (repo.findOne as jest.Mock).mockResolvedValueOnce({ id: 1 });

      await expect(
        service.create({ name: "A", email: "a@a.com", password: "x" } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws when name already in use", async () => {
      (repo.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 2 });

      await expect(
        service.create({ name: "A", email: "a@a.com", password: "x" } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("login", () => {
    it("returns user profile on valid credentials", async () => {
      const stored = {
        id: 1,
        email: "a@a.com",
        name: "Alice",
        password: "hashed",
      };
      (repo.findOne as jest.Mock).mockResolvedValue(stored);
      bcrypt.compare.mockResolvedValue(true);

      const result = await service.login("a@a.com", "secret");

      expect(bcrypt.compare).toHaveBeenCalledWith("secret", "hashed");
      expect(result).toEqual({ id: 1, email: "a@a.com", name: "Alice" });
    });

    it("throws when user not found", async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.login("nope@a.com", "x")).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("throws when password is invalid", async () => {
      (repo.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        email: "a@a.com",
        name: "Alice",
        password: "hashed",
      });
      bcrypt.compare.mockResolvedValue(false);

      await expect(service.login("a@a.com", "wrong")).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe("logout", () => {
    it("delegates revoke to TokenBlacklistService and returns success payload", () => {
      const result = service.logout("jwt-token");

      expect(blacklist.revoke).toHaveBeenCalledWith("jwt-token");
      expect(result).toEqual({
        success: true,
        message: "Logged out successfully",
      });
    });
  });

  describe("generateJwt", () => {
    it("signs a JWT using JWT_SECRET from environment", () => {
      process.env.JWT_SECRET = "test-secret";
      jwt.sign.mockReturnValue("signed-token");

      const token = service.generateJwt({
        id: 1,
        email: "a@a.com",
        name: "Alice",
      });

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1, email: "a@a.com", name: "Alice" },
        "test-secret",
      );
      expect(token).toBe("signed-token");
    });

    it("throws InternalServerErrorException when JWT_SECRET is missing", () => {
      expect(() =>
        service.generateJwt({ id: 1, email: "a@a.com", name: "Alice" }),
      ).toThrow(InternalServerErrorException);
    });
  });

  describe("buildUserResponse", () => {
    it("wraps user profile with a JWT token", () => {
      process.env.JWT_SECRET = "test-secret";
      jwt.sign.mockReturnValue("signed-token");

      const response = service.buildUserResponse({
        id: 1,
        email: "a@a.com",
        name: "Alice",
      });

      expect(response).toEqual({
        user: {
          id: 1,
          email: "a@a.com",
          name: "Alice",
          token: "signed-token",
        },
      });
    });
  });
});
