import type { TextBlockData } from '@/types/block';

// --- TextBlock｜型定義 ---
export const defaultTextParams: Required<TextBlockData['parameters']> = {
    content: 'テキストを入力',
};

export type TextBlockProps = TextBlockData['parameters'] & {
    type: TextBlockData['type'];
};

// --- TextBlock | コンポーネント ---
export default function TextBlock({
    type,
    content = defaultTextParams.content,
}: TextBlockProps) {
    
    switch (type) {
        case 'h1': return <h1 className="text-4xl font-bold">{content}</h1>;
        case 'h2': return <h2 className="text-3xl font-bold">{content}</h2>;
        case 'h3': return <h3 className="text-2xl font-bold">{content}</h3>;
        case 'h4': return <h4 className="text-xl font-bold">{content}</h4>;
        case 'text': return <p className="text-base">{content}</p>;
        default: return null;
    }
}