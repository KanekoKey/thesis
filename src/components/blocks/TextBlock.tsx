import React, { ReactNode } from 'react';
import { TextBlockProps } from '@/types/block';

// --- 個別の部品 ---
const Heading1 = ({ children }: { children: ReactNode }) => (
  <h1 className="text-4xl font-bold">{children}</h1>
);
const Heading2 = ({ children }: { children: ReactNode }) => (
  <h2 className="text-3xl font-bold">{children}</h2>
);
const Heading3 = ({ children }: { children: ReactNode }) => (
  <h3 className="text-2xl font-bold">{children}</h3>
);
const Heading4 = ({ children }: { children: ReactNode }) => (
  <h4 className="text-xl font-bold">{children}</h4>
);
const Text = ({ children }: { children: ReactNode }) => (
  <p className="text-base font-bold">{children}</p>
);

// --- テキスト専門のレンダラー ---
export default function TextBlock({ type, children }: TextBlockProps) {
  switch (type) {
    case 'h1': return <Heading1>{children}</Heading1>;
    case 'h2': return <Heading2>{children}</Heading2>;
    case 'h3': return <Heading3>{children}</Heading3>;
    case 'h4': return <Heading4>{children}</Heading4>;
    case 'text': return <Text>{children}</Text>;
    default: return null;
  }
}