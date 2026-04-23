import { useMemo, useState } from 'react';
import type { StrategicNodeWithChildren } from '@st6/shared-types';
import { Breadcrumb, type BreadcrumbSegment, FieldError, Spinner, cn } from '@st6/shared-ui';
import { useGetStrategicTreeQuery } from '@st6/api-client';

interface StrategicNodePickerProps {
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  error?: string;
}

interface FlatChoice {
  id: string;
  segments: BreadcrumbSegment[];
  searchKey: string;
}

export function StrategicNodePicker({ value, onChange, error }: StrategicNodePickerProps) {
  const { data: tree, isLoading } = useGetStrategicTreeQuery();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(!value);

  const flat = useMemo(() => flatten(tree ?? []), [tree]);
  const filtered = useMemo(() => {
    if (!query.trim()) return flat;
    const q = query.trim().toLowerCase();
    return flat.filter((c) => c.searchKey.includes(q));
  }, [query, flat]);

  const selected = flat.find((c) => c.id === value);

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
    setQuery('');
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-ink">
        Supporting Outcome <span className="text-claude-500">*</span>
      </label>

      {/* Selected value — compact display */}
      {selected && !open && (
        <div className="flex items-center justify-between rounded-md border border-claude-200 bg-claude-50 px-3 py-2">
          <Breadcrumb segments={selected.segments} size="sm" />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="ml-3 shrink-0 rounded px-2 py-0.5 text-xs font-medium text-claude-500 transition-colors hover:bg-claude-100"
          >
            Change
          </button>
        </div>
      )}

      {/* Empty state — prompt to pick */}
      {!selected && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-md border border-dashed border-border px-3 py-3 text-left text-sm text-ink-muted transition-colors hover:border-claude-300 hover:bg-cream-50"
        >
          Pick a Supporting Outcome…
        </button>
      )}

      {/* Picker dropdown — only when open */}
      {open && (
        <div className="space-y-2 rounded-md border border-border bg-white p-2 shadow-card">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search outcomes…"
            autoFocus
            className="w-full rounded-md border border-border bg-cream-50 px-3 py-2 text-sm placeholder:text-ink-subtle focus:border-claude-400 focus:bg-white"
          />
          <div className="max-h-48 overflow-y-auto" role="listbox">
            {isLoading ? (
              <div className="flex items-center justify-center p-4"><Spinner /></div>
            ) : filtered.length === 0 ? (
              <p className="p-3 text-sm text-ink-muted">No matching outcomes.</p>
            ) : (
              filtered.slice(0, 50).map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => handleSelect(choice.id)}
                  className={cn(
                    'block w-full rounded-md px-3 py-2 text-left transition-colors',
                    'hover:bg-cream-100',
                    value === choice.id && 'bg-claude-50 ring-1 ring-claude-200',
                  )}
                >
                  <Breadcrumb segments={choice.segments} size="sm" />
                </button>
              ))
            )}
          </div>
          {value && (
            <div className="flex justify-end border-t border-border-subtle pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded px-3 py-1 text-xs font-medium text-ink-muted hover:bg-cream-100"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
      <FieldError message={error} />
    </div>
  );
}

function flatten(roots: StrategicNodeWithChildren[]): FlatChoice[] {
  const out: FlatChoice[] = [];
  function walk(node: StrategicNodeWithChildren, trail: BreadcrumbSegment[]) {
    const segs: BreadcrumbSegment[] = [
      ...trail,
      { id: node.id, label: node.title, type: node.type },
    ];
    if (node.type === 'SUPPORTING_OUTCOME') {
      out.push({
        id: node.id,
        segments: segs,
        searchKey: segs.map((s) => s.label.toLowerCase()).join(' '),
      });
    }
    for (const c of node.children) walk(c, segs);
  }
  for (const r of roots) walk(r, []);
  return out;
}
