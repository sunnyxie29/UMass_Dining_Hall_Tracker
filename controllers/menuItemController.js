import * as service from "../services/menuItemService.js";
import { DINING_HALLS, getDiningHallName } from "../dtos/menuitemdto.js";

const isHtmx = (req) => req.get("HX-Request") === "true";

const toRow = (item, index) => ({
  id: item.id ?? item._id?.toString() ?? index,
  name: item.name,
  diningHallId: item.diningHallId,
  hallName: getDiningHallName(item.diningHallId) ?? "Unknown hall",
  section: item.section,
});

const renderList = async (res, status = 200) => {
  const items = await service.getAllItems();
  res.status(status).render("partials/menu-items", {
    items: items.map(toRow),
    halls: DINING_HALLS,
  });
};

export const list = async (req, res, next) => {
  try {
    if (isHtmx(req)) return await renderList(res);
    res.json(await service.getAllItems());
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const saved = await service.createItem(req.body);
    if (isHtmx(req)) return await renderList(res, 201);
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const saved = await service.updateItem(req.params.id, req.body);
    if (isHtmx(req)) {
      return res.render("partials/menu-item", {
        item: toRow({ ...saved.toObject ? saved.toObject() : saved, id: req.params.id }),
        halls: DINING_HALLS,
      });
    }
    res.json(saved);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await service.deleteItem(req.params.id);
    if (isHtmx(req)) return await renderList(res);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
