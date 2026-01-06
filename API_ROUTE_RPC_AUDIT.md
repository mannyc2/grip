## API Route RPC Audit Report

### Executive Summary
- Total API routes analyzed: 39
- Routes with RPC calls: 4
- Calls recommended for client migration: 0 (migrated in this branch)
- Estimated latency savings: ~0.7-3.0s per request for moved reads + removed server polling (5-60s per request)

### Findings by Route

#### `/api/claim/[token]`
**File**: `app/api/claim/[token]/route.ts`

| RPC Call | Line | Purpose | Decision | Rationale |
|----------|------|---------|----------|-----------|
| `tempoClient.getTransactionCount()` | 193 | Nonce for server-side Access Key signing | KEEP SERVER | Server signs with Access Keys; nonce is required for trusted signing |

**Code**
```ts
const nonce = BigInt(
  await tempoClient.getTransactionCount({
    address: funderWallet.tempoAddress as `0x${string}`,
    blockTag: 'pending',
  })
);
```

#### `/api/payments/direct`
**File**: `app/api/payments/direct/route.ts`

| RPC Call | Line | Purpose | Decision | Rationale |
|----------|------|---------|----------|-----------|
| `tempoClient.getTransactionCount()` | 322 | Nonce for Access Key auto-signing | KEEP SERVER | Server holds Access Key workflow; must sign on backend |

**Code**
```ts
const nonce = BigInt(
  await tempoClient.getTransactionCount({
    address: senderWalletAddress,
    blockTag: 'pending',
  })
);
```

#### `/api/bounties/[id]/approve`
**File**: `app/api/bounties/[id]/approve/route.ts`

| RPC Call | Line | Purpose | Decision | Rationale |
|----------|------|---------|----------|-----------|
| `tempoClient.getTransactionCount()` | 253 | Nonce for Access Key auto-signing | KEEP SERVER | Server signs with Access Keys and broadcasts |

**Code**
```ts
const nonce = BigInt(
  await tempoClient.getTransactionCount({
    address: funderWalletAddress,
    blockTag: 'pending',
  })
);
```

#### `/api/webhooks/github`
**File**: `app/api/webhooks/github/route.ts`

| RPC Call | Line | Purpose | Decision | Rationale |
|----------|------|---------|----------|-----------|
| `tempoClient.getTransactionCount()` | 130 | Nonce for webhook auto-pay signing | KEEP SERVER | Webhook is server-only and signs with Access Key |

**Code**
```ts
const nonce = BigInt(
  await tempoClient.getTransactionCount({
    address: funderWallet.tempoAddress as `0x${string}`,
    blockTag: 'pending',
  })
);
```

### Client-Side Migrations Applied in This Branch

- `/api/wallet/balance` removed; balances now use `Hooks.token.useGetBalance` client-side.
- `/api/wallet/faucet` removed; testnet funding now uses `Hooks.faucet.useFund` client-side.
- `/api/repo-settings/[id]/treasury` now returns address + committed liabilities only; balance reads moved client-side.
- `/api/organizations/[orgId]/wallet` now returns address + token metadata only; balance reads moved client-side.
- `/api/payouts/[id]/confirm` no longer waits for receipts; client sends `blockNumber` + `status` when confirmed.
- `/api/payouts/batch/confirm` no longer waits for receipts; new `/api/payouts/batch/mark-confirmed` handles confirmed updates.
- `/api/payouts/[id]/release` no longer fetches nonce; client must request nonce before signing.

### Migration Patterns

**Pattern: Balance Display**
```ts
const { data: balance } = Hooks.token.useGetBalance({
  account,
  token: TEMPO_TOKENS.USDC,
  query: { refetchInterval: 10_000, staleTime: 10_000 },
});
const { data: metadata } = Hooks.token.useGetMetadata({
  token: TEMPO_TOKENS.USDC,
  query: { staleTime: 86_400_000 },
});
```

**Pattern: Transaction Polling**
```ts
const { data: receipt, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
if (isSuccess && receipt?.blockNumber) {
  fetch(`/api/payouts/${id}/confirm`, {
    method: 'POST',
    body: JSON.stringify({
      txHash,
      status: receipt.status,
      blockNumber: receipt.blockNumber.toString(),
    }),
  });
}
```

**Pattern: Batch Confirmation**
```ts
const { data: receipt, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
if (isSuccess && receipt?.blockNumber) {
  fetch('/api/payouts/batch/mark-confirmed', {
    method: 'POST',
    body: JSON.stringify({
      payoutIds,
      txHash,
      blockNumber: receipt.blockNumber.toString(),
    }),
  });
}
```

**Pattern: Nonce Fetching for Client Signing (Tempo nonce lanes)**
```ts
const nonceKey = 1n;
const nonce = await Actions.nonce.getNonce(config, {
  account: signingAddress,
  nonceKey,
});
```

### Priority Actions

1. Add a lightweight background job to reconcile pending payouts by txHash (defense-in-depth).
2. Consider adding a short-lived confirmation token if you want to avoid trusting client receipts.
