const STORAGE_KEY = 'pantry-items-v1';

const form = document.getElementById('entryForm');
const itemName = document.getElementById('itemName');
const itemCategory = document.getElementById('itemCategory');
const itemNote = document.getElementById('itemNote');
const itemRows = document.getElementById('itemRows');
const emptyState = document.getElementById('emptyState');
const clearAllBtn = document.getElementById('clearAllBtn');
const rowTemplate = document.getElementById('rowTemplate');

let items = loadItems();

render();

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = itemName.value.trim();
  const category = itemCategory.value;
  const note = itemNote.value.trim();

  if (!name) return;

  items.unshift({
    id: crypto.randomUUID(),
    name,
    category,
    note,
    low: false,
    createdAt: new Date().toISOString()
  });

  saveItems();
  form.reset();
  itemName.focus();
  render();
});

clearAllBtn.addEventListener('click', () => {
  if (!items.length) return;
  const ok = confirm('Clear every pantry item from this browser?');
  if (!ok) return;
  items = [];
  saveItems();
  render();
});

itemRows.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const row = button.closest('tr[data-id]');
  if (!row) return;

  const id = row.dataset.id;
  const action = button.dataset.action;
  const item = items.find((entry) => entry.id === id);
  if (!item) return;

  if (action === 'toggle-low') {
    item.low = !item.low;
    saveItems();
    render();
    return;
  }

  if (action === 'remove') {
    items = items.filter((entry) => entry.id !== id);
    saveItems();
    render();
  }
});

function render() {
  itemRows.innerHTML = '';
  emptyState.hidden = items.length > 0;

  for (const item of items) {
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    row.dataset.id = item.id;
    row.classList.toggle('low', item.low);

    row.querySelector('[data-field="name"]').textContent = item.name;
    row.querySelector('[data-field="category"]').textContent = item.category;
    row.querySelector('[data-field="note"]').textContent = item.note || '—';

    const statusButton = row.querySelector('[data-action="toggle-low"]');
    statusButton.textContent = item.low ? 'Running low' : 'Normal';

    itemRows.appendChild(row);
  }
}

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
