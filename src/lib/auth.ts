import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

async function refreshGitHubToken(refreshToken: string) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_APP_CLIENT_ID,
      client_secret: process.env.GITHUB_APP_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error_description || data.error)
  }

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in as number),
  }
}

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
    error: "/auth",
  },
  callbacks: {
    async jwt({ token, profile, account }) {
      const providerAccountId =
        "providerAccountId" in (account ?? {}) && account?.providerAccountId
          ? String(account.providerAccountId)
          : undefined

      // Initial sign-in: store GitHub tokens
      if (account) {
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

        token.accessToken = account.access_token!
        token.refreshToken = account.refresh_token ?? undefined
        token.accessTokenExpires = account.expires_at
          ? account.expires_at
          : Math.floor(Date.now() / 1000) + 8 * 3600
        token.error = undefined

        return token
      }

      // Subsequent requests: check if token needs refresh
      if (typeof token.accessTokenExpires === "number") {
        const expiresAt = token.accessTokenExpires
        const now = Math.floor(Date.now() / 1000)
        const buffer = 5 * 60 // refresh 5 minutes before expiry

        if (now < expiresAt - buffer) {
          return token
        }

        if (token.refreshToken) {
          try {
            const refreshed = await refreshGitHubToken(token.refreshToken as string)
            token.accessToken = refreshed.accessToken
            token.refreshToken = refreshed.refreshToken
            token.accessTokenExpires = refreshed.expiresAt
            token.error = undefined
            return token
          } catch {
            token.error = "RefreshTokenError"
            return token
          }
        }

        token.error = "RefreshTokenError"
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
