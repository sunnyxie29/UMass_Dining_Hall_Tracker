import ejs from 'ejs';
import { DINING_HALLS } from '../dtos/menuitemdto.js';

const partial = (name) => new URL(`../views/partials/${name}.ejs`, import.meta.url).pathname;

const item = { id: 7, name: 'Chicken Tenders', diningHallId: 2, hallName: 'Franklin', section: 'Grill' };

describe('menu-item partial', () => {
  let html;

  beforeAll(async () => {
    html = await ejs.renderFile(partial('menu-item'), { item, halls: DINING_HALLS });
  });

  test('shows the item name, hall and section', () => {
    expect(html).toContain('Chicken Tenders');
    expect(html).toContain('Franklin');
    expect(html).toContain('Grill');
  });

  test('gives the delete button an hx-delete aimed at the item id and the list', () => {
    expect(html).toContain('hx-delete="/menu-items/7"');
    expect(html).toContain('hx-target="#items"');
  });

  test('gives the edit form an hx-put that swaps the row in place', () => {
    expect(html).toContain('hx-put="/menu-items/7"');
    expect(html).toContain('hx-target="closest li"');
    expect(html).toContain('hx-swap="outerHTML"');
  });

  test('preselects the item hall in the edit form', () => {
    expect(html).toMatch(/<option value="2" selected>Franklin<\/option>/);
    expect(html).not.toMatch(/<option value="1" selected>/);
  });

  test('escapes markup in item fields', async () => {
    const unsafe = { ...item, name: '<script>alert(1)</script>' };
    const output = await ejs.renderFile(partial('menu-item'), { item: unsafe, halls: DINING_HALLS });

    expect(output).not.toContain('<script>alert(1)</script>');
    expect(output).toContain('&lt;script&gt;');
  });
});

describe('menu-items partial', () => {
  test('renders one row per item and clears the error area out of band', async () => {
    const items = [item, { ...item, id: 8, name: 'Pasta' }];

    const html = await ejs.renderFile(partial('menu-items'), { items, halls: DINING_HALLS });

    expect(html.match(/<li /g)).toHaveLength(2);
    expect(html).toContain('id="form-error"');
    expect(html).toContain('hx-swap-oob="innerHTML"');
  });

  test('renders only the error-clearing element for an empty list', async () => {
    const html = await ejs.renderFile(partial('menu-items'), { items: [], halls: DINING_HALLS });

    expect(html).not.toContain('<li ');
    expect(html).toContain('hx-swap-oob="innerHTML"');
  });
});
