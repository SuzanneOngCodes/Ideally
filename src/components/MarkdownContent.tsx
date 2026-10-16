import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  text: string | null | undefined;
  className?: string;
  tone?: 'light' | 'dark';
}

const safeUrl = (url: string) => /^https?:\/\//i.test(url) ? url : '';

export const MarkdownContent = memo(function MarkdownContent({ text, className = '', tone = 'light' }: MarkdownContentProps) {
  if (!text) return null;

  return (
    <div className={`min-w-0 break-words ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={safeUrl}
        components={{
          h1: ({ children }) => <h1 className="mb-2 mt-3 text-base font-bold first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 mt-3 text-sm font-bold first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1 mt-2 font-semibold first:mt-0">{children}</h3>,
          h4: ({ children }) => <h4 className="mb-1 mt-2 font-semibold first:mt-0">{children}</h4>,
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-slate-300 pl-3 italic">{children}</blockquote>,
          a: ({ href, children }) => href ? <a href={href} target="_blank" rel="noopener noreferrer" className={`${tone === 'dark' ? 'text-sky-300 hover:text-sky-200' : 'text-blue-700 hover:text-blue-900'} underline break-all`}>{children}</a> : <span>{children}</span>,
          img: () => null,
          pre: ({ children }) => <pre className="my-2 max-w-full overflow-x-auto rounded-lg bg-slate-900 p-3 text-slate-100 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">{children}</pre>,
          code: ({ children }) => <code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-[0.9em] text-slate-900">{children}</code>,
          table: ({ children }) => <div className="my-2 max-w-full overflow-x-auto"><table className="min-w-full border-collapse text-left">{children}</table></div>,
          th: ({ children }) => <th className="border border-slate-200 bg-slate-100 px-2 py-1 font-semibold">{children}</th>,
          td: ({ children }) => <td className="border border-slate-200 px-2 py-1 align-top">{children}</td>,
          hr: () => <hr className="my-3 border-slate-200" />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
});
