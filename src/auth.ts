import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { verifyTotpCode } from "@/lib/totp";
import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    builderId: string;
    builderName: string;
    isCompanyWide: boolean;
    projectIds: string[];
    sessionVersion: number;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      builderId: string;
      builderName: string;
      isCompanyWide: boolean;
      projectIds: string[];
      sessionVersion: number;
    };
  }
}

interface AppToken {
  id: string;
  role: Role;
  builderId: string;
  builderName: string;
  isCompanyWide: boolean;
  projectIds: string[];
  sessionVersion: number;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "2FA Code", type: "text" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const code = credentials?.code as string | undefined;
        if (!email || !password) return null;

        const user = await db.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          include: { builder: true, projectAccess: true },
        });
        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        if (user.twoFactorEnabled) {
          if (!user.twoFactorSecret || !code || !verifyTotpCode(user.twoFactorSecret, code)) {
            return null;
          }
        }

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          builderId: user.builderId,
          builderName: user.builder.name,
          isCompanyWide: user.isCompanyWide,
          projectIds: user.projectAccess.map((p) => p.projectId),
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      const t = token as typeof token & Partial<AppToken>;
      if (user) {
        t.id = user.id;
        t.role = user.role;
        t.builderId = user.builderId;
        t.builderName = user.builderName;
        t.isCompanyWide = user.isCompanyWide;
        t.projectIds = user.projectIds;
        t.sessionVersion = user.sessionVersion;
      }
      return t;
    },
    session: async ({ session, token }) => {
      const t = token as typeof token & AppToken;
      session.user.id = t.id;
      session.user.role = t.role;
      session.user.builderId = t.builderId;
      session.user.builderName = t.builderName;
      session.user.isCompanyWide = t.isCompanyWide;
      session.user.projectIds = t.projectIds;
      session.user.sessionVersion = t.sessionVersion;
      return session;
    },
  },
});
