import { BlockProps } from '@/types/block';
import TextBlock from './TextBlock';
import ErrorBlock from './ErrorBlock';


export default function Block(props: BlockProps) {

  if (props.type === 'h1' || props.type === 'h2' || props.type === 'h3'
    || props.type === 'h4' || props.type === 'text') {
    return <TextBlock type={props.type}>{props.children}</TextBlock>;
  }

  return <ErrorBlock />;
}
