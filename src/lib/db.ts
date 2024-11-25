import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';
import * as fs from 'node:fs';

let db: Database | null = null;

export const connectToDatabase = async (): Promise<Database> => {
  if (!db) {
    db = await open({
      filename: 'database/twyllbot.db',
      driver: sqlite3.Database,
    });
    console.log('Database connected successfully.');
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.close();
    db = null;
    console.log('Database connection closed.');
  }
};

export const seedDatabase = async (): Promise<void> => {
  const db = await connectToDatabase();
  const data = fs.readFileSync('./data/strings.csv', 'utf8');
  const lines = data.split('\n');
  for (const line of lines) {
    const [action, value] = line.split(',');
    await db.run(
      'INSERT INTO strings (action, value) VALUES (?, ?) ON CONFLICT DO NOTHING',
      action,
      value
    );
  }
  console.log('Database seeded successfully.');
};
