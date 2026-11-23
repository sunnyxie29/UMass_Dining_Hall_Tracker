import * as repository from "../repositories/menuItemRepository.js";
import mongoose from "mongoose";

const fail = (status, message) => Object.assign(new Error(message), { status });

const isOwnerOrAdmin = (item, user) => {
  if (user.role === "admin") return true;

  return item.createdBy?.toString() === user.id;
};

const authorizeItem = (item, user) => {
  if (!isOwnerOrAdmin(item, user)) {
    throw fail(403, "You are not authorized to modify this item.");
  }
};

const validate = ({ name, diningHallId, section }) => {
  if (!name || !name.trim()) throw fail(400, "Item name is required.");
  if (![1, 2, 3, 4].includes(Number(diningHallId)))
    throw fail(400, "Please choose a valid dining hall.");
  if (!section || !section.trim()) throw fail(400, "Section is required.");
};

const validateObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw fail(400, "Invalid menu item ID.");
  }
};

const toItem = ({ name, diningHallId, section }) => ({
  name: name.trim(),
  diningHallId: Number(diningHallId),
  section: section.trim(),
});

export const getAllItems = async () => repository.findAll();

export const createItem = async (input, userId) => {
  validate(input);
  return repository.create({ ...toItem(input), createdBy: userId });
};

export const updateItem = async (id, input, user) => {
  validateObjectId(id);
  validate(input);
  const item = await repository.findById(id);
  if (!item) throw fail(404, "Menu item not found.");
  authorizeItem(item, user);
  const saved = await repository.update(id, toItem(input));
  return saved;
};

export const deleteItem = async (id, user) => {
  validateObjectId(id);
  const item = await repository.findById(id);
  if (!item) throw fail(404, "Menu item not found.");
  authorizeItem(item, user);
  await repository.remove(id);
};
