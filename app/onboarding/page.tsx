"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const acceptRules = async () => {
    setLoading(true);
    const res = await fetch("/api/user/accepted-rules", { method: "POST" });
    if (res.ok) {
      await update(); // atualiza a sessão no cliente
      router.push("/croqui");
    } else {
      alert("Erro ao aceitar regras. Tente novamente.");
    }
    setLoading(false);
  };

  if (!session) return null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Regras do Iperocks</h1>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Respeite a ordem de fila nos blocos</li>
        <li>Use magnésio apenas líquido</li>
        <li>Não é permitido som alto</li>
        <li>Leve todo o lixo de volta</li>
      </ul>
      <button
        onClick={acceptRules}
        disabled={loading}
        className="w-full bg-green-600 text-white px-6 py-3 rounded-md disabled:opacity-50 text-lg"
      >
        {loading ? "Salvando..." : "Aceito as regras"}
      </button>
    </div>
  );
}