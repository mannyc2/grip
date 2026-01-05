'use client';

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

interface WithdrawContentProps {
  balance: number;
  onDone?: () => void;
}

export function WithdrawContent({ balance, onDone }: WithdrawContentProps) {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');

  const numericAmount = Number.parseFloat(amount) || 0;
  const isValidAmount = numericAmount > 0 && numericAmount <= balance;
  const isValidAddress = recipient.startsWith('0x') && recipient.length === 42;
  const isReady = isValidAmount && isValidAddress;
  const isSending = status === 'sending';

  const handleMaxClick = () => setAmount(balance.toFixed(2));

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSend = async () => {
    if (!isReady || isSending) return;
    setStatus('sending');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus('error');
  };

  const amountError =
    amount && !isValidAmount
      ? numericAmount > balance
        ? 'Exceeds available balance'
        : undefined
      : undefined;
  const addressError = recipient && !isValidAddress ? 'Enter a valid Tempo address' : undefined;

  return (
    <div className="space-y-4 py-2">
      {/* Amount */}
      <Field>
        <FieldLabel>Amount</FieldLabel>
        <InputGroup className="h-9">
          <InputGroupAddon>$</InputGroupAddon>
          <InputGroupInput
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={handleAmountChange}
            aria-invalid={!!amountError}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton onClick={handleMaxClick}>Max</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>${balance.toFixed(2)} available</FieldDescription>
        {amountError && <FieldError>{amountError}</FieldError>}
      </Field>

      {/* Recipient */}
      <Field>
        <FieldLabel>Recipient</FieldLabel>
        <InputGroup className="h-9">
          <InputGroupInput
            type="text"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            aria-invalid={!!addressError}
            className="font-mono"
          />
        </InputGroup>
        {addressError && <FieldError>{addressError}</FieldError>}
      </Field>

      {/* Send error */}
      {status === 'error' && <FieldError>Withdrawals not yet implemented</FieldError>}

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2">
        <Button className="w-full gap-2" disabled={!isReady || isSending} onClick={handleSend}>
          <ArrowUpRight className="h-4 w-4" />
          {isSending ? 'Sending...' : 'Send'}
        </Button>
        {onDone && (
          <Button variant="ghost" size="sm" onClick={onDone} className="w-full">
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
