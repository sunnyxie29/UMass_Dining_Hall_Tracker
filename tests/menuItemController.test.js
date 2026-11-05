import { jest } from '@jest/globals';
import { DINING_HALLS } from '../dtos/menuitemdto.js';

const service = {
  getAllItems: jest.fn(),
  createItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
};

jest.unstable_mockModule('../services/menuItemService.js', () => service);

const controller = await import('../controllers/menuItemController.js');

const makeReq = ({ htmx = false, params = {}, body = {} } = {}) => ({
  params,
  body,
  get: (name) => (htmx && name === 'HX-Request' ? 'true' : undefined),
});

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.render = jest.fn(() => res);
  res.end = jest.fn(() => res);
  return res;
};

const stored = [
  { name: 'Chicken Tenders', diningHallId: 1, section: 'Grill' },
  { name: 'Pasta', diningHallId: 3, section: 'Bowl' },
];

const rows = [
  { id: 0, name: 'Chicken Tenders', diningHallId: 1, hallName: 'Worcester', section: 'Grill' },
  { id: 1, name: 'Pasta', diningHallId: 3, hallName: 'Berkshire', section: 'Bowl' },
];

beforeEach(() => {
  jest.resetAllMocks();
});

describe('list', () => {
  test('answers a plain request with JSON', async () => {
    service.getAllItems.mockResolvedValue(stored);
    const res = makeRes();

    await controller.list(makeReq(), res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(stored);
    expect(res.render).not.toHaveBeenCalled();
  });

  test('answers an HTMX request with the list partial', async () => {
    service.getAllItems.mockResolvedValue(stored);
    const res = makeRes();

    await controller.list(makeReq({ htmx: true }), res, jest.fn());

    expect(res.render).toHaveBeenCalledWith('partials/menu-items', { items: rows, halls: DINING_HALLS });
    expect(res.json).not.toHaveBeenCalled();
  });

  test('prefers an id on the item over its position', async () => {
    service.getAllItems.mockResolvedValue([
      { id: 'abc', name: 'Soup', diningHallId: 2, section: 'Deli' },
      { _id: { toString: () => 'def' }, name: 'Rice', diningHallId: 4, section: 'Wok' },
    ]);
    const res = makeRes();

    await controller.list(makeReq({ htmx: true }), res, jest.fn());

    const { items } = res.render.mock.calls[0][1];
    expect(items.map((item) => item.id)).toEqual(['abc', 'def']);
  });

  test('labels an item with an unknown hall id', async () => {
    service.getAllItems.mockResolvedValue([{ name: 'Mystery', diningHallId: 99, section: 'Nowhere' }]);
    const res = makeRes();

    await controller.list(makeReq({ htmx: true }), res, jest.fn());

    expect(res.render.mock.calls[0][1].items[0].hallName).toBe('Unknown hall');
  });
});

describe('create', () => {
  const body = { name: 'Pasta', diningHallId: '3', section: 'Bowl' };

  test('answers a plain request with the saved item as JSON', async () => {
    service.createItem.mockResolvedValue(stored[1]);
    const res = makeRes();

    await controller.create(makeReq({ body }), res, jest.fn());

    expect(service.createItem).toHaveBeenCalledWith(body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(stored[1]);
  });

  test('answers an HTMX request with the refreshed list partial', async () => {
    service.createItem.mockResolvedValue(stored[1]);
    service.getAllItems.mockResolvedValue(stored);
    const res = makeRes();

    await controller.create(makeReq({ htmx: true, body }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.render).toHaveBeenCalledWith('partials/menu-items', { items: rows, halls: DINING_HALLS });
    expect(res.json).not.toHaveBeenCalled();
  });

  test('passes a service error to next and renders nothing', async () => {
    const error = Object.assign(new Error('Item name is required.'), { status: 400 });
    service.createItem.mockRejectedValue(error);
    const res = makeRes();
    const next = jest.fn();

    await controller.create(makeReq({ htmx: true, body: {} }), res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.render).not.toHaveBeenCalled();
  });
});

describe('update', () => {
  const body = { name: 'Pasta', diningHallId: '2', section: 'Bowl' };
  const saved = { name: 'Pasta', diningHallId: 2, section: 'Bowl' };

  test('answers a plain request with the saved item as JSON', async () => {
    service.updateItem.mockResolvedValue(saved);
    const res = makeRes();

    await controller.update(makeReq({ params: { id: '1' }, body }), res, jest.fn());

    expect(service.updateItem).toHaveBeenCalledWith('1', body);
    expect(res.json).toHaveBeenCalledWith(saved);
  });

  test('answers an HTMX request with a single row partial keyed by the request id', async () => {
    service.updateItem.mockResolvedValue(saved);
    const res = makeRes();

    await controller.update(makeReq({ htmx: true, params: { id: '1' }, body }), res, jest.fn());

    expect(res.render).toHaveBeenCalledWith('partials/menu-item', {
      item: { id: '1', name: 'Pasta', diningHallId: 2, hallName: 'Franklin', section: 'Bowl' },
      halls: DINING_HALLS,
    });
    expect(res.json).not.toHaveBeenCalled();
  });

  test('passes a not-found error to next', async () => {
    const error = Object.assign(new Error('Menu item not found.'), { status: 404 });
    service.updateItem.mockRejectedValue(error);
    const res = makeRes();
    const next = jest.fn();

    await controller.update(makeReq({ htmx: true, params: { id: '9' }, body }), res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.render).not.toHaveBeenCalled();
  });
});

describe('remove', () => {
  test('answers a plain request with 204 and no body', async () => {
    service.deleteItem.mockResolvedValue(undefined);
    const res = makeRes();

    await controller.remove(makeReq({ params: { id: '0' } }), res, jest.fn());

    expect(service.deleteItem).toHaveBeenCalledWith('0');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  test('answers an HTMX request with the refreshed list so row ids stay correct', async () => {
    service.deleteItem.mockResolvedValue(undefined);
    service.getAllItems.mockResolvedValue([stored[1]]);
    const res = makeRes();

    await controller.remove(makeReq({ htmx: true, params: { id: '0' } }), res, jest.fn());

    expect(res.render).toHaveBeenCalledWith('partials/menu-items', {
      items: [{ ...rows[1], id: 0 }],
      halls: DINING_HALLS,
    });
    expect(res.end).not.toHaveBeenCalled();
  });

  test('passes a not-found error to next', async () => {
    const error = Object.assign(new Error('Menu item not found.'), { status: 404 });
    service.deleteItem.mockRejectedValue(error);
    const res = makeRes();
    const next = jest.fn();

    await controller.remove(makeReq({ htmx: true, params: { id: '9' } }), res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.render).not.toHaveBeenCalled();
  });
});
