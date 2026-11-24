import React from 'react';
import MixedText from '../components/MixedText.jsx';

const INLINE_RE = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)/g;

function Inline({ text, size }) {
  const value = String(text || '').replace(/<\/?p>/gi, '');
  const parts = value.split(INLINE_RE).filter((part) => part !== '');
  return (
    <>
      {parts.map((part, index) => {
        const key = `i-${index}`;
        if (/^\*\*[^*]+\*\*$/.test(part)) {
          return (
            <strong key={key}>
              <MixedText size={size}>{part.slice(2, -2)}</MixedText>
            </strong>
          );
        }
        if (/^\*[^*]+\*$/.test(part)) {
          return (
            <em key={key}>
              <MixedText size={size}>{part.slice(1, -1)}</MixedText>
            </em>
          );
        }
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          const href = link[2];
          const external = /^https?:\/\//i.test(href);
          return (
            <a
              key={key}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
            >
              <MixedText size={size}>{link[1]}</MixedText>
            </a>
          );
        }
        if (/^`[^`]+`$/.test(part)) {
          return (
            <code key={key}>
              <MixedText size={size}>{part.slice(1, -1)}</MixedText>
            </code>
          );
        }
        return <MixedText key={key} size={size}>{part}</MixedText>;
      })}
    </>
  );
}

function renderBlocks(text, size) {
  const source = String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
  const lines = source.split('\n');
  const blocks = [];
  let i = 0;

  const isBlockStart = (line) =>
    /^\s*#{1,6}\s+/.test(line) ||
    /^\s*>\s?/.test(line) ||
    /^\s*([-*+]|\d+\.)\s+/.test(line) ||
    /^\s*(---|\*\*\*|___)\s*$/.test(line);

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (/^(---|\*\*\*|___)$/.test(trimmed)) {
      blocks.push(<hr key={`hr-${i}`} />);
      i += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const sizes = { 1: size + 11, 2: size + 8, 3: size + 5, 4: size + 3, 5: size + 1, 6: size };
      const Tag = `h${Math.min(6, level)}`;
      blocks.push(
        <Tag key={`h-${i}`} className="md-heading">
          <MixedText as="span" size={sizes[level] || size}>
            {heading[2]}
          </MixedText>
        </Tag>
      );
      i += 1;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      blocks.push(
        <blockquote key={`q-${i}`} className="md-quote">
          {quoteLines.map((q, index) => (
            <p key={`qp-${index}`}>
              <Inline text={q} size={size} />
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*+]|\d+\.)\s+/, ''));
        i += 1;
      }
      const Tag = ordered ? 'ol' : 'ul';
      blocks.push(
        <Tag key={`l-${i}`} className="md-list">
          {items.map((item, index) => (
            <li key={`li-${index}`}>
              <Inline text={item} size={size} />
            </li>
          ))}
        </Tag>
      );
      continue;
    }

    const paragraph = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    if (paragraph.length) {
      blocks.push(
        <p key={`p-${i}`} className="md-p">
          <Inline text={paragraph.join(' ')} size={size} />
        </p>
      );
    } else {
      i += 1;
    }
  }

  return blocks;
}

export default function Markdown({ text, size = 16, className = '' }) {
  return <div className={`markdown ${className}`.trim()}>{renderBlocks(text, size)}</div>;
}
