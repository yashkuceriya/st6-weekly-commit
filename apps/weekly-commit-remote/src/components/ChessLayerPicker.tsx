import { useGetChessLayersQuery } from '@st6/api-client';
import { ChessChip, FieldError, Spinner, cn } from '@st6/shared-ui';

interface ChessLayerPickerProps {
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  error?: string;
}

export function ChessLayerPicker({ value, onChange, error }: ChessLayerPickerProps) {
  const { data, isLoading } = useGetChessLayersQuery();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-ink">
        Chess layer <span className="text-claude-500">*</span>
      </label>
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <div className="flex flex-wrap gap-2">
          {(data ?? []).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange(value === cat.id ? null : cat.id)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm transition-all',
                value === cat.id
                  ? 'border-claude-400 bg-claude-50 shadow-soft'
                  : 'border-border bg-white hover:border-border-strong hover:bg-cream-100',
              )}
            >
              <ChessChip label={cat.name} color={cat.color} />
            </button>
          ))}
        </div>
      )}
      <FieldError message={error} />
    </div>
  );
}
