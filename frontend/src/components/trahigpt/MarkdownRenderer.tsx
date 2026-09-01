import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Split lines into blocks
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];

  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = (keyPrefix: string) => {
    if (!currentList) return;
    if (currentList.type === 'ul') {
      blocks.push(
        <ul key={`${keyPrefix}-ul`} className="space-y-1.5 my-2.5 pl-1 text-slate-200">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-[14.5px] leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F9D8F] shrink-0 mt-2" />
              <span className="flex-1">{formatInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      blocks.push(
        <ol key={`${keyPrefix}-ol`} className="space-y-2 my-2.5 pl-1 text-slate-200">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-[14.5px] leading-relaxed">
              <span className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700/80 text-[#0F9D8F] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="flex-1">{formatInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  const formatInline = (text: string): React.ReactNode[] => {
    // Process **bold**, *italic*, and `code`
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const str = match[0];
      if (str.startsWith('**') && str.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-bold text-white tracking-wide">
            {str.slice(2, -2)}
          </strong>
        );
      } else if (str.startsWith('*') && str.endsWith('*')) {
        parts.push(
          <em key={match.index} className="italic text-slate-300">
            {str.slice(1, -1)}
          </em>
        );
      } else if (str.startsWith('`') && str.endsWith('`')) {
        parts.push(
          <code
            key={match.index}
            className="px-1.5 py-0.5 rounded bg-slate-800 text-[#0F9D8F] border border-slate-700 font-mono text-xs"
          >
            {str.slice(1, -1)}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check list items
    const ulMatch = line.match(/^(\*|-)\s+(.+)/);
    const olMatch = line.match(/^(\d+)\.\s+(.+)/);

    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList(`list-${index}`);
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[2]);
      return;
    }

    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList(`list-${index}`);
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[2]);
      return;
    }

    // Flush active list if line is not a list item
    if (currentList) {
      flushList(`list-${index}`);
    }

    if (!trimmed) {
      return; // Skip empty lines
    }

    // Blockquote / Emergency Warning callouts starting with >
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.replace(/^>\s*/, '');
      const isRedAlert = quoteText.includes('🚨') || quoteText.includes('⚠️') || quoteText.toLowerCase().includes('emergency') || quoteText.toLowerCase().includes('warning');

      blocks.push(
        <div
          key={`quote-${index}`}
          className={`my-3 p-3.5 sm:p-4 rounded-2xl border-l-4 text-xs sm:text-sm font-medium shadow-xs ${
            isRedAlert
              ? 'bg-red-950/40 border-[#DC2626] text-red-200 border-t border-r border-b border-red-900/40'
              : 'bg-teal-950/40 border-[#0F9D8F] text-teal-200 border-t border-r border-b border-teal-900/40'
          }`}
        >
          {formatInline(quoteText)}
        </div>
      );
      return;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h3 key={`h3-${index}`} className="text-base sm:text-lg font-bold text-white mt-4 mb-2 flex items-center gap-2">
          {formatInline(trimmed.replace('### ', ''))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('#### ')) {
      blocks.push(
        <h4 key={`h4-${index}`} className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0F9D8F] mt-3 mb-1.5">
          {formatInline(trimmed.replace('#### ', ''))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      blocks.push(
        <h2 key={`h2-${index}`} className="text-lg sm:text-xl font-black text-white mt-5 mb-3 border-b border-slate-700/80 pb-2">
          {formatInline(trimmed.replace(/^#+\s*/, ''))}
        </h2>
      );
      return;
    }

    // Paragraph
    blocks.push(
      <p key={`p-${index}`} className="my-1.5 text-sm sm:text-[14.5px] leading-relaxed text-slate-200">
        {formatInline(line)}
      </p>
    );
  });

  // Flush any remaining list at the end
  if (currentList) {
    flushList('end');
  }

  return <div className="space-y-1">{blocks}</div>;
};
