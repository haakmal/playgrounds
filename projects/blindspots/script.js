const decks = {
  Biases: [
    { title: "Break the Goal", prompt: "What if the stated goal is the wrong problem to solve?", symbol: "◐" },
    { title: "Over-constraint It", prompt: "What disappears when every variable is controlled?", symbol: "◐" },
    { title: "Amplify the Problem", prompt: "What happens if the issue becomes unavoidable?", symbol: "◐" },
    { title: "Make it Unfair", prompt: "Who gains power and who loses it?", symbol: "◐" },
    { title: "Contradict the Stakeholders", prompt: "What if every stakeholder expectation conflicts?", symbol: "◐" },
    { title: "Speak as the System", prompt: "What system limitations shape this design?", symbol: "●" },
    { title: "Speak as the Enemy", prompt: "Who would resist this interaction, and why?", symbol: "●" },
    { title: "Speak as the User", prompt: "What is the user unable to say directly?", symbol: "●" },
    { title: "Confront Assumptions", prompt: "Which assumptions feel invisible because they are familiar?", symbol: "●" },
    { title: "Contradict Ego", prompt: "Defy yourself, what if your preferred solution is the weakest one?", symbol: "◐" },
    { title: "Explain to a Child", prompt: "What becomes confusing, unnecessary, or impossible to explain?", symbol: "●" },
    { title: "Tradition as Bias", prompt: "Which traditions are shaping this design, and whose values do they carry?", symbol: "◐" },
    { title: "Design the Taboo", prompt: "What part of this interaction might future societies reject entirely?", symbol: "✳" }
  ],
  Glitches: [
    { title: "Remove a Constraint", prompt: "What becomes possible when a rule disappears?", symbol: "◐" },
    { title: "Make it Fail", prompt: "What does failure expose about the system?", symbol: "●" },
    { title: "Introduce Noise", prompt: "What changes when the signal becomes unclear?", symbol: "◐" },
    { title: "Shift the User", prompt: "Who else could this interaction belong to?", symbol: "◐" },
    { title: "Shift the Context", prompt: "What breaks when the environment changes?", symbol: "◐" },
    { title: "Shift the Scale", prompt: "What changes when this becomes massive or tiny?", symbol: "●" },
    { title: "Timetravel", prompt: "What assumptions tie this design to the present?", symbol: "◐" },
    { title: "When the System Learns", prompt: "What happens when the interaction changes itself over time?", symbol: "✳" }
  ],
  Pressures: [
    { title: "Add Friction", prompt: "What resisitance has been ignored? What disrupts the intended flow? What interferes with this interaction?", symbol: "●" },
    { title: "Contradict Authority", prompt: "What rules sare shaping this decision? What authority is influencing this design?", symbol: "◐" },
    { title: "Map the Trade-offs", prompt: "What improves at the expense of something else?", symbol: "●" },
    { title: "Design for Conflict", prompt: "What happens when users fundamentally disagree?", symbol: "●" },
    { title: "Compare Alternatives", prompt: "What existing designs challenge your approach?", symbol: "●" },
    { title: "Pause & Reframe", prompt: "What problem are you actually designing for?", symbol: "◐" },
    { title: "Last minute...", prompt: "What collapses under pressure? What changes when time disappears?", symbol: "●" },
    { title: "Hear the Room", prompt: "Who has spoken the least during this process?", symbol: "◐" },
    { title: "Argue Against", prompt: "Which part of this interaction is hardest to defend?", symbol: "◐" },
    { title: "Who Controls the Future?", prompt: "What systems or institutions could eventually control this interaction?", symbol: "✳" }
  ],
  Making: [
    { title: "Make it Absurd", prompt: "What becomes visible when the idea is exaggerated?", symbol: "◐" },
    { title: "Design for the Edge Cases", prompt: "Who is excluded by the \"average\" user?", symbol: "◐" },
    { title: "Map the Interaction", prompt: "What happens between the obvious moments?", symbol: "●" },
    { title: "Isolate, Combine, or Remove", prompt: "What changes when one element disappears?", symbol: "◐" },
    { title: "Simulate the Experience", prompt: "What can only be understood by acting it out?", symbol: "●" },
    { title: "Learn from Traditional Making", prompt: "What could traditional, local, or indigenous ways of making teach this design process?", symbol: "●" },
    { title: "Evidence & Experiments", prompt: "<strong><em>Wildcard</em></strong> What needs to be tested rather than assumed? What claims still rely on intuition? What proof is missing from this design?", symbol: "●" },
    { title: "Have you tried...", prompt: "<strong><em>Wildcard</em></strong> ...sketching it, performing it, prototyping it physically, or mapping it?", symbol: "✳" }
  ]
};

const state = Object.fromEntries(
  Object.entries(decks).map(([name, cards]) => [
    name,
    {
      remaining: cards.map((card, index) => ({ ...card, id: `${name}-${index}` })),
      drawn: []
    }
  ])
);

const deckGrid = document.getElementById("deckGrid");
const randomDrawAllBtn = document.getElementById("randomDrawAll");
const clearDrawnBtn = document.getElementById("clearDrawn");

function shuffleIndex(length) {
  return Math.floor(Math.random() * length);
}

function drawFromDeck(deckName) {
  const deck = state[deckName];
  if (!deck.remaining.length) return;

  const index = shuffleIndex(deck.remaining.length);
  const [card] = deck.remaining.splice(index, 1);
  deck.drawn.push(card);
  render();
}

function returnCard(deckName, cardId) {
  const deck = state[deckName];
  const index = deck.drawn.findIndex(card => card.id === cardId);
  if (index === -1) return;

  const [card] = deck.drawn.splice(index, 1);
  deck.remaining.push(card);
  render();
}

function clearAllDrawn() {
  for (const deckName of Object.keys(state)) {
    const deck = state[deckName];
    deck.remaining.push(...deck.drawn);
    deck.drawn = [];
  }
  render();
}

function drawRandomFromEachDeck() {
  for (const deckName of Object.keys(state)) {
    drawFromDeck(deckName);
  }
  render();
}

function deckCardHTML(deckName, card) {
  let stageClass = "wildcard";

  if (card.symbol === "◐") {
    stageClass = "exploratory";
  } else if (card.symbol === "●") {
    stageClass = "reflective";
  } else if (card.symbol === "✳") {
    stageClass = "wildcard";
  }

  return `
    <article class="card" data-deck="${deckName}" data-card-id="${card.id}">
      <button class="remove" aria-label="Return card to deck" title="Return card to deck">×</button>

      <div class="card-top">
        <div>
          <h3 class="card-title">${card.title}</h3>
        </div>
      </div>

      <p class="prompt">${card.prompt}</p>

      <div class="meta">
        <span>${deckName}</span>
        <span class="stage-mark ${stageClass}" aria-hidden="true"></span>
      </div>
    </article>
  `;
}

function deckSectionHTML(deckName) {
  const deck = state[deckName];
  const remainingCount = deck.remaining.length;
  const drawnCards = deck.drawn;

  return `
    <section class="deck" data-deck-name="${deckName}">
      <div class="deck-header">
        <div class="deck-title">
          <h2>${deckName}</h2>
          <span class="count">${remainingCount} remaining</span>
        </div>
        <button class="draw-btn" data-action="draw" data-deck="${deckName}">Draw card</button>
      </div>

      <div class="cards">
        ${
          drawnCards.length
            ? drawnCards.map(card => deckCardHTML(deckName, card)).join("")
            : '<div class="empty">No cards drawn yet.</div>'
        }
      </div>
    </section>
  `;
}

function render() {
  deckGrid.innerHTML = Object.keys(state).map(deckSectionHTML).join("");

  deckGrid.querySelectorAll('[data-action="draw"]').forEach(button => {
    button.addEventListener("click", () => drawFromDeck(button.dataset.deck));
  });

  deckGrid.querySelectorAll(".card").forEach(cardEl => {
    const deckName = cardEl.dataset.deck;
    const cardId = cardEl.dataset.cardId;
    const removeBtn = cardEl.querySelector(".remove");

    removeBtn.addEventListener("click", e => {
      e.stopPropagation();
      returnCard(deckName, cardId);
    });
  });

  randomDrawAllBtn.disabled = Object.values(state).every(deck => deck.remaining.length === 0);
  clearDrawnBtn.disabled = Object.values(state).every(deck => deck.drawn.length === 0);
}

randomDrawAllBtn.addEventListener("click", drawRandomFromEachDeck);
clearDrawnBtn.addEventListener("click", clearAllDrawn);

render();