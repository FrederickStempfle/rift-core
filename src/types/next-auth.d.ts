import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      githubId: string
      login: string
    } & DefaultSession["user"]
    accessToken: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    githubId: string
    login: string
    avatar_url: string
    accessToken: string
    refreshToken?: string
    accessTokenExpires?: number
    error?: string
  }
}
