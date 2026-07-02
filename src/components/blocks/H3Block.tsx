import type { TextParameters } from '@/types/block';

export const defaultH3Params: Required<TextParameters> = {
    content: '見出し3',
};

export default function H3Block({ content = defaultH3Params.content }: TextParameters) {
    return <h3 className="text-2xl font-bold">{content}</h3>;
}