# VIA ZTF Security Controls Todo Application

A production-ready Next.js 15 application demonstrating **VIA ZTF passwordless authentication** with a security controls to-do list. Users authenticate via QR code scanning with VIA Wallet, with sessions secured using encrypted HTTP-only cookies and OAuth 2.0 + PKCE flow.

## Features

### 🔐 Passwordless Authentication

- **VIA ZTF Integration**: Scan QR code with VIA Wallet for instant login
- **OAuth 2.0 + PKCE**: Secure authorization without client secrets
- **Quantum-Resistant**: Hybrid cryptographic signatures (CNSA 1.0 + NIST post-quantum)
- **Zero Trust**: No passwords, no phishing risks

### 🔒 Security

- **Encrypted Sessions**: iron-session with AES-256-GCM encryption
- **HTTP-Only Cookies**: XSS protection, no tokens in localStorage
- **Row Level Security**: Supabase RLS ensures data isolation
- **Complete Logout**: 3-layer logout (client, session cookie, Keycloak SSO)
- **Session Monitoring**: Detects wallet-initiated logouts

### 📋 Todo Management

- Create, read, update, delete security control tasks
- Priority levels: Low, Medium, High, Critical
- Categories: Access Control, Encryption, Monitoring, Compliance, etc.
- User-specific data (each user only sees their own tasks)
- Real-time updates with server actions

## Architecture

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Authentication**: Keycloak + VIA ZTF
- **Database**: Supabase (PostgreSQL)
- **Session Management**: iron-session (encrypted cookies)
- **UI**: shadcn/ui + Tailwind CSS (VIA brand colors)
- **Deployment**: Docker containerized

## Getting Started

Follow these steps to get the application running locally.

### 1. Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- VIA Wallet [Mobile App](https://apps.apple.com/id/app/via-wallet/id6479538897)
- Access to a VIA ZTF Keycloak instance

### 2. Clone and Install

```bash
cd /path/to/tutorial-1-Passwordless-Cursor
npm install
```

### 3. Environment Setup

First, copy the example environment file:

```bash
cp .env.example .env.local
```

Next, generate a 32-byte, base64-encoded secret for session encryption:

```bash
openssl rand -base64 32
```

Now, open .env.local and fill in the values. Use the secret you just generated for SESSION_SECRET.

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Keycloak
KEYCLOAK_URL=https://auth.solvewithvia.com/auth
KEYCLOAK_REALM=ztf_demo
KEYCLOAK_CLIENT_ID=localhost-app
NEXT_PUBLIC_KEYCLOAK_URL=https://auth.solvewithvia.com/auth

# Session encryption (use the generated secret above)
SESSION_SECRET=your-generated-secret-here

# Session monitoring (30 seconds)
SESSION_VALIDATION_INTERVAL=30000

# Supabase (will be set after starting Supabase)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from-supabase-start>
SUPABASE_SERVICE_ROLE_KEY=<from-supabase-start>
```

### 4. Start Local Supabase Database

We use the official Supabase CLI to run the full Supabase stack locally via Docker. This provides all Supabase services (auth, storage, realtime, etc.) in one command.

```bash
# Install the Supabase CLI (recommended)
npm install supabase --save-dev

# OR use npx for one-time commands
npx supabase --help

# Initialize Supabase (only needed once per project)
npx supabase init

# Start the full Supabase stack (all services)
npx supabase start
```

**Important:** After running `npx supabase start`, the CLI will display your local credentials. Copy these values into your `.env.local` file:

```env
# Copy these from the supabase start output:
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321  # API URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key-here
SUPABASE_SERVICE_ROLE_KEY=your-secret-key-here
```

**Apply your database schema:**

```bash
# Apply any pending migrations
npx supabase migration up
```

**Supabase Local Services:**

- 🎛️ **Supabase Dashboard**: http://localhost:54323
- 📊 **API Gateway**: http://localhost:54321
- 💾 **Database**: localhost:54322
- 📧 **Inbucket (Email)**: http://localhost:54324

For detailed setup instructions, visit the [Supabase Local Development Guide](https://supabase.com/docs/guides/local-development).

### 5. Start Development Server

```bash
chmod +x check-supabase.sh
```

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 6. How to Authenticate (User Flow)

1. Click "Login with VIA Wallet" on the home page.
2. You'll be redirected to Keycloak login page.
3. Keycloak will display a secure QR code.
4. Open your VIA Wallet mobile app and scan the QR code.
5. Approve the authentication request in your wallet.
6. You will be automatically redirected back to the application dashboard, fully logged in.

## Docker Deployment

### Prerequisites for Docker Deployment

1. **Supabase**: Ensure Supabase is running locally or use a hosted Supabase instance
2. **Environment**: Configure `.env.local` with proper Supabase credentials

### Build and Run with Docker Compose

The `docker-compose.yml` includes only the Next.js application. Supabase runs separately using the official CLI.

```bash
# Start Supabase first (in a separate terminal)
npx supabase start

# Build and start the Next.js application
docker-compose up --build app

# Or run in detached mode
docker-compose up -d --build app

# Stop the application
docker-compose down

# View application logs
docker-compose logs -f app
```

**Note:** The Docker setup expects Supabase to be running on the host machine at `localhost:54321`. The container connects to Supabase via the host network.

### Build Docker Image Only

```bash
docker build -t ztf-security-todo .
docker run -p 3000:3000 --env-file .env.local ztf-security-todo
```

## Project Structure

```
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── login/           # OAuth initiation + PKCE
│   │   │   ├── callback/        # Token exchange
│   │   │   └── logout/          # Complete logout
│   │   └── session/             # Session management
│   │       ├── route.ts         # Get session
│   │       └── validate/        # Validate session
│   ├── dashboard/               # Protected dashboard
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
│
├── components/                   # React components
│   ├── auth/                    # Authentication components
│   │   ├── login-card.tsx       # Login UI
│   │   ├── logout-button.tsx   # Logout with confirmation
│   │   └── session-expired-modal.tsx  # Session expiry notification
│   ├── layout/                  # Layout components
│   │   └── header.tsx           # App header
│   ├── providers/               # Context providers
│   │   └── session-provider.tsx # Session context + monitoring
│   ├── todo/                    # Todo components
│   │   ├── todo-list.tsx        # Todo list container
│   │   ├── todo-item.tsx        # Individual todo
│   │   └── todo-form.tsx        # Create todo form
│   └── ui/                      # shadcn/ui components
│
├── lib/                         # Utility libraries
│   ├── actions/                 # Server actions
│   │   └── todos.ts            # Todo CRUD operations
│   ├── auth/                    # Authentication utilities
│   │   ├── keycloak.ts         # Keycloak client
│   │   ├── pkce.ts             # PKCE generation
│   │   ├── session.ts          # iron-session config
│   │   └── session-validator.ts # Session validation
│   ├── db/                      # Database clients
│   │   ├── supabase.ts         # Server Supabase client
│   │   ├── supabase-browser.ts # Browser client
│   │   └── queries.ts          # DB queries
│   └── utils/                   # Utilities
│       ├── cn.ts               # Class name merger
│       └── validation.ts       # Zod schemas
│
├── types/                       # TypeScript types
│   ├── auth.ts                 # Auth types
│   └── todo.ts                 # Todo types
│
├── supabase/                    # Supabase configuration
│   ├── config.toml             # Local config
│   └── migrations/             # Database migrations
│       └── 001_initial_schema.sql
│
├── middleware.ts                # Next.js middleware
├── docker-compose.yml          # Docker Compose config
├── Dockerfile                  # Docker build
└── nginx.conf                  # Production nginx config
```

## Authentication Flow

### 1. Login Initiation

- User clicks "Login with VIA Wallet"
- App generates PKCE code_verifier and code_challenge
- Redirects to Keycloak with OAuth parameters

### 2. QR Code Scan

- Keycloak displays QR code (via ZTF plugin)
- User scans with VIA Wallet
- Wallet generates Verifiable Presentation
- Verifier validates cryptographically
- Keycloak grants authorization code

### 3. Token Exchange

- App receives authorization code
- Exchanges code + code_verifier for tokens
- Creates/updates user in Supabase
- Stores session in encrypted cookie

### 4. Session Management

- Middleware validates session on protected routes
- Automatically refreshes tokens before expiry
- Client-side monitoring detects wallet-initiated logouts

### 5. Secure Logout

- User-initiated: Confirmation → Clear client state → API call → Keycloak SSO logout
- Wallet-initiated: Session monitoring detects → Show modal → Redirect to login

## Testing

### User-Initiated Logout

1. Log in with VIA Wallet
2. Click "Logout" button
3. Confirm in dialog
4. Verify redirected to Keycloak logout
5. Verify redirected back to login page
6. Try accessing `/dashboard` (should redirect to login)

### Session Invalidation

1. Log in successfully
2. Wait for session validation interval (30s)
3. Simulate token expiry (modify token in DevTools)
4. Wait for next validation check
5. Verify session expired modal appears
6. Verify automatic redirect to login

### Todo Management

1. Create tasks with different priorities
2. Toggle completion status
3. Delete tasks (with confirmation)
4. Verify real-time stats update
5. Filter by All/Active/Completed
6. Open in incognito window (should not see tasks from other users)

## Security Best Practices

✅ **No passwords anywhere** - Passwordless authentication only  
✅ **Encrypted sessions** - AES-256-GCM with iron-session  
✅ **HTTP-only cookies** - XSS protection  
✅ **PKCE flow** - No client secrets  
✅ **Row Level Security** - Supabase RLS policies  
✅ **Complete logout** - Clears app, session, and Keycloak SSO  
✅ **HTTPS in production** - Secure transport  
✅ **Token refresh** - Automatic before expiry

## Troubleshooting

### Supabase Connection Issues

- Ensure Supabase is running: `npx supabase status`
- Check `.env.local` has correct Supabase URL and keys
- Verify database migrations applied: `npx supabase db push`

### Authentication Errors

- Verify Keycloak URL is accessible
- Check client ID matches in Keycloak admin console
- Ensure redirect URI is whitelisted in Keycloak

### Session Expires Immediately

- Check `SESSION_SECRET` is set in `.env.local`
- Verify session secret is at least 32 characters
- Check browser allows cookies

### Docker Build Fails

- Ensure Node.js 18+ is installed
- Check all dependencies in `package.json`
- Try `docker-compose build --no-cache`

## Production Deployment

### Environment Variables

Update `.env.local` for production:

- Set `NEXT_PUBLIC_APP_URL` to your production domain
- Use HTTPS URLs for all services
- Generate new `SESSION_SECRET` for production
- Use Supabase Cloud or production Supabase instance

### Keycloak Configuration

1. Add production redirect URIs to Keycloak client
2. Add production post-logout redirect URI
3. Verify CORS settings allow your domain

### Deploy to Cloud

1. Build Docker image: `docker build -t ztf-todo-app .`
2. Push to container registry (ECR, GCR, Docker Hub)
3. Deploy to cloud platform (AWS ECS, GCP Cloud Run, Azure Container Apps)
4. Configure environment variables
5. Enable HTTPS/SSL
6. Test complete authentication and logout flows

## Contributing

This is a demo application for VIA ZTF integration. For issues or questions:

- VIA ZTF Documentation: See `ZTF-Documentation/` folder
- VIA Support: Contact VIA team
- GitHub Issues: Create an issue in the repository

## License

This project is created for demonstration purposes.

## Acknowledgments

- **VIA Science** for Zero Trust Fabric (ZTF) technology
- **Keycloak** for OAuth/OIDC implementation
- **Supabase** for database and RLS
- **Next.js** team for the amazing framework
- **shadcn/ui** for beautiful UI components
