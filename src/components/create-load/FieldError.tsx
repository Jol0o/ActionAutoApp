"use client";

interface FieldErrorProps {
  error?: string;
  touched?: boolean;
  className?: string;
}

export function FieldError({ error, touched = true, className = '' }: FieldErrorProps) {
  if (!error || !touched) return null;

  return (
    <p className={`text-red-600 text-sm mt-1 ${className}`}>
      {error}
    </p>
  );
}
