import { jest } from "@jest/globals";
const mockRepository = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};
jest.unstable_mockModule("../repositories/menuItemRepository.js", () => ({
  findAll: mockRepository.findAll,
  create: mockRepository.create,
  update: mockRepository.update,
  remove: mockRepository.remove,
}));

const service = await import("../services/menuItemService.js");
beforeEach(() => {
  jest.clearAllMocks();
});
describe("Menu Item Service", () => {
  test("should reject an empty item name", async () => {
    await expect(
      service.createItem({
        name: "",
        diningHallId: 1,
        section: "Lunch",
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: "Item name is required.",
    });
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  test("should reject an invalid dining hall ID", async () => {
    await expect(
      service.createItem({
        name: "Pizza",
        diningHallId: 5,
        section: "Lunch",
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: "Please choose a valid dining hall.",
    });
    expect(mockRepository.create).not.toHaveBeenCalled();
  });
  test("should reject an empty section", async () => {
    await expect(
      service.createItem({
        name: "Pizza",
        diningHallId: 1,
        section: "",
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: "Section is required.",
    });

    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  test("should create a menu item with valid data", async () => {
    const input = {
      name: "Pizza",
      diningHallId: "1",
      section: "Lunch",
    };
    const savedItem = {
      _id: "abc123",
      name: "Pizza",
      diningHallId: 1,
      section: "Lunch",
    };
    mockRepository.create.mockResolvedValue(savedItem);

    const result = await service.createItem(input);

    expect(mockRepository.create).toHaveBeenCalledWith({
      name: "Pizza",
      diningHallId: 1,
      section: "Lunch",
    });

    expect(result).toEqual(savedItem);
  });

  test("should return all menu items", async () => {
    const items = [
      {
        _id: "abc123",
        name: "Pizza",
        diningHallId: 1,
        section: "Lunch",
      },
    ];

    mockRepository.findAll.mockResolvedValue(items);

    const result = await service.getAllItems();

    expect(result).toEqual(items);
    expect(mockRepository.findAll).toHaveBeenCalled();
  });

  test("should update a menu item by its ID", async () => {
    const updatedItem = {
      _id: "abc123",
      name: "Burger",
      diningHallId: 2,
      section: "Dinner",
    };

    mockRepository.update.mockResolvedValue(updatedItem);

    const result = await service.updateItem("abc123", {
      name: "Burger",
      diningHallId: 2,
      section: "Dinner",
    });

    expect(mockRepository.update).toHaveBeenCalledWith("abc123", {
      name: "Burger",
      diningHallId: 2,
      section: "Dinner",
    });

    expect(result).toEqual(updatedItem);
  });

  test("should return 404 when updating a nonexistent item", async () => {
    mockRepository.update.mockResolvedValue(null);

    await expect(
      service.updateItem("notfound", {
        name: "Burger",
        diningHallId: 2,
        section: "Dinner",
      }),
    ).rejects.toMatchObject({
      status: 404,
      message: "Menu item not found.",
    });
  });

  test("should delete a menu item by its ID", async () => {
    mockRepository.remove.mockResolvedValue(true);

    await service.deleteItem("abc123");

    expect(mockRepository.remove).toHaveBeenCalledWith("abc123");
  });

  test("should return 404 when deleting a nonexistent item", async () => {
    mockRepository.remove.mockResolvedValue(false);

    await expect(service.deleteItem("notfound")).rejects.toMatchObject({
      status: 404,
      message: "Menu item not found.",
    });
  });
});
