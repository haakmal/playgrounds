/**
 * Playgrounds Utility, v4
 * A self-contained, dependency-free navigation layer for project pages.
 *
 * Edit _data/playgrounds_utility.yml. Jekyll automatically renders the JSON endpoint.
 * The injector only registers new projects and inserts the script reference.
 * No GitHub credentials are required.
 *
 * Email obfuscation is not email security. The configured address is recoverable
 * by visitors/scripts, even if mailto is assembled only on click.
 */
(async () => {
  "use strict";
  if (document.querySelector("[data-pg-utility-root]")) return;

  const fallbackDefaults = {
    siteUrl: "/",
    repositoryUrl: "https://github.com/haakmal/playgrounds",
    issuesUrl: "https://github.com/haakmal/playgrounds/issues/new",
    discussionsUrl: "https://github.com/haakmal/playgrounds/discussions",
    discussionsEnabled: false,
    email: "",
    side: "right",
    bottom: 96,
    mobileBottom: 16,
    mobileSide: "right",
    mobileInset: 12,
  };
  const script = document.currentScript || document.querySelector("script[data-playgrounds-utility]");
  const pathParts = location.pathname.split("/").filter(Boolean);
  const inferredProject = pathParts.indexOf("projects") >= 0 ? pathParts[pathParts.indexOf("projects") + 1] : "";
  const slug = (script && script.dataset.project) || inferredProject || "";
  // Keep configuration outside each project and outside the component source.
  let fileConfig = {};
  try {
    const configUrl = (script && script.dataset.configUrl) || "/assets/playgrounds-utility-config.json";
    const response = await fetch(configUrl, { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    fileConfig = await response.json();
  } catch (error) {
    console.warn("[Playgrounds utility] Could not load configuration; using defaults.", error);
  }
  // Jekyll renders JSON from _data/playgrounds_utility.yml; optional window overrides support demos.
  const CONFIG = Object.assign({}, fallbackDefaults, fileConfig.defaults || {}, window.PLAYGROUNDS_UTILITY_CONFIG || {});
  const override = Object.assign({}, (fileConfig.projects || {})[slug] || {}, (window.PLAYGROUNDS_UTILITY_PROJECTS || {})[slug] || {});
  const opts = Object.assign({}, CONFIG, override);
  const side = opts.side === "left" ? "left" : "right";
  const projectTitle = opts.title || (document.title || slug || "This project").replace(/\s*[|–—-]\s*Dr Daft.*$/i, "").trim();
  const repo = String(opts.repositoryUrl).replace(/\/$/, "");
  const site = opts.siteUrl || "/";
  const source = `${repo}/tree/main/projects/${encodeURIComponent(slug)}`;
  const url = location.href;
  const reportTitle = `[${slug || "Playgrounds"}] Problem report`;
  const issueBody = `**Playground:** ${projectTitle}\n**Page:** ${url}\n\n**What happened?**\n\n\n**What did you expect?**\n\n\n**How can it be reproduced?**\n`;
  const issueHref = `${opts.issuesUrl}?${new URLSearchParams({ title: reportTitle, body: issueBody }).toString()}`;

  const host = document.createElement("div");
  host.setAttribute("data-pg-utility-root", "");
  host.className = "print-remove";
  host.style.cssText = `position:fixed;z-index:2147483000;${side}:0;bottom:calc(${Math.max(0, Number(opts.bottom) || 0)}px + env(safe-area-inset-bottom, 0px));pointer-events:none;`;
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    *, *::before, *::after { box-sizing: border-box; }
    .shell { --pg-fg:#111; --pg-bg:#fff; --pg-muted:#666; --pg-line:#aaa; color:var(--pg-fg); font: 13px/1.4 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; pointer-events:none; display:flex; flex-direction:column; gap:7px; }
    /* Align the utility with its currently configured edge. */
    .shell[data-side="left"] {  align-items: flex-start;}
    .shell[data-side="right"] { align-items: flex-end;}
    /* Mirror the trigger's direction and corners. */
    .shell[data-side="left"] .trigger { flex-direction: row; border-radius: 0 5px 5px 0;}
    .shell[data-side="right"] .trigger { flex-direction: row-reverse;  border-radius: 5px 0 0 5px;}
    /* Expand the label inward from either edge. */
    .shell[data-side="left"] .trigger:hover .caption,
    .shell[data-side="left"] .trigger:focus-visible .caption,
    .shell[data-side="left"] .trigger[aria-expanded="true"] .caption { margin-left: 8px; margin-right: 0;}
    .shell[data-side="right"] .trigger:hover .caption,
    .shell[data-side="right"] .trigger:focus-visible .caption,
    .shell[data-side="right"] .trigger[aria-expanded="true"] .caption { margin-right: 8px; margin-left: 0; }
    button, a { font:inherit; color:inherit; cursor:pointer; }
    button:focus-visible, a:focus-visible { outline:2px solid #555; outline-offset:3px; }
    .trigger { pointer-events:auto; display:inline-flex; align-items:center; justify-content:center; gap:0; background:#111; color:#fff; border:1px solid #111; border-radius:${side === "right" ? "5px 0 0 5px" : "0 5px 5px 0"}; padding:10px 11px; min-height:42px; min-width:42px; letter-spacing:.01em; white-space:nowrap; }
    .trigger > span:first-child { display:inline-flex; justify-content:center; align-items:center; width:16px; height:16px; font-size:16px; line-height:1; flex-shrink:0; }
    .trigger .caption { display:inline-flex; align-items: center; line-height: 1; max-width:0; opacity:0; overflow:hidden; transition:max-width .2s ease, opacity .16s ease, margin .2s ease; margin:0; }
    .trigger:hover .caption, .trigger:focus-visible .caption, .trigger[aria-expanded="true"] .caption { max-width:130px; opacity:1; margin-${side === "right" ? "right" : "left"}:8px; }
    .trigger:hover { background:#333; }
    .trigger .mark { font-size:16px; line-height:1; }
    .trigger .caption { font-size:11px; font-weight:650; letter-spacing:.08em; }
    .panel { pointer-events:auto; width:min(270px,calc(100vw - 24px)); background:var(--pg-bg); color:var(--pg-fg); border:1px solid #111; border-radius:5px; overflow:hidden; }
    .panel[hidden] { display:none; }
    .heading { padding:14px 14px 11px; border-bottom:1px solid #bbb; display:flex; align-items:flex-start; gap:10px; justify-content:space-between; }
    .eyebrow { font-size:10px; font-weight:750; letter-spacing:.11em; }
    .project { font-size:12px; margin-top:5px; overflow-wrap:anywhere; color:#555; }
    .close { flex:none; border:1px solid #ccc; background:white; min-height:30px; min-width:30px; border-radius:3px; }
    .close:hover { background:#eee; }
    nav { padding:5px; }
    .item { display:flex; align-items:center; gap:10px; min-height:38px; padding:9px; text-decoration:none; border-radius:2px; }
    .item:hover { background:#eee; }
    .icon { display:inline-flex; justify-content:center; align-items:center; width:20px; font-size:15px; flex:none; }
    .meta { font-size:10px; color:#777; padding:11px 14px; border-top:1px solid #ddd; }
    .section { font-size:10px; letter-spacing:.1em; font-weight:700; color:#666; padding:10px 9px 3px; }
    @media (min-width: 701px) and (pointer: fine) {
  .shell[data-side="left"] .panel {
    margin-left: 10px;
    margin-bottom: 3px;
  }

  .shell[data-side="right"] .panel {
    margin-right: 10px;
    margin-bottom: 3px;
  }
}
    @media (max-width: 700px), (pointer: coarse) {
      .shell[data-side="left"] .trigger,
      .shell[data-side="right"] .trigger {
        width: 42px;
        height: 42px;
        min-width: 42px;
        min-height: 42px;
        padding: 0;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;}
  .trigger .caption { display: none; }}
    @media (prefers-reduced-motion:reduce) { .trigger .caption { transition:none; } }
    @media (prefers-reduced-motion:no-preference) { .panel { animation:pg-appear .13s ease-out; } @keyframes pg-appear { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } } }
    @media print { .shell { display:none !important; } }
  `;
  root.appendChild(style);
  const shell = document.createElement("div");
  shell.className = "shell";
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.id = "pg-panel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Playgrounds navigation and participation");
  const heading = document.createElement("div");
  heading.className = "heading";
  const titleWrap = document.createElement("div");
  const eyebrow = document.createElement("div");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "PLAYGROUNDS";
  const project = document.createElement("div");
  project.className = "project";
  project.textContent = projectTitle;
  titleWrap.append(eyebrow, project);
  const close = document.createElement("button");
  close.type = "button";
  close.className = "close";
  close.setAttribute("aria-label", "Close Playgrounds menu");
  close.textContent = "×";
  heading.append(titleWrap, close);
  panel.appendChild(heading);
  const nav = document.createElement("nav");
  nav.setAttribute("aria-label", "Playgrounds links");
  function section(label) {
    const el = document.createElement("div");
    el.className = "section";
    el.textContent = label;
    nav.appendChild(el);
  }
  function link(label, href, glyph, external = false) {
    const a = document.createElement("a");
    a.className = "item";
    a.href = href;
    if (external) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    const ic = document.createElement("span");
    ic.className = "icon";
    ic.setAttribute("aria-hidden", "true");
    ic.textContent = glyph;
    const name = document.createElement("span");
    name.textContent = label;
    a.append(ic, name);
    nav.appendChild(a);
    return a;
  }
  section("EXPLORE");
  link("All playgrounds", site, "←");
  link("This project’s source", source, "⌘", true);
  link("Full GitHub repository", repo, "↗", true);
  section("PARTICIPATE");
  link("Report a problem", issueHref, "!", true);
  if (opts.discussionsEnabled) link("Discuss or suggest", opts.discussionsUrl, "◎", true);
  link("Fork and contribute", `${repo}/fork`, "⑂", true);
  if (opts.email) {
    section("CONTACT");
    const contact = link("Email the author", "#", "✉");
    contact.addEventListener("click", (e) => {
      e.preventDefault();
      const subject = `Playgrounds — ${projectTitle}`;
      const body = `Project: ${projectTitle}\n${url}\n\n`;
      location.href = `mailto:${opts.email}?subject=${subject}&body=${encodeURIComponent(body)}`;
    });
  }
  panel.appendChild(nav);
  const footer = document.createElement("div");
  footer.className = "meta";
  footer.textContent = "Playgrounds are everywhere.";
  panel.appendChild(footer);
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "trigger";
  trigger.setAttribute("aria-label", "Open Playgrounds utility");
  trigger.setAttribute("aria-controls", "pg-panel");
  trigger.setAttribute("aria-expanded", "false");
  const mark = document.createElement("span");
  mark.className = "mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = "☷";
  const caption = document.createElement("span");
  caption.className = "caption";
  caption.textContent = "PLAYGROUNDS";
  trigger.append(mark, caption);
  // Position the panel above the trigger, so its opening does not move the trigger.
  shell.append(panel, trigger);
  root.appendChild(shell);
  document.body.appendChild(host);

  const coarse = matchMedia("(max-width: 700px), (pointer: coarse)");
  const setMobilePosition = () => {
    const isMobile = coarse.matches;

    const activeSide = isMobile ? (opts.mobileSide === "left" ? "left" : "right") : side;

    // Clear positioning from the previous viewport.
    host.style.left = "";
    host.style.right = "";

    // Position the utility against the active edge.
    host.style[activeSide] = isMobile ? `${Math.max(0, Number(opts.mobileInset) || 0)}px` : "0";

    // Apply vertical positioning.
    const bottom = isMobile ? opts.mobileBottom : opts.bottom;

    host.style.bottom = `calc(${Math.max(0, Number(bottom) || 0)}px + env(safe-area-inset-bottom, 0px))`;

    // Synchronise internal alignment with the active edge.
    shell.dataset.side = activeSide;
  };
  setMobilePosition();
  if (coarse.addEventListener) coarse.addEventListener("change", setMobilePosition);

  // Hover only extends the label. The panel opens exclusively via click/tap.
  function setOpen(open) {
    panel.hidden = !open;
    trigger.setAttribute("aria-expanded", String(open));
    trigger.setAttribute("aria-label", open ? "Close Playgrounds utility" : "Open Playgrounds utility");
    mark.textContent = open ? "×" : "☷";
  }
  trigger.addEventListener("click", () => setOpen(panel.hidden));
  close.addEventListener("click", () => {
    setOpen(false);
    trigger.focus();
  });
  document.addEventListener("pointerdown", (e) => {
    if (!panel.hidden && !e.composedPath().includes(host)) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) {
      setOpen(false);
      trigger.focus();
    }
  });
})();
