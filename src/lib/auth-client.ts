import { createAuthClient } from "better-auth/react";

/** Better Auth's browser client, for the login form and Sign out. Same origin, so no base URL. */
export const authClient = createAuthClient();
