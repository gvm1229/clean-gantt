import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

type AuthErrorWithType = Error & { type?: string };

export function isJwtSessionError(error: Error) {
  const authError = error as AuthErrorWithType;
  return (
    authError.name === "JWTSessionError" || authError.type === "JWTSessionError"
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost:
    process.env.NODE_ENV !== "production" ||
    process.env.AUTH_TRUST_HOST === "true",
  session: { strategy: "jwt" },
  logger: {
    error(error) {
      if (isJwtSessionError(error)) return;
      console.error("[auth::logger.error] Auth.js error", error);
    },
  },
  providers: [Google, GitHub],
  callbacks: {
    jwt({ token, user }) {
      if (user?.email) token.email = user.email;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
