import { TokenBlacklistService } from "./token-blacklist.service";

describe("TokenBlacklistService", () => {
  let service: TokenBlacklistService;

  beforeEach(() => {
    service = new TokenBlacklistService();
  });

  it("should report token as not revoked by default", () => {
    expect(service.isRevoked("any-token")).toBe(false);
  });

  it("should mark a token as revoked after calling revoke", () => {
    service.revoke("jwt-abc");
    expect(service.isRevoked("jwt-abc")).toBe(true);
  });

  it("should not revoke unrelated tokens", () => {
    service.revoke("token-a");
    expect(service.isRevoked("token-b")).toBe(false);
  });

  it("should be idempotent when revoking the same token twice", () => {
    service.revoke("t1");
    service.revoke("t1");
    expect(service.isRevoked("t1")).toBe(true);
  });
});
