"use client";
import { useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Defina os slides (etapas) do onboarding
const slides: { title: string; subtitle?: ReactNode; content: ReactNode; emoji: string }[] = [
  {
    title: "Bem-vindo ao Iperocks!",
    // subtitle: "Antes de escalar, conheça o local",
    content: "Antes de começar a explorar as vias, conheça as regras do local.",
    emoji: "🧗‍♂️",
  },
  {
    title: "Cuide de Iperocks",
    subtitle: (
      <>
        O bom senso de todos ajuda a manter o pico aberto.
        <br />
        Respeite e colabore com a comunidade.
      </>
    ),
    content: (
      <>
        - Siga as trilhas indicadas
        <br />
        - Estacione os veículos organizadamente
        <br />
        - Respeite o limite de velocidade de acesso
      </>
    ),
    emoji: "🚶‍♂️",
  },
  {
    title: "Cuide do cativasso",
    subtitle: (
      <>
        Cada um é responsável pela sua parte no bem estar de todos.
        <br />
        Somos todos voluntários e fanáticos pelo climb e por Iperocks.
      </>
    ),
    content: (
      <>
        - Sujou, lavou
        <br />
        - Separa e leve o lixo
        <br />
        - Respeite as áreas comuns
      </>
    ),
    emoji: "💧",
  },
  {
    title: "Apoie Iperocks",
    subtitle: (
      <>
        Iperocks se mantêm com a colaboração financeira dos escaladores.
        <br />
        100% da arrecadação é revertida para a sustentação do pico.
      </>
    ),
    content: (
      <>
        - Faça a contribuição de R$5 por escalador
        <br />
        - Faça a contribuição de R$15 por carro estacionado
        <br />
        - Faça a reserva e contribuição de camping
      </>
    ),
    emoji: "💧",
  },
  {
    title: "Formas de pagamento",
    subtitle: (
      <>
        Iperocks se mantêm com a colaboração financeira dos escaladores.
        <br />
        100% da arrecadação é revertida para a sustentação do pico.
      </>
    ),
    content: (
      <>
        - Maquininha de cartão [em Iperocks no banheiro, na caixa de madeira]
        <br />
        - Pix [229.249.178-83]
        <br />
        - Picpay [procure por Iperocks]
      </>
    ),
    emoji: "🗑️",
  },
  {
    title: "Evitem escalar após a chuva",
    subtitle: (
      <>
        O arenito é sensível e as agarras podem quebrar.
      </>
    ),
    content: (
      <>
        - Inúmeros blocos podem ser afetados e perder boulders para sempre
      </>
    ),
    emoji: "🗑️",
  },
];

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const acceptRules = async () => {
    setLoading(true);
    const res = await fetch("/api/user/accepted-rules", { method: "POST" });
    if (res.ok) {
      await update();
      router.push("/croqui");
    } else {
      alert("Erro ao aceitar regras. Tente novamente.");
    }
    setLoading(false);
  };

  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transition-all">
        {/* Emoji/Ícone principal */}
        <div className="text-6xl text-center mb-4">{slides[currentSlide].emoji}</div>

        {/* Título e conteúdo do slide */}
        <h2 className="text-2xl font-bold text-center text-gray-800">
          {slides[currentSlide].title}
        </h2>
        <p className="text-sm font-medium text-center text-blue-600 mt-1">
          {slides[currentSlide].subtitle}
        </p>
        <p className="text-gray-600 text-center mt-3">
          {slides[currentSlide].content}
        </p>

        {/* Indicadores de progresso */}
        <div className="flex justify-center gap-2 mt-6">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlide ? "w-6 bg-blue-500" : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* Botões de navegação */}
        <div className="flex justify-between items-center mt-8 gap-4">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="px-4 py-2 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Voltar
          </button>

          {!isLastSlide ? (
            <button
              onClick={nextSlide}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={acceptRules}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Aceitar regras"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}