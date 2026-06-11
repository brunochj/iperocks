"use client";
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export default function CollapsibleCard({ title, children, defaultExpanded = true }: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-md border border-white/20 dark:border-gray-700/50 mb-6 overflow-hidden transition-all">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        )}
      </button>
      {isExpanded && <div className="p-4 pt-0">{children}</div>}
    </div>
  );
}