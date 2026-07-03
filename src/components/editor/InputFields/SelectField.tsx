interface SelectFieldProps<T extends string> {
    label: string;
    value: T;
    options: { value: T; label: string }[];
    onChange: (value: T) => void;
    disabled?: boolean;
}

export default function SelectField<T extends string>({ label, value, options, onChange, disabled = false }: SelectFieldProps<T>) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500">{label}</label>
            <select
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value as T)}
                className={`border border-gray-300 rounded p-1.5 text-sm outline-none focus:border-blue-500 transition-colors ${
                    disabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-50'
                }`}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}