# GRIP - Git Reward & Incentive Platform

Enterprise reward infrastructure for GitHub contributions. Pay contributors instantly with blockchain-backed bounties.

## Features

- **Blockchain-Backed Bounties**: Create and fund bounties on GitHub issues using USDC on Tempo blockchain
- **Passkey Wallet**: Secure, passwordless wallet using WebAuthn (Face ID/Touch ID)
- **Auto-Pay**: Automated bounty payouts with Access Key authorization
- **GitHub Integration**: Native integration with GitHub issues and pull requests
- **Instant Payments**: Direct blockchain payments with sub-second finality

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with Passkey support
- **Blockchain**: Tempo (Layer-1 blockchain for stablecoin payments)
  - TIP-20 tokens (USDC)
  - Payment Lanes for guaranteed low-cost transfers
  - Fee Sponsorship (app pays gas fees)
  - Passkey (P256) native signing
- **Key Management**: Turnkey HSM for backend signing

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- GitHub OAuth App credentials
- Turnkey account (for Access Key auto-signing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/wozhendeai/grip.git
   cd grip
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Required variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`: GitHub OAuth
   - `NEXT_PUBLIC_APP_URL`: Your app URL (https://usegrip.xyz)
   - `NEXT_PUBLIC_RP_ID`: Passkey relying party ID (usegrip.xyz)
   - `TEMPO_RPC_URL`: Tempo blockchain RPC endpoint
   - `TEMPO_USDC_ADDRESS`: USDC token address on Tempo
   - `TURNKEY_ORGANIZATION_ID` / `TURNKEY_API_*`: Turnkey credentials

4. **Run database migrations**
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Development Workflow

### Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run Biome linter
- `pnpm format` - Format code with Biome
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio (database GUI)

### Git Hooks

This project uses Lefthook for automated quality checks:

- **Pre-commit**: Linting, formatting, type checking, migration checks
- **Commit-msg**: Conventional Commits validation
- **Pre-push**: Production build verification

Install hooks: `pnpm hooks:install`

## Project Structure

```
grip/
├── app/                    # Next.js App Router
│   ├── (main)/            # Main app routes
│   │   ├── bounties/      # Bounty management
│   │   ├── wallet/        # Wallet & payments
│   │   ├── settings/      # User settings
│   │   └── [owner]/[repo]/# Repository pages
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # Global React components
│   ├── ui/                # UI primitives (shadcn/ui)
│   └── layout/            # Layout components
├── lib/                   # Utilities & libraries
│   ├── auth/              # Better Auth configuration
│   ├── tempo/             # Tempo blockchain utilities
│   ├── github/            # GitHub API integration
│   └── turnkey/           # Turnkey HSM client
├── db/                    # Database layer
│   ├── schema/            # Drizzle schema definitions
│   └── queries/           # Database queries
├── public/                # Static assets
└── docs/                  # Documentation
```

## Key Concepts

### Bounty Workflow

1. **Create**: Repo owner creates a bounty on a GitHub issue
2. **Fund**: Bounty is funded with USDC (promise model, not escrow)
3. **Claim**: Contributor opens a PR referencing the issue
4. **Complete**: PR is merged on GitHub
5. **Approve**: Funder approves the submission
6. **Payout**: Contributor receives USDC directly to their wallet

### Passkey Wallet

- Users create a wallet using Face ID/Touch ID (WebAuthn)
- Private key never leaves the device
- Passkey public key derives Tempo blockchain address (P-256 curve)
- No seed phrases or passwords required

### Access Keys (Auto-Pay)

- Users can authorize GRIP to sign payouts automatically
- Backend wallet (Turnkey HSM) signs on behalf of user
- Spending limits and expiry enforced on-chain via Tempo's Account Keychain
- Revocable at any time

## Documentation

- [Tempo Blockchain](https://docs.tempo.xyz)
- [Better Auth](https://better-auth.com)
- [Turnkey](https://turnkey.com)
- [Drizzle ORM](https://orm.drizzle.team)

## License

MIT

## Links

- Website: [usegrip.xyz](https://usegrip.xyz)
- Documentation: [docs.usegrip.xyz](https://docs.usegrip.xyz)
- GitHub: [github.com/wozhendeai/grip](https://github.com/wozhendeai/grip)
