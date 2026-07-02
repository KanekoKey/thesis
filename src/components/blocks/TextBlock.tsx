import type { TextParameters } from '@/types/block';

export const defaultTextParams: Required<TextParameters> = {
    content: 'テキストを入力',
};

export default function TextBlock({ content = defaultTextParams.content }: TextParameters) {
    return <p className="text-base">{content}</p>;
}