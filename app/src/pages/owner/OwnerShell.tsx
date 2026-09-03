import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Field, Notice, inputClass } from '../../components/ui';
import { ApiError, OWNER_SIGNED_OUT, callOwner, ownerToken } from '../../lib/api';

/** One shared password. No roles, no accounts — that is the whole auth model. */
export function OwnerGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(() => Boolean(ownerToken.get()));

  useEffect(() => {
    const onSignedOut = () => setAuthed(false);
    window.addEventListener(OWNER_SIGNED_OUT, onSignedOut);
    return () => window.removeEventListener(OWNER_SIGNED_OUT, onSignedOut);
  }, []);

  if (authed) return <>{children}</>;
  return <Login onDone={() => setAuthed(true)} />;
}

function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    try {
      const res = await callOwner<{ token: string }>('login', { password });
      ownerToken.set(res.token);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5">
      <h1 className="font-display text-3xl font-bold text-brand">Ruchitva</h1>
      <p className="mb-6 text-sm text-ink-soft">Kitchen owner sign in</p>
      <Card>
        <Field label="Password" error={error || undefined}>
          <input
            type="password"
            className={inputClass}
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </Field>
        <Button full className="mt-3" onClick={submit} disabled={busy || !password}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </Card>
      <Link to="/" className="mt-6 text-center text-sm text-ink-soft underline">
        Back to the customer site
      </Link>
    </div>
  );
}

export function OwnerShell({
  title,
  children,
  home,
}: {
  title: string;
  children: ReactNode;
  home?: boolean;
}) {
  const navigate = useNavigate();

  const signOut = useCallback(() => {
    ownerToken.clear();
    window.dispatchEvent(new Event(OWNER_SIGNED_OUT));
    navigate('/owner');
  }, [navigate]);

  return (
    <div className="min-h-dvh bg-cream">
      <header className="sticky top-0 z-10 border-b border-cream-deep bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
          {home ? (
            <span className="font-display text-xl font-bold text-brand">Ruchitva · Owner</span>
          ) : (
            <Link to="/owner" className="text-base font-bold text-brand">
              ← Home
            </Link>
          )}
          <button className="min-h-0 text-sm font-semibold text-ink-soft underline" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-4">
        <h1 className="mb-4 text-2xl font-bold text-ink">{title}</h1>
        {children}
      </main>
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="grid gap-3">
      <Notice tone="error">{error}</Notice>
      {onRetry && (
        <Button tone="plain" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
