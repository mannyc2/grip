'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { label: 'Open', value: 'open' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const COMMON_LABELS = [
  'bug',
  'feature',
  'documentation',
  'enhancement',
  'help wanted',
  'good first issue',
];

export function BountyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state for immediate UI feedback
  const [minAmount, setMinAmount] = useState(searchParams.get('min') ?? '');
  const [maxAmount, setMaxAmount] = useState(searchParams.get('max') ?? '');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(searchParams.getAll('label'));
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    searchParams.getAll('status').length > 0 ? searchParams.getAll('status') : ['open']
  );

  // Sync state with URL params
  const createQueryString = useCallback(
    (params: Record<string, string | string[] | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
          newSearchParams.delete(key);
        } else if (Array.isArray(value)) {
          newSearchParams.delete(key);
          for (const v of value) {
            newSearchParams.append(key, v);
          }
        } else {
          newSearchParams.set(key, value);
        }
      }

      return newSearchParams.toString();
    },
    [searchParams]
  );

  const applyFilters = useCallback(() => {
    startTransition(() => {
      router.push(
        `/explore?${createQueryString({
          min: minAmount,
          max: maxAmount,
          label: selectedLabels,
          status: selectedStatuses,
        })}`
      );
    });
  }, [router, createQueryString, minAmount, maxAmount, selectedLabels, selectedStatuses]);

  // Debounce applyFilters for text inputs
  useEffect(() => {
    const currentMin = searchParams.get('min') ?? '';
    const currentMax = searchParams.get('max') ?? '';
    const timer = setTimeout(() => {
      if (minAmount !== currentMin || maxAmount !== currentMax) {
        applyFilters();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [minAmount, maxAmount, searchParams, applyFilters]);

  // Immediate apply for checkboxes/selections
  useEffect(() => {
    // Comparison to avoid loops, though router.push usually is fine providing params change
    const currentLabels = searchParams.getAll('label');
    const currentStatuses = searchParams.getAll('status').length
      ? searchParams.getAll('status')
      : ['open'];

    const labelsChanged =
      JSON.stringify(selectedLabels.sort()) !== JSON.stringify(currentLabels.sort());
    const statusesChanged =
      JSON.stringify(selectedStatuses.sort()) !== JSON.stringify(currentStatuses.sort());

    if (labelsChanged || statusesChanged) {
      applyFilters();
    }
  }, [selectedLabels, selectedStatuses, searchParams, applyFilters]);

  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        // "Default to open bounties only" in DB means empty -> open.
        // Let's allow empty to mean default (open).
        return prev.filter((s) => s !== status);
      }
      return [...prev, status];
    });
  };

  return (
    <div className="space-y-10">
      {/* Status */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Status
        </h3>
        <div className="grid gap-3">
          {STATUS_OPTIONS.map((status) => (
            <div key={status.value} className="flex items-center space-x-3 group">
              <Checkbox
                id={`status-${status.value}`}
                checked={selectedStatuses.includes(status.value)}
                onCheckedChange={() => toggleStatus(status.value)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
              />
              <Label
                htmlFor={`status-${status.value}`}
                className="text-sm font-medium text-foreground/80 group-hover:text-foreground cursor-pointer transition-colors"
              >
                {status.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Value Range */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Reward (USDC)
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
              $
            </span>
            <Input
              type="number"
              placeholder="Min"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="h-9 pl-6 text-sm"
            />
          </div>
          <span className="text-muted-foreground text-xs font-medium">TO</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
              $
            </span>
            <Input
              type="number"
              placeholder="Max"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="h-9 pl-6 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Labels
        </h3>
        <div className="flex flex-wrap gap-2">
          {COMMON_LABELS.map((label) => {
            const isSelected = selectedLabels.includes(label);
            return (
              <Badge
                key={label}
                variant={isSelected ? 'secondary' : 'outline'}
                className={cn(
                  'cursor-pointer px-2.5 py-1 text-xs font-medium transition-all hover:bg-muted active:scale-95',
                  isSelected
                    ? 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20'
                    : 'text-muted-foreground hover:text-foreground border-border/50'
                )}
                onClick={() => toggleLabel(label)}
              >
                {label}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Clear Filters (if any active) */}
      {(selectedStatuses.length !== 1 ||
        selectedStatuses[0] !== 'open' ||
        selectedLabels.length > 0 ||
        minAmount ||
        maxAmount) && (
        <Button
          variant="link"
          size="sm"
          className="w-full text-muted-foreground hover:text-destructive h-auto p-0 text-xs font-normal"
          onClick={() => {
            setMinAmount('');
            setMaxAmount('');
            setSelectedLabels([]);
            setSelectedStatuses(['open']);
          }}
        >
          Clear all filters
        </Button>
      )}
    </div>
  );
}
