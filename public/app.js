const ITEMS_URL = '/menu-items';
const DINING_HALLS = ['Worcester', 'Franklin', 'Berkshire', 'Hampshire'];

const form = document.querySelector('#item-form');
const list = document.querySelector('#items');
const hallSelect = form.querySelector('select[name="diningHall"]');

const timedFetch = (url, options = {}) =>
  fetch(url, { ...options, signal: AbortSignal.timeout(5000) });

const fetchJSON = async (url, options) => {
  let response;
  try {
    response = await timedFetch(url, options);
  } catch (error) {
    throw new Error(error.name === 'TimeoutError'
      ? 'The server did not answer within five seconds.'
      : 'Could not reach the server.');
  }

  let body = {};
  try {
    body = await response.json();
  } catch {
    body = {};
  }

  if (!response.ok) {
    throw new Error(body.error || `The server answered ${response.status}.`);
  }
  return body;
};

const makeOption = (value, label) => {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  return option;
};

const fillHallSelect = (select, selected = '') => {
  const placeholder = makeOption('', 'Choose a dining hall');
  placeholder.disabled = true;
  select.replaceChildren(
    placeholder,
    ...DINING_HALLS.map((hall) => makeOption(hall, hall)),
  );
  select.value = selected;
};

const makeInput = (name, value, placeholder = '') => {
  const input = document.createElement('input');
  input.type = 'text';
  input.name = name;
  input.value = value;
  input.placeholder = placeholder;
  return input;
};

const makeButton = (className, label) => {
  const button = document.createElement('button');
  button.className = className;
  button.type = 'button';
  button.textContent = label;
  return button;
};

const fillDisplay = (display, item) => {
  const name = document.createElement('strong');
  name.className = 'item-name';
  name.textContent = item.name;

  const hall = document.createElement('span');
  hall.className = 'item-hall';
  hall.textContent = item.diningHall;

  const section = document.createElement('span');
  section.className = 'item-section';
  section.textContent = item.section;

  display.replaceChildren(name, ' ', hall, ' ', section);
};

const buildItem = (item) => {
  const li = document.createElement('li');
  li.dataset.id = list.children.length;
  li.dataset.name = item.name;
  li.dataset.diningHall = item.diningHall;
  li.dataset.section = item.section;

  const display = document.createElement('span');
  display.className = 'item-display';
  fillDisplay(display, item);

  li.append(display, makeButton('edit-btn', 'Edit'), makeButton('delete-btn', 'Delete'));
  return li;
};

const renumber = () => {
  [...list.children].forEach((li, index) => {
    li.dataset.id = index;
  });
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const item = Object.fromEntries(new FormData(form));
  const button = form.querySelector('button');

  button.disabled = true;
  try {
    const saved = await fetchJSON(ITEMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    list.append(buildItem(saved));
    form.reset();
  } catch (error) {
    alert(`Your item was not saved. ${error.message}`);
  } finally {
    button.disabled = false;
  }
});

const startEdit = (li) => {
  const display = li.querySelector('.item-display');
  const buttons = li.querySelectorAll('.edit-btn, .delete-btn');

  const editForm = document.createElement('form');
  editForm.className = 'edit-form';

  const hallPicker = document.createElement('select');
  hallPicker.name = 'diningHall';
  fillHallSelect(hallPicker, li.dataset.diningHall);

  const save = document.createElement('button');
  save.type = 'submit';
  save.textContent = 'Save';

  editForm.append(
    makeInput('name', li.dataset.name, 'Item name'),
    hallPicker,
    makeInput('section', li.dataset.section, 'Section'),
    save,
    makeButton('cancel-btn', 'Cancel'),
  );

  display.replaceWith(editForm);
  buttons.forEach((button) => { button.hidden = true; });

  editForm.querySelector('.cancel-btn').addEventListener('click', () => {
    editForm.replaceWith(display);
    buttons.forEach((button) => { button.hidden = false; });
  });

  editForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const item = Object.fromEntries(new FormData(editForm));

    save.disabled = true;
    try {
      const saved = await fetchJSON(`${ITEMS_URL}/${li.dataset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      li.dataset.name = saved.name;
      li.dataset.diningHall = saved.diningHall;
      li.dataset.section = saved.section;
      fillDisplay(display, saved);
      editForm.replaceWith(display);
      buttons.forEach((button) => { button.hidden = false; });
    } catch (error) {
      alert(`Your changes were not saved. ${error.message}`);
    } finally {
      save.disabled = false;
    }
  });
};

list.addEventListener('click', async (event) => {
  if (event.target.matches('.edit-btn')) {
    startEdit(event.target.closest('li'));
    return;
  }

  if (!event.target.matches('.delete-btn')) return;

  const button = event.target;
  const li = button.closest('li');

  button.disabled = true;
  try {
    await fetchJSON(`${ITEMS_URL}/${li.dataset.id}`, { method: 'DELETE' });
    li.remove();
    renumber();
  } catch (error) {
    alert(`That item was not deleted. ${error.message}`);
    button.disabled = false;
  }
});

fillHallSelect(hallSelect);
