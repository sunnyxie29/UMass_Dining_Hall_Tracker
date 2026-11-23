import { jest } from "@jest/globals";

const mockRepository = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findById: jest.fn(),
};

jest.unstable_mockModule("../repositories/menuItemRepository.js", () => ({
  findAll: mockRepository.findAll,
  create: mockRepository.create,
  update: mockRepository.update,
  remove: mockRepository.remove,
  findById: mockRepository.findById,
}));

const service = await import("../services/menuItemService.js");

const validInput = {
  name: "Burger",
  diningHallId: 2,
  section: "Dinner",
};

const owner = {
  id: "user-1",
  role: "member",
};

const otherUser = {
  id: "user-2",
  role: "member",
};

const admin = {
  id: "admin-1",
  role: "admin",
};

const existingItem = {
  _id: "abc123",
  name: "Old Burger",
  diningHallId: 1,
  section: "Lunch",
  createdBy: "user-1",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Menu Item Service", () => {
  describe("createItem", () => {
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
        createdBy: "user-1",
      };

      mockRepository.create.mockResolvedValue(savedItem);

      const result = await service.createItem(input, "user-1");
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: "Pizza",
        diningHallId: 1,
        section: "Lunch",
        createdBy: "user-1",
      });

      expect(result).toEqual(savedItem);
    });
  });

  describe("getAllItems", () => {
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
  });

  describe("updateItem", () => {
    test("should update a menu item when the user is its owner", async () => {
      const updatedItem = {
        _id: "abc123",
        ...validInput,
        createdBy: "user-1",
      };
      mockRepository.findById.mockResolvedValue(existingItem);
      mockRepository.update.mockResolvedValue(updatedItem);

      const result = await service.updateItem("abc123", validInput, owner);

      expect(mockRepository.findById).toHaveBeenCalledWith("abc123");
      expect(mockRepository.update).toHaveBeenCalledWith("abc123", validInput);
      expect(result).toEqual(updatedItem);
    });

    test("should allow an admin to update another user's item", async () => {
      const updatedItem = {
        _id: "abc123",
        ...validInput,
        createdBy: "user-1",
      };

      mockRepository.findById.mockResolvedValue(existingItem);
      mockRepository.update.mockResolvedValue(updatedItem);

      const result = await service.updateItem("abc123", validInput, admin);

      expect(mockRepository.findById).toHaveBeenCalledWith("abc123");
      expect(mockRepository.update).toHaveBeenCalledWith("abc123", validInput);
      expect(result).toEqual(updatedItem);
    });
    test("should reject a non-owner with 403 when updating", async () => {
      mockRepository.findById.mockResolvedValue(existingItem);

      await expect(
        service.updateItem("abc123", validInput, otherUser),
      ).rejects.toMatchObject({
        status: 403,
        message: "You are not authorized to modify this item.",
      });

      expect(mockRepository.findById).toHaveBeenCalledWith("abc123");
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    test("should return 404 when updating a nonexistent item", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateItem("notfound", validInput, owner),
      ).rejects.toMatchObject({
        status: 404,
        message: "Menu item not found.",
      });

      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteItem", () => {
    test("should delete a menu item when the user is its owner", async () => {
      mockRepository.findById.mockResolvedValue(existingItem);
      mockRepository.remove.mockResolvedValue(true);

      await service.deleteItem("abc123", owner);

      expect(mockRepository.findById).toHaveBeenCalledWith("abc123");
      expect(mockRepository.remove).toHaveBeenCalledWith("abc123");
    });

    test("should allow an admin to delete another user's item", async () => {
      mockRepository.findById.mockResolvedValue(existingItem);
      mockRepository.remove.mockResolvedValue(true);

      await service.deleteItem("abc123", admin);

      expect(mockRepository.findById).toHaveBeenCalledWith("abc123");
      expect(mockRepository.remove).toHaveBeenCalledWith("abc123");
    });

    test("should reject a non-owner with 403 when deleting", async () => {
      mockRepository.findById.mockResolvedValue(existingItem);

      await expect(
        service.deleteItem("abc123", otherUser),
      ).rejects.toMatchObject({
        status: 403,
        message: "You are not authorized to modify this item.",
      });

      expect(mockRepository.findById).toHaveBeenCalledWith("abc123");
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });

    test("should return 404 when deleting a nonexistent item", async () => {
      // MODIFIED: The item lookup determines whether the item exists.
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deleteItem("notfound", owner)).rejects.toMatchObject(
        {
          status: 404,
          message: "Menu item not found.",
        },
      );

      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });
});
