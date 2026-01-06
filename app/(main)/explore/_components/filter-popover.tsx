'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { SlidersHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { BountyStatus } from '@/lib/types';

const STATUS_OPTIONS: { label: string; value: BountyStatus }[] = [
  { label: 'Open', value: 'open' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const LABEL_OPTIONS = [
  'bug',
  'feature',
  'documentation',
  'enhancement',
  'help wanted',
  'good first issue',
];

interface FilterPopoverProps {
  currentStatus: BountyStatus[];
  currentLabels?: string[];
}

export function FilterPopover({ currentStatus, currentLabels = [] }: FilterPopoverProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const [selectedStatuses, setSelectedStatuses] = useState<BountyStatus[]>(currentStatus);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(currentLabels);
  const [minAmount, setMinAmount] = useState(searchParams.get('min') ?? '');
  const [maxAmount, setMaxAmount] = useState(searchParams.get('max') ?? '');

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

  const applyFilters = () => {
    startTransition(() => {
      const queryString = createQueryString({
        status:
          selectedStatuses.length === 1 && selectedStatuses[0] === 'open' ? null : selectedStatuses,
        label: selectedLabels,
        min: minAmount || null,
        max: maxAmount || null,
      });
      router.push(`/explore${queryString ? `?${queryString}` : ''}`);
      setIsOpen(false);
    });
  };

  const clearFilters = () => {
    setSelectedStatuses(['open']);
    setSelectedLabels([]);
    setMinAmount('');
    setMaxAmount('');
    startTransition(() => {
      router.push('/explore');
      setIsOpen(false);
    });
  };

  const toggleStatus = (status: BountyStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
          'h-9 px-3'
        )}
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-6">
          {/* Status */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </Label>
            <div className="grid gap-2">
              {STATUS_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${option.value}`}
                    checked={selectedStatuses.includes(option.value)}
                    onCheckedChange={() => toggleStatus(option.value)}
                  />
                  <Label
                    htmlFor={`status-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Reward Range */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Reward (USDC)
            </Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                  $
                </span>
                <Input
                  type="number"
                  placeholder="Min"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="h-8 pl-6 text-sm"
                />
              </div>
              <span className="text-muted-foreground text-xs">to</span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                  $
                </span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="h-8 pl-6 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Labels
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {LABEL_OPTIONS.map((label) => {
                const isSelected = selectedLabels.includes(label);
                return (
                  <Badge
                    key={label}
                    variant={isSelected ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer text-xs transition-colors',
                      isSelected ? 'bg-primary hover:bg-primary/90' : 'hover:bg-muted'
                    )}
                    onClick={() => toggleLabel(label)}
                  >
                    {label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={clearFilters}
              disabled={isPending}
            >
              Clear
            </Button>
            <Button size="sm" className="flex-1" onClick={applyFilters} disabled={isPending}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
