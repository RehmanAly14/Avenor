import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "../../utils/cn";

const SQL_KEYWORDS =
  /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|AND|OR|NOT|NULL|IS|IN|GROUP BY|ORDER BY|BY|HAVING|LIMIT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|ADD|DROP|COLUMN|COALESCE|CASE|WHEN|THEN|ELSE|END|DISTINCT|WITH)\b/gi;
const SQL_FUNCTIONS = /\b([A-Z_]+)(?=\()/g;
const SQL_STRINGS = /'[^']*'/g;
const SQL_COMMENTS = /--.*$/gm;
const SQL_NUMBERS = /\b\d+(\.\d+)?\b/g;

function highlightSql(code: string) {
  const tokens: { text: string; className?: string }[] = [];
  let lastIndex = 0;
  const combined = new RegExp(
    `(${SQL_COMMENTS.source})|(${SQL_STRINGS.source})|(${SQL_KEYWORDS.source})|(${SQL_FUNCTIONS.source})|(${SQL_NUMBERS.source})`,
    "gim"
  );
  let match: RegExpExecArray | null;
  while ((match = combined.exec(code))) {
    if (match.index > lastIndex) tokens.push({ text: code.slice(lastIndex, match.index) });
    const text = match[0];
    let className: string | undefined;
    if (match[1]) className = "syntax-comment";
    else if (match[2]) className = "syntax-string";
    else if (match[3]) className = "syntax-keyword";
    else if (match[4]) className = "syntax-function";
    else if (match[5]) className = "syntax-number";
    tokens.push({ text, className });
    lastIndex = match.index + text.length;
  }
  if (lastIndex < code.length) tokens.push({ text: code.slice(lastIndex) });
  return tokens;
}

interface CodeBlockProps {
  code: string;
  language?: "sql" | "text";
  className?: string;
  title?: string;
}

export function CodeBlock({ code, language = "sql", className, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const tokens = language === "sql" ? highlightSql(code) : [{ text: code }];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silently ignore, copy button is a convenience
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-[#0a0e14]", className)}>
      <div className="flex items-center justify-between border-b border-border-subtle bg-surface px-3.5 py-2">
        <span className="font-mono text-xs text-text-tertiary">{title ?? language.toUpperCase()}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono">
          {tokens.map((t, i) => (
            <span key={i} className={t.className}>
              {t.text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
