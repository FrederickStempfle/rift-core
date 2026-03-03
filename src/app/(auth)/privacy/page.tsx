import Link from "next/link"
import { Home } from "lucide-react"

export default function PrivacyPolicy() {
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Home className="size-3.5" />
            </div>
            <span className="text-sm font-semibold">Acme Inc</span>
          </Link>
          <Link
            href="/auth"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="space-y-2 mb-12">
          <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: February 1, 2026</p>
        </div>

        <div className="space-y-10 text-[15px] leading-relaxed text-foreground/80">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p>
              We collect information you provide directly, such as your name, email address, and payment information when you create an account or subscribe to our Service.
            </p>
            <p>We also automatically collect certain information, including:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Device information (browser type, operating system, device identifiers)</li>
              <li>Usage data (pages visited, features used, timestamps)</li>
              <li>IP address and approximate location</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and security alerts</li>
              <li>Respond to your comments, questions, and support requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent or unauthorized activity</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share your information with third parties only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>With your consent or at your direction</li>
              <li>With service providers who assist in operating the Service</li>
              <li>To comply with legal obligations or respond to lawful requests</li>
              <li>To protect the rights, privacy, safety, or property of Acme Inc and our users</li>
              <li>In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide the Service. We may also retain certain information as required by law or for legitimate business purposes, such as resolving disputes and enforcing our agreements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to or restrict processing of your information</li>
              <li>Request portability of your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at{" "}
              <span className="font-medium text-foreground">privacy@acme-inc.com</span>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Cookies</h2>
            <p>
              We use cookies and similar technologies to collect usage information and provide a better experience. You can control cookies through your browser settings. Disabling cookies may affect the functionality of the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for individuals under the age of 16. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will take steps to delete it promptly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &ldquo;Last updated&rdquo; date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">10. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <span className="font-medium text-foreground">privacy@acme-inc.com</span>.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
