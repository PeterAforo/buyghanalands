import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma, withDbRetry } from "./db";
import { checkRateLimit, RATE_LIMITS } from "./rate-limit";

// Build providers array — Google is only added if credentials are configured
const providers = [
  Credentials({
    name: "credentials",
    credentials: {
      identifier: { label: "Email or Phone", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.identifier || !credentials?.password) {
        return null;
      }

      const identifier = (credentials.identifier as string).trim();
      const isEmail = identifier.includes("@");

      let user;

      if (isEmail) {
        // Look up by email
        user = await withDbRetry(() => prisma.user.findUnique({
          where: { email: identifier.toLowerCase() },
        }));
      } else {
        // Normalize phone number - convert 0XXXXXXXXX to +233XXXXXXXXX
        let phone = identifier;
        if (phone.startsWith("0") && phone.length === 10) {
          phone = "+233" + phone.substring(1);
        }

        // Try to find user with normalized phone first
        user = await withDbRetry(() => prisma.user.findUnique({
          where: { phone },
        }));

        // If not found, try with original input (for users with different phone formats)
        if (!user) {
          user = await withDbRetry(() => prisma.user.findUnique({
            where: { phone: identifier },
          }));
        }
      }

      if (!user || !user.passwordHash) {
        return null;
      }

      const isValid = await compare(
        credentials.password as string,
        user.passwordHash
      );

      if (!isValid) {
        // Increment failed login counter and check if account should be locked
        const rateLimit = await checkRateLimit(user.phone, RATE_LIMITS.LOGIN_FAILED);
        if (!rateLimit.success) {
          console.warn(
            `Account locked due to too many failed login attempts: ${user.phone}`
          );
        }
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.fullName,
        phone: user.phone,
        roles: user.roles,
        kycTier: user.kycTier,
        accountStatus: user.accountStatus,
      };
    },
  }),
];

// Add Google provider only if client ID and secret are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }) as any
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  trustHost: true,
  cookies: {
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // For Google OAuth, create or link the user in the database
      if (account?.provider === "google" && user?.email) {
        try {
          // Check if a user with this email already exists
          let dbUser = await withDbRetry(() => prisma.user.findUnique({
            where: { email: user.email! },
          }));

          if (!dbUser) {
            // Create a new user from Google profile
            // Generate a placeholder phone (Google users may not have one)
            const placeholderPhone = `google_${user.id?.substring(0, 20) ?? Date.now()}`;
            dbUser = await withDbRetry(() => prisma.user.create({
              data: {
                email: user.email!,
                fullName: user.name ?? "Google User",
                phone: placeholderPhone,
                passwordHash: null, // No password for OAuth users
                roles: ["BUYER"],
                kycTier: "TIER_0_OTP",
                accountStatus: "ACTIVE",
                avatarUrl: user.image ?? null,
              },
            }));
          }

          // Attach DB user info to the user object for JWT callback
          const u = user as unknown as Record<string, unknown>;
          u.id = dbUser.id;
          u.phone = dbUser.phone;
          u.roles = dbUser.roles;
          u.kycTier = dbUser.kycTier;
          u.accountStatus = dbUser.accountStatus;
        } catch (error) {
          console.error("Google OAuth sign-in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as Record<string, unknown>;
        token.id = (u.id as string) ?? user.id ?? "";
        token.phone = (u.phone as string) ?? (user as any).phone ?? "";
        token.roles = (u.roles as string[]) ?? (user as any).roles ?? [];
        token.kycTier = (u.kycTier as string) ?? (user as any).kycTier ?? "";
        token.accountStatus = (u.accountStatus as string) ?? (user as any).accountStatus ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.phone = token.phone as string;
        session.user.roles = token.roles as string[];
        session.user.kycTier = token.kycTier as string;
        session.user.accountStatus = token.accountStatus as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
