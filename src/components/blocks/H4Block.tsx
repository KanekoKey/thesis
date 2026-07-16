import type { TextParameters } from '@/types/block';

export const defaultH4Params: Required<TextParameters> = {
    content: '',
};

export default function H4Block({ content = defaultH4Params.content }: TextParameters) {
    return <h4 className="text-xl font-bold">{content}</h4>;
}