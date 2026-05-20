import { useCallback, useState } from "react";

/**
 * Wraps an async submit handler with a loading flag and
 * a stable callback. Designed to be used with React Hook Form's
 * `handleSubmit(onSubmit)` to keep button states in sync.
 *
 * Replace the simulated delay with a real API call (fetch, axios,
 * tRPC, Firebase, Supabase, etc.) when integrating a backend.
 */
export function useAuthSubmit<TValues>(
  onSubmit: (values: TValues) => Promise<void> | void
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submit = useCallback(
    async (values: TValues) => {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        await onSubmit(values);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit]
  );

  return { submit, isSubmitting, submitError, setSubmitError };
}
