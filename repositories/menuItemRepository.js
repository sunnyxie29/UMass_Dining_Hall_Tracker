import { readFile, writeFile } from 'node:fs/promises';

const FILE = new URL('../data/menu-items.json', import.meta.url);

const readAll = async () => JSON.parse(await readFile(FILE, 'utf-8'));
const writeAll = (items) => writeFile(FILE, JSON.stringify(items, null, 2));

export const create = async (item) => {
  const items = await readAll();
  items.push(item);
  await writeAll(items);
  return item;
};
export const update = async (index, item) => {
  const items = await readAll();
  if (!items[index]) return null;
  items[index] = item;
  await writeAll(items);
  return item;
};

export const remove = async (index) => {
  const items = await readAll();
  if (!items[index]) return false;
  items.splice(index, 1);
  await writeAll(items);
  return true;
};

export const findAll = readAll;