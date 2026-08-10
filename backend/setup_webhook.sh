#!/bin/bash
# Verse AI — Stripe Webhook Setup

echo "🔧 Setting up Stripe webhook..."

if ! command -v stripe &> /dev/null; then
  echo "Install Stripe CLI: https://stripe.com/docs/stripe-cli"
  echo "  macOS: brew install stripe/stripe/stripe"
  echo "  Linux: https://github.com/stripe/stripe-cli/releases"
  exit 1
fi

stripe login

echo ""
echo "For local development, run:"
echo "  stripe listen --forward-to localhost:8000/webhook"
echo ""
echo "For production, create a webhook endpoint:"
echo "  stripe webhooks endpoints create --url https://your-domain.com/webhook --events checkout.session.completed"
echo ""
echo "Copy the webhook signing secret (whsec_...) to your .env as STRIPE_WEBHOOK_SECRET"
