"use client"

import Link from "next/link"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

// Compact markdown for chat bubbles (AI replies use lists, bold, links).
// Raw HTML is not rendered (react-markdown default), so model output can't inject markup.
const components: Components = {
    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="mb-2 last:mb-0 ml-4 list-disc space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="mb-2 last:mb-0 ml-4 list-decimal space-y-1">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    h1: ({ children }) => <p className="mb-2 font-semibold">{children}</p>,
    h2: ({ children }) => <p className="mb-2 font-semibold">{children}</p>,
    h3: ({ children }) => <p className="mb-2 font-semibold">{children}</p>,
    code: ({ children }) => <code className="rounded bg-black/10 dark:bg-white/10 px-1 py-0.5 text-[0.85em]">{children}</code>,
    pre: ({ children }) => <pre className="mb-2 overflow-x-auto rounded-lg bg-black/10 dark:bg-white/10 p-2 text-xs">{children}</pre>,
    table: ({ children }) => <div className="mb-2 overflow-x-auto"><table className="text-xs">{children}</table></div>,
    th: ({ children }) => <th className="border-b px-2 py-1 text-left font-semibold">{children}</th>,
    td: ({ children }) => <td className="border-b px-2 py-1">{children}</td>,
    a: ({ href = "", children }) =>
        href.startsWith("/") ? (
            <Link href={href} className="underline underline-offset-2 font-medium">{children}</Link>
        ) : (
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 font-medium">{children}</a>
        ),
}

export function ChatMarkdown({ content, className }: { content: string; className?: string }) {
    return (
        <div className={cn("text-sm break-words", className)}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {content}
            </ReactMarkdown>
        </div>
    )
}
