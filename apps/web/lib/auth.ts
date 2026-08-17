import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import jwt from "jsonwebtoken";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@nexus/database";

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "internal_search";

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_ID || process.env.AUTH_GOOGLE_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SECRET || process.env.AUTH_GOOGLE_SECRET || "";
const githubClientId = process.env.GITHUB_CLIENT_ID || process.env.GITHUB_ID || process.env.AUTH_GITHUB_ID || "";
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET || process.env.GITHUB_SECRET || process.env.AUTH_GITHUB_SECRET || "";

if (!googleClientSecret && typeof window === 'undefined') {
  console.warn('[NextAuth Warning] GOOGLE_CLIENT_SECRET is not set in environment variables!');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    GitHubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
      allowDangerousEmailAccountLinking: true,
    }),
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  secret: authSecret,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        const userId = token.id || token.sub;
        const accTok = jwt.sign(
          {
            sub: userId,
            id: userId,
            // @ts-ignore
            role: token.role,
            image: token.image || token.picture,
            email: token.email,
            name: token.name,
          },
          authSecret!,
          { expiresIn: "30d" },
        );
        console.log(accTok);
        session.accessToken = accTok;
        // @ts-ignore
        session.user.id = userId;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        // @ts-ignore
        token.role = user.role;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
