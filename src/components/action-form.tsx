"use client";

import { useActionState, useEffect, useRef } from "react";

type State = { error?: string; ok?: string } | null;

export function ActionForm({
  action,
  children,
  className,
  submitLabel = "Salvar",
}: {
  action: (state: State, formData: FormData) => Promise<State>;
  children: React.ReactNode;
  className?: string;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={formAction} className={className}>
      {children}
      {state?.error ? <p className="text-sm text-negative">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-positive">{state.ok}</p> : null}
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Salvando…" : submitLabel}
      </button>
    </form>
  );
}
