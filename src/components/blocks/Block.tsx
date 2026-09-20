import { BlockData } from '@/types/block';

import TextBlock from './TextBlock';
import H1Block from './H1Block';
import H2Block from './H2Block';
import H3Block from './H3Block';
import H4Block from './H4Block';
import RollerCoasterBlock from './RollerCoasterBlock';
import CounterBlock from './CounterBlock';
import ErrorBlock from './ErrorBlock';

interface Props {
  block: BlockData;
  // サムネイル/プレビュー(ScaledSlide経由)ではfalseにし、権限バッジ等の操作UIを出さない。
  // 通常のスライド表示(ActiveSlideStage・guest画面)では常にtrue。
  interactive?: boolean;
}

// テキスト系は中身が置かれたセルより大きくてもはみ出さないようクリップする。
// data-clip は、エディタがはみ出し警告を出すために「クリップされている要素」を見つける目印
function Clipped({ children }: { children: React.ReactNode }) {
  return <div data-clip className="h-full w-full overflow-hidden">{children}</div>;
}

export default function Block({ block, interactive = true }: Props) {

  switch (block.type) {
    case 'text': return <Clipped><TextBlock {...block.parameters} /></Clipped>;
    case 'h1': return <Clipped><H1Block {...block.parameters} /></Clipped>;
    case 'h2': return <Clipped><H2Block {...block.parameters} /></Clipped>;
    case 'h3': return <Clipped><H3Block {...block.parameters} /></Clipped>;
    case 'h4': return <Clipped><H4Block {...block.parameters} /></Clipped>;
    case 'counter': return <CounterBlock {...block.parameters} />;
    case 'roller-coaster': return <RollerCoasterBlock id={block.id} permission={block.permission} interactive={interactive} {...block.parameters} />;

    default: return <ErrorBlock />;
  }
}