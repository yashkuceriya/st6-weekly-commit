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

/**
 * Searchable tree picker. Only SUPPORTING_OUTCOME nodes are selectable, but
 * each option carries the full breadcrumb so the user sees how their commit
 * maps up to the Rally Cry.
 */
export function StrategicNodePicker({ value, onChange, error }: StrategicNodePickerProps) {
  const { data: tree, isLoading } = useGetStrategicTreeQuery();
  const [query, setQuery] = useState('');

  const flat = useMemo(() => flatten(tree ?? []), [tree]);
  const filtered = useMemo(() => {
    if (!query.trim()) return flat;
    const q = query.trim().toLowerCase();
    return flat.filter((c) => c.searchKey.includes(q));
  }, [query, flat]);

  const selected = flat.find((c) => c.id === value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-ink">
        Supporting Outcome <span className="text-claude-500">*</span>
      </label>
      {selected && (
        <div className="rounded-md border border-claude-200 bg-claude-50 px-3 py-2">
          <Breadcrumb segments={selected.segments} />
        </div>
      )}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search outcomes…"
        className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-ink-subtle focus:border-claude-400"
      />
      <div
        className="max-h-64 overflow-y-auto rounded-md border border-border bg-white"
        role="listbox"
      >
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-sm text-ink-muted">No matching outcomes.</p>
        ) : (
          filtered.slice(0, 50).map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => onChange(choice.id)}
              className={cn(
                'block w-full border-b border-border-subtle px-3 py-2 text-left transition-colors last:border-b-0',
                'hover:bg-cream-100',
                value === choice.id && 'bg-claude-50',
              )}
            >
              <Breadcrumb segments={choice.segments} />
            </button>
          ))
        )}
      </div>
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
