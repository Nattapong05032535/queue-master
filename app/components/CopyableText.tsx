'use client';

import { useState } from 'react';

interface CopyableTextProps {
  text: string;
  truncateLength?: number;
  className?: string;
}

export default function CopyableText({ text, truncateLength = 6, className = '' }: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const displayText = text.slice(0, truncateLength);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className={`flex items-center gap-2 group ${className}`}>
      <span className="font-mono text-slate-600 group-hover:text-slate-900 transition-colors">
        {displayText}
      </span>
      <button
        onClick={handleCopy}
        className="text-slate-400 hover:text-blue-600 transition-colors focus:outline-none p-1 rounded-md hover:bg-slate-100"
        title="Copy full ID"
      >
        {copied ? (
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
