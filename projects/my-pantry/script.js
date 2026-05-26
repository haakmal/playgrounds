import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const STORAGE_KEY = 'pantry-items-v1';
const MODE_KEY = 'pantry-storage-mode-v1';

// Supabase project details
const SUPABASE_URL = 'https://kdypeumhilmnmnqzhadx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ONhtAEUGhFtgiZmfSP0gEw_Pf7hzbGR';

const form = document.getElementById('entryForm');
const itemName = document.getElementById('itemName');
const itemCategory = document.getElementById('itemCategory');
const itemNote = document.getElementById('itemNote');
const itemRows = document.getElementById('itemRows');
const emptyState = document.getElementById('emptyState');
const clearAllBtn = document.getElementById('clearAllBtn');
const rowTemplate = document.getElementById('rowTemplate');
const modeSelect = document.getElementById('modeSelect');
const statusPill = document.getElementById('statusPill');
const authPanel = document.getElementById('authPanel');
const authState = document.getElementById('authState');
const authHelp = document.getElementById('authHelp');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const signInBtn = document.getElementById('signInBtn');
const signUpBtn = document.getElementById('signUpBtn');
const signOutBtn = document.getElementById('signOutBtn');

const hasSupabaseConfig = Boolean(SUPABASE_URL.trim() && SUPABASE_ANON_KEY.trim());
const supabase = hasSupabaseConfig ? createClient(SUPABASE_URL.trim(), SUPABASE_ANON_KEY.trim()) : null;

let mode = loadMode();
let items = [];
let session = null;
let loading = false;

bootstrap();

function toDbId(raw) {
  constvalue = Number(raw);
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid pantry item ID: ${raw}`);
  }
  return value;
}

async function bootstrap() {
  modeSelect.value = mode;
  modeSelect.addEventListener('change', handleModeChange);
  form.addEventListener('submit', handleAddItem);
  clearAllBtn.addEventListener('click', handleClearAll);
  itemRows.addEventListener('click', handleRowClick);
  signInBtn.addEventListener('click', handleSignIn);
  signUpBtn.addEventListener('click', handleSignUp);
  signOutBtn.addEventListener('click', handleSignOut);

  if (supabase) {
    const result = await supabase.auth.getSession();
    session = result.data.session ?? null;

    supabase.auth.onAuthStateChange((_event, nextSession) => {
      session = nextSession;
      if (mode === 'supabase') {
        refreshActiveBackend();
      } else {
        updateChrome();
      }
    });
  }

  await refreshActiveBackend();
}

async function handleModeChange() {
  mode = modeSelect.value;
  saveMode(mode);
  await refreshActiveBackend();
}

async function refreshActiveBackend() {
  updateChrome();

  if (mode === 'local') {
    items = loadLocalItems();
    render();
    return;
  }

  if (!supabase) {
    items = [];
    render();
    setAuthState('Supabase is not configured yet. Add your URL and anon key in script.js.');
    return;
  }

  if (!session) {
    items = [];
    render();
    setAuthState('Signed out. Enter your Supabase credentials to load shared pantry data.');
    return;
  }

  await loadSupabaseItems();
  render();
  setAuthState(`Signed in as ${session.user.email || 'a Supabase user'}.`);
}

function updateChrome() {
  modeSelect.value = mode;
  authPanel.hidden = mode !== 'supabase';

  if (mode === 'local') {
    statusPill.textContent = 'Local mode';
    setAuthState('Local mode stores data in this browser only.');
    setAuthControlsDisabled(true);
    clearAllBtn.disabled = false;
    return;
  }

  if (!supabase) {
    statusPill.textContent = 'Supabase mode unavailable';
    setAuthState('Add your Supabase URL and anon key in script.js.');
    setAuthControlsDisabled(true);
    clearAllBtn.disabled = true;
    return;
  }

  statusPill.textContent = session ? 'Supabase mode · signed in' : 'Supabase mode · signed out';
  setAuthControlsDisabled(false);
  clearAllBtn.disabled = false;
}

function setAuthState(message) {
  authState.textContent = message;
  authHelp.textContent = hasSupabaseConfig
    ? 'Use the sign in or sign up controls for your Supabase project. Local mode remains available at any time.'
    : 'Add your Supabase project URL and anon key in script.js before using Supabase mode.';
}

function setAuthControlsDisabled(disabled) {
  authEmail.disabled = disabled;
  authPassword.disabled = disabled;
  signInBtn.disabled = disabled;
  signUpBtn.disabled = disabled;
  signOutBtn.disabled = disabled;
}

async function handleAddItem(event) {
  event.preventDefault();

  const name = itemName.value.trim();
  const category = itemCategory.value;
  const note = itemNote.value.trim();

  if (!name) return;

  const newItem = {
    id: crypto.randomUUID(),
    name,
    category,
    note,
    low: false,
    createdAt: new Date().toISOString()
  };

  if (mode === 'local') {
    items.unshift(newItem);
    saveLocalItems(items);
    form.reset();
    itemName.focus();
    render();
    return;
  }

  if (!supabase) {
    setAuthState('Supabase is not configured yet. Saving locally is still available.');
    return;
  }

  if (!session) {
    setAuthState('Sign in before adding items to Supabase mode.');
    return;
  }

  const { error } = await supabase.from('pantry_items').insert([
    {
      name: newItem.name,
      category: newItem.category,
      note: newItem.note,
      low: newItem.low,
      created_at: newItem.createdAt
    }
  ]);

  if (error) {
    setAuthState(`Could not save item: ${error.message}`);
    return;
  }

  form.reset();
  itemName.focus();
  await loadSupabaseItems();
  render();
}

async function handleRowClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const row = button.closest('tr[data-id]');
  if (!row) return;

  const id = row.dataset.id;
  const action = button.dataset.action;
  const item = items.find((entry) => entry.id === id);
  if (!item) return;

  if (action === 'toggle-low') {
    if (mode === 'local') {
      item.low = !item.low;
      saveLocalItems(items);
      render();
      return;
    }

    if (!supabase) {
      return;
    }

    const dbId = toDbId(id);

    const { data, error } = await supabase
      .from('pantry_items')
      .update({ low: !item.low })
      .eq('id', dbId)
      .select();

    if (error) {
      setAuthState(`Could not update item: ${error.message}`);
      return;
    }

    await loadSupabaseItems();
    render();
    return;
  }

  if (action === 'remove') {
    if (mode === 'local') {
      items = items.filter((entry) => entry.id !== id);
      saveLocalItems(items);
      render();
      return;
    }

    if (!supabase) {
      return;
    }

    const dbId = toDbId(id);

    const { error } = await supabase.from('pantry_items').delete().eq('id', dbId);
    if (error) {
      setAuthState(`Could not delete item: ${error.message}`);
      return;
    }

    await loadSupabaseItems();
    render();
  }
}

async function handleClearAll() {
  if (!items.length) return;

  const label = mode === 'local'
    ? 'Clear every pantry item from this browser?'
    : 'Clear every visible pantry item from Supabase?';

  if (!confirm(label)) return;

  if (mode === 'local') {
    items = [];
    saveLocalItems(items);
    render();
    return;
  }

  if (!supabase) {
    return;
  }

  const ids = items.map((entry) => toDbId(entry.id));
  const { error } = await supabase.from('pantry_items').delete().in('id', ids);

  if (error) {
    setAuthState(`Could not clear items: ${error.message}`);
    return;
  }

  items = [];
  render();
}

async function handleSignIn() {
  if (!supabase) {
    setAuthState('Supabase is not configured yet.');
    return;
  }

  const email = authEmail.value.trim();
  const password = authPassword.value;

  if (!email || !password) {
    setAuthState('Enter an email and password first.');
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    setAuthState(`Sign in failed: ${error.message}`);
    return;
  }

  authPassword.value = '';
  await refreshActiveBackend();
}

async function handleSignUp() {
  if (!supabase) {
    setAuthState('Supabase is not configured yet.');
    return;
  }

  const email = authEmail.value.trim();
  const password = authPassword.value;

  if (!email || !password) {
    setAuthState('Enter an email and password first.');
    return;
  }

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    setAuthState(`Sign up failed: ${error.message}`);
    return;
  }

  authPassword.value = '';
  setAuthState('Account created. If email confirmation is enabled, check your inbox.');
  await refreshActiveBackend();
}

async function handleSignOut() {
  if (!supabase) {
    setAuthState('Supabase is not configured yet.');
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    setAuthState(`Sign out failed: ${error.message}`);
    return;
  }

  session = null;
  await refreshActiveBackend();
}

async function loadSupabaseItems() {
  const { data, error } = await supabase
    .from('pantry_items')
    .select('id, name, category, note, low, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    items = [];
    setAuthState(`Could not load items: ${error.message}`);
    return;
  }

  items = (data ?? []).map((entry) => ({
    id: String(entry.id),
    name: entry.name,
    category: entry.category,
    note: entry.note ?? '',
    low: Boolean(entry.low),
    createdAt: entry.created_at ?? new Date().toISOString()
  }));
}

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

function loadLocalItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalItems(nextItems) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
}

function loadMode() {
  const saved = localStorage.getItem(MODE_KEY);
  return saved === 'supabase' ? 'supabase' : 'local';
}

function saveMode(nextMode) {
  localStorage.setItem(MODE_KEY, nextMode);
}
