interface TextAreaFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export default function TextField({ label, value, onChange, placeholder, disabled = false }: TextAreaFieldProps) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500">{label}</label>
            <textarea
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`border border-gray-300 rounded p-1.5 text-sm outline-none focus:border-blue-500 min-h-[100px] transition-colors ${
                    disabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-50'
                }`}
            />
        </div>
    );
}