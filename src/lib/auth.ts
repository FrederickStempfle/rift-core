import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_APP_CLIENT_ID,
      clientSecret: process.env.GITHUB_APP_CLIENT_SECRET,
      authorization: { params: { scope: "read:user user:email repo" } },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth",
    signOut: "/logout",
  },
  callbacks: {
    jwt({ token, profile, account }) {
      const providerAccountId =
        "providerAccountId" in (account ?? {}) && account?.providerAccountId
          ? String(account.providerAccountId)
          : undefined

      if (profile) {
        token.githubId = String(profile.id ?? providerAccountId ?? token.githubId ?? token.sub ?? "")
        token.login = profile.login as string
        token.avatar_url = profile.avatar_url as string
      }
      if (!token.githubId && providerAccountId) {
        token.githubId = providerAccountId
      }
      if (!token.githubId && token.sub) {
        token.githubId = token.sub
      }
      if (account?.access_token) {
        token.accessToken = account.access_token
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.githubId = (token.githubId as string | undefined) ?? token.sub!
        session.user.login = token.login as string
        session.user.image = token.avatar_url as string
      }
      session.accessToken = token.accessToken as string
      return session
    },
  },
})
