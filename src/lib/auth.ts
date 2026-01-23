import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          return null;
        }

        // Normalize phone number - convert 0XXXXXXXXX to +233XXXXXXXXX
        let phone = (credentials.phone as string).trim();
        if (phone.startsWith("0") && phone.length === 10) {
          phone = "+233" + phone.substring(1);
        }

        // Try to find user with normalized phone first
        let user = await prisma.user.findUnique({
          where: { phone },
        });

        // If not found, try with original input (for users with different phone formats)
        if (!user) {
          user = await prisma.user.findUnique({
            where: { phone: (credentials.phone as string).trim() },
          });
        }

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
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
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.phone = user.phone ?? "";
        token.roles = user.roles ?? [];
        token.kycTier = user.kycTier ?? "";
        token.accountStatus = user.accountStatus ?? "";
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
