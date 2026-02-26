import { Home } from "lucide-react"

export default function TermsOfService() {
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Home className="size-3.5" />
            </div>
            <span className="text-sm font-semibold">Acme Inc</span>
          </a>
          <a href="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Back to sign in
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="space-y-2 mb-12">
          <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: February 1, 2026</p>
        </div>

        <div className="space-y-10 text-[15px] leading-relaxed text-foreground/80">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Acme Inc platform (&ldquo;Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Description of Service</h2>
            <p>
              Acme Inc provides a collaborative platform for teams to manage projects, documentation, analytics, and infrastructure. The Service includes web-based tools, APIs, and related documentation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized access to your account.
            </p>
            <p>
              You must provide accurate and complete information when creating an account. Accounts registered with misleading or false information may be terminated without notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Upload or transmit any malicious code, viruses, or harmful data</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by Acme Inc and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              You retain ownership of any content you submit through the Service. By submitting content, you grant us a worldwide, non-exclusive license to use, reproduce, and display such content solely for the purpose of operating the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Payment and Billing</h2>
            <p>
              Certain features of the Service require a paid subscription. You agree to pay all fees associated with your chosen plan. Fees are non-refundable except as required by law or as explicitly stated in our refund policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Termination</h2>
            <p>
              We may terminate or suspend your account at any time, with or without cause, with or without notice. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Limitation of Liability</h2>
            <p>
              In no event shall Acme Inc be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service. Our total liability shall not exceed the amount paid by you in the twelve months preceding the claim.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. Contact</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at{" "}
              <span className="font-medium text-foreground">legal@acme-inc.com</span>.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
