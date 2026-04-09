import path from 'node:path';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readCsv } from './csv-reader.js';

let tempDir: string;

beforeAll(async () => {
  tempDir = await fs.mkdtemp(path.join(tmpdir(), 'csv-reader-'));
});

afterAll(async () => {
  await fs.rm(tempDir, { recursive: true });
});

async function writeTempCsv(name: string, content: string): Promise<string> {
  const filePath = path.join(tempDir, name);
  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
}

describe('readCsv', () => {
  it('should parse basic CSV with headers and data rows', async () => {
    const filePath = await writeTempCsv('basic.csv', 'name,age\nAlice,30\nBob,25\n');

    const result = await readCsv(filePath);

    expect(result).toEqual([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' },
    ]);
  });

  it('should parse quoted fields containing commas', async () => {
    const filePath = await writeTempCsv('quoted.csv', 'name,description\nAlice,"Hello, World"\n');

    const result = await readCsv(filePath);

    expect(result).toEqual([
      { name: 'Alice', description: 'Hello, World' },
    ]);
  });

  it('should parse escaped double quotes within quoted fields', async () => {
    const filePath = await writeTempCsv('escaped.csv', 'name,value\ntest,"""quoted"""\n');

    const result = await readCsv(filePath);

    expect(result).toEqual([
      { name: 'test', value: '"quoted"' },
    ]);
  });

  it('should handle trailing empty lines', async () => {
    const filePath = await writeTempCsv('trailing.csv', 'name,value\nAlice,1\n\n\n');

    const result = await readCsv(filePath);

    expect(result).toEqual([
      { name: 'Alice', value: '1' },
    ]);
  });

  it('should handle CRLF line endings', async () => {
    const filePath = await writeTempCsv('crlf.csv', 'name,value\r\nAlice,1\r\nBob,2\r\n');

    const result = await readCsv(filePath);

    expect(result).toEqual([
      { name: 'Alice', value: '1' },
      { name: 'Bob', value: '2' },
    ]);
  });

  it('should return empty array for header-only CSV', async () => {
    const filePath = await writeTempCsv('headeronly.csv', 'name,value\n');

    const result = await readCsv(filePath);

    expect(result).toEqual([]);
  });

  it('should return empty array for empty file', async () => {
    const filePath = await writeTempCsv('empty.csv', '');

    const result = await readCsv(filePath);

    expect(result).toEqual([]);
  });

  it('should parse CSV without trailing newline', async () => {
    const filePath = await writeTempCsv('notail.csv', 'name,value\nAlice,1');

    const result = await readCsv(filePath);

    expect(result).toEqual([
      { name: 'Alice', value: '1' },
    ]);
  });

  it('should parse Japanese text correctly', async () => {
    const filePath = await writeTempCsv('japanese.csv', 'name,display_order\n一般的なお問合せ,1\n製品/サービスについて,2\n');

    const result = await readCsv(filePath);

    expect(result).toEqual([
      { name: '一般的なお問合せ', display_order: '1' },
      { name: '製品/サービスについて', display_order: '2' },
    ]);
  });
});
