import type { TextParameters } from '@/types/block';

export const defaultH2Params: Required<TextParameters> = {
    content: '',
};

export default function H2Block({ content = defaultH2Params.content }: TextParameters) {
    return <h2 className="text-3xl font-bold">{content}</h2>;
}