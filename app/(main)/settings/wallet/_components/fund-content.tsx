'use client';

import { Button } from '@/components/ui/button';
import { Check, Copy, Droplet, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

interface FundContentProps {
  walletAddress: string;
  onDone?: () => void;
}

export function FundContent({ walletAddress, onDone }: FundContentProps) {
  const [copied, setCopied] = useState(false);
  const [faucetStatus, setFaucetStatus] = useState<'idle' | 'requesting' | 'success' | 'error'>(
    'idle'
  );
  const [faucetMessage, setFaucetMessage] = useState('');

  const isTestnet = process.env.NEXT_PUBLIC_TEMPO_NETWORK === 'testnet';
  const networkName = isTestnet ? 'Tempo Testnet' : 'Tempo';
  const explorerUrl = isTestnet ? 'https://explore.testnet.tempo.xyz' : 'https://explore.tempo.xyz';

  const truncatedAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  async function handleRequestTestTokens() {
    setFaucetStatus('requesting');
    setFaucetMessage('');

    try {
      const res = await fetch('/api/wallet/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await res.json();

      if (res.ok) {
        setFaucetStatus('success');
        setFaucetMessage('Test tokens sent! Balance updates in ~30s');
      } else if (res.status === 429) {
        setFaucetStatus('error');
        const hours = Math.ceil((result.retryAfter || 86400) / 3600);
        setFaucetMessage(`Rate limited. Try again in ${hours}h`);
      } else {
        setFaucetStatus('error');
        setFaucetMessage(result.error || 'Request failed');
      }
    } catch {
      setFaucetStatus('error');
      setFaucetMessage('Network error');
    }
  }

  return (
    <div className="flex flex-col items-center py-2">
      {/* QR Code */}
      <div className="rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
        <QRCodeSVG value={walletAddress} size={120} level="M" marginSize={0} />
      </div>

      {/* Address + Copy */}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleCopy}
        className="mt-4 gap-2 rounded-full px-4"
      >
        <span className="font-mono">{truncatedAddress}</span>
        {copied ? (
          <Check className="h-4 w-4 text-success" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      {/* Network badge */}
      <span className="mt-2 text-xs text-muted-foreground">{networkName}</span>

      {/* Instructions */}
      <p className="mt-4 max-w-[240px] text-center text-sm text-muted-foreground">
        Send USDC to this address to fund your wallet
      </p>

      {/* Explorer link */}
      <a
        href={`${explorerUrl}/address/${walletAddress}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        View on Explorer
        <ExternalLink className="h-3 w-3" />
      </a>

      {/* Testnet Faucet */}
      {isTestnet && (
        <div className="mt-4 flex flex-col items-center gap-1">
          <Button
            variant="link"
            size="sm"
            onClick={handleRequestTestTokens}
            disabled={faucetStatus === 'requesting'}
            className="h-auto gap-1 p-0 text-xs text-muted-foreground"
          >
            <Droplet className="h-3 w-3" />
            {faucetStatus === 'requesting' ? 'Requesting...' : 'Get test tokens'}
          </Button>
          {faucetMessage && (
            <span
              className={`text-xs ${
                faucetStatus === 'success' ? 'text-success' : 'text-destructive'
              }`}
            >
              {faucetMessage}
            </span>
          )}
        </div>
      )}

      {/* Done button */}
      {onDone && (
        <Button variant="ghost" size="sm" onClick={onDone} className="mt-4">
          Done
        </Button>
      )}
    </div>
  );
}
