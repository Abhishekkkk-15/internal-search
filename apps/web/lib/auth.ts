import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import jwt from "jsonwebtoken";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@nexus/database";

const authSecret = process.env.NEXTAUTH_SECRET;
console.log(authSecret);
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "mock_github_id_placeholder",
      clientSecret:
        process.env.GITHUB_SECRET || "mock_github_secret_placeholder",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock_google_id_placeholder",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET || "mock_google_secret_placeholder",
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
