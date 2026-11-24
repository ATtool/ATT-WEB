import React, { createContext, useContext } from 'react';

const TAMIL_RE = /[\u0B80-\u0BFF]/;
const LATIN_RE = /[A-Za-z0-9]/;

const classify = (ch) => {
  if (TAMIL_RE.test(ch)) return 'ta';
  if (LATIN_RE.test(ch)) return 'en';
  return 'n';
};

export function splitTextRuns(str) {
  if (typeof str !== 'string' || str.length === 0) return null;
  const tokens = [];
  let i = 0;
  while (i < str.length) {
    const type = classify(str[i]);
    let j = i + 1;
    while (j < str.length && classify(str[j]) === type) j += 1;
    tokens.push({ type, text: str.slice(i, j) });
    i = j;
  }

  const runs = [];
  let pending = '';
  for (const token of tokens) {
    if (token.type === 'n') {
      pending += token.text;
      continue;
    }
    const last = runs[runs.length - 1];
    if (!last) {
      runs.push({ type: token.type, text: pending + token.text });
    } else if (last.type === token.type) {
      last.text += pending + token.text;
    } else {
      last.text += pending;
      runs.push({ type: token.type, text: token.text });
    }
    pending = '';
  }
  if (pending) {
    if (runs.length > 0) runs[runs.length - 1].text += pending;
    else runs.push({ type: 'n', text: pending });
  }
  return runs;
}

const BaseFontSizeContext = createContext(null);

const flattenChildren = (children, out = []) => {
  React.Children.forEach(children, (child) => {
    if (child === null || child === undefined || typeof child === 'boolean') return;
    if (typeof child === 'string' || typeof child === 'number') {
      out.push(String(child));
      return;
    }
    if (Array.isArray(child)) {
      flattenChildren(child, out);
      return;
    }
    out.push(child);
  });
  return out;
};

/**
 * Web port of the app's MixedText:
 * - Tamil runs keep the custom Tamil font at regular weight.
 * - Latin runs use the bold system font, exactly 2px smaller (min 9px).
 */
export default function MixedText({
  as: Tag = 'span',
  size,
  children,
  className = '',
  style,
  ...rest
}) {
  const inherited = useContext(BaseFontSizeContext);
  const base = typeof size === 'number' ? size : inherited;
  const parts = flattenChildren(children);
  const hasText = parts.some((part) => typeof part === 'string' && part.trim().length > 0);

  const renderRuns = (str, prefix) => {
    const runs = splitTextRuns(str);
    if (!runs) return str;
    return runs.map((run, index) => {
      if (run.type === 'en') {
        const runStyle = { fontWeight: 700 };
        if (typeof base === 'number') runStyle.fontSize = Math.max(9, base - 2);
        return (
          <span key={`${prefix}-en-${index}`} className="mt-en" style={runStyle}>
            {run.text}
          </span>
        );
      }
      if (run.type === 'ta') {
        return (
          <span key={`${prefix}-ta-${index}`} className="mt-ta">
            {run.text}
          </span>
        );
      }
      return <React.Fragment key={`${prefix}-n-${index}`}>{run.text}</React.Fragment>;
    });
  };

  const content = hasText
    ? parts.map((part, index) => {
        if (typeof part !== 'string') {
          return <React.Fragment key={`el-${index}`}>{part}</React.Fragment>;
        }
        return <React.Fragment key={`s-${index}`}>{renderRuns(part, `s${index}`)}</React.Fragment>;
      })
    : children;

  const mergedStyle = typeof size === 'number' ? { fontSize: size, ...style } : style;

  return (
    <BaseFontSizeContext.Provider value={base ?? null}>
      <Tag className={`mt ${className}`.trim()} style={mergedStyle} {...rest}>
        {content}
      </Tag>
    </BaseFontSizeContext.Provider>
  );
}
