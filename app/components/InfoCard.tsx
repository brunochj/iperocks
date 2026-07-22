"use client";

import { useState } from "react";

export default function InfoCard() {
  const [copied, setCopied] = useState(false);

  const pixKey = "229.249.178-83";

  const copyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = pixKey;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-md border border-white/20 dark:border-gray-700/50 p-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Informações
      </h2>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Nos siga no Instagram
          </p>
          <a
            href="https://instagram.com/iperocks"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition"
          >
            <span className="material-symbols-outlined">photo_camera</span>
            <span>@iperocks</span>
          </a>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Apoie Iperocks
          </p>
          <div className="relative inline-block">
            <button
              onClick={copyPixKey}
              className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition w-full text-left"
            >
              <span className="material-symbols-outlined">payments</span>
              <span>
                Chaves PIX: {pixKey} (Flávio Ragne Torreglosa)
              </span>
            </button>
            {copied && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Copiado!
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
