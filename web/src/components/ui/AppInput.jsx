/**
 * AppInput — labeled text input, mirrors the mobile AppInput component.
 *
 * @param {{ label?: string, error?: string, hint?: string, className?: string } & React.InputHTMLAttributes<HTMLInputElement>} props
 */
export function AppInput({ label, error, hint, className = '', ...props }) {
    return (
        <div>
            {label && (
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
            )}
            <input
                className={[
                    'w-full rounded-xl border px-4 py-3 text-sm text-gray-900 outline-none transition-colors',
                    'focus:ring-2 focus:ring-amber-300 focus:border-amber-300',
                    error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
                    className,
                ].join(' ')}
                {...props}
            />
            {error ? (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            ) : hint ? (
                <p className="mt-1 text-xs text-gray-400">{hint}</p>
            ) : null}
        </div>
    );
}
