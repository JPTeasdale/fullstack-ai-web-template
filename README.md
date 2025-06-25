# Fullstack AI Web Template

A production-ready, enterprise-grade fullstack web application template built with modern technologies and best practices. Go from zero to deployed in minutes with authentication, payments, AI integration, and scalable infrastructure already configured.

## 🚀 What This Template Includes

### Frontend
- **SvelteKit 5** - Modern, fast web framework with TypeScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn/ui Components** - Beautiful, accessible UI components
- **PostHog Analytics** - Product analytics, session replays, feature flags, A/B testing, error tracking, and surveys

### Backend & Infrastructure
- **Cloudflare Workers** - Edge computing with global distribution and 99.9% uptime
- **Supabase** - PostgreSQL database with authentication, real-time subscriptions, and storage
- **Durable Objects** - Stateful serverless computing for rate limiting and session management
- **R2 Storage** - Object storage for file uploads

### Authentication & Security
- **Supabase Auth** - Complete authentication system with email/password, OAuth providers
- **Custom Email Templates** - Professional transactional emails via AWS SES
- **Row Level Security (RLS)** - Database-level security policies
- **Rate Limiting** - DDoS protection with Cloudflare Durable Objects
- **Secure Secret Management** - Environment-based configuration

### Payments & Billing
- **Stripe Integration** - Subscription management, one-time payments, webhooks
- **Organizations & Teams** - Multi-tenant architecture with team management
- **Usage-based Billing** - Ready for SaaS monetization

### AI Integration
- **OpenAI API** - Chat interface with function calling and structured outputs
- **Streaming Responses** - Real-time AI responses with proper error handling
- **Custom AI Components** - Pre-built chat UI with typing indicators

### Developer Experience
- **TypeScript** - End-to-end type safety
- **Testing Suite** - Unit tests (Vitest), E2E tests (Playwright)
- **CI/CD Ready** - GitHub Actions compatible
- **Hot Module Replacement** - Fast development iteration
- **Database Migrations** - Version-controlled schema changes

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js** (v22 or higher) - [Download](https://nodejs.org/) I recommend using [fnm](https://github.com/Schniz/fnm) to install and manage node versions. 
- **npm** (comes with Node.js)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/) (for local Supabase)
- **Git** - [Download](https://git-scm.com/)
- **direnv** (recommended) - [Install guide](https://direnv.net/docs/installation.html) for tracking per-project environmet variables used on the command line

## 🛠️ Initial Setup

### 1. Clone and Configure

From GitHub, click `Use this template > Create a new repository` and create a copy of the tempalte. 

Then git clone your repository to your development machine. 

### 2. Create Required Accounts

You'll need accounts for the following services:

#### Supabase (Database & Auth)
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. From your project dashboard, collect:
   - Project URL: `Settings > Configuration > Project URL`
   - Anon Key: `Settings > Configuration > Project API keys > anon`
   - Service Role Key: `Settings > Configuration > Project API keys > service_role`
   - Project ID: `Settings > General > Project ID`
   - Database Password: The one you set during project creation

#### Cloudflare (Hosting & Edge Computing)
1. Create account at [cloudflare.com](https://cloudflare.com)
2. Add your domain (if you have one)
3. Go to `Profile > API Tokens > Create Token`
4. Use "Edit Cloudflare Workers" template
5. Save the API token

#### Stripe (Payments)
1. Create account at [stripe.com](https://stripe.com)
2. From Dashboard, get:
   - Secret Key: `Developers > API keys > Secret key`
   - Create a webhook endpoint: `Developers > Webhooks > Add endpoint`
   - Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
   - Select events: `customer.subscription.*`, `checkout.session.completed`
   - Save the webhook signing secret

#### PostHog (Analytics)
1. Create account at [posthog.com](https://posthog.com)
2. Create a project
3. Get your Project API Key from `Settings > Project API Key`

#### OpenAI (AI Features)
1. Create account at [platform.openai.com](https://platform.openai.com)
2. Generate API key: `API keys > Create new secret key`

#### AWS (Email Sending)
1. Create AWS account
2. Set up SES (Simple Email Service) in your preferred region
3. Verify your domain or email addresses
4. Create IAM user with `AmazonSESFullAccess` policy
5. Generate access keys for the IAM user

### 3. Global Find & Replace

Replace these placeholders throughout the codebase:
- `fullstack-ai-web-template` → `your-project-name` (hyphenated)
- `template.johnteasdale.com` → `your-domain.com` (no https://)
- `TODO_SUPABASE_PROJECT_ID` → Your Supabase project ID

### 4. Environment Configuration

```bash
# Copy the example environment file
cp .envrc.example .envrc

# Edit .envrc with your values
# Make sure to fill in ALL the TODO values
```

Your `.envrc` should contain:
```bash
export SUPABASE_ACCESS_TOKEN=your_token_here
export SUPABASE_PROJECT_ID=your_project_id
export SUPABASE_DB_PASSWORD=your_db_password
export SUPABASE_REGION=your_region # e.g., aws-0-us-east-1
export SUPABASE_AUTH_HOOK_SECRET=your_webhook_secret
export CLOUDFLARE_API_TOKEN=your_cf_token
```

### 5. Initialize the Project

```bash
# Load environment variables
direnv allow

# Initialize Supabase and link to your project
./scripts/init.sh

# Start local Supabase
npm run db

# Initialize secrets for local development
npm run init:env
```

## 🚀 Local Development

### Starting the Development Environment

```bash
# Terminal 1: Start Supabase (PostgreSQL, Auth, Storage)
npm run db

# Terminal 2: Start the web application
cd web
npm run dev

# Terminal 3 (Optional): Start Stripe webhook listener
npm run stripe

# The app will be available at http://localhost:5173
```

### Development Workflow

1. **Database Changes**
   ```bash
   # Create a new migration
   supabase migration new your_migration_name
   
   # Apply migrations
   supabase db reset
   
   # Regenerate Supabase types 
   npm run db:changed
   ```

2. **Testing**
   ```bash
   # Run unit tests
   cd web
   npm run test:unit
   
   # Run E2E tests
   npm run test:e2e
   
   # Run all tests
   npm run test
   ```

## 🌐 Production Deployment

### 1. Prepare Secrets for Production

```bash
# Set production secrets in Cloudflare
npm run init:env:prod
```

This will prompt you for all required secrets and set them in Cloudflare Workers.

### 2. Set Up Supabase Webhooks

1. Go to Supabase Dashboard > Authentication > Hooks
2. Add new "Send Email" hook
3. Set URL: `https://your-domain.com/api/webhooks/supabase/auth_email`
4. Generate and save the webhook secret

### 3. Deploy Database

```bash
# Push database schema to production
npm run db:push
```

### 4. Deploy Durable Objects Worker

```bash
cd workers/durable-objects
npm run deploy
```

### 5. Deploy to Cloudflare

#### Option A: GitHub Integration (Recommended)
1. Push your code to GitHub
2. In Cloudflare Dashboard:
   - Go to `Workers & Pages > Create > Pages`
   - Connect your GitHub repository
   - Set build command: `cd web && npm install && npm run build`
   - Set build output directory: `web/.svelte-kit/cloudflare`
   - Deploy

#### Option B: Manual Deployment
```bash
cd web
npm run build
npx wrangler pages deploy .svelte-kit/cloudflare --project-name=your-project-name
```

### 6. Configure Custom Domain

1. In Cloudflare Dashboard > Workers & Pages > Your Project
2. Go to Custom Domains tab
3. Add your domain
4. Update DNS records as instructed

### 7. Post-Deployment Setup

1. **Update Supabase URLs**
   - Go to Supabase > Authentication > URL Configuration
   - Set Site URL: `https://your-domain.com`
   - Add redirect URLs as needed

2. **Configure Stripe Webhooks**
   - Update webhook endpoint URL to production domain
   - Test webhook with Stripe CLI

3. **Verify Email Sending**
   - Ensure AWS SES is in production mode (not sandbox)
   - Test authentication emails

## 📁 Project Structure

```
fullstack-web-template/
├── web/                    # SvelteKit application
│   ├── src/
│   │   ├── routes/        # Page routes and API endpoints
│   │   │   ├── ai/        # AI integration (OpenAI)
│   │   │   ├── components/# Reusable UI components
│   │   │   ├── server/    # Server-side utilities
│   │   │   └── types/     # TypeScript type definitions
│   │   └── app.css        # Global styles
│   ├── static/            # Static assets
│   └── wrangler.toml      # Cloudflare Workers config
├── supabase/              # Database configuration
│   ├── migrations/        # Database migrations
│   ├── seeds/            # Seed data (for local dev)
│   └── config.toml       # Supabase configuration
├── workers/               # Cloudflare Workers
│   ├── durable-objects/  # Rate limiting, sessions
│   └── supabase-keepalive/ # Keep Supabase from turning off due to free tier
├── scripts/              # Automation scripts (called from npm)
└── package.json         # Root package configuration
```

## 🔧 Common Tasks

### Adding New Environment Variables

1. Add to `web/.env` for local development server
2. Add to `web/secrets.jsonc` for documentation
3. Run `npm run init:env:prod` to set in production


### Adding UI Components

```bash
cd web
npm run shad:add button  # Add specific component
```

### Database Schema Changes

1. Create SQL migration with `npx supabase migrations new`
   2. Option B Make changes in Supabase Studio (local) and generate migration: `npx supabase db diff -f your_change`
3. Apply Locally: `npx supabase db reset`
4. Deploy: `npm run db:push`

## 🐛 Troubleshooting

### Local Development Issues

**Supabase won't start**
```bash
# Reset Docker and try again
docker system prune -a
npm run db
```

**Type errors after database changes**
```bash
# Regenerate types
npm run db:changed
```

**Email not sending locally**
- Check Inbucket at http://localhost:54324
- Ensure SUPABASE_AUTH_HOOK_SECRET is set correctly

### Production Issues

**Deployment fails**
- Check Cloudflare Pages build logs
- Ensure all secrets are set: `wrangler secret list`
- Verify Node.js version matches

**Auth emails not sending**
- Verify AWS SES is configured
- Check Supabase webhook logs
- Ensure webhook secret matches

## 📚 Additional Resources

- [SvelteKit Documentation](https://svelte.dev/docs/kit)
- [Supabase Documentation](https://supabase.com/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Stripe Documentation](https://docs.stripe.com)
- [PostHog Documentation](https://posthog.com/docs)

## 🤝 Support

- Create an issue on GitHub
- Check existing issues for solutions
- Join our Discord community (coming soon)

## 📄 License

MIT License - feel free to use this template for any project!




