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
}

export default function Block({ block }: Props) {

  switch (block.type) {
    case 'text': return <TextBlock {...block.parameters} />;
    case 'h1': return <H1Block {...block.parameters} />;
    case 'h2': return <H2Block {...block.parameters} />;
    case 'h3': return <H3Block {...block.parameters} />;
    case 'h4': return <H4Block {...block.parameters} />;
    case 'counter': return <CounterBlock {...block.parameters} />;
    case 'roller-coaster': return <RollerCoasterBlock {...block.parameters} />;
    case 'two-column': return <TwoColumnBlock id={block.id} {...block.parameters} />;

    default: return <ErrorBlock />;
  }
}