"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "../../components/ThemeToggle";
import Loader from "../../components/Loader";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${SITE_URL}/reset-password` }
      );

      if (resetError) {
        console.error("[forgot-password]", resetError);
      }
    } catch (err) {
      console.error("[forgot-password]", err);
    } finally {
      setSubmitted(true);
      setLoading(false);
    }
  };

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
            Esqueceu a senha?
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
            Informe seu email para redefinir sua senha
          </p>

          {submitted ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-lg text-sm">
                Se o email estiver cadastrado, você receberá um link para redefinir a senha. Verifique sua caixa de entrada.
              </div>
              <Link
                href="/login"
                className="inline-block text-indigo-600 hover:text-indigo-500 font-medium text-sm"
              >
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/50 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
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
                {loading ? <Loader size="sm" /> : "Enviar link de redefinição"}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Voltar para o login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
