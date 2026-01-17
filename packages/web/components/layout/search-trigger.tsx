'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export function SearchTrigger() {
  return (
    <Button
      variant="outline"
      className={cn(
        'relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2',
        'text-muted-foreground hover:text-foreground'
      )}
      onClick={() => {
        // In the future, open CommandMenu here
        // setOpen(true)
        console.log('Search clicked');
      }}
    >
      <Search className="h-4 w-4 xl:mr-2" />
      <span className="hidden xl:inline-flex">Search...</span>
      <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 xl:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}
