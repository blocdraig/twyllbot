import { connectToDatabase } from '../lib/db';

export const ActionTypes = {
  DELETE: 'delete',
  BAN: 'ban',
};

export interface IString {
  action: string;
  value: string;
}

let strings: IString[] | null = null;

export const loadStrings = async (): Promise<void> => {
  if (strings === null) {
    const db = await connectToDatabase();
    strings =
      ((await db.all('SELECT action, value FROM strings')) as IString[]) || [];
  }
};

export const getStrings = async (): Promise<IString[]> => {
  if (strings === null) {
    await loadStrings();
  }
  return strings;
};

export const addString = async (string: IString): Promise<void> => {
  if (strings === null) {
    await loadStrings();
  }

  const db = await connectToDatabase();
  const res = await db.run(
    'INSERT INTO strings (value, action) VALUES (?, ?) ON CONFLICT DO NOTHING',
    [string.value, string.action]
  );
  if (res.changes) {
    strings.push(string);
  }
};

export const matchString = (text: string): IString | undefined => {
  return strings?.find((s) => text.includes(s.value));
};
