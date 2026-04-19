/* ============================================================
   script.js — Student View
   Design Brief AI Client
   ============================================================ */

// ── API Configuration ─────────────────────────────────────
// Uses the Cloudflare Worker to proxy requests to Gemini safely
const WORKER_ENDPOINT = "https://gemini-worker.hakmal.workers.dev/";

// ── Default brief (shown when no tutor session is active) ─
const DEFAULT_BRIEF = {
  clientName: "Alex Chen",
  clientTitle: "Creative Director, Spatial UX Lab",
  scenario: `The university has seen a 40% increase in visitor complaints about
navigating between buildings. Current signage was designed in 2003 and does not
account for accessibility needs or digital interaction points.`,
  requirements: [
    "Must work for first-time visitors unfamiliar with campus",
    "Must meet WCAG 2.1 AA accessibility standards",
    "Must integrate with the university's existing mobile app",
    "Physical touchpoints must be weather-resistant",
  ],
  constraints: [
    "Budget: $120,000 AUD total",
    "Timeline: 6-month delivery",
    "Cannot require structural modifications to heritage buildings",
  ],
  metrics: [
    "Reduce visitor complaints by 60%",
    "Navigation task completion < 3 minutes for a first-time visitor",
    "Positive result from an independent accessibility audit",
  ],
  intensity: 3,
};

// ── Intensity helpers ─────────────────────────────────────
const INTENSITY_CONFIG = {
  badge: (v) => {
    if (v <= 2) return "This client is warm and collaborative";
    if (v <= 3) return "This client is professional and balanced";
    return "This client is demanding and direct";
  },
  guidance: (v) => {
    if (v <= 2) return `Lead with what works before addressing gaps. Use warm, collaborative language.
Gently probe with open questions. Acknowledge good thinking generously.`;
    if (v <= 3) return `Balance acknowledgement of strengths with clear identification of gaps.
Ask direct but constructive follow-up questions.`;
    return `Lead with gaps and weaknesses first. Hold the student to every requirement and constraint.
Ask sharp, specific questions that expose weaknesses. Do not soften critique.`;
  },
};

// ── State ─────────────────────────────────────────────────
let brief = DEFAULT_BRIEF;
let pseudonym = "";
let conversationHistory = []; // { role: 'user'|'model', parts: [{text}] }[]

// ── Brief & session loading ───────────────────────────────
function loadBrief() {
  try {
    const saved = localStorage.getItem("ai_client_brief");
    if (saved) brief = { ...DEFAULT_BRIEF, ...JSON.parse(saved) };
  } catch {
    console.warn("Could not parse saved brief — using default.");
  }
}

function loadSession() {
  try {
    const saved = localStorage.getItem("ai_client_session");
    if (saved) {
      const s = JSON.parse(saved);
      pseudonym = s.pseudonym || "";
      // Rebuild history for Gemini (role/parts format)
      conversationHistory = (s.history || []).map((m) => ({
        role: m.role === "client" ? "model" : "user",
        parts: [{ text: m.text }],
      }));
      return s;
    }
  } catch { /* ignore */ }
  return null;
}

function saveSession(role, text) {
  try {
    const saved = localStorage.getItem("ai_client_session");
    const s = saved ? JSON.parse(saved) : { pseudonym, startedAt: new Date().toISOString(), history: [] };
    s.history.push({ role, text, ts: new Date().toISOString() });
    localStorage.setItem("ai_client_session", JSON.stringify(s));
  } catch { /* non-critical */ }
}

// ── System prompt builder ─────────────────────────────────
function buildSystemPrompt(b, name) {
  const reqs = b.requirements.map((r) => `- ${r}`).join("\n");
  const cons = b.constraints.map((c) => `- ${c}`).join("\n");
  const mets = b.metrics.map((m) => `- ${m}`).join("\n");
  const guide = INTENSITY_CONFIG.guidance(b.intensity);

  return `You are ${b.clientName}, ${b.clientTitle}.
You are conducting a design review meeting with a student named ${name}.

THE BRIEF YOU ARE EVALUATING AGAINST:
${b.scenario}

Requirements:
${reqs}

Constraints:
${cons}

Success Metrics:
${mets}

PERSONA INSTRUCTIONS:
- You are a real client in a face-to-face meeting. Never break character or refer to yourself as an AI.
- Respond in natural conversational prose — as you would speak in a real meeting. No bullet points.
- Anchor every piece of feedback to a specific element of the brief above.
- Intensity style: ${guide}
- Always end your response with exactly one probing question that pushes the student to think further.
- If the student makes a convincing argument, acknowledge it — but immediately raise a new concern from the brief.
- Do not simply validate whatever the student says. Be rigorous.
- Keep responses concise (3–5 sentences) unless the student asks you to elaborate.`;
}

// ── Gemini API call ───────────────────────────────────────
async function fetchAIResponse() {
  const systemPrompt = buildSystemPrompt(brief, pseudonym);
  
  // Package history into the shape the Worker expects
  // The worker receives: { contents: [{ parts: [{ text: ... }] }] }
  // To pass system instructions and history, we concatenate them for the worker
  const fullPrompt = `SYSTEM INSTRUCTION:
${systemPrompt}

CONVERSATION HISTORY:
${conversationHistory.map(m => `${m.role.toUpperCase()}: ${m.parts[0].text}`).join('\n\n')}

CLIENT RESPONSE (You):`;

  try {
    const res = await fetch(WORKER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
      }),
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    // Support both the standard Gemini response shape and the specific scenario/provoked shape from the worker
    return data?.scenario || data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
  } catch (err) {
    console.error("Worker error:", err);
    return "Something went wrong reaching the client. Please try again.";
  }
}

// ── UI rendering ──────────────────────────────────────────
function renderBrief(b) {
  document.getElementById("brief-title").textContent = b.scenario.split("\n")[0].trim().slice(0, 80) || "Design Brief";
  document.getElementById("brief-scenario").textContent = b.scenario;
  document.getElementById("client-name").textContent = b.clientName;
  document.getElementById("client-title").textContent = b.clientTitle;
  document.getElementById("intensity-badge").textContent = INTENSITY_CONFIG.badge(b.intensity);

  // Avatar initials
  const initials = b.clientName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  document.getElementById("client-avatar").textContent = initials;

  const renderList = (id, items) => {
    const el = document.getElementById(id);
    el.innerHTML = items.map((i) => `<li>${i}</li>`).join("");
  };
  renderList("brief-requirements", b.requirements);
  renderList("brief-constraints", b.constraints);
  renderList("brief-metrics", b.metrics);
}

function renderBubble(role, text) {
  const messages = document.getElementById("chat-messages");
  const typing = document.getElementById("typing-indicator");

  const bubble = document.createElement("div");
  bubble.classList.add("chat-bubble", role);

  const sender = document.createElement("div");
  sender.classList.add("bubble-sender");
  sender.textContent = role === "client" ? brief.clientName : pseudonym;

  const body = document.createElement("div");
  body.classList.add("bubble-body");
  // Render markdown for client; plain text for student
  body.innerHTML = role === "client"
    ? marked.parse(text, { breaks: true })
    : text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>");

  bubble.appendChild(sender);
  bubble.appendChild(body);

  // Insert before typing indicator
  messages.insertBefore(bubble, typing);
  scrollToBottom();
}

function showTyping() {
  const t = document.getElementById("typing-indicator");
  t.classList.remove("hidden");
  // Move to end
  document.getElementById("chat-messages").appendChild(t);
  scrollToBottom();
}

function hideTyping() {
  document.getElementById("typing-indicator").classList.add("hidden");
}

function scrollToBottom() {
  const el = document.getElementById("chat-messages");
  el.scrollTop = el.scrollHeight;
}

function setInputEnabled(enabled) {
  document.getElementById("message-input").disabled = !enabled;
  document.getElementById("send-btn").disabled = !enabled;
}

// ── Send message flow ─────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById("message-input");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  setInputEnabled(false);

  // Render student bubble
  renderBubble("student", text);
  saveSession("student", text);

  // Add to conversation history
  conversationHistory.push({ role: "user", parts: [{ text }] });

  // Show typing, fetch, respond
  showTyping();
  const reply = await fetchAIResponse();
  hideTyping();

  // Add AI response to history
  conversationHistory.push({ role: "model", parts: [{ text: reply }] });
  saveSession("client", reply);

  renderBubble("client", reply);
  setInputEnabled(true);
  document.getElementById("message-input").focus();
}

// ── Welcome message (initial AI greeting) ─────────────────
async function sendWelcome() {
  showTyping();
  // Seed the conversation with a context-setting opener prompt
  const opener = `You are starting the review session. Welcome ${pseudonym} warmly and in 2-3 sentences explain what you're hoping to see from them today, grounded in the brief. End with an open question to get them talking.`;
  conversationHistory.push({ role: "user", parts: [{ text: opener }] });

  const reply = await fetchAIResponse();
  hideTyping();

  conversationHistory.push({ role: "model", parts: [{ text: reply }] });
  saveSession("client", reply);
  renderBubble("client", reply);
  setInputEnabled(true);
  document.getElementById("message-input").focus();
}

// ── Onboarding flow ───────────────────────────────────────
function startSession(name) {
  pseudonym = name.trim();
  document.getElementById("chat-pseudonym").textContent = `— ${pseudonym}`;

  // Persist new session
  localStorage.setItem(
    "ai_client_session",
    JSON.stringify({ pseudonym, startedAt: new Date().toISOString(), history: [] })
  );

  sendWelcome();
}

function restoreSession(session) {
  pseudonym = session.pseudonym;
  document.getElementById("chat-pseudonym").textContent = `— ${pseudonym}`;

  // Replay visible history (skip the internal opener prompt at index 0)
  const visible = session.history || [];
  visible.forEach((m) => renderBubble(m.role, m.text));

  if (visible.length > 0) {
    setInputEnabled(true);
    document.getElementById("message-input").focus();
  } else {
    sendWelcome();
  }
}

// ── Keyboard shortcut (Shift+Enter = newline, Enter = send) ─
document.getElementById("message-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

document.getElementById("send-btn").addEventListener("click", sendMessage);

// ── Begin button ──────────────────────────────────────────
document.getElementById("begin-btn").addEventListener("click", () => {
  const name = document.getElementById("pseudonym-input").value.trim();
  if (!name) {
    document.getElementById("pseudonym-input").focus();
    return;
  }
  document.getElementById("onboarding-dialog").close();
  startSession(name);
});

document.getElementById("pseudonym-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("begin-btn").click();
});

// ── Init ──────────────────────────────────────────────────
(function init() {
  loadBrief();
  renderBrief(brief);

  const session = loadSession();

  if (session && session.pseudonym) {
    // Returning student — restore their session
    restoreSession(session);
  } else {
    // New student — show onboarding
    document.getElementById("onboarding-dialog").showModal();
  }
})();
