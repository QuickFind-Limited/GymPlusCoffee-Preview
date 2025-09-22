import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  // Preprocess content to fix formatting issues
  const preprocessContent = (text: string): string => {
    let processedText = text;

    // Split lines to process each one
    const lines = processedText.split('\n');
    const processedLines: string[] = [];

    for (let line of lines) {
      // Check if this line contains multiple options (a) b) c) d) format
      if (/[a-d]\).*[a-d]\)/.test(line)) {
        console.log('Found line with multiple options:', line);

        // Split by option pattern, keeping the delimiter
        const parts: string[] = [];
        let currentPart = '';
        let i = 0;

        while (i < line.length) {
          // Check if we're at the start of an option (a), b), c), or d))
          if (i < line.length - 1 &&
              /[a-d]/.test(line[i]) &&
              line[i + 1] === ')') {

            // If we have accumulated text, save it
            if (currentPart.trim() && parts.length > 0) {
              parts.push(currentPart.trim());
              currentPart = '';
            }

            // Start new part with the option letter
            currentPart = line[i] + line[i + 1];
            i += 2;
          } else {
            currentPart += line[i];
            i++;
          }
        }

        // Add the last part
        if (currentPart.trim()) {
          parts.push(currentPart.trim());
        }

        // If we found multiple parts, add them as separate lines
        if (parts.length > 1) {
          console.log('Split into parts:', parts);
          // Add a blank line before options if previous line exists
          if (processedLines.length > 0 && processedLines[processedLines.length - 1].trim()) {
            processedLines.push('');
          }
          parts.forEach(part => {
            if (part.trim()) {
              processedLines.push(part);
            }
          });
          // Add a blank line after options
          processedLines.push('');
        } else {
          processedLines.push(line);
        }
      } else {
        processedLines.push(line);
      }
    }

    processedText = processedLines.join('\n');

    // Clean up any multiple consecutive blank lines
    processedText = processedText.replace(/\n{3,}/g, '\n\n');

    console.log('Original text:', text);
    console.log('Processed text:', processedText);

    return processedText;
  };

  const processedContent = preprocessContent(content);

  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Personnaliser les composants pour s'adapter au design
          table: ({ children }) => (
            <div className="my-2 w-full overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/60">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/40 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th
              style={(props as any).style}
              className="text-left font-semibold text-foreground px-3 py-2 border-b border-border align-middle whitespace-nowrap"
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td
              style={(props as any).style}
              className="text-foreground px-3 py-2 align-top border-b border-border"
            >
              {children}
            </td>
          ),
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 text-sm">{children}</p>
          ),
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mb-2 text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mb-2 text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold mb-1 text-foreground">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-4 mb-2 text-sm">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 mb-2 text-sm">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="mb-1 text-sm">{children}</li>
          ),
          code: ({ children, ...props }) => {
            const content = String(children);
            const isMultipleChoice = /^[a-d]\)/.test(content.trim());

            if ((props as any).inline) {
              return (
                <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground">
                  {children}
                </code>
              );
            } else if (isMultipleChoice) {
              // For multiple choice options, use regular font without background
              return (
                <span className="block text-sm text-foreground">
                  {children}
                </span>
              );
            } else {
              return (
                <code className="block bg-muted p-2 rounded text-xs font-mono overflow-x-auto text-foreground">
                  {children}
                </code>
              );
            }
          },
          pre: ({ children }) => {
            // Check if this pre block contains multiple choice options
            const childContent = children && typeof children === 'object' &&
              'props' in children && children.props && children.props.children;
            const isMultipleChoice = childContent &&
              typeof childContent === 'string' &&
              /^[a-d]\)/.test(childContent.trim());

            if (isMultipleChoice) {
              // For multiple choice options, no background and no padding
              return (
                <div className="mb-2 text-sm whitespace-pre-wrap">
                  {children}
                </div>
              );
            } else {
              return (
                <pre className="bg-muted p-2 rounded overflow-x-auto mb-2">
                  {children}
                </pre>
              );
            }
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic mb-2 text-muted-foreground">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground">{children}</em>
          ),
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-primary underline hover:text-primary/80"
              target="_blank" 
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
