"use client";
import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { api, errMsg } from "@/lib/client";
import { btn, card, ErrorBox, Field, input, PageTitle } from "@/components/ui";

export default function Acesso() {
  const [currentUsername, setCurrentUsername] = useState("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ username: string }>("/api/account")
      .then((r) => {
        setCurrentUsername(r.username);
        setUsername(r.username);
      })
      .catch((e) => setError(errMsg(e)));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError("A confirmação da nova senha não bate com a nova senha.");
      return;
    }
    if (!currentPassword) {
      setError("Informe a senha atual para confirmar a alteração.");
      return;
    }

    setBusy(true);
    try {
      const body: Record<string, string> = { currentPassword };
      if (username && username !== currentUsername) body.username = username;
      if (newPassword) body.newPassword = newPassword;

      const r = await api<{ username: string }>("/api/account", { method: "PATCH", json: body });
      setCurrentUsername(r.username);
      setUsername(r.username);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setInfo("Dados de acesso atualizados.");
    } catch (x) {
      setError(errMsg(x));
    } finally {
      setBusy(false);
    }
  };

  const changed = username !== currentUsername || !!newPassword;

  return (
    <main className="p-4 md:p-8">
      <PageTitle icon={<KeyRound className="text-emerald-500" />}>Acesso ao sistema</PageTitle>

      {error && <ErrorBox>{error}</ErrorBox>}
      {info && <p role="status" className="mb-6 rounded-xl border border-emerald-900 bg-emerald-950/30 p-4 text-sm text-emerald-300">{info}</p>}

      <section className={`${card} max-w-md`}>
        <h2 className="mb-4 text-lg font-semibold">Usuário e senha</h2>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Usuário de login">
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" className={input} />
          </Field>
          <Field label="Nova senha (deixe em branco para não trocar)">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className={input}
            />
          </Field>
          {newPassword && (
            <Field label="Confirmar nova senha">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className={input}
              />
            </Field>
          )}
          <Field label="Senha atual (obrigatória para salvar)">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className={input}
            />
          </Field>
          <button type="submit" disabled={busy || !changed || !currentPassword} className={`${btn} w-full`}>
            {busy ? "Salvando…" : "Salvar alterações"}
          </button>
        </form>
      </section>
    </main>
  );
}
