/*
  ENCHANTMENT — CONTENT ONLY
  Edit the arrays below to expand or tune the Seer's repertoire.
  Do not edit app.js just to add cards, ingredients or Ether prompts.
*/
window.ENCHANTMENT_CONTENT = {
  settings: {
    minInteractionLength: 12,
    minIngredients: 2,
    minIdeaLength: 20,
    minReflectionLength: 12,
    maxIngredientSelections: 5,
    etherOptionsShown: 8,
    animationSpeed: 'normal'
  },

  desires: [
    { name: 'Omniscience', description: 'The desire to know all.' },
    { name: 'Telepathy', description: 'The desire for human connection.' },
    { name: 'Safekeeping', description: 'The desire to protect and be protected.' },
    { name: 'Immortality', description: 'The desire to be healthy and vital.' },
    { name: 'Teleportation', description: 'The desire to move effortlessly.' },
    { name: 'Expression', description: 'The desire to create, make, and play.' }
  ],

  powers: [
    { name: 'Anticipate', nudge: 'Act before the person needs to ask.' },
    { name: 'Reveal', nudge: 'Make something known that was previously hidden.' },
    { name: 'Remember', nudge: 'Hold onto something from an earlier encounter.' },
    { name: 'Connect', nudge: 'Create a relationship without the usual exchange.' },
    { name: 'Protect', nudge: 'Intervene before something is lost, damaged, or forgotten.' },
    { name: 'Transform', nudge: 'Change the state of the interaction as it unfolds.' },
    { name: 'Sense', nudge: 'Notice something the person cannot easily notice themselves.' },
    { name: 'Refuse', nudge: 'Choose not to comply when the conditions are wrong.' },
    { name: 'Create', nudge: 'Turn an action into something expressive or playful.' },
    { name: 'Move', nudge: 'Remove effort or change how movement happens.' }
  ],

  ingredients: [
    { id: 'people', label: 'People', question: 'Who matters here?', guidance: 'Think about the person acting, other people nearby, anyone affected, or anyone missing.' },
    { id: 'time', label: 'Time', question: 'When does this change?', guidance: 'Think about routines, waiting, deadlines, urgency, frequency, or duration.' },
    { id: 'place', label: 'Place', question: 'Where does this happen?', guidance: 'Think about the physical or social setting and how it changes the experience.' },
    { id: 'information', label: 'Information', question: 'What needs to be known?', guidance: 'Consider what people know, lack, trust, remember, search for, or misunderstand.' },
    { id: 'habits', label: 'Habits', question: 'What keeps happening?', guidance: 'Look for routines, repeated behaviours, workarounds, or expectations.' },
    { id: 'objects', label: 'Objects', question: 'What things are involved?', guidance: 'Consider tools, belongings, furniture, infrastructure, or things being handled.' },
    { id: 'constraints', label: 'Constraints', question: 'What makes this harder?', guidance: 'Think about access, rules, capacity, distance, resources, or limits.' },
    { id: 'relationships', label: 'Relationships', question: 'Who depends on whom?', guidance: 'Consider trust, responsibility, cooperation, conflict, authority, or dependence.' }
  ],

  ether: [
    { text: 'It has no screen', nudge: 'Change the interaction, not just its interface.' },
    { text: 'It can remember', nudge: 'How does the next encounter become different?' },
    { text: 'It can refuse', nudge: 'What would make the system say no?' },
    { text: 'It only works between two people', nudge: 'What changes when another person becomes part of the interaction?' },
    { text: 'It communicates without words', nudge: 'How would the person know that something happened?' },
    { text: 'It changes over time', nudge: 'What does the interaction become after repeated use?' },
    { text: 'It sometimes gets it wrong', nudge: 'What happens when the enchantment misreads the situation?' },
    { text: 'It acts before the user', nudge: 'What happens when the system gets there first?' },
    { text: 'It needs another person to work', nudge: 'What does the interaction ask from someone else?' },
    { text: 'It learns from every encounter', nudge: 'What changes after the interaction has been used many times?' },
    { text: 'It disappears when ignored', nudge: 'What happens when the person chooses not to engage?' },
    { text: 'It works only at night', nudge: 'What changes when the time of day becomes part of the interaction?' }
  ],

  ballReadings: [
    'Look at your spell through this detail from the world you brought with you.',
    'Keep this part of the situation in the room while you imagine.',
    'What changes when this becomes important?',
    'Let this detail colour the spell.',
    'See what this reveals about the interaction.'
  ],

  openingLines: [
    'You have brought an interaction that needs another possibility.',
    'The Seer cannot give you an answer. But there are ways of seeing what is not there yet.',
    'Bring the quandary. Leave the solution at the door.'
  ]
};
