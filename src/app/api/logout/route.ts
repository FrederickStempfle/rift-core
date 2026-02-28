import { signOut } from "@/lib/auth"
import { revokeRiftSession } from "@/lib/rift"

export async function POST() {
  await revokeRiftSession()
  await signOut({ redirect: false })
  return Response.json({ ok: true })
}
