import { jest } from '@jest/globals';

const repository = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

jest.unstable_mockModule('../repositories/menuItemRepository.js', () => repository);

const service = await import('../services/menuItemService.js');

const validInput = { name: 'Chicken Tenders', diningHallId: 1, section: 'Grill' };

const NAME_ERROR = 'Item name is required.';
const HALL_ERROR = 'Please choose a valid dining hall.';
const SECTION_ERROR = 'Section is required.';

const invalidInputs = [
  ['a missing name', { ...validInput, name: undefined }, NAME_ERROR],
  ['an empty name', { ...validInput, name: '' }, NAME_ERROR],
  ['a whitespace-only name', { ...validInput, name: '   ' }, NAME_ERROR],
  ['a missing dining hall', { ...validInput, diningHallId: undefined }, HALL_ERROR],
  ['an empty dining hall', { ...validInput, diningHallId: '' }, HALL_ERROR],
  ['a dining hall id below the range', { ...validInput, diningHallId: 0 }, HALL_ERROR],
  ['a dining hall id above the range', { ...validInput, diningHallId: 5 }, HALL_ERROR],
  ['a non-numeric dining hall', { ...validInput, diningHallId: 'Worcester' }, HALL_ERROR],
  ['a missing section', { ...validInput, section: undefined }, SECTION_ERROR],
  ['an empty section', { ...validInput, section: '' }, SECTION_ERROR],
  ['a whitespace-only section', { ...validInput, section: '   ' }, SECTION_ERROR],
];

beforeEach(() => {
  jest.resetAllMocks();
});

describe('getAllItems', () => {
  test('returns whatever the repository holds', async () => {
    const items = [validInput];
    repository.findAll.mockResolvedValue(items);

    await expect(service.getAllItems()).resolves.toBe(items);
    expect(repository.findAll).toHaveBeenCalledTimes(1);
  });
});

describe('createItem', () => {
  test.each(invalidInputs)('rejects %s with a 400', async (label, input, message) => {
    await expect(service.createItem(input)).rejects.toMatchObject({ status: 400, message });
    expect(repository.create).not.toHaveBeenCalled();
  });

  test('saves a valid item and returns what the repository returns', async () => {
    const saved = { ...validInput };
    repository.create.mockResolvedValue(saved);

    await expect(service.createItem(validInput)).resolves.toBe(saved);
    expect(repository.create).toHaveBeenCalledWith(validInput);
  });

  test('trims the name and section before saving', async () => {
    repository.create.mockResolvedValue({});

    await service.createItem({ name: '  Pizza  ', diningHallId: 2, section: '  Bowl  ' });

    expect(repository.create).toHaveBeenCalledWith({
      name: 'Pizza',
      diningHallId: 2,
      section: 'Bowl',
    });
  });

  test.each(['1', '2', '3', '4'])('accepts the form string "%s" and saves it as a number', async (value) => {
    repository.create.mockResolvedValue({});

    await service.createItem({ ...validInput, diningHallId: value });

    expect(repository.create).toHaveBeenCalledWith({
      ...validInput,
      diningHallId: Number(value),
    });
  });
});

describe('updateItem', () => {
  test.each(invalidInputs)('rejects %s with a 400', async (label, input, message) => {
    await expect(service.updateItem('0', input)).rejects.toMatchObject({ status: 400, message });
    expect(repository.update).not.toHaveBeenCalled();
  });

  test('updates the item and returns the saved version', async () => {
    const saved = { ...validInput, section: 'Salad Bar' };
    repository.update.mockResolvedValue(saved);

    await expect(service.updateItem('abc123', { ...validInput, section: 'Salad Bar' })).resolves.toBe(saved);
    expect(repository.update).toHaveBeenCalledWith('abc123', { ...validInput, section: 'Salad Bar' });
  });

  test('normalizes the input the same way create does', async () => {
    repository.update.mockResolvedValue({});

    await service.updateItem('abc123', { name: '  Soup ', diningHallId: '4', section: ' Deli ' });

    expect(repository.update).toHaveBeenCalledWith('abc123', {
      name: 'Soup',
      diningHallId: 4,
      section: 'Deli',
    });
  });

  test('rejects with a 404 when the repository finds nothing to update', async () => {
    repository.update.mockResolvedValue(null);

    await expect(service.updateItem('9', validInput)).rejects.toMatchObject({
      status: 404,
      message: 'Menu item not found.',
    });
  });
});

describe('deleteItem', () => {
  test('removes the item', async () => {
    repository.remove.mockResolvedValue(true);

    await expect(service.deleteItem('abc123')).resolves.toBeUndefined();
    expect(repository.remove).toHaveBeenCalledWith('abc123');
  });

  test('rejects with a 404 when the repository finds nothing to remove', async () => {
    repository.remove.mockResolvedValue(false);

    await expect(service.deleteItem('9')).rejects.toMatchObject({
      status: 404,
      message: 'Menu item not found.',
    });
  });
});
