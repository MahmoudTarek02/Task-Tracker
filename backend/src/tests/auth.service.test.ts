// describe: groups related tests
// it: individual test case
// expect: used to make assertions
// vi.mock: replaces a module with a mock implementation (Arrange)
// vi.spyOn: Observe what happens in an existing method call (Assert)
// also it can optionally mock a method on that object (Arrange)
// the difference between mocking in spyOn vs mock is that mock replaces an entire module
// whereas spyOn only replaces individual methods and keeps the same module loaded.
// beforeEach(() => { ... }) . Whatever function you pass into it 
// runs before every single it(...) test in that describe block (and any nested ones)

import { describe, it, expect, vi, beforeEach } from "vitest";
import authService from "../modules/auth/auth.service";
import { User } from "../database/models";
import { sendVerificationEmail } from "../config/email";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ConflictError, BadRequestError, UnauthorizedError } from "../utils/errors";

// Arrange: Set up the test environment and mocks
// Act: Call the function under test
// Assert: Check the result

// This replaces the entire email module. 
// Anywhere in the code under test that imports sendVerificationEmail, 
// it gets this fake version instead — a function that does nothing and resolves immediately, 
// rather than actually sending an email.

// mocking outside the describe means it will be mocked for all the describe blocks
// if we mock inside the describe block, it will only be mocked for that specific describe block
vi.mock("../config/email", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("AuthService", () => {
  beforeEach(() => { 
    // will run before each it() tests in the describe block
    // restoreAllMock
    vi.restoreAllMocks(); 
  });

  describe("register", () => {
    it("should throw ConflictError if user email already exists", async () => {
      // spy makes two thigns
      // 1. It remembers every call made to it (arguments, how many times, etc.)
      // 2. By default, it still calls through to the real method... 
      // unless you chain on something like .mockResolvedValue(...), 
      // which tells it to stop calling the real implementation and instead just return a fake value. 
      // and here is starts acting like vi.mock

      //  vi.spyOn(User, "findOne") alone -> watch this method 
      // attaching .mockResolvedValue() to it -> watch this method, AND replace what it actually does
      
      
      // whenever  User.findOne() called -> don't hit the real database
      // instead, immediately resolve with a fake object { id: "existing_id" }
      // This simulates: a user with that email was found
      vi.spyOn(User, "findOne").mockResolvedValue({
        id: "existing_id",
      } as any);

      // checks rejection 
      await expect(
        authService.register("John Doe", "john@example.com", "password123")
      ).rejects.toThrow(new ConflictError("Email already exists"));

      // checks if the User.findOne() was called with email: 'john@example.com'
      // so later if we forgot to mock User.findOne, it would fail here, telling us that User.findOne was not called
      // or if we used wrong email address, it would fail here
      // or if we used username instead of email, it would fail here
      // recall: spyOn not only resolve, but also record call history
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: "john@example.com" },
      });
    });

    it("should successfully register a user, hash password, and send verification email", async () => {
      
      // Arrange: Set up the test environment and mocks - starts here
      
      // This simulates: no user was found
      vi.spyOn(User, "findOne").mockResolvedValue(null);
      
      // build the fake user that will return whenever User.create() called
      // sequalize create() method returns the created model instance
      // u need to access datavalues to access individual values
      const mockUser = {
        getDataValue: vi.fn((key) => {
          if (key === "id") return "new_user_uuid";
          if (key === "name") return "John Doe";
          if (key === "email") return "john@example.com";
          return null;
        }),
      };
      vi.spyOn(User, "create").mockResolvedValue(mockUser as any);
      vi.spyOn(bcrypt, "hash").mockResolvedValue("hashed_password" as any);

      // Arrange: Set up the test environment and mocks - ends here

      // Act: Call the function under test - starts here
      const result = await authService.register("John Doe", "john@example.com", "password123");
      // Act: Call the function under test - ends here

      // Assert: Check the result - starts here

      // check if bcrypt.hash called with password: "password123", and salt 10
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);

      // check if User.create() method called, and with what arguments
      expect(User.create).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
        password: "hashed_password",
        isEmailVerified: false,
        emailVerificationToken: expect.any(String), // doesn't matter what exact string, as long as it is a string
      });

      // just check if it was called
      expect(sendVerificationEmail).toHaveBeenCalled();

      // check the return value of register() method
      expect(result).toEqual({
        id: "new_user_uuid",
        name: "John Doe",
        email: "john@example.com",
      });
      // Assert: Check the result - ends here
    });
  });
  // Note:
  // verifyEmail feature was not requested, but it is included in the test case 
  // because not including it will drop the overall coverage percentage


  describe("verifyEmail", () => {
    it("should throw BadRequestError if token is invalid or expired", async () => {
      // Arrange: Set up the test environment and mocks - starts here
      vi.spyOn(User, "findOne").mockResolvedValue(null);
      // Arrange: Set up the test environment and mocks - ends here

      // Act and Assert (combined) - starts here

      //Assert: Check rejection
      await expect(authService.verifyEmail("invalid_token")).rejects.toThrow(
        new BadRequestError("Invalid or expired verification token")
      );  
      // Act and Assert (combined) - ends here

      // same as 
      // const resultPromise = authService.verifyEmail("invalid_token");

      // await expect(resultPromise).rejects.toThrow(
      //   new BadRequestError("Invalid or expired verification token")
      // );


      // assert starts here

      // why we need to check if the function is called with 'invalid_token'?
      // because spyOne only controls what is returned, not what it is called with
      // so we need to check if the function is called with correct arguments
      expect(User.findOne).toHaveBeenCalledWith({
        where: { emailVerificationToken: "invalid_token" },
      });

      // assert ends here

    });

    it("should verify email and clear token if valid token is provided", async () => {

      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      
      // mockUser object will have 2 methods
      // update() method will be called with { isEmailVerified: true, emailVerificationToken: null }
      // getDataValue() method will be called with 'id', 'name', 'email', 'isEmailVerified'
      const mockUser = {
        // We use plain vi.fn() (not vi.spyOn) because mockUser is a fake object
        // we built ourselves — there's no real User.update() to spy on/restore.
        // spyOn is only for replacing methods on real, pre-existing objects
        // (like User.findOne or bcrypt.hash).
        update: mockUpdate,
        getDataValue: vi.fn((key) => {
          if (key === "id") return "user_id";
          if (key === "name") return "John Doe";
          if (key === "email") return "john@example.com";
          if (key === "isEmailVerified") return true;
          return null;
        }),
      };
      vi.spyOn(User, "findOne").mockResolvedValue(mockUser as any);

      const result = await authService.verifyEmail("valid_token");

      expect(User.findOne).toHaveBeenCalledWith({
        where: { emailVerificationToken: "valid_token" },
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        isEmailVerified: true,
        emailVerificationToken: null,
      });
      expect(result).toEqual({
        id: "user_id",
        name: "John Doe",
        email: "john@example.com",
        isEmailVerified: true,
      });
    });
  });

  describe("login", () => {
    it("should throw UnauthorizedError if user is not found", async () => {
      vi.spyOn(User, "findOne").mockResolvedValue(null);

      await expect(authService.login("notfound@example.com", "password123")).rejects.toThrow(
        new UnauthorizedError("Invalid email or password")
      );
    });

    it("should throw UnauthorizedError if password verification fails", async () => {
      
      // we could have also write 
      
      //   const mockGetDataValue = vi.fn((key) => {
      //     if (key === "password") return "hashed_password";
      //     return null;
      //   });

      //   const mockUser = {
      //     getDataValue: mockGetDataValue,
      // };

      const mockUser = {
        getDataValue: vi.fn((key) => {
          if (key === "password") return "hashed_password";
          return null;
        }),
      };
      vi.spyOn(User, "findOne").mockResolvedValue(mockUser as any);
      vi.spyOn(bcrypt, "compare").mockResolvedValue(false as any);

      await expect(authService.login("john@example.com", "wrong_password")).rejects.toThrow(
        new UnauthorizedError("Invalid email or password")
      );
    });

    it("should return user and jwt token upon successful authentication", async () => {
      const mockUser = {
        getDataValue: vi.fn((key) => {
          if (key === "id") return "user_id";
          if (key === "name") return "John Doe";
          if (key === "email") return "john@example.com";
          if (key === "password") return "hashed_password";
          return null;
        }),
      };
      vi.spyOn(User, "findOne").mockResolvedValue(mockUser as any);
      vi.spyOn(bcrypt, "compare").mockResolvedValue(true as any);
      vi.spyOn(jwt, "sign").mockReturnValue("signed_jwt_token" as any);

      const result = await authService.login("john@example.com", "password123");

      expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashed_password");
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: "user_id",
          email: "john@example.com",
          name: "John Doe",
        },
        "test_secret_key_12345",
        { expiresIn: "24h" }
      );
      expect(result).toEqual({
        user: {
          id: "user_id",
          name: "John Doe",
          email: "john@example.com",
        },
        token: "signed_jwt_token",
      });
    });
  });
});
