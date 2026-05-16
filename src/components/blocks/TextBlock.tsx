
// --- テキストブロックの型定義 ---
export type TextBlockProps = {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'text';
  content: string;
};

// --- テキスト専門のレンダラー ---
export default function TextBlock({ type, content }: TextBlockProps) {
  switch (type) {
    case 'h1': return <p className="text-4xl font-bold">{content}</p>;
    case 'h2': return <p className="text-3xl font-bold">{content}</p>;
    case 'h3': return <p className="text-2xl font-bold">{content}</p>;
    case 'h4': return <p className="text-xl font-bold">{content}</p>;
    case 'text': return <p className="text-base">{content}</p>;
    default: return null;
  }
}
