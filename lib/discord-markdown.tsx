import React, { useState } from 'react';
import Image from 'next/image';

function SpoilerToken({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <span
      onClick={() => setRevealed(!revealed)}
      title="Нажмите, чтобы показать спойлер"
      className={`cursor-pointer rounded px-1.5 py-0.5 transition-all inline-block font-sans text-xs sm:text-sm ${
        revealed
          ? 'bg-[#202225] text-slate-100 border border-slate-700/50'
          : 'bg-[#111214] text-transparent hover:bg-[#1e1f22] select-none'
      }`}
    >
      {children}
    </span>
  );
}

function EmojiToken({ id, raw }: { id: string; raw: string }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return <span className="inline-block text-amber-400 font-sans mx-0.5">📝</span>;
  }

  return (
    <Image
      src={`https://cdn.discordapp.com/emojis/${id}.png?size=48&quality=lossless`}
      alt="emoji"
      width={20}
      height={20}
      unoptimized
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className="w-5 h-5 inline-block align-middle mx-0.5"
      draggable={false}
    />
  );
}

/**
 * Recursive inline Discord Markdown parser.
 * Handles nested formatting like:
 * _Семья **Allegri Famq** получает заморозку на **7 дней**_
 */
export function renderFormattedText(text: string, keyPrefix = 'rt'): React.ReactNode[] {
  if (!text) return [];

  const elements: React.ReactNode[] = [];
  let remaining = text;
  let elementIndex = 0;

  while (remaining.length > 0) {
    // 1. Spoilers ||text||
    const spoilerMatch = remaining.match(/^\|\|([\s\S]+?)\|\|/);
    if (spoilerMatch) {
      const innerText = spoilerMatch[1];
      elements.push(
        <SpoilerToken key={`${keyPrefix}-sp-${elementIndex++}`}>
          {renderFormattedText(innerText, `${keyPrefix}-sp-${elementIndex}`)}
        </SpoilerToken>
      );
      remaining = remaining.substring(spoilerMatch[0].length);
      continue;
    }

    // 2. Bold Italic ***text***
    const boldItalicMatch = remaining.match(/^\*\*\*([\s\S]+?)\*\*\*/);
    if (boldItalicMatch) {
      elements.push(
        <strong key={`${keyPrefix}-bi-${elementIndex++}`} className="font-bold italic text-white">
          {renderFormattedText(boldItalicMatch[1], `${keyPrefix}-bi-${elementIndex}`)}
        </strong>
      );
      remaining = remaining.substring(boldItalicMatch[0].length);
      continue;
    }

    // 3. Bold **text**
    const boldMatch = remaining.match(/^\*\*([\s\S]+?)\*\*/);
    if (boldMatch) {
      elements.push(
        <strong key={`${keyPrefix}-b-${elementIndex++}`} className="font-bold text-white">
          {renderFormattedText(boldMatch[1], `${keyPrefix}-b-${elementIndex}`)}
        </strong>
      );
      remaining = remaining.substring(boldMatch[0].length);
      continue;
    }

    // 4. Underline __text__
    const underlineMatch = remaining.match(/^__([\s\S]+?)__/);
    if (underlineMatch) {
      elements.push(
        <u key={`${keyPrefix}-u-${elementIndex++}`} className="underline underline-offset-2">
          {renderFormattedText(underlineMatch[1], `${keyPrefix}-u-${elementIndex}`)}
        </u>
      );
      remaining = remaining.substring(underlineMatch[0].length);
      continue;
    }

    // 5. Strikethrough ~~text~~
    const strikeMatch = remaining.match(/^~~([\s\S]+?)~~/);
    if (strikeMatch) {
      elements.push(
        <s key={`${keyPrefix}-s-${elementIndex++}`} className="line-through opacity-75">
          {renderFormattedText(strikeMatch[1], `${keyPrefix}-s-${elementIndex}`)}
        </s>
      );
      remaining = remaining.substring(strikeMatch[0].length);
      continue;
    }

    // 6. Inline Italics _text_ or *text*
    const italicMatch = remaining.match(/^(_|\*)([\s\S]+?)\1/);
    if (italicMatch) {
      elements.push(
        <em key={`${keyPrefix}-i-${elementIndex++}`} className="italic text-slate-200">
          {renderFormattedText(italicMatch[2], `${keyPrefix}-i-${elementIndex}`)}
        </em>
      );
      remaining = remaining.substring(italicMatch[0].length);
      continue;
    }

    // 7. Custom Emoji <:name:id> or <a:name:id>
    const emojiMatch = remaining.match(/^<a?:[a-zA-Z0-9_]+:(\d+)>/);
    if (emojiMatch) {
      elements.push(
        <EmojiToken
          key={`${keyPrefix}-em-${elementIndex++}`}
          id={emojiMatch[1]}
          raw={emojiMatch[0]}
        />
      );
      remaining = remaining.substring(emojiMatch[0].length);
      continue;
    }

    // 8. Explicit URL in angle brackets <http...>
    const linkMatch = remaining.match(/^<(https?:\/\/[^\s>]+)>/);
    if (linkMatch) {
      elements.push(
        <a
          key={`${keyPrefix}-link-${elementIndex++}`}
          href={linkMatch[1]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 hover:underline break-all"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.substring(linkMatch[0].length);
      continue;
    }

    // 9. Raw URL http...
    const rawUrlMatch = remaining.match(/^(https?:\/\/[^\s<]+)/);
    if (rawUrlMatch) {
      elements.push(
        <a
          key={`${keyPrefix}-rawlink-${elementIndex++}`}
          href={rawUrlMatch[1]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 hover:underline break-all"
        >
          {rawUrlMatch[1]}
        </a>
      );
      remaining = remaining.substring(rawUrlMatch[0].length);
      continue;
    }

    // 10. Normal character - consume until next special delimiter
    const nextSpecialIndex = remaining.search(/(\*|_|~|\|\||<|http)/);
    if (nextSpecialIndex === -1) {
      elements.push(<span key={`${keyPrefix}-txt-${elementIndex++}`}>{remaining}</span>);
      break;
    } else if (nextSpecialIndex > 0) {
      elements.push(
        <span key={`${keyPrefix}-txt-${elementIndex++}`}>
          {remaining.substring(0, nextSpecialIndex)}
        </span>
      );
      remaining = remaining.substring(nextSpecialIndex);
    } else {
      // First char was special but didn't match full pattern above
      elements.push(<span key={`${keyPrefix}-txt-${elementIndex++}`}>{remaining[0]}</span>);
      remaining = remaining.substring(1);
    }
  }

  return elements;
}

export function DiscordMarkdown({ content }: { content: string }) {
  if (!content) return null;

  return (
    <div className="font-sans space-y-1 text-slate-200 text-xs sm:text-sm leading-relaxed">
      {content.split('\n').map((line, idx) => (
        <div key={`line-${idx}`} className="min-h-[1.25rem]">
          {renderFormattedText(line, `l-${idx}`)}
        </div>
      ))}
    </div>
  );
}
