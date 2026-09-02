const models = {
    flow: {
        name: "Flow Model",
        q: "Who depends on whom, and what moves between them?",
        why: "communication, coordination, responsibility and dependencies",
        steps: [
            [
                "Identify the roles",
                "Use roles rather than named individuals. Include only roles relevant to the activity.",
            ],
            [
                "Identify what moves",
                "Find information, questions, artefacts, requests, decisions or responsibilities exchanged between roles.",
            ],
            ["Draw the connections", "Connect roles according to evidence and label significant exchanges."],
            ["Identify dependencies", "Ask what each role is waiting for and who or what they depend upon."],
            [
                "Mark breakdowns",
                "Show missing information, delays, duplicated communication, bottlenecks and workarounds.",
            ],
            ["Check the evidence", "For each major connection ask: where did we observe or hear this?"],
        ],
    },
    sequence: {
        name: "Sequence Model",
        q: "How is this activity actually accomplished?",
        why: "actions, decisions, strategies and time",
        steps: [
            [
                "Choose one activity",
                "Select a specific activity revealed by the research rather than an entire service or day.",
            ],
            ["Identify the trigger", "What causes this activity to begin?"],
            ["Identify the intent", "What is the person trying to accomplish?"],
            ["Map the actual sequence", "Include actions, decisions, repetitions, interruptions and strategies."],
            ["Find workarounds", "Retain shortcuts and adaptations rather than simplifying them away."],
            ["Mark breakdowns", "Identify where activity becomes difficult, repeats or changes direction."],
            ["Check the evidence", "Separate what was observed or heard from what was inferred."],
        ],
    },
    cultural: {
        name: "Cultural Model",
        q: "What influences why people behave this way?",
        why: "rules, expectations, norms, authority and influence",
        steps: [
            ["Identify the focus", "Choose the role or activity whose behaviour you are trying to understand."],
            [
                "Identify influences",
                "Find rules, expectations, authority, priorities, norms and organisational pressures.",
            ],
            [
                "Separate formal and informal",
                "Distinguish policy/procedure from habits, expectations and social pressure.",
            ],
            ["Connect influence to behaviour", "Show how an influence appears to affect what happens."],
            ["Find competing influences", "Look for expectations pulling behaviour in different directions."],
            ["Identify power and control", "Ask who controls decisions, access, information or resources."],
            ["Check the evidence", "What behaviour or statement demonstrates that this influence matters?"],
        ],
    },
    physical: {
        name: "Physical Model",
        q: "How does the environment shape the activity?",
        why: "space, movement, access and environmental constraints",
        steps: [
            ["Select the environment", "Focus on the space in which the relevant activity occurs."],
            ["Draw the basic layout", "Represent only spatial elements important to the activity."],
            ["Add movement", "Map routes, stopping points, congestion and repeated movement."],
            ["Add environmental conditions", "Note visibility, noise, privacy, proximity and access where relevant."],
            ["Identify adaptations", "Show how people alter or work around the environment."],
            ["Mark spatial friction", "Identify delay, interruption, restricted access or unwanted exposure."],
            ["Check observed behaviour", "What did people actually do because of this spatial condition?"],
        ],
    },
    artefact: {
        name: "Artefact Model",
        q: "How does the artefact structure the activity?",
        why: "tools, documents, interfaces, objects and information structures",
        steps: [
            ["Select an artefact", "Choose one that appears repeatedly or is important in the evidence."],
            ["Represent its structure", "Draw or reproduce only the relevant parts."],
            ["Identify information", "What does it tell the person and how is information organised?"],
            ["Identify requirements", "What does it require the person to enter, remember, select or interpret?"],
            ["Identify constraints", "What does it make difficult, mandatory, easy or invisible?"],
            ["Find adaptations", "Look for annotation, rewriting, bypassing or use of another tool."],
            ["Identify assumptions", "What does it appear to assume about user, situation or task?"],
            ["Check actual use", "Model how it was actually used, not only its intended function."],
        ],
    },
};
const groups = [
    {
        id: "people",
        label: "People communicating, coordinating or depending on each other",
        model: "flow",
        detail: [
            "Information was exchanged between people",
            "Responsibility moved between roles",
            "Someone depended on someone else",
            "Information was lost or delayed",
            "Responsibilities were unclear",
        ],
    },
    {
        id: "actions",
        label: "Actions happening in a particular order",
        model: "sequence",
        detail: [
            "There was a recognisable trigger",
            "People followed repeated steps",
            "Decisions changed what happened next",
            "Actions were repeated or interrupted",
            "People developed shortcuts or workarounds",
        ],
    },
    {
        id: "rules",
        label: "Rules, expectations or authority affecting behaviour",
        model: "cultural",
        detail: [
            "Formal rules affected what happened",
            "Informal expectations affected behaviour",
            "Authority or hierarchy mattered",
            "Priorities conflicted",
            "Someone had limited control",
        ],
    },
    {
        id: "space",
        label: "People moving through or adapting to an environment",
        model: "physical",
        detail: [
            "Layout affected activity",
            "Visibility or proximity mattered",
            "Access was restricted",
            "Noise or privacy affected behaviour",
            "People adapted the environment",
        ],
    },
    {
        id: "tools",
        label: "Tools, documents, interfaces or objects affecting what happened",
        model: "artefact",
        detail: [
            "An artefact organised important information",
            "A tool required particular actions",
            "Information was difficult to find",
            "People modified or annotated an artefact",
            "People worked around a tool or interface",
        ],
    },
    { id: "breakdowns", label: "Breakdowns or workarounds were especially visible", model: null, detail: [] },
];
const scenarioEvidence = {
    flow: [
        ["E1", "A student cannot proceed when the printer balance is too low."],
        ["E2", "The student asks another student how to add credit."],
        ["E3", "The peer points them to instructions beside the printer."],
        ["E4", "The student eventually approaches library staff for help."],
        ["E5", "Staff explain a payment step the student had not understood."],
    ],
    sequence: [
        ["E1", "The student decides to print an assessment before class."],
        ["E2", "They locate the library printer and submit the document."],
        ["E3", "The printer reports insufficient balance."],
        ["E4", "The student tries to add credit, then repeats the print attempt."],
        ["E5", "After the second failed attempt, they ask a peer and then staff."],
    ],
    cultural: [
        ["E1", "The student is under pressure to print before class begins."],
        ["E2", "The university requires payment before printing can continue."],
        ["E3", "Students commonly ask peers for quick help before approaching staff."],
        ["E4", "Staff are responsible for resolving printing account issues."],
        ["E5", "The student prioritises speed over reading all available instructions."],
    ],
    physical: [
        ["E1", "The printer is located away from the main library help desk."],
        ["E2", "Payment instructions are posted beside the printer."],
        ["E3", "A queue forms behind the student while they troubleshoot."],
        ["E4", "The payment terminal is positioned beside, rather than directly facing, the printer screen."],
        ["E5", "The student walks between printer, payment point and help desk."],
    ],
    artefact: [
        ["E1", "The printer screen reports “insufficient balance”."],
        ["E2", "The payment interface uses a separate sequence to add credit."],
        ["E3", "A printed instruction sheet uses different terminology from the screen."],
        ["E4", "The student checks the instruction sheet, then asks a peer."],
        ["E5", "The student retries the print after adding credit."],
    ],
};
const scenarioModelNotes = {
    flow: "The example focuses on the movement of information and responsibility between the student, peer, printer/payment system and library staff.",
    sequence:
        "The example focuses on one specific activity—printing the assessment—rather than the student’s entire day.",
    cultural:
        "The example focuses on the pressures, rules and informal expectations that shape how the student responds to the printing problem.",
    physical:
        "The example focuses only on spatial features that affect movement, visibility, access or troubleshooting.",
    artefact:
        "The example focuses on the printer interface and instruction sheet as artefacts that structure what the student can do.",
};
let state = {
    screen: 0,
    selected: new Set(),
    details: {},
    scores: {},
    recommended: [],
    guide: "flow",
    exampleKey: null,
    exampleStage: "evidence",
};
const app = document.querySelector("#app"),
    next = document.querySelector("#nextBtn"),
    back = document.querySelector("#backBtn"),
    progress = document.querySelector("#progress"),
    mobileBack = document.querySelector("#mobileBackBtn"),
    mobileNext = document.querySelector("#mobileNextBtn");
function shell(kicker, title, body) {
    app.innerHTML = `<div class="eyebrow">${kicker}</div><h1>${title}</h1>${body}`;
}
function choice(id, label, on, cls = "") {
    return `<label class="choice ${cls}"><input type="checkbox" data-id="${id}" ${on ? "checked" : ""}><span>${label}</span></label>`;
}
function score() {
    let s = { flow: 0, sequence: 0, cultural: 0, physical: 0, artefact: 0 };
    groups.forEach((g) => {
        if (g.model && state.selected.has(g.id)) s[g.model] += 2;
        if (g.model && state.details[g.id]) s[g.model] += state.details[g.id].size;
    });
    if (state.selected.has("breakdowns")) {
        s.flow++;
        s.sequence++;
        s.artefact++;
    }
    state.scores = s;
    state.recommended = Object.keys(s).sort((a, b) => s[b] - s[a]);
}
function bindChoices() {
    document.querySelectorAll(".choice input").forEach(
        (i) =>
            (i.onchange = () => {
                i.checked ? state.selected.add(i.dataset.id) : state.selected.delete(i.dataset.id);
                render();
            })
    );
}
function bindDetails() {
    document.querySelectorAll(".choice input").forEach(
        (i) =>
            (i.onchange = () => {
                let [g, n] = i.dataset.id.split("_");
                state.details[g] ??= new Set();
                i.checked ? state.details[g].add(+n) : state.details[g].delete(+n);
                render();
            })
    );
}
function diagram(key, example = false) {
    if (!example) {
        if (key === "flow")
            return `<div class="diagram-card"><div class="diagram-title">Generic model structure</div><div class="flow-diagram"><div class="flow-node">ROLE / ACTOR</div><div class="flow-line"><span>information / responsibility</span></div><div class="flow-node">ROLE / ACTOR</div><div class="dependency">Dependencies, hand-offs and breakdowns can be annotated around the flow.</div></div><div class="diagram-caption">Model the movement between roles, rather than simply listing the people involved.</div></div>`;
        if (key === "sequence")
            return `<div class="diagram-card"><div class="diagram-title">Generic model structure</div><div class="sequence-diagram"><div class="seq-node">TRIGGER</div><div class="seq-arrow"></div><div class="seq-node">ACTION</div><div class="seq-arrow"></div><div class="seq-node">DECISION</div><div class="seq-arrow"></div><div class="seq-node">ACTION</div><div class="sequence-break"><span class="marker">BREAKDOWN</span><span class="marker">WORKAROUND</span></div></div><div class="diagram-caption">Reconstruct what actually happens over time, including decisions, interruptions and adaptations.</div></div>`;
        if (key === "cultural")
            return `<div class="diagram-card"><div class="diagram-title">Generic model structure</div><div class="culture-diagram"><div class="culture-node top">FORMAL RULES</div><div class="culture-node left">SOCIAL / INFORMAL</div><div class="culture-node center">ROLE / ACTIVITY</div><div class="culture-node right">ORGANISATIONAL PRIORITY</div><div class="influence">INFLUENCES • PRESSURES • CONFLICTS • POWER</div></div><div class="diagram-caption">Connect influences to the behaviour or activity they appear to shape.</div></div>`;
        if (key === "physical")
            return `<div class="diagram-card"><div class="diagram-title">Generic model structure</div><div class="physical-diagram"><div class="space-box">ENTRY / START</div><div class="space-box">RELEVANT FEATURE</div><div class="space-box">DESTINATION</div><div class="space-main"><div class="route"></div><div class="physical-label">MOVEMENT / VISIBILITY / ACCESS</div></div></div><div class="diagram-caption">Represent only spatial features that affect the activity. Movement, access and environmental friction can be annotated on the plan.</div></div>`;
        return `<div class="diagram-card"><div class="diagram-title">Generic model structure</div><div class="artefact-diagram"><div class="artefact-ui"><div class="ui-line long"></div><div class="ui-line"></div><div class="ui-field"></div><div class="ui-field marked"></div></div><div class="artefact-annotations"><div class="annotation">INFORMATION</div><div class="annotation">CONSTRAINT</div><div class="annotation">ASSUMPTION</div><div class="annotation">ADAPTATION / WORKAROUND</div></div></div><div class="diagram-caption">Examine how the artefact structures information and shapes what the person can do.</div></div>`;
    }
    if (key === "flow")
        return `<div class="diagram-card"><div class="diagram-title">Library printing / flow of help</div><div class="flow-example"><div class="flow-role">STUDENT</div><div class="flow-arrow"><span>print request</span></div><div class="flow-role">PRINTER / PAYMENT</div><div class="flow-arrow"><span>needs help</span></div><div class="flow-role">PEER</div><div class="flow-arrow"><span>instruction</span></div><div class="flow-role">LIBRARY STAFF</div></div><div class="diagram-caption">The example highlights movement of information and responsibility between roles.</div></div>`;
    if (key === "sequence")
        return `<div class="diagram-card"><div class="diagram-title">Library printing / observed sequence</div><div class="sequence-example"><div class="seq-step"><b>01</b><span>Need to print</span><small>intent</small></div><div class="seq-connector"></div><div class="seq-step"><b>02</b><span>Submit document</span><small>action</small></div><div class="seq-connector"></div><div class="seq-step warning"><b>03</b><span>Balance too low</span><small>breakdown</small></div><div class="seq-connector"></div><div class="seq-step"><b>04</b><span>Ask for help</span><small>workaround</small></div><div class="seq-connector"></div><div class="seq-step"><b>05</b><span>Retry print</span><small>action</small></div></div></div>`;
    if (key === "cultural")
        return `<div class="diagram-card"><div class="diagram-title">Library printing / influences</div><div class="culture-example"><div class="culture-box top">DEADLINE PRESSURE</div><div class="culture-box left">UNIVERSITY RULE</div><div class="culture-box centre">STUDENT<br><span>printing</span></div><div class="culture-box right">PEER EXPECTATION</div><div class="culture-box bottom">STAFF RESPONSIBILITY</div></div><div class="diagram-caption">The example focuses on the pressures, rules and informal expectations shaping behaviour.</div></div>`;
    if (key === "physical")
        return `<div class="diagram-card"><div class="diagram-title">Library printing / spatial conditions</div><div class="physical-example"><div class="place start">PRINTER</div><div class="place instructions">INSTRUCTIONS</div><div class="place payment">PAYMENT</div><div class="place desk">HELP DESK</div><div class="physical-path path-a"></div><div class="physical-path path-b"></div><div class="physical-friction">QUEUE / TROUBLESHOOTING</div></div><div class="diagram-caption">Only spatial features that affect the activity are included.</div></div>`;
    return `<div class="diagram-card"><div class="diagram-title">Library printing / artefact structure</div><div class="artefact-example"><div class="artefact-screen"><div class="screen-label">PRINT STATUS</div><div class="screen-message">Insufficient balance</div><div class="screen-action">ADD CREDIT</div><div class="screen-action muted-action">CANCEL</div></div><div class="artefact-callouts"><div><b>Constraint</b><span>Cannot continue until balance is increased.</span></div><div><b>Terminology</b><span>Screen wording differs from printed instructions.</span></div><div><b>Workaround</b><span>Student checks another source for help.</span></div></div></div></div>`;
}

function exampleModalHtml(key) {
    const e = scenarioEvidence[key];
    const stage = state.exampleStage;
    const model = models[key];
    let body = "";
    if (stage === "evidence") {
        body = `<div class="example-intro"><div class="example-kicker">Shared scenario</div><h2>University library printing</h2><p>A student needs to print an assessment before class. The printing process becomes difficult and they seek help.</p></div><div class="example-section"><div class="example-label">Evidence</div><div class="evidence-list">${e.map((x) => `<div class="evidence-item"><span>${x[0]}</span><p>${x[1]}</p></div>`).join("")}</div></div><div class="example-prompt"><strong>Before revealing the model</strong><p>What relationships, actions, influences, spatial conditions or artefact constraints do you notice in this evidence?</p></div>`;
    } else if (stage === "model") {
        body = `<div class="example-intro"><div class="example-kicker">Worked example</div><h2>${model.name}</h2><p>${scenarioModelNotes[key]}</p></div>${diagram(key, true)}<div class="example-section"><div class="example-label">What the model makes visible</div><p>${model.q}</p><p class="muted">This is one interpretation of the dummy evidence, not the only possible interpretation.</p></div>`;
    } else {
        body = `<div class="example-intro"><div class="example-kicker">Compare with your research</div><h2>Now look back at your evidence</h2></div><div class="compare-grid"><div class="compare-card"><span>01</span><h3>Do you have similar evidence?</h3><p>Which parts of this example resemble something you actually observed, heard or collected?</p></div><div class="compare-card"><span>02</span><h3>What would be different?</h3><p>What relationships in your context would change the model?</p></div><div class="compare-card"><span>03</span><h3>What are you assuming?</h3><p>Can every important element in your model be traced to evidence?</p></div></div><div class="example-prompt"><strong>Remember</strong><p>The example demonstrates a way to reason with evidence. It is not a template that your research needs to imitate.</p></div>`;
    }
    return `<div class="example-modal"><div class="example-progress"><span class="active">01 Evidence</span><span class="${stage === "model" || stage === "compare" ? "active" : ""}">02 Model</span><span class="${stage === "compare" ? "active" : ""}">03 Compare</span></div>${body}</div>`;
}
function openExample(key) {
    state.exampleKey = key;
    state.exampleStage = "evidence";
    document.body.classList.add("modal-open");
    document.querySelector("#modalTitle").textContent = "Worked example";
    document.querySelector("#modalBody").innerHTML = exampleModalHtml(key);
    document.querySelector("#modalFooter").innerHTML =
        `<button class="btn" data-example-back>Back</button><button class="btn primary" data-example-next>Reveal model →</button>`;
    document.querySelector("#modal").showModal();
    bindExampleModal();
}
function bindExampleModal() {
    document.querySelector("[data-example-back]").onclick = () => {
        if (state.exampleStage === "evidence") return closeExample();
        state.exampleStage = state.exampleStage === "model" ? "evidence" : "model";
        document.querySelector("#modalBody").innerHTML = exampleModalHtml(state.exampleKey);
        document.querySelector("#modalFooter").innerHTML =
            `<button class="btn" data-example-back>Back</button><button class="btn primary" data-example-next>${state.exampleStage === "evidence" ? "Reveal model →" : "Compare with your research →"}</button>`;
        bindExampleModal();
    };
    document.querySelector("[data-example-next]").onclick = () => {
        if (state.exampleStage === "evidence") state.exampleStage = "model";
        else if (state.exampleStage === "model") state.exampleStage = "compare";
        else return closeExample();
        document.querySelector("#modalBody").innerHTML = exampleModalHtml(state.exampleKey);
        document.querySelector("#modalFooter").innerHTML =
            `<button class="btn" data-example-back>Back</button><button class="btn primary" data-example-next>${state.exampleStage === "evidence" ? "Reveal model →" : state.exampleStage === "model" ? "Compare with your research →" : "Done"}</button>`;
        bindExampleModal();
    };
}
function closeExample() {
    document.querySelector("#modal").close();
    document.body.classList.remove("modal-open");
    state.exampleKey = null;
}
function render() {
    progress.textContent = String(state.screen + 1).padStart(2, "0") + " / 06";
    back.disabled = state.screen === 0;
    mobileBack.disabled = state.screen === 0;
    if (state.screen === 0) {
        shell(
            "Contextual Modelling Companion",
            "Make relationships in your research visible.",
            `<p class="lead">Use evidence from contextual research and affinity mapping to explore which Contextual Design models may help you understand how a situation works.</p><div class="note"><strong>This is a reference, not an answer generator.</strong><br>The suggestions are prompts for your own analysis. If you are unsure about your evidence, terminology or modelling choices, discuss them with your class tutor.</div>`
        );
        next.textContent = "Begin →";
        mobileNext.textContent = "Begin →";
    } else if (state.screen === 1) {
        const evidenceCount = [...state.selected].filter((id) => id !== "unsure").length;
        let rule = `<div class="evidence-rule"><strong>Selection rule</strong>Select at least <b>two evidence categories</b>. Breakdowns/workarounds are cross-cutting clues and do not identify a model by themselves; uncertainty also does not count toward the minimum.</div>`;
        if (state.selected.has("breakdowns") && evidenceCount < 2)
            rule += `<div class="note"><strong>Breakdowns need context.</strong><br>What are the breakdowns connected to: people, actions, rules, space, or artefacts? Select another evidence category to help locate them.</div>`;
        shell(
            "01 — Evidence",
            "What appears in your evidence?",
            `<p class="lead">Select all that apply. Think about what you actually observed, heard or collected—not simply what your project is about.</p><div class="choices">${groups.map((g) => choice(g.id, g.label, state.selected.has(g.id))).join("")}${choice("unsure", "I am unsure how to describe some of my evidence", state.selected.has("unsure"), "unsure")}</div>${rule}`
        );
        bindChoices();
        next.textContent = evidenceCount < 2 ? "Select at least 2 →" : "Look closer →";
        mobileNext.textContent = next.textContent;
        next.disabled = evidenceCount < 2;
        mobileNext.disabled = next.disabled;
    } else if (state.screen === 2) {
        let sel = groups.filter((g) => state.selected.has(g.id) && g.detail.length);
        let html = '<p class="lead">Select all statements that are supported by your collected evidence.</p>';
        if (state.selected.has("breakdowns") && !sel.length)
            html += `<div class="note"><strong>Breakdowns alone do not identify a model.</strong><br>Breakdowns can appear within several models. Select at least one additional evidence category so the tool can identify what the breakdown is connected to.</div>`;
        if (state.selected.has("unsure"))
            html += `<div class="note"><strong>You marked some evidence as unsure.</strong><br>Uncertainty is useful information, but it does not count toward the minimum two evidence categories. Keep uncertain material visible as a question or assumption and discuss it with your class tutor.</div>`;
        if (sel.length)
            html += sel
                .map(
                    (g) =>
                        `<section><h2>${g.label}</h2><div class="choices">${g.detail.map((d, i) => choice(g.id + "_" + i, d, (state.details[g.id] || new Set()).has(i))).join("")}</div></section>`
                )
                .join("");
        shell("02 — Look closer", "What did you actually notice?", html);
        bindDetails();
        next.textContent = "Reflect →";
        mobileNext.textContent = "Reflect →";
    } else if (state.screen === 3) {
        score();
        let prompts = state.recommended
            .slice(0, 3)
            .map(
                (k, i) =>
                    ({
                        flow: "Who appears to depend on whom? What moves between them?",
                        sequence: "Where does the activity change direction, repeat or break down?",
                        cultural: "What seems to influence behaviour beyond the immediate task?",
                        physical: "What did people do differently because of the environment?",
                        artefact: "What did the tool or artefact make easier, harder or necessary?",
                    })[k] || "What does this evidence make difficult to see?"
            );
        shell(
            "03 — Reflect",
            "Before seeing a recommendation…",
            `<p class="lead">Consider these questions against your affinity map and raw evidence. You do not need to answer them in this interface.</p><div class="reflection-grid">${prompts.map((p, i) => `<div class="panel"><div class="tag">Consider ${String(i + 1).padStart(2, "0")}</div><h3>${p}</h3></div>`).join("")}</div><div class="note">A model is useful when it makes a relationship easier to see. It does not become correct simply because this tool recommends it.</div>`
        );
        next.textContent = "See models →";
        mobileNext.textContent = "See models →";
    } else if (state.screen === 4) {
        score();
        const evidenceCount = [...state.selected].filter((id) => id !== "unsure").length;
        if (evidenceCount < 2) {
            shell(
                "04 — More evidence needed",
                "Your selections are not enough to suggest a model.",
                `<p class="lead">The tool needs at least two evidence categories to make a useful recommendation.</p><div class="note"><strong>Try again</strong><br>Breakdowns and uncertainty are useful observations, but on their own they do not tell us what kind of relationship the breakdown belongs to. Return to the evidence step and identify what the breakdown is connected to.<div class="result-actions"><button class="btn" id="reviewEvidenceBtn">Review evidence →</button></div></div>`
            );
            next.textContent = "Review evidence →";
            mobileNext.textContent = "Review evidence →";
            document.querySelector("#reviewEvidenceBtn")?.addEventListener("click", () => {
                state.screen = 1;
                render();
            });
            return;
        }
        let primary = state.recommended[0] || "flow",
            secondary = state.recommended[1];
        state.guide = primary;
        shell(
            "04 — Models to explore",
            "Possible modelling directions.",
            `<p class="lead">These suggestions are based on the evidence characteristics you selected. They are not a prescription.</p><div class="results"><div class="panel result primary"><div class="tag">Strong direction</div><h3>${models[primary].name}</h3><p>${models[primary].q}</p><p>Why: your selections point toward ${models[primary].why}.</p><div class="result-actions"><button class="btn primary-outline guide-jump" data-model="${primary}">Explore this guide →</button><button class="btn example-btn" data-example="${primary}">View worked example ↗</button></div></div>${secondary ? `<div class="model-card"><div><div class="tag">Also consider</div><h3>${models[secondary].name}</h3><p>${models[secondary].q}</p></div><div class="result-actions"><button class="btn guide-jump" data-model="${secondary}">Explore guide →</button><button class="btn example-btn" data-example="${secondary}">Worked example ↗</button></div></div>` : ""}<div class="model-card"><div><div class="tag">Other perspectives</div><h3>Explore freely</h3><p>You can inspect any model. Multiple models can reveal different relationships in the same evidence.</p></div><div class="result-actions"><button class="btn guide-jump" data-model="flow">Open model guide →</button></div></div></div>${state.selected.has("unsure") ? '<div class="note"><strong>You marked some evidence as uncertain.</strong><br>Use these recommendations as starting points only. Bring unresolved evidence or modelling questions to your class tutor.</div>' : ""}`
        );
        document.querySelectorAll(".guide-jump").forEach(
            (b) =>
                (b.onclick = () => {
                    state.guide = b.dataset.model;
                    state.screen = 5;
                    render();
                })
        );
        document.querySelectorAll(".example-btn").forEach((b) => (b.onclick = () => openExample(b.dataset.example)));
        next.textContent = "Explore guide →";
        mobileNext.textContent = "Explore guide →";
    } else {
        let m = models[state.guide];
        shell(
            "05 — Model guide",
            m.name,
            `<p class="lead">${m.q}</p><div class="model-tabs">${Object.keys(models)
                .map(
                    (k) =>
                        `<button class="btn ${k === state.guide ? "active" : ""}" data-model="${k}">${models[k].name.replace(" Model", "")}</button>`
                )
                .join(
                    ""
                )}</div>${diagram(state.guide)}<div class="model-guide"><h2>Build it from evidence</h2><div class="steps">${m.steps.map((s, i) => `<div class="step"><div class="step-number">${String(i + 1).padStart(2, "0")}</div><div><h3>${s[0]}</h3><p>${s[1]}</p></div></div>`).join("")}</div><div class="check"><strong>Check your model</strong>Can you trace its important elements back to research evidence? Does it reveal a relationship that was difficult to see in the raw data or affinity map?</div><div class="note"><strong>Visual conventions are flexible.</strong><br>The diagrams demonstrate possible structures only. Your model should respond to your evidence.</div><div class="example-access"><button class="btn" id="modelExampleBtn">View worked example ↗</button></div></div>`
        );
        document.querySelectorAll("[data-model]").forEach(
            (b) =>
                (b.onclick = () => {
                    state.guide = b.dataset.model;
                    render();
                })
        );
        document.querySelector("#modelExampleBtn").onclick = () => openExample(state.guide);
        next.textContent = "Start again";
        mobileNext.textContent = "Start again";
    }
}
function advance() {
    if (state.screen === 5) {
        state = {
            screen: 0,
            selected: new Set(),
            details: {},
            scores: {},
            recommended: [],
            guide: "flow",
            exampleKey: null,
            exampleStage: "evidence",
        };
    } else state.screen++;
    render();
}
function retreat() {
    if (state.screen > 0) state.screen--;
    render();
}
next.onclick = advance;
mobileNext.onclick = advance;
back.onclick = retreat;
mobileBack.onclick = retreat;
const modal = document.querySelector("#modal");
document.querySelector("#aboutBtn").onclick = () =>
    openInfo(
        "About",
        `<p>The Contextual Modelling Companion helps students move from affinity analysis toward evidence-grounded contextual models.</p><p>It focuses on five core modelling perspectives: Flow, Sequence, Cultural, Physical and Artefact.</p>`
    );
document.querySelector("#helpBtn").onclick = () =>
    openInfo(
        "How to use this tool",
        `<p>Work from evidence you have already collected and analysed. Use the checkboxes to describe what appears in that evidence, then inspect the suggested modelling directions.</p><p><strong>Do not treat recommendations as answers.</strong> Contextual models are analytical lenses. If you are uncertain about your evidence, a model, or how to interpret a relationship, discuss it with your class tutor.</p><p>The example diagrams demonstrate possible visual structures only. They are not mandatory templates.</p>`
    );
function openInfo(t, b) {
    document.querySelector("#modalTitle").textContent = t;
    document.querySelector("#modalBody").innerHTML = b;
    document.querySelector("#modalFooter").innerHTML =
        '<button class="btn primary" onclick="document.querySelector(\'#modal\').close()">Close</button>';
    modal.showModal();
}
document.querySelector("#closeModal").onclick = () => modal.close();
render();
