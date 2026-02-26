"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const plans = [
  {
    name: "Free",
    description: "For individuals and small projects.",
    price: "$0",
    period: "forever",
    cta: "Get started",
    ctaVariant: "outline" as const,
    features: [
      "Up to 3 projects",
      "1 team member",
      "5 GB storage",
      "Basic analytics",
      "Community support",
    ],
  },
  {
    name: "Pro",
    description: "For growing teams that need more power.",
    price: "$19",
    period: "per member / month",
    cta: "Start free trial",
    ctaVariant: "default" as const,
    popular: true,
    features: [
      "Unlimited projects",
      "Up to 25 team members",
      "100 GB storage",
      "Advanced analytics",
      "Priority support",
      "Custom integrations",
      "API access",
    ],
  },
  {
    name: "Enterprise",
    description: "For large organizations with custom needs.",
    price: "$49",
    period: "per member / month",
    cta: "Contact sales",
    ctaVariant: "outline" as const,
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "1 TB storage",
      "Real-time analytics",
      "Dedicated support",
      "SSO & SAML",
      "Custom contracts",
      "SLA guarantee",
    ],
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = React.useState(true)

  return (
    <div className="min-h-svh">
      <main className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center space-y-4 mb-14">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Choose the plan that fits your team. Upgrade or downgrade at any time.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <span className={`text-sm ${!annual ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative h-6 w-11 rounded-full transition-colors ${annual ? "bg-primary" : "bg-input"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${annual ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
            <span className={`text-sm ${annual ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              Annual
            </span>
            {annual && (
              <Badge variant="secondary" className="text-xs">
                Save 20%
              </Badge>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const price = plan.price === "$0"
              ? "$0"
              : annual
                ? `$${Math.round(parseInt(plan.price.slice(1)) * 0.8)}`
                : plan.price

            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-xl border p-6 ${
                  plan.popular ? "border-primary shadow-sm" : ""
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2.5 left-6 text-[11px]">
                    Most popular
                  </Badge>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">{price}</span>
                    {plan.price !== "$0" && (
                      <span className="text-sm text-muted-foreground">
                        /{annual ? "yr" : "mo"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{plan.period}</p>
                </div>

                <Button
                  variant={plan.ctaVariant}
                  className="w-full mb-6"
                >
                  {plan.cta}
                </Button>

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </main>
    </div>
  )
}
