/**
 * Tiny className joiner that accepts strings, falsy values, and arrays.
 * Avoids pulling in `clsx`/`tailwind-merge` to keep the project minimal,
 * while still giving us conditional class composition for NativeWind.
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];

  const walk = (value: ClassValue) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (typeof value === "string" || typeof value === "number") {
      out.push(String(value));
    }
  };

  inputs.forEach(walk);
  return out.join(" ");
}
