"use client";

import { useUser } from "@/hooks/useUser";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch, writeCachedUserProfile } from "@/lib/api-fetch";
import ThemeToggle from "../../components/ThemeToggle";
import { navigateTo } from "@/lib/navigate";

export default function OnboardingPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!userLoading && user?.rulesAccepted) {
      navigateTo("/home");
    }
  }, [user, userLoading]);

  // Definição dos slides (inclui boas-vindas, cada regra individualmente e aceitação final)
  const slides = [
    {
      title: "Bem‑vindo ao Iperocks",
      subtitle: "Sua comunidade de escalada",
      description:
        "Antes de começar a explorar as vias, conheça as regras do local.",
      image: "https://res.cloudinary.com/dszmb7soi/image/upload/iperocks_home", // você pode trocar a imagem depois
    },
    {
      title: "Cuide de Iperocks",
      subtitle:
        "O bom senso de todos ajuda a manter o pico aberto. Respeite e colabore com a comunidade.",
      description: (
        <>
          - Siga as trilhas indicadas
          <br />
          - Estacione os veículos organizadamente
          <br />- Respeite o limite de velocidade de acesso
        </>
      ),
      image:
        "https://res.cloudinary.com/dszmb7soi/image/upload/climbing_outdoor_wmokq0", // você pode trocar a imagem depois
    },
    {
      title: "Cuide do cativasso",
      subtitle:
        "Cada um é responsável pela sua parte no bem estar de todos. Somos todos voluntários e fanáticos pelo climb e por Iperocks.",
      description: (
        <>
          - Sujou, lavou
          <br />
          - Separa e leve o lixo
          <br />- Respeite as áreas comuns
        </>
      ),
      image:
        "https://res.cloudinary.com/dszmb7soi/image/upload/trash_mqhvge", // você pode trocar a imagem depois
    },
    {
      title: "Apoie Iperocks",
      subtitle:
        "Iperocks se mantêm com a colaboração financeira dos escaladores. 100% da arrecadação é revertida para a sustentação do pico.",
      description: (
        <>
          - Faça a contribuição de R$5 por escalador
          <br />
          - Faça a contribuição de R$15 por carro estacionado
          <br />- Faça a reserva e contribuição de camping
        </>
      ),
      image: "https://res.cloudinary.com/dszmb7soi/image/upload/payment_hiqb6i", // você pode trocar a imagem depois
    },
    // {
    //   title: "Formas de pagamento",
    //   subtitle: "Iperocks se mantêm com a colaboração financeira dos escaladores. 100% da arrecadação é revertida para a sustentação do pico.",
    //   description: (
    //     <>
    //       - Maquininha de cartão [em Iperocks no banheiro, na caixa de madeira]
    //       <br />
    //       - Pix [229.249.178-83]
    //       <br />- Picpay [procure por Iperocks]
    //     </>
    //   ),
    //   image: "/images/onboarding/rule4.svg",
    // },
    {
      title: "Evitem escalar após a chuva",
      subtitle: "O arenito é sensível e as agarras podem quebrar.",
      description: (
        <>- Inúmeros blocos podem ser afetados e perder boulders para sempre</>
      ),
      image: "https://res.cloudinary.com/dszmb7soi/image/upload/rain_vpnq0v", // você pode trocar a imagem depois
    },
    // {
    //   title: "Pronto para começar?",
    //   subtitle: "Faça parte dessa comunidade",
    //   description:
    //     "Ao aceitar, você concorda em seguir todas as regras e contribuir para um ambiente saudável e sustentável.",
    //   image: "/images/onboarding/accept.svg",
    // },
  ];

  const acceptRules = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/user/accepted-rules", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const profile = data.user ?? (user ? { ...user, rulesAccepted: true } : null);
        if (profile) writeCachedUserProfile(profile);
        window.dispatchEvent(new Event("iperocks-app-session-change"));
        navigateTo("/home");
      } else {
        alert("Erro ao aceitar regras. Tente novamente.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error accepting rules:", error);
      alert("Erro ao aceitar regras. Tente novamente.");
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      acceptRules();
    }
  };

  const handleSkip = () => {
    // Pular direto para o último slide (aceitação)
    setCurrentSlide(slides.length - 1);
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  if (userLoading || !user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle />
      </div>
      
      <div className="flex h-screen w-full max-w-md flex-col overflow-hidden bg-white dark:bg-gray-900 shadow-xl md:rounded-2xl">
        {/* Área da imagem (topo) */}
        <div className="relative h-[60vh] shrink-0 bg-indigo-50 sm:h-56">
          {/* <Image
            src={slide.image}
            alt={slide.title}
            fill
            className="object-cover"
            priority
          /> */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                className="object-cover"
                priority
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Área de texto (meio) — ocupa o espaço restante e rola se necessário */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                {slide.title}
              </h2>
              <p className="mb-4 font-medium text-indigo-600">
                {slide.subtitle}
              </p>
              <p className="text-gray-600">{slide.description}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Área de controles (footer fixo no rodapé) */}
        <div className="mt-auto shrink-0 flex justify-between border-t border-gray-100 bg-white p-6 pt-4">
          <div className="flex justify-center gap-2 items-center">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Ir para slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide ? "w-6 bg-indigo-600" : "w-2 bg-gray-300"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSkip}
              aria-hidden={isLastSlide}
              tabIndex={isLastSlide ? -1 : 0}
              className={`rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50 ${
                isLastSlide ? "invisible pointer-events-none" : ""
              }`}
            >
              Pular
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className={`rounded-lg px-4 py-2 font-semibold text-white transition disabled:opacity-50 ${
                isLastSlide
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading
                ? "Salvando..."
                : isLastSlide
                  ? "Aceitar regras"
                  : "Próximo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
