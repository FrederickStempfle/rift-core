"use client"

import * as React from "react"
import { Home, Eye, EyeOff, ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"

type Step = "credentials" | "otp" | "forgot" | "reset" | "reset-success"

export default function AuthPage() {
  return (
    <React.Suspense>
      <AuthPageInner />
    </React.Suspense>
  )
}

function AuthPageInner() {
  const [isSignUp, setIsSignUp] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [step, setStep] = React.useState<Step>("credentials")
  const [otp, setOtp] = React.useState("")
  const [email, setEmail] = React.useState("")
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignUp) return
    setStep("otp")
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep("reset")
  }

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep("reset-success")
  }

  const handleBackToSignIn = () => {
    setStep("credentials")
    setOtp("")
  }

  return (
    <div className="flex min-h-svh">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between border-r bg-muted/30 p-10">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Home className="size-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Acme Inc</span>
        </div>

        <div className="space-y-6">
          <blockquote className="space-y-4">
            <p className="text-[22px] font-medium leading-relaxed tracking-tight text-foreground/90">
              &ldquo;This platform has completely transformed how our team collaborates. The intuitive design makes everything feel effortless.&rdquo;
            </p>
            <footer className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">JD</span>
              </div>
              <div>
                <p className="text-sm font-medium">Jane Doe</p>
                <p className="text-xs text-muted-foreground">Head of Engineering, Vercel</p>
              </div>
            </footer>
          </blockquote>
        </div>

        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Acme Inc. All rights reserved.
        </p>
      </div>

      {/* Right panel — auth form */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between items-center p-6 lg:p-8">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Home className="size-3.5" />
            </div>
            <span className="text-sm font-semibold">Acme Inc</span>
          </div>
          <div className="ml-auto">
            {step === "credentials" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? "Sign in" : "Create account"}
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-[360px] space-y-8">

            {/* Sign in / Sign up */}
            {step === "credentials" && (
              <>
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {isSignUp ? "Create an account" : "Welcome back"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {isSignUp
                      ? "Enter your details to get started."
                      : "Enter your credentials to continue."}
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="h-10 w-full"
                    type="button"
                    onClick={() => signIn("github", { callbackUrl })}
                  >
                    <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    Continue with GitHub
                  </Button>

                  <div className="relative">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
                      or
                    </span>
                  </div>

                  <form className="space-y-3" onSubmit={handleSignIn}>
                    {isSignUp && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label htmlFor="firstName" className="text-sm font-medium">
                            First name
                          </label>
                          <Input id="firstName" placeholder="Jane" className="h-10" />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="lastName" className="text-sm font-medium">
                            Last name
                          </label>
                          <Input id="lastName" placeholder="Doe" className="h-10" />
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="text"
                        placeholder="jane@example.com"
                        className="h-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-medium">
                          Password
                        </label>
                        {!isSignUp && (
                          <button
                            type="button"
                            onClick={() => setStep("forgot")}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                          className="h-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <Button className="h-10 w-full" type="submit">
                      {isSignUp ? "Create account" : "Sign in"}
                    </Button>
                  </form>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  By continuing, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="underline underline-offset-4 hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="underline underline-offset-4 hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </>
            )}

            {/* 2FA OTP */}
            {step === "otp" && (
              <>
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Two-factor authentication
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code from your authenticator app
                    {email && (
                      <>
                        {" "}for <span className="font-medium text-foreground">{email}</span>
                      </>
                    )}
                    .
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleVerifyOtp}>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="size-12 text-lg" />
                        <InputOTPSlot index={1} className="size-12 text-lg" />
                        <InputOTPSlot index={2} className="size-12 text-lg" />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} className="size-12 text-lg" />
                        <InputOTPSlot index={4} className="size-12 text-lg" />
                        <InputOTPSlot index={5} className="size-12 text-lg" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button className="h-10 w-full" type="submit" disabled={otp.length < 6}>
                    Verify
                  </Button>
                </form>

                <div className="space-y-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Didn&apos;t receive a code?{" "}
                    <button className="underline underline-offset-4 hover:text-foreground transition-colors">
                      Resend
                    </button>
                  </p>
                  <button
                    onClick={handleBackToSignIn}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="size-3" />
                    Back to sign in
                  </button>
                </div>
              </>
            )}

            {/* Forgot password */}
            {step === "forgot" && (
              <>
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Forgot your password?
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Enter your email and we&apos;ll send you a link to reset your password.
                  </p>
                </div>

                <form className="space-y-4" onSubmit={handleForgotSubmit}>
                  <div className="space-y-1.5">
                    <label htmlFor="forgot-email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="forgot-email"
                      type="text"
                      placeholder="jane@example.com"
                      className="h-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <Button className="h-10 w-full" type="submit">
                    Send reset link
                  </Button>
                </form>

                <button
                  onClick={handleBackToSignIn}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="size-3" />
                  Back to sign in
                </button>
              </>
            )}

            {/* Reset password */}
            {step === "reset" && (
              <>
                <div className="space-y-2">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted mb-4">
                    <Mail className="size-5 text-muted-foreground" />
                  </div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Check your email
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    We sent a reset link to{" "}
                    <span className="font-medium text-foreground">{email || "your email"}</span>.
                    Click the link to continue.
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    For this demo, click below to simulate opening the reset link.
                  </p>
                  <Button
                    variant="outline"
                    className="h-10 w-full"
                    onClick={() => setStep("reset-success")}
                  >
                    Open reset link
                  </Button>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Didn&apos;t receive the email?{" "}
                    <button className="underline underline-offset-4 hover:text-foreground transition-colors">
                      Resend
                    </button>
                  </p>
                  <button
                    onClick={handleBackToSignIn}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="size-3" />
                    Back to sign in
                  </button>
                </div>
              </>
            )}

            {/* New password form */}
            {step === "reset-success" && (
              <>
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Set a new password
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Your new password must be different from your previous password.
                  </p>
                </div>

                <form className="space-y-3" onSubmit={handleResetSubmit}>
                  <div className="space-y-1.5">
                    <label htmlFor="new-password" className="text-sm font-medium">
                      New password
                    </label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                        className="h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="confirm-password" className="text-sm font-medium">
                      Confirm password
                    </label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                        className="h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="pt-1">
                    <Button className="h-10 w-full" type="submit">
                      Reset password
                    </Button>
                  </div>
                </form>

                <button
                  onClick={handleBackToSignIn}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="size-3" />
                  Back to sign in
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
