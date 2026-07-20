"use client";

import { useState } from "react";

type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

export default function PasswordInput({
  className = "",
  id,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mt-1">
      <input
        id={id}
        type={visible ? "text" : "password"}
        className={`appearance-none rounded-md relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        aria-controls={id}
      >
        <span className="material-symbols-outlined text-[20px]">
          {visible ? "visibility_off" : "visibility"}
        </span>
      </button>
    </div>
  );
}
