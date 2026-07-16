import { Type, Heading1, Heading2, Heading3, Heading4, RollerCoaster, SquarePlus, Columns2 } from 'lucide-react';
import type { BlockType } from '@/types/block';

export type BlockItem = {
    type: BlockType;
    icon: React.ElementType | null;
    label: string;
};

export const STATIC_ITEMS: BlockItem[] = [
    { type: 'text', icon: Type, label: 'テキスト' },
    { type: 'h1', icon: Heading1, label: '見出し1' },
    { type: 'h2', icon: Heading2, label: '見出し2' },
    { type: 'h3', icon: Heading3, label: '見出し3' },
    { type: 'h4', icon: Heading4, label: '見出し4' },
    { type: 'two-column', icon: Columns2, label: '2列' },
];

export const DYNAMIC_ITEMS: BlockItem[] = [
    { type: 'roller-coaster', icon: RollerCoaster, label: '力学的エネルギー' },
    { type: 'counter', icon: SquarePlus, label: 'カウンター' },
];
