interface NumberFieldProps {
    label: string;
    value: number | undefined;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
}

export default function NumberField({ label, value, onChange, min, max, step = 1, disabled = false }: NumberFieldProps) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500">{label}</label>
            <input
                type="number"
                min={min}
                max={max}
                step={step}
                value={value ?? ''}
                disabled={disabled}
                onChange={(e) => onChange(Number(e.target.value))}
                className={`border border-gray-300 rounded p-1.5 text-sm outline-none focus:border-blue-500 transition-colors ${
                    disabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-50'
                }`}
            />
        </div>
    );
}