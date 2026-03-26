import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email?.trim().toLowerCase();
      const password = credentials?.password;
      if (!email || !password) return null;

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          password: true,
          role: true,
        },
      });
      if (!user?.password) return null;

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id;
        token.role = (user as { role?: UserRole }).role ?? UserRole.ADVERTISER;
        if (user.email) token.email = user.email;
      }
      if (trigger === "update" && session?.user?.name != null) {
        token.name = session.user.name;
      }
      const uid = (token.sub ?? token.id) as string | undefined;
      if (uid) {
        try {
          const row = await prisma.user.findUnique({
            where: { id: uid },
            select: { role: true, email: true },
          });
          if (row) {
            token.role = row.role;
            if (row.email) token.email = row.email;
          }
        } catch {
          // DB 다운·DATABASE_URL 누락 시 JWT 갱신이 500 HTML을 반환해
          // CLIENT_FETCH_ERROR(HTML 파싱 실패)로 이어지므로 기존 토큰 유지
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub ?? token.id) as string;
        session.user.role = (token.role as UserRole) ?? UserRole.ADVERTISER;
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email;
      }
      return session;
    },
  },
  events: {
    async linkAccount({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
