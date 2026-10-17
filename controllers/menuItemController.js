import * as service from '../services/menuItemService.js';

export const list = async (req, res, next) => {
  try {
    res.json(await service.getAllItems());
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    res.status(201).json(await service.createItem(req.body));
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    res.json(await service.updateItem(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await service.deleteItem(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};