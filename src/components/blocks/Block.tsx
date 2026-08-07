import { BlockData } from '@/types/block';

import TextBlock from './TextBlock';
import H1Block from './H1Block';
import H2Block from './H2Block';
import H3Block from './H3Block';
import H4Block from './H4Block';
import RollerCoasterBlock from './RollerCoasterBlock';
import CounterBlock from './CounterBlock';
import TwoColumnBlock from './TwoColumnBlock';
import ErrorBlock from './ErrorBlock';

interface Props {
  block: BlockData;
  // サムネイル/プレビュー(ScaledSlide経由)ではfalseにし、権限バッジ等の操作UIを出さない。
  // 通常のスライド表示(ActiveSlideStage・guest画面)では常にtrue。
  interactive?: boolean;
  // エディタ(SortableBlockItem経由)から描画されているときだけtrue。
  // two-column内の子ブロックをドラッグ並び替え可能にするかどうかを切り替える。
  // 教材提示(classroom)側では常にfalse(デフォルト)。
  editable?: boolean;
}

export default function Block({ block, interactive = true, editable = false }: Props) {

  switch (block.type) {
    case 'text': return <TextBlock {...block.parameters} />;
    case 'h1': return <H1Block {...block.parameters} />;
    case 'h2': return <H2Block {...block.parameters} />;
    case 'h3': return <H3Block {...block.parameters} />;
    case 'h4': return <H4Block {...block.parameters} />;
    case 'counter': return <CounterBlock {...block.parameters} />;
    case 'roller-coaster': return <RollerCoasterBlock id={block.id} permission={block.permission} interactive={interactive} {...block.parameters} />;
    case 'two-column': return <TwoColumnBlock id={block.id} editable={editable} {...block.parameters} />;

    default: return <ErrorBlock />;
  }
}