"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const hasUpperCase = /[A-Z]/.test(form.password);
  const hasLowerCase = /[a-z]/.test(form.password);
  const hasNumber = /\d/.test(form.password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(form.password);
  const isLengthValid = form.password.length >= 8;
  const isPasswordValid = hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && isLengthValid;
  const doPasswordsMatch = form.password === form.confirmPassword;

  const getRequirementClass = (condition: boolean) => {
    if (!passwordTouched) return "text-gray-400";
    return condition ? "text-green-600" : "text-red-600";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError("A senha não atende os requisitos de segurança.");
      return;
    }
    if (!doPasswordsMatch) {
      setError("As senhas não conferem.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = form.name && form.username && form.email && isPasswordValid && doPasswordsMatch;

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        <Image
          src="https://res.cloudinary.com/dszmb7soi/image/upload/iperocks_home" // coloque sua imagem em public/images/
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-xl p-8 backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-2">
            Criar nova conta
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
            Cadastre-se para explorar Iperocks
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome completo
              </label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome de usuário
              </label>
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                onBlur={() => setPasswordTouched(true)}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirmar senha
              </label>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={() => setConfirmTouched(true)}
                className={`mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white/50 ${
                  confirmTouched && !doPasswordsMatch && form.confirmPassword !== ""
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                required
              />
              {confirmTouched && !doPasswordsMatch && form.confirmPassword !== "" && (
                <p className="text-red-500 text-xs mt-1">As senhas não coincidem</p>
              )}
              <div className="mt-2 text-xs space-y-1">
                <p className={getRequirementClass(hasUpperCase)}>✓ Letra maiúscula</p>
                <p className={getRequirementClass(hasLowerCase)}>✓ Letra minúscula</p>
                <p className={getRequirementClass(hasNumber)}>✓ Número</p>
                <p className={getRequirementClass(hasSpecialChar)}>✓ Caractere especial (!@#$...)</p>
                <p className={getRequirementClass(isLengthValid)}>✓ Pelo menos 8 caracteres</p>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Criando conta..." : "Cadastrar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Entrar
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center text-xs text-gray-400">
            Created by yourname
          </div>
        </div>
      </div>
    </div>
  );
}