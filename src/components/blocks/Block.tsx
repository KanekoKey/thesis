import { BlockData } from '@/types/block';
import CounterBlock from './CounterBlock';
import RollerCoasterBlock from './RollerCoasterBlock';
import TextBlock from './TextBlock';
import ErrorBlock from './ErrorBlock';

interface Props {
  block: BlockData;
}

export default function Block({ block }: Props) {
  
  switch (block.type) {
    
    // CounterBlock
    case 'counter':
      return <CounterBlock {...block.parameters} />;

    // RollerCoasterBlock
    case 'roller-coaster':
      return <RollerCoasterBlock {...block.parameters} />;

    // TextBlock
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'text':
      return <TextBlock type={block.type} content={block.parameters.content} />;

    // ErrorBlock（不明なタイプのブロック）
    default:
      return <ErrorBlock />;
  }
}