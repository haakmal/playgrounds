'use strict';

const $ = (id) => document.getElementById(id);

const DiceUtils = {
  clampSides(value) {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? Math.max(2, Math.min(100, n)) : 6;
  },
  parseValues(text) {
    return text.split(/\n+/).map(s => s.trim()).filter(Boolean);
  },
  defaultValues(count) {
    return Array.from({ length: count }, (_, i) => String(i + 1));
  },
  randomIndex(length) {
    return Math.floor(Math.random() * length);
  },
  timeStamp() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  },
  uid() {
    return (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random());
  }
};

class DiceModel {
  constructor(values) {
    this.setValues(values);
  }
  setValues(values) {
    this.values = Array.isArray(values) ? values.slice() : [];
  }
  roll() {
    if (this.values.length < 2) throw new Error('Add at least two side values.');
    return this.values[DiceUtils.randomIndex(this.values.length)];
  }
}

class DiceSession {
  constructor() {
    this.items = [];
    this.activeId = null;
  }
  init() {
    const first = this.create('Die 1', DiceUtils.defaultValues(6));
    this.activeId = first.id;
  }
  create(name, values) {
    const item = {
      id: DiceUtils.uid(),
      name: name || `Die ${this.items.length + 1}`,
      values: values.length >= 2 ? values.slice() : DiceUtils.defaultValues(6)
    };
    this.items.push(item);
    return item;
  }
  remove(id) {
    const index = this.items.findIndex(d => d.id === id);
    if (index < 0) return;
    this.items.splice(index, 1);
    if (this.activeId === id) this.activeId = this.items[0]?.id || null;
  }
  active() {
    return this.items.find(d => d.id === this.activeId) || null;
  }
  setActive(id) {
    if (this.items.some(d => d.id === id)) this.activeId = id;
  }
}

class History {
  constructor() {
    this.entries = [];
  }
  add(entry) {
    this.entries.unshift({ id: DiceUtils.uid(), ...entry });
  }
}

class Animator {
  constructor(faceEl) {
    this.el = faceEl;
  }
  rollTo(value) {
    const tokens = ['•', '◦', '□', '◇'];
    const duration = 700;
    const step = 70;
    const steps = Math.max(4, Math.floor(duration / step));
    let count = 0;
    
    this.el.classList.add('rolling');
    this.el.style.opacity = '0.85';
    
    return new Promise(resolve => {
      const timer = setInterval(() => {
        this.el.textContent = tokens[count % tokens.length];
        count += 1;
        if (count >= steps) {
          clearInterval(timer);
          this.el.classList.remove('rolling');
          this.el.style.opacity = '1';
          this.el.textContent = value;
          resolve();
        }
      }, step);
    });
  }
}

const view = {
  diceSelect: $('diceSelect'),
  diceName: $('diceName'),
  sideCount: $('sideCount'),
  sideValues: $('sideValues'),
  rollBtn: $('rollBtn'),
  newDiceBtn: $('newDiceBtn'),
  deleteDiceBtn: $('deleteDiceBtn'),
  diceFace: $('diceFace'),
  historyList: $('historyList'),
  drawer: $('drawer'),
  backdrop: $('backdrop'),
  openDrawerBtn: $('openDrawerBtn'),
  closeDrawerBtn: $('closeDrawerBtn'),
  
  fitDiceFace() {
    const el = this.diceFace;
    let size = 172;
    const minSize = 70;
    el.style.fontSize = `${size}px`;
    while ((el.scrollWidth > el.clientWidth - 20 || el.scrollHeight > el.clientHeight - 20) && size > minSize) {
      size -= 2;
      el.style.fontSize = `${size}px`;
    }
  },
  
  renderDiceList(items, activeId) {
    this.diceSelect.innerHTML = '';
    items.forEach(dice => {
      const option = document.createElement('option');
      option.value = dice.id;
      option.textContent = dice.name || 'Untitled die';
      if (dice.id === activeId) option.selected = true;
      this.diceSelect.appendChild(option);
    });
  },
  
  renderHistory(entries) {
    this.historyList.innerHTML = '';
    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'history-empty';
      empty.textContent = 'No rolls yet.';
      this.historyList.appendChild(empty);
      return;
    }
    
    entries.forEach(entry => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
            <div class="history-main">
              <div class="history-value">${escapeHtml(entry.value)}</div>
              <div class="history-meta">${escapeHtml(entry.time)}</div>
            </div>
            <div class="history-meta">${escapeHtml(entry.diceName)} · ${entry.sides} sides</div>
          `;
      this.historyList.appendChild(item);
    });
  },
  
  setDiceFace(value) {
    this.diceFace.textContent = value;
    requestAnimationFrame(() => this.fitDiceFace());
  },
  
  openDrawer() {
    this.drawer.classList.add('open');
    this.drawer.setAttribute('aria-hidden', 'false');
    this.backdrop.classList.add('show');
    this.openDrawerBtn.setAttribute('aria-expanded', 'true');
  },
  
  closeDrawer() {
    this.drawer.classList.remove('open');
    this.drawer.setAttribute('aria-hidden', 'true');
    this.backdrop.classList.remove('show');
    this.openDrawerBtn.setAttribute('aria-expanded', 'false');
  }
};

const session = new DiceSession();
const history = new History();
const animator = new Animator(view.diceFace);

function syncActiveDiceToView() {
  const dice = session.active();
  if (!dice) return;
  view.renderDiceList(session.items, dice.id);
  view.diceName.value = dice.name;
  view.sideCount.value = String(dice.values.length);
  view.sideValues.value = dice.values.join('\n');
}

function updateActiveDice() {
  const dice = session.active();
  if (!dice) return;
  dice.name = view.diceName.value.trim() || 'Untitled die';
  dice.values = DiceUtils.parseValues(view.sideValues.value);
  if (dice.values.length < 2) dice.values = DiceUtils.defaultValues(DiceUtils.clampSides(view.sideCount.value));
  view.renderDiceList(session.items, dice.id);
}

function renderHistory() {
  view.renderHistory(history.entries);
}

async function roll() {
  const dice = session.active();
  if (!dice) return;
  
  dice.values = DiceUtils.parseValues(view.sideValues.value);
  if (dice.values.length < 2) {
    view.setDiceFace('—');
    return;
  }
  
  const model = new DiceModel(dice.values);
  const result = model.roll();
  await animator.rollTo(result);
  view.fitDiceFace();
  history.add({
    value: result,
    time: DiceUtils.timeStamp(),
    diceName: dice.name,
    sides: dice.values.length
  });
  renderHistory();
}

function createDice() {
  const count = DiceUtils.clampSides(view.sideCount.value);
  const dice = session.create(`Die ${session.items.length + 1}`, DiceUtils.defaultValues(count));
  session.setActive(dice.id);
  syncActiveDiceToView();
}

function deleteDice() {
  if (session.items.length <= 1) return;
  const active = session.active();
  if (!active) return;
  session.remove(active.id);
  syncActiveDiceToView();
}

function openDrawer() {
  view.openDrawer();
}

function closeDrawer() {
  view.closeDrawer();
}

function escapeHtml(value) {
  return String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');
}

session.init();
syncActiveDiceToView();
view.setDiceFace('—');

view.diceSelect.addEventListener('change', () => {
  session.setActive(view.diceSelect.value);
  syncActiveDiceToView();
});
view.diceName.addEventListener('input', () => {
  updateActiveDice();
  syncActiveDiceToView();
});
view.sideCount.addEventListener('change', () => {
  const dice = session.active();
  if (!dice) return;
  const count = DiceUtils.clampSides(view.sideCount.value);
  dice.values = DiceUtils.defaultValues(count);
  view.sideCount.value = String(count);
  view.sideValues.value = dice.values.join('\n');
  view.fitDiceFace();
});
view.sideValues.addEventListener('input', () => {
  const dice = session.active();
  if (!dice) return;
  const values = DiceUtils.parseValues(view.sideValues.value);
  if (values.length >= 2) {
    dice.values = values;
    view.sideCount.value = String(values.length);
  }
  view.fitDiceFace();
});
view.rollBtn.addEventListener('click', roll);
view.newDiceBtn.addEventListener('click', createDice);
view.deleteDiceBtn.addEventListener('click', deleteDice);
view.openDrawerBtn.addEventListener('click', openDrawer);
view.closeDrawerBtn.addEventListener('click', closeDrawer);
view.backdrop.addEventListener('click', closeDrawer);
window.addEventListener('resize', () => view.fitDiceFace());

window.DiceAppTestHooks = { DiceUtils, DiceModel, DiceSession, History, escapeHtml };