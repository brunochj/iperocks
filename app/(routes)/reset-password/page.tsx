"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "../../components/ThemeToggle";
import Loader from "../../components/Loader";
import PasswordInput from "../../components/password-input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) {
      setReady(true);
      return;
    }

    const supabase = createClient();
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            console.error("[reset-password] setSession error:", error);
          } else {
            setHasToken(true);
          }
          window.history.replaceState({}, "", window.location.pathname);
          setReady(true);
        });
    } else {
      setReady(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || "Erro ao redefinir senha");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Erro ao redefinir senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <Loader size="md" />
      </div>
    );
  }

  if (!hasToken) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <div className="relative z-10 w-full max-w-md px-4">
          <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-xl p-8 backdrop-blur-sm text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Link inválido
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              O link de redefinição de senha é inválido ou expirou. Solicite um novo link.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg transition"
            >
              Solicitar novo link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="absolute inset-0 z-0">
        <Image
          src="https://res.cloudinary.com/dszmb7soi/image/upload/iperocks_home"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-xl p-8 backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-2">
            Redefinir senha
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
            Informe sua nova senha
          </p>

          {success ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-lg text-sm">
                Senha redefinida com sucesso! Redirecionando para o login...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nova senha
                </label>
                <PasswordInput
                  id="reset-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirmar senha
                </label>
                <PasswordInput
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/30 dark:text-red-400 p-2 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader size="sm" /> : "Redefinir senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
