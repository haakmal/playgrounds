(function () {
  function card(type, text) {
    return { id: crypto.randomUUID(), type, text: text || '', order: Date.now() + Math.random() };
  }

  function sortCards(cards) { return cards.slice().sort((a, b) => (a.order || 0) - (b.order || 0)); }

  function addCard(collection, type, text) {
    const c = card(type, text);
    collection.push(c);
    return c;
  }

  function removeCard(collection, id) {
    const index = collection.findIndex(c => c.id === id);
    if (index >= 0) collection.splice(index, 1);
  }

  function findCard(map, id) {
    for (const key of Object.keys(map)) {
      if (!Array.isArray(map[key])) continue;
      const hit = map[key].find(c => c.id === id);
      if (hit) return hit;
    }
    return null;
  }

  function removeConnectionsFor(map, id) {
    map.connections = map.connections.filter(c => c.from !== id && c.to !== id);
  }

  window.ICMMaps = { card, sortCards, addCard, removeCard, findCard, removeConnectionsFor };
})();
