import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import type { Components } from 'react-markdown';
import { Copy, Check, Sparkles } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

// Separate CopyButton component to handle its own state
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border dark:bg-white/10 dark:hover:bg-white/20 dark:text-gray-300 dark:hover:text-white dark:border-white/10 dark:hover:border-white/20"
        >
            {copied ? (
                <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                </>
            ) : (
                <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                </>
            )}
        </button>
    );
};

// Example block component for bio/text examples with special styling
const ExampleBlock: React.FC<{ children: React.ReactNode; text: string }> = ({ children, text }) => {
    return (
        <div className="my-4 rounded-xl overflow-hidden border border-purple-300/30 dark:border-purple-500/30 bg-purple-50 dark:bg-gradient-to-br dark:from-purple-950/50 dark:via-indigo-950/50 dark:to-blue-950/50 shadow-lg shadow-purple-500/10">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-b border-purple-500/20">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Example</span>
                </div>
                <CopyButton text={text} />
            </div>
            <div className="p-4">
                <div className="text-sm text-foreground dark:text-gray-200 leading-relaxed font-medium whitespace-pre-wrap break-words">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
    content,
    className = ""
}) => {
    // Extract code content from pre children
    const extractTextFromChildren = (children: React.ReactNode): string => {
        if (typeof children === 'string') return children;
        if (Array.isArray(children)) {
            return children.map(extractTextFromChildren).join('');
        }
        if (React.isValidElement(children) && children.props?.children) {
            return extractTextFromChildren(children.props.children);
        }
        return '';
    };

    const components: Components = {
        h2: ({ ...props }) => (
            <h2 className="text-xl font-semibold mt-6 mb-3 text-foreground" {...props} />
        ),
        h3: ({ ...props }) => (
            <h3 className="text-lg font-medium mt-4 mb-2 text-foreground/90" {...props} />
        ),
        p: ({ children, ...props }) => {
            return (
                <p className="mb-3 text-foreground/80 leading-relaxed" {...props}>{children}</p>
            );
        },
        ul: ({ ...props }) => (
            <ul className="list-disc list-inside mb-3 space-y-1.5 text-foreground/80" {...props} />
        ),
        ol: ({ ...props }) => (
            <ol className="list-decimal list-inside mb-3 space-y-1.5 text-foreground/80" {...props} />
        ),
        li: ({ ...props }) => (
            <li className="ml-2 leading-relaxed" {...props} />
        ),
        strong: ({ children, ...props }) => {
            const text = extractTextFromChildren(children);
            // Style labels like "Bio Example:", "Improved example:", etc.
            if (text.toLowerCase().includes('example')) {
                return (
                    <strong className="font-bold text-purple-400" {...props}>{children}</strong>
                );
            }
            return (
                <strong className="font-semibold text-foreground" {...props}>{children}</strong>
            );
        },
        em: ({ ...props }) => (
            <em className="italic text-foreground/70" {...props} />
        ),
        code: ({ className, children, ...props }) => {
            const isInline = !className || !className.startsWith('language-');
            const text = extractTextFromChildren(children);
            
            if (isInline) {
                // Check if this looks like an example/suggestion (longer inline code)
                const isExample = text.length > 50 || text.includes('with') || text.includes('Developer');
                
                if (isExample) {
                    return (
                        <ExampleBlock text={text}>
                            {children}
                        </ExampleBlock>
                    );
                }
                
                return (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm text-foreground font-mono" {...props}>
                        {children}
                    </code>
                );
            }
            
            return (
                <code className={`block text-sm overflow-x-auto ${className || ''}`} {...props}>
                    {children}
                </code>
            );
        },
        pre: ({ children, ...props }) => {
            // Simple pre wrapper - the code inside will handle ExampleBlock if needed
            return (
                <pre className="whitespace-pre-wrap break-words text-sm my-2" {...props}>
                    {children}
                </pre>
            );
        },
        blockquote: ({ children, ...props }) => {
            const text = extractTextFromChildren(children);
            
            // Check if this might be an example or suggestion
            if (text.length > 30) {
                return (
                    <ExampleBlock text={text}>
                        {children}
                    </ExampleBlock>
                );
            }
            
            return (
                <blockquote className="border-l-4 border-purple-500/50 pl-4 my-4 italic text-foreground/70 bg-muted/30 py-2 rounded-r-lg" {...props}>
                    {children}
                </blockquote>
            );
        },
    };

    return (
        <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[
                    rehypeSlug,
                    [rehypeAutolinkHeadings, { behavior: 'wrap' }],
                    rehypeHighlight
                ]}
                components={components}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
