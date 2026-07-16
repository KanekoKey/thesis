import type { TextParameters } from '@/types/block';

export const defaultH1Params: Required<TextParameters> = {
    content: '',
};

export default function H1Block({ content = defaultH1Params.content }: TextParameters) {
    return <h1 className="text-4xl font-bold">{content}</h1>;
}