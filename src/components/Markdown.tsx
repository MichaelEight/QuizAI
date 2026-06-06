import { Fragment, ReactNode } from "react";

/**
 * Minimal, dependency-free Markdown renderer for AI-generated prose
 * (explanations, hints, expected answers, chat replies).
 *
 * Supported:
 *   **bold** / __bold__
 *   *italic* / _italic_
 *   `inline code`
 *   [text](url)
 *   - / * / + bullet lists, 1. ordered lists
 *   # .. ###### headings
 *   blank-line paragraphs, single-line soft breaks
 *
 * Output is built as React elements (no dangerouslySetInnerHTML) so it is
 * XSS-safe regardless of model output.
 */

let keyCounter = 0;
function nextKey(): string {
  return `md-${keyCounter++}`;
}

// Leftmost-match alternation: code | bold | italic | link
const INLINE_RE =
  /(`[^`]+`)|(\*\*[^*]+\*\*|__[^_]+__)|(\*[^*\n]+\*|_[^_\n]+_)|(\[[^\]]+\]\([^)]+\))/;

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const match = INLINE_RE.exec(remaining);
    if (!match) {
      nodes.push(remaining);
      break;
    }

    const idx = match.index;
    if (idx > 0) {
      nodes.push(remaining.slice(0, idx));
    }

    const token = match[0];

    if (match[1]) {
      // inline code — content is NOT re-parsed
      nodes.push(
        <code
          key={nextKey()}
          className="px-1 py-0.5 rounded bg-slate-700/70 text-slate-100 text-[0.9em] font-mono"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (match[2]) {
      // bold
      const inner = token.slice(2, -2);
      nodes.push(
        <strong key={nextKey()} className="font-semibold text-slate-100">
          {parseInline(inner)}
        </strong>,
      );
    } else if (match[3]) {
      // italic
      const inner = token.slice(1, -1);
      nodes.push(<em key={nextKey()}>{parseInline(inner)}</em>);
    } else if (match[4]) {
      // link
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (linkMatch) {
        nodes.push(
          <a
            key={nextKey()}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline"
          >
            {parseInline(linkMatch[1])}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    }

    remaining = remaining.slice(idx + token.length);
  }

  return nodes;
}

const UL_RE = /^\s*[-*+]\s+/;
const OL_RE = /^\s*\d+\.\s+/;
const HEADING_RE = /^\s*(#{1,6})\s+(.*)$/;

function parseBlocks(content: string): ReactNode[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // blank line — skip
    if (!line.trim()) {
      i++;
      continue;
    }

    // unordered list
    if (UL_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && UL_RE.test(lines[i])) {
        items.push(lines[i].replace(UL_RE, ""));
        i++;
      }
      blocks.push(
        <ul key={nextKey()} className="list-disc pl-5 space-y-1">
          {items.map((item) => (
            <li key={nextKey()}>{parseInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // ordered list
    if (OL_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && OL_RE.test(lines[i])) {
        items.push(lines[i].replace(OL_RE, ""));
        i++;
      }
      blocks.push(
        <ol key={nextKey()} className="list-decimal pl-5 space-y-1">
          {items.map((item) => (
            <li key={nextKey()}>{parseInline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // heading
    const heading = HEADING_RE.exec(line);
    if (heading) {
      blocks.push(
        <p key={nextKey()} className="font-semibold text-slate-100">
          {parseInline(heading[2])}
        </p>,
      );
      i++;
      continue;
    }

    // paragraph — gather consecutive plain lines, soft-break with <br/>
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !UL_RE.test(lines[i]) &&
      !OL_RE.test(lines[i]) &&
      !HEADING_RE.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={nextKey()}>
        {paraLines.map((l, idx) => (
          <Fragment key={nextKey()}>
            {idx > 0 && <br />}
            {parseInline(l)}
          </Fragment>
        ))}
      </p>,
    );
  }

  return blocks;
}

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  if (!content) return null;
  return <div className={`space-y-2 ${className ?? ""}`}>{parseBlocks(content)}</div>;
}
