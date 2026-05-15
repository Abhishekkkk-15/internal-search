import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import jwt from "jsonwebtoken";
export const { handlers, auth, signIn, signOut } = NextAuth({
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
  secret:
    process.env.AUTH_SECRET || "fallback_nexus_enterprise_secret_token_key_v2",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.accessToken = jwt.sign(
          {
            sub: token.id,
            id: token.id,
            role: token.role,
            image: token.image || token.picture,
            email: token.email,
            name: token.name,
          },
          process.env.NEXTAUTH_SECRET!,
          { expiresIn: "30d" },
        );
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, account }) {
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
