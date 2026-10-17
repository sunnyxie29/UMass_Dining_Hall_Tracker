export const DINING_HALLS = [
  { id: 1, name: 'Worcester' },
  { id: 2, name: 'Franklin' },
  { id: 3, name: 'Berkshire' },
  { id: 4, name: 'Hampshire' },
];

export const isDiningHallId = (id) => DINING_HALLS.some((hall) => hall.id === id);

export const getDiningHallName = (id) => DINING_HALLS.find((hall) => hall.id === id)?.name;

export const toMenuItemDto = (item) => ({
  name: item.name,
  diningHallId: item.diningHallId,
  section: item.section,
});
