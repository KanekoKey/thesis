import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';

export default function NewEditorPage() {
  const newDeckId = randomBytes(4).toString('hex');

  redirect(`/editor/${newDeckId}`);

  return null;
}