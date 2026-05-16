import { BlockData } from '@/types/block';
import TextBlock from './TextBlock';
import CounterBlock from './CounterBlock';
import ErrorBlock from './ErrorBlock';

interface Props {
  block: BlockData;
}

export default function Block({ block }: Props) {
  
  // switch文を使うことで、TypeScriptに「今はどのブロックなのか」を完璧に理解させます
  switch (block.type) {
    
    // ① カウンターブロックの場合
    case 'counter':
      // 🌟 ここでは block が CounterBlockData だと確定しているので、
      // parameters の中身をそのまま安全に渡せます。
      return <CounterBlock {...block.parameters} />;

    // ② テキスト系ブロックの場合（どれか1つでも当てはまればここを通る）
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'text':
      // 🌟 ここでは block が TextBlockData だと確定しています。
      // type と content をそれぞれ渡します。
      return <TextBlock type={block.type} content={block.parameters.content} />;

    // ③ 予期せぬデータが来た場合
    default:
      return <ErrorBlock />;
  }
}