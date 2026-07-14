import React from 'react';

export function renderScriptText(
  text: string | undefined,
  darkMode: boolean,
  callVariables: Record<string, string>,
): React.ReactNode[] {
  if (!text) return [];
  let substituted = text;
  Object.entries(callVariables).forEach(([key, value]) => {
    if (value.trim()) {
      substituted = substituted.split(`[${key}]`).join(value.trim());
    }
  });
  const parts: React.ReactNode[] = [];
  const regex = /(\[.*?\]|¿.*?\?)/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(substituted)) !== null) {
    if (match.index > lastIndex) parts.push(substituted.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith('[')) {
      parts.push(
        <span key={key++} className={`inline-block px-1.5 py-0.5 mx-0.5 rounded text-[9px] font-bold ${
          darkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700'
        }`}>{token}</span>
      );
    } else {
      parts.push(
        <span key={key++} className={`font-bold ${darkMode ? 'text-stone-100' : 'text-stone-900'}`}>
          {token}
        </span>
      );
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < substituted.length) parts.push(substituted.slice(lastIndex));
  return parts;
}
