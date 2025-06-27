# Fullstack AI Web Template

A complete web application template that includes everything you need to build and launch a modern website or web app. This template comes with user accounts, payments, AI features, and much more already built in!

## 🎯 What You Get

This template gives you a professional website with:
- ✅ User accounts (sign up, login, password reset)
- ✅ Payment processing (subscriptions and one-time payments)
- ✅ AI chat features (like ChatGPT)
- ✅ File uploads and storage
- ✅ Email sending
- ✅ Analytics and user tracking
- ✅ Team/organization features
- ✅ Security and spam protection

## 🚀 Getting Started (No Technical Experience Required!)

Don't worry if you've never built a website before! We've made this as simple as possible. You'll use an AI assistant (like ChatGPT) to help you through every step.

### Step 1: Get Help from AI

Copy the entire prompt below and paste it into [ChatGPT](https://chat.openai.com), [Claude](https://claude.ai), or any other AI assistant:

---

**COPY EVERYTHING BELOW THIS LINE:**

```
<system>
You are a senior software engineer and mentor who is mentoring me through the process of getting my first full stack application up and running in Supabase with Cloudflare Pages. Do not answer everything all at once,
walk me through one step at a time and wait for my confirmation before continuing.
</system>

I need help setting up a web application using https://github.com/jpteasdale/fullstack-ai-web-template from GitHub. I have little to no technical experience and need detailed, step-by-step guidance.


Here's what I need to accomplish:

1. **Initial Setup**
   - Install required software on my computer (Node.js v22+, Docker Desktop, Git, direnv)
   - Clone the template from GitHub
   - Set up my development environment

2. **Create Required Accounts and Collect Information**
   
   **Supabase Account** (Database & Authentication)
   - Create a new project at supabase.com
   - Collect these values:
     - Project URL (found in: Settings > Configuration > Project URL)
     - Anon Key (found in: Settings > Configuration > Project API keys > anon)
     - Service Role Key (found in: Settings > Configuration > Project API keys > service_role) 
     - Project ID (found in: Settings > General > Project ID)
     - Database Password (the one you created when setting up the project)
     - Region (shown in your project URL, like 'aws-0-us-east-1')
   
   **Cloudflare Account** (Website Hosting)
   - Create account at cloudflare.com
   - Create an API Token:
     - Go to Profile > API Tokens > Create Token
     - Use the "Edit Cloudflare Workers" template
     - Save the API token (you can't see it again!)
   
   **Stripe Account** (Payment Processing)
   - Create account at stripe.com
   - Collect:
     - Secret Key (found in: Developers > API keys > Secret key)
     - After deployment, will need to create webhook:
       - Endpoint URL: https://[your-domain]/api/webhooks/stripe
       - Events to select: all events starting with "customer.subscription." and "checkout.session.completed"
       - Save the webhook signing secret
   
   **PostHog Account** (Analytics)
   - Create account at posthog.com
   - Create a new project
   - Collect: Project API Key (found in: Settings > Project API Key)
   
   **OpenAI Account** (AI Features)
   - Create account at platform.openai.com
   - Generate API key: API keys > Create new secret key
   - Save the key (you can't see it again!)
   
   **AWS Account** (Email Sending)
   - Create AWS account
   - Set up SES (Simple Email Service):
     - Choose a region (like us-east-1)
     - Verify your email address or domain
     - Create an IAM user with "AmazonSESFullAccess" policy
     - Generate access keys for the IAM user
     - Collect: Access Key ID and Secret Access Key

3. **Configuration**
   - Replace these placeholders throughout the codebase:
     - `fullstack-ai-web-template` → your project name (use hyphens, no spaces)
     - `template.johnteasdale.com` → your domain (without https://)
     - `TODO_SUPABASE_PROJECT_ID` → your actual Supabase project ID
   - Set up environment variables in .envrc file
   - Initialize the project with provided scripts

4. **Local Development**
   - Start Supabase locally with Docker
   - Run the website on your computer
   - Test user registration, login, and basic features

5. **Deployment**
   - Deploy database schema to Supabase
   - Deploy Durable Objects to Cloudflare
   - Deploy website to Cloudflare Pages
   - Configure custom domain
   - Set up production environment variables
   - Configure Supabase email webhook
   - Test everything is working

**My Current Situation:**
- Operating System: [Tell the AI: Windows, Mac, or Linux]
- Technical Experience: Beginner/None
- Domain Name: [Tell the AI: Do you have one already, or need help getting one?]
- Project Name: [Tell the AI: What do you want to call your website?]
- GitHub Repository: [Tell the AI: The URL of your cloned repository]

**Environment Variables I'll Need to Set:**
For local development (.envrc file):
- SUPABASE_ACCESS_TOKEN (for Supabase CLI)
- SUPABASE_PROJECT_ID
- SUPABASE_DB_PASSWORD
- SUPABASE_REGION
- SUPABASE_AUTH_HOOK_SECRET (you'll generate this)
- CLOUDFLARE_API_TOKEN

For production (in Cloudflare):
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- POSTHOG_API_KEY
- OPENAI_API_KEY
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- AWS_SES_FROM_EMAIL
- SUPABASE_AUTH_HOOK_SECRET
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_BUCKET_NAME

Please provide:
1. Very detailed, click-by-click instructions for each step
2. Explanations of what each step does in simple terms
3. What to do if something goes wrong
4. How to verify each step worked correctly
5. Exact commands I need to type (and explain what they do)

Please start by helping me with the very first step and wait for me to confirm it's complete before moving to the next step.
```

**COPY EVERYTHING ABOVE THIS LINE**

---

### Step 2: Follow Along

The AI will guide you through each step. Here's what to expect:

1. **Software Installation** - The AI will help you install the necessary programs on your computer
2. **Account Creation** - You'll create accounts with various services (all have free tiers to start)
3. **Configuration** - The AI will help you connect everything together
4. **Testing** - You'll run the website on your computer to make sure it works
5. **Going Live** - The AI will help you put your website on the internet

### Step 3: Customization

Once your website is running, you can ask the AI to help you:
- Change colors and styling
- Add new pages
- Modify features
- Set up your payment plans
- Customize emails
- And much more!

## 💡 Tips for Success

1. **Take it slow** - There's no rush. Each step builds on the previous one.
2. **Ask questions** - If the AI uses a term you don't understand, ask for clarification.
3. **Copy/paste carefully** - Many steps involve copying and pasting commands or code. Be precise!
4. **Save your progress** - Keep a document with all your account credentials and important information.

## 🆘 Getting Help

If you get stuck:
1. Tell the AI exactly what error message you're seeing
2. Share screenshots if possible
3. Describe what you expected to happen vs. what actually happened

## 💰 Costs

Most services have free tiers that are perfect for getting started:
- **Supabase**: Free for small projects
- **Cloudflare**: Free website hosting
- **Stripe**: Only charges when you make money
- **PostHog**: Free for up to 1M events/month
- **OpenAI**: Pay only for what you use
- **AWS Email**: Very cheap (fractions of a cent per email)

You can run everything for free or very cheaply while getting started!

## 🎉 What's Next?

After setup, you'll have:
- A real website live on the internet
- Users can create accounts and log in
- You can accept payments
- AI features are ready to use
- Everything is secure and professional

The beauty of this template is that all the hard technical work is already done. You just need to customize it for your specific needs!

## 📝 Notes

- This template is based on modern, professional web technologies
- It's the same foundation used by many successful startups
- You own all the code and can modify anything
- No monthly fees to use the template itself

---

**Remember**: Every expert was once a beginner. Take it one step at a time, and you'll have your professional web application up and running before you know it! 🚀

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




