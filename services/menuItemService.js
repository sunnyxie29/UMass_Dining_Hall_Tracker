import * as repository from '../repositories/menuItemRepository.js';

const fail = (status, message) => Object.assign(new Error(message), { status });

const validate = ({ name, diningHallId, section }) => {
  if (!name || !name.trim()) throw fail(400, 'Item name is required.');
  if (![1, 2, 3, 4].includes(Number(diningHallId))) throw fail(400, 'Please choose a valid dining hall.');
  if (!section || !section.trim()) throw fail(400, 'Section is required.');
};


const toItem = ({ name, diningHallId, section }) => ({
  name: name.trim(),
  diningHallId: Number(diningHallId),
  section: section.trim(),
});

export const getAllItems = async () => repository.findAll();

export const createItem = async (input) => {
  validate(input);
  return repository.create(toItem(input));
};

export const updateItem = async (id, input) => {
  validate(input);
  const saved = await repository.update(Number(id), toItem(input));
  if (!saved) throw fail(404, 'Menu item not found.');
  return saved;
};

export const deleteItem = async (id) => {
  const removed = await repository.remove(Number(id));
  if (!removed) throw fail(404, 'Menu item not found.');
};