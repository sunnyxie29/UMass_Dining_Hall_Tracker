export const DINING_HALLS = ['Worcester', 'Franklin', 'Berkshire', 'Hampshire'];

export const isDiningHall = (value) => DINING_HALLS.includes(value);

export const toMenuItemDto = (item) => ({
  name: item.name,
  diningHall: item.diningHall,
  section: item.section,
});
