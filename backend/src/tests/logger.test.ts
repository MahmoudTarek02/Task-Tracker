import { describe, it, expect, beforeEach } from "vitest";
import { logger } from "../utils/logger";
import Transport from "winston-transport";

// Normally, logs are printed in console
class MemoryTransport extends Transport {
  // This array acts as our local in-memory database of logs.
  // Every log sent to this transport will be stored here.
  public logs: any[] = [];

  constructor(opts?: any) {
    super(opts);
  }

  log(info: any, callback: () => void) {
    this.logs.push(info);
    if (callback) {
      callback(); 
    }
  }
}

describe("Winston Logger Scrubbing Filter", () => {
  let memoryTransport: MemoryTransport;

  beforeEach(() => {
    memoryTransport = new MemoryTransport();
    logger.add(memoryTransport); // .add() method adds a new transport to the logger. 
  });

  it("should scrub secrets from metadata object fields", () => {
    logger.info("Test log event", {
      password: "sensitive-password-123",
      userPassword: "sensitive-password-123",
      pAsSwoRD: "sensitive-password-123",
      token: "secret-token-abc",
      jwt: "jwt-value-xyz",
      authorization: "Bearer sensitive-auth",
      clientSecret: "some-client-secret-123", // matches the "secret" keyword
      username: "john_doe", // should NOT scrub
    });

    const logged = memoryTransport.logs[0];
    expect(logged).toBeDefined(); // checks if there is any log
    expect(logged.password).toBe("[REDACTED]"); // redacted 
    expect(logged.userPassword).toBe("[REDACTED]"); // redacted 
    expect(logged.pAsSwoRD).toBe("[REDACTED]"); // redacted 
    expect(logged.token).toBe("[REDACTED]"); // redacted
    expect(logged.jwt).toBe("[REDACTED]"); // redacted
    expect(logged.authorization).toBe("[REDACTED]"); // redacted 
    expect(logged.clientSecret).toBe("[REDACTED]"); // redacted
    expect(logged.username).toBe("john_doe"); // not redacted 
  });

  it("should scrub nested secrets from metadata objects", () => {
    logger.info("Nested log event", {
      user: {
        password: "nested-password-456",
        profile: {
          token: "nested-token-789",
        },
      },
    });

    const logged = memoryTransport.logs[0];
    expect(logged).toBeDefined();
    expect(logged.user.password).toBe("[REDACTED]");
    expect(logged.user.profile.token).toBe("[REDACTED]");
  });

  it("should scrub secrets in message strings using regex", () => {
    logger.info('User created: {"password":"secret_password","email":"test@example.com"}');

    const logged = memoryTransport.logs[0];
    expect(logged).toBeDefined();
    expect(logged.message).toContain('"password":"[REDACTED]"');
    expect(logged.message).toContain('"email":"test@example.com"');
  });
});
