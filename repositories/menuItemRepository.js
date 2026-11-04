import MenuItem from "../models/menuItem.js";

export const create = async (item) => {
  return await MenuItem.create(item);
};

export const update = async (id, item) => {
  return await MenuItem.findByIdAndUpdate(id, item, {
    returnDocument: "after",
    runValidators: true,
  });
};

export const remove = async (id) => {
  const deletedItem = await MenuItem.findByIdAndDelete(id);
  return deletedItem !== null;
};
export const findById = async (id) => {
  return await MenuItem.findById(id);
};
export const findAll = async () => {
  return await MenuItem.find();
};
