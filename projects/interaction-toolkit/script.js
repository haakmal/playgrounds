// Replace these sample cards with your full deck content.
    const decks = {
  provocation: [
    {
      title: "Remove a Constraint",
      prompt: "Eliminate a key limitation shaping the design",
      framingCue: "Where should this be harder, slower, or less efficient?",
      action: "Expand scope, rethink assumptions, or explore new directions"
    },
    {
      title: "Overconstraint It",
      prompt: "Add strict limitations to the design",
      framingCue: "What if this could only exist under extreme conditions?",
      action: "Restrict materials, time, or interaction to force creative adaptation"
    },
    {
      title: "Delay the Outcome",
      prompt: "Postpone when results or feedback are revealed",
      framingCue: "What changes when outcomes are not immediate?",
      action: "Redesign timing, stretch processes, or introduce deferred responses"
    },
    {
      title: "Make It Fail",
      prompt: "Design for breakdown, error, or failure",
      framingCue: "Where does this system collapse or fall apart?",
      action: "Identify weak points, exaggerate failure, or simulate breakdown scenarios"
    },
    {
      title: "Reverse the Flow",
      prompt: "Invert the direction of interaction or process",
      framingCue: "What if this worked backwards?",
      action: "Reorder sequences, flip inputs/outputs, or invert user-system roles"
    },
    {
      title: "Amplify the Problem",
      prompt: "Exaggerate the core issue or tension",
      framingCue: "What happens when the problem becomes extreme?",
      action: "Scale up constraints, intensify conditions, or magnify user challenges"
    },
    {
      title: "Collapse the System",
      prompt: "Remove structure until the system breaks down",
      framingCue: "What remains when organisation disappears?",
      action: "Strip components, flatten hierarchy, or dissolve boundaries"
    },
    {
      title: "Introduce Noise",
      prompt: "Add randomness, ambiguity, or interference",
      framingCue: "What disrupts clarity or predictability here?",
      action: "Inject variation, distort signals, or complicate communication"
    },
    {
      title: "Make It Unfair",
      prompt: "Remove balance or equality from the system",
      framingCue: "Who benefits and who is disadvantaged?",
      action: "Bias outcomes, privilege certain users, or skew conditions"
    },
    {
      title: "Disrupt the Timing",
      prompt: "Alter when interactions occur",
      framingCue: "What if this happened too early, too late, or out of sync?",
      action: "Shift sequences, interrupt rhythms, or de-synchronise actions"
    },
    {
      title: "Contradict the Brief",
      prompt: "Go against the stated intentions of the design",
      framingCue: "What if the opposite were true?",
      action: "Challenge requirements, reinterpret goals, or subvert expectations"
    },
    {
      title: "Expose the Trade-off",
      prompt: "Reveal what is gained and lost in the design",
      framingCue: "What is hidden behind this decision?",
      action: "Map consequences, compare alternatives, or surface compromises"
    },
    {
      title: "Make It Absurd",
      prompt: "Push the idea into irrational or exaggerated territory",
      framingCue: "What happens when logic breaks down?",
      action: "Exaggerate features, distort purpose, or explore unlikely scenarios"
    }
  ],

  perspective: [
    {
      title: "Speak as the System",
      prompt: "Describe the design from the system’s point of view",
      framingCue: "What does the system do, want, or prioritise?",
      action: "Write, narrate, or model behaviour from the system’s perspective"
    },
    {
      title: "Speak as the User",
      prompt: "Describe the design from the user’s lived experience",
      framingCue: "What do they perceive, feel, or struggle with?",
      action: "Narrate interactions, map experience, or roleplay scenarios"
    },
    {
      title: "Speak as the Opponent",
      prompt: "Describe the design from a resisting or opposing force",
      framingCue: "What pushes back against this system?",
      action: "Identify tensions, simulate resistance, or challenge assumptions"
    },
    {
      title: "Shift the User",
      prompt: "Redefine who the user is",
      framingCue: "Who else could this be for, or excluded from?",
      action: "Recast audience, introduce new users, or explore edge cases"
    },
    {
      title: "Shift the Context",
      prompt: "Place the design in a different situation or environment",
      framingCue: "Where else could this exist?",
      action: "Relocate use, adapt conditions, or explore new settings"
    },
    {
      title: "Shift the Scale",
      prompt: "Change the size or scope of the design",
      framingCue: "What happens at a much smaller or larger scale?",
      action: "Zoom in or out, redesign interactions, or rethink impact"
    },
    {
      title: "Shift the Timeframe",
      prompt: "Reposition the design in time",
      framingCue: "What changes across past, present, or future users?",
      action: "Project possible scenarios, extend duration, or compress timelines"
    },
    {
      title: "Shift the Stakeholder",
      prompt: "Consider a different stakeholder’s perspective",
      framingCue: "Who is affected but not centred?",
      action: "Map relationships, surface conflicts, or redistribute priorities"
    },
    {
      title: "Shift the Environment",
      prompt: "Change the surrounding conditions of use",
      framingCue: "How does environment shape interaction?",
      action: "Introduce constraints, simulate conditions, or alter surroundings"
    },
    {
      title: "Design for the Edge Case",
      prompt: "Focus on extreme or atypical scenarios",
      framingCue: "What happens at the limits of use?",
      action: "Explore failure points, expand inclusivity, or stress-test assumptions"
    },
    {
      title: "Design for the Invisible",
      prompt: "Focus on what is unseen or overlooked",
      framingCue: "What is hidden in this system?",
      action: "Surface processes, reveal data, or expose underlying structures"
    },
    {
      title: "Design for Conflict",
      prompt: "Introduce competing needs or perspectives",
      framingCue: "Where do interests clash?",
      action: "Map tensions, simulate disagreement, or negotiate outcomes"
    }
  ],

  actionMethod: [
    {
      title: "Map the Interaction",
      prompt: "Trace how interaction unfolds",
      framingCue: "What happens between each moment?",
      action: "Sketch flows, diagram relationships, or annotate transitions"
    },
    {
      title: "Trace the Journey",
      prompt: "Follow the experience over time",
      framingCue: "Where does it begin, shift, and end?",
      action: "Sequence moments, narrate progression, or map changes"
    },
    {
      title: "Isolate One Element",
      prompt: "Focus on a single part of the design",
      framingCue: "What happens when everything else is removed?",
      action: "Extract, examine, or test one component in detail"
    },
    {
      title: "Combine Two Elements",
      prompt: "Bring two parts of the design together",
      framingCue: "What emerges when they interact?",
      action: "Merge components, test relationships, or create hybrids"
    },
    {
      title: "Remove One Element",
      prompt: "Take something away from this design",
      framingCue: "What changes when it is missing?",
      action: "Strip back components, simplify, or test absence"
    },
    {
      title: "Repeat the Action",
      prompt: "Do the same thing again, differently",
      framingCue: "What differs between repetitions?",
      action: "Contrast versions, evaluate differences, or map trade-offs"
    },
    {
      title: "Compare Alternatives",
      prompt: "Place multiple approaches side by side",
      framingCue: "What differs between them?",
      action: "Contrast versions, evaluate differences, or map trade-offs"
    },
    {
      title: "Simulate the Experience",
      prompt: "Act out or model the interaction",
      framingCue: "How does it behave in use?",
      action: "Roleplay, prototype, or perform the interaction"
    },
    {
      title: "Translate Medium",
      prompt: "Express the idea in a different form",
      framingCue: "What changes across media?",
      action: "Shift from digital to physical, visual to verbal, or vice versa"
    },
    {
      title: "Abstract the Idea",
      prompt: "Reduce the design to its core concept",
      framingCue: "What remains when detail is removed?",
      action: "Simplify, generalise, or identify underlying structure"
    },
    {
      title: "Ground the Interaction",
      prompt: "Make the design specific and concrete",
      framingCue: "Where and how does this actually exist?",
      action: "Add detail, situate context, or define real conditions"
    },
    {
      title: "Test an Assumption",
      prompt: "Challenge something taken for granted",
      framingCue: "What if this is not true?",
      action: "Question premises, run small tests, or reframe decisions"
    }
  ],

  materialisation: [
    {
      title: "Make it Physical",
      prompt: "Translate the idea into a tangible form",
      framingCue: "What can be touched, moved, or held?",
      action: "Build, assemble, or represent using physical materials"
    },
    {
      title: "Make it Performative",
      prompt: "Express the idea through action or behaviour",
      framingCue: "How does this play out in real time?",
      action: "Act out interactions, roleplay scenarios, or stage use"
    },
    {
      title: "Make it Visual",
      prompt: "Represent the idea visually",
      framingCue: "What can be seen at a glance?",
      action: "Sketch, diagram, or map elements and relationships"
    },
    {
      title: "Make it Spatial",
      prompt: "Arrange the idea in space",
      framingCue: "How are elements positioned or navigated?",
      action: "Lay out components, organise environments, or map movement"
    },
    {
      title: "Make it Temporal",
      prompt: "Express the idea across time",
      framingCue: "What changes from moment to moment?",
      action: "Sequence actions, storyboard events, or map duration"
    },
    {
      title: "Make it Interactive",
      prompt: "Enable input, response, or feedback",
      framingCue: "What happens when someone engages with it?",
      action: "Define interactions, simulate responses, or prototype behaviour"
    },
    {
      title: "Prototype Roughly",
      prompt: "Create a quick and unfinished version",
      framingCue: "What is the simplest way to test this idea?",
      action: "Build fast, use placeholders, or prioritise speed over detail"
    },
    {
      title: "Act it Out",
      prompt: "Embody the interaction through movement",
      framingCue: "What does this feel like to perform?",
      action: "Use your body, simulate roles, or enact scenarios"
    },
    {
      title: "Build a Fragment",
      prompt: "Focus on making one part of the design",
      framingCue: "What can be explored in isolation?",
      action: "Construct a partial prototype, test a feature, or isolate behaviour"
    }
  ],

  reflection: [
    {
      title: "Pause and Reframe",
      prompt: "Stop and reinterpret what has been done so far",
      framingCue: "What does this look like from a different angle?",
      action: "Revisit earlier ideas, shift perspective, or redefine direction"
    },
    {
      title: "What Changed?",
      prompt: "Identify what has shifted through this process",
      framingCue: "How is this different from where it started?",
      action: "Compare states, trace development, or map transformation"
    },
    {
      title: "What is Missing?",
      prompt: "Consider what is absent or overlooked",
      framingCue: "What has not yet been addressed?",
      action: "Identify gaps, introduce new elements, or expand scope"
    },
    {
      title: "What is Working?",
      prompt: "Recognise what is effective or meaningful",
      framingCue: "What should be kept or developed further?",
      action: "Highlight strengths, reinforce decisions, or refine elements"
    },
    {
      title: "What is Assumed?",
      prompt: "Surface underlying assumptions in the design",
      framingCue: "What is being taken for granted?",
      action: "Question premises, expose biases, or challenge defaults"
    },
    {
      title: "What Should Be Removed?",
      prompt: "Consider what can be reduced or discarded",
      framingCue: "What no longer serves the design?",
      action: "Simplify, eliminate elements, or refocus the direction"
    }
  ],

  reconfiguration: [
    {
      title: "Combine Cards",
      prompt: "Merge two or more cards into a single direction",
      framingCue: "What emerges when these ideas intersect?",
      action: "Link prompts, overlay meanings, or create hybrid interpretations"
    },
    {
      title: "Replace Cards",
      prompt: "Swap a card for a new one",
      framingCue: "What changes when this is removed or substituted?",
      action: "Remove a prompt, introduce another, or redirect focus"
    },
    {
      title: "Reposition Everything",
      prompt: "Rearrange the board and its elements",
      framingCue: "How does structure influence meaning?",
      action: "Move clusters, shift relationships, or reorganise spatial layout"
    },
    {
      title: "Discard and Restart",
      prompt: "Remove current directions and begin again",
      framingCue: "What remains worth carrying forward?",
      action: "Clear part or all of the board, retain fragments or reset direction"
    },
    {
      title: "Return to an Earlier State",
      prompt: "Revisit a previous version of the work",
      framingCue: "What was lost or overlooked?",
      action: "Recover earlier ideas, restore configurations, or reinterpret past work"
    },
    {
      title: "Invert the Board",
      prompt: "Reverse the meaning or structure of the current state",
      framingCue: "What happens if everything is flipped?",
      action: "Oppose assumptions, invert relationships, or reinterpret all elements"
    }
  ]
};

    const diceSets = {
      constraint: { label: "Constraint", faces: ["Time Pressure", "Resource Scarcity", "Social Conflict", "Ethical Tension", "Scale Shift", "Unexpected User"] },
      interpretation: { label: "Interpretation", faces: ["Literal", "Metaphorical", "Extreme", "Minimal", "Opposite", "Combine"] },
      stage: { label: "Phase", faces: ["Discover", "Define", "Develop", "Delivery"] }
    };

    const drawState = {};
    Object.keys(decks).forEach(k => drawState[k] = []);

    function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

    function drawCard(deck){
      const c = {...rand(decks[deck]), modifiers: [], open:false, id:Date.now()+Math.random()};
      drawState[deck].push(c);
      render();
    }

    function toggle(deck,id){
      drawState[deck].forEach(c=>c.open=(c.id===id?!c.open:false));
      render();
    }

    function addMod(deck,id,type){
      const d = diceSets[type];
      drawState[deck]=drawState[deck].map(c=>{
        if(c.id!==id) return c;
        return {...c, open:false, modifiers:[...c.modifiers,{type,label:d.label,result:rand(d.faces),mid:Date.now()+Math.random()}]};
      });
      render();
    }

    function reroll(deck,id,mid){
      drawState[deck]=drawState[deck].map(c=>{
        if(c.id!==id) return c;
        return {...c, modifiers:c.modifiers.map(m=>m.mid===mid?{...m,result:rand(diceSets[m.type].faces)}:m)};
      });
      render();
    }

    function render(){
      const root=document.getElementById("deckGrid");
      root.innerHTML = Object.keys(decks).map(deck=>{
        return `
          <div class="deck-column">
            <div class="deck-header">
              <div class="deck-title">${deck}</div>
              <button class="draw-btn" onclick="drawCard('${deck}')">Draw Card</button>
            </div>
            <div class="cards-stack">
              ${drawState[deck].map((c,i)=>`
                <div class="card" onclick="if(event.target.closest('select, button')) return; toggle('${deck}',${c.id})">
                  <div class="card-title">${c.title}</div>
                  <div><div class="label">Prompt</div>${c.prompt}</div>
                  <div><div class="label">Framing Cue</div>${c.framingCue}</div>
                  <div><div class="label">Action</div>${c.action}</div>

                  <div class="modifier-block">
                    ${c.modifiers.map(m=>`
                      <div class="modifier-item">
                        ${m.label}: ${m.result}
                        <button onclick="event.stopPropagation();reroll('${deck}',${c.id},${m.mid})">reroll</button>
                      </div>
                    `).join("")}

                    ${c.open?`
                      <select onclick="event.stopPropagation()" onchange="if(this.value) addMod('${deck}',${c.id},this.value)">
  <option value="" selected disabled>Select a dice set</option>
  ${Object.keys(diceSets).map(k => `<option value="${k}">${diceSets[k].label}</option>`).join("")}
</select>
                    `:`<div class="hint">click to add modifier</div>`}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }).join("");
    }

    render();