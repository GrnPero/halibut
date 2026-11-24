// Halibut: Better Auth config. Sign-up stays off, a request without a cookie
// has no session, and users get uuid IDs the database accepts.

import { APIError } from "better-auth/api";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { POST } from "@/app/api/auth/[...all]/route";
import { auth } from "@/server/auth";
import { testPrisma } from "@tests/helpers/db";

// Better Auth's default base path; the host doesn't matter to its router.
const SIGN_UP_URL = "http://localhost/api/auth/sign-up/email";

// Made-up account details.
const NEW_ACCOUNT = {
  name: "Test User",
  email: "sign-up@example.test",
  password: "not-a-real-password-123",
};

describe("sign-up", () => {
  it("is refused by the /api/auth route", async () => {
    const response = await POST(
      new Request(SIGN_UP_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(NEW_ACCOUNT),
      }),
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    expect(await testPrisma.user.count()).toBe(0);
  });

  it("is refused when called from server code", async () => {
    await expect(
      auth.api.signUpEmail({ body: NEW_ACCOUNT }),
    ).rejects.toBeInstanceOf(APIError);

    expect(await testPrisma.user.count()).toBe(0);
  });
});

describe("getSession", () => {
  it("returns null without a session cookie", async () => {
    const session = await auth.api.getSession({ headers: new Headers() });

    expect(session).toBeNull();
  });
});

describe("user IDs", () => {
  it("are uuids filled in by the database", async () => {
    const { internalAdapter } = await auth.$context;

    // "admin": created by us, as sc-175's account command will, not by sign-up.
    const user = await internalAdapter.createUser(
      { name: NEW_ACCOUNT.name, email: NEW_ACCOUNT.email },
      { method: "admin" },
    );

    expect(z.uuid().safeParse(user.id).success).toBe(true);
    expect(
      await testPrisma.user.findUnique({ where: { id: user.id } }),
    ).not.toBeNull();
  });
});
