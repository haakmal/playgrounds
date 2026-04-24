const files = [
  { name: "action-logger.js", path: "scripts/action-logger.js" }
];

const list = document.getElementById("script-list");

function getExtension(filename) {
  const index = filename.lastIndexOf(".");
  return index === -1 ? "" : filename.slice(index + 1).toLowerCase();
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightJavaScript(text) {
  let html = escapeHtml(text);

  html = html.replace(
    /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    '<span class="token-comment">$1</span>'
  );

  html = html.replace(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,
    '<span class="token-string">$1</span>'
  );

  html = html.replace(
    /\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|class|new|try|catch|finally|throw|async|await|import|export|default|true|false|null|undefined)\b/g,
    '<span class="token-keyword">$1</span>'
  );

  html = html.replace(
    /\b(\d+(\.\d+)?)\b/g,
    '<span class="token-number">$1</span>'
  );

  return html;
}

function highlightCSS(text) {
  let html = escapeHtml(text);

  html = html.replace(
    /(\/\*[\s\S]*?\*\/)/g,
    '<span class="token-comment">$1</span>'
  );

  html = html.replace(
    /([^{\s][^{]*)(\s*\{)/g,
    '<span class="token-selector">$1</span>$2'
  );

  html = html.replace(
    /([a-zA-Z-]+)(\s*:)/g,
    '<span class="token-property">$1</span>$2'
  );

  html = html.replace(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    '<span class="token-string">$1</span>'
  );

  html = html.replace(
    /\b(\d+(\.\d+)?)(px|rem|em|vh|vw|%|s)?\b/g,
    '<span class="token-number">$1$3</span>'
  );

  return html;
}

function highlightHTML(text) {
  let html = escapeHtml(text);

  html = html.replace(
    /(&lt;!--[\s\S]*?--&gt;)/g,
    '<span class="token-comment">$1</span>'
  );

  html = html.replace(
    /(&lt;\/?)([a-zA-Z0-9-]+)/g,
    '$1<span class="token-tag">$2</span>'
  );

  html = html.replace(
    /\s([a-zA-Z-:]+)=/g,
    ' <span class="token-attr">$1</span>='
  );

  html = html.replace(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    '<span class="token-string">$1</span>'
  );

  return html;
}

function highlightPython(text) {
  let html = escapeHtml(text);

  html = html.replace(
    /(#.*$)/gm,
    '<span class="token-comment">$1</span>'
  );

  html = html.replace(
    /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    '<span class="token-string">$1</span>'
  );

  html = html.replace(
    /\b(def|class|return|if|elif|else|for|while|try|except|finally|with|as|import|from|pass|break|continue|True|False|None|lambda|yield|async|await)\b/g,
    '<span class="token-keyword">$1</span>'
  );

  html = html.replace(
    /\b(\d+(\.\d+)?)\b/g,
    '<span class="token-number">$1</span>'
  );

  return html;
}

function highlightByType(text, extension) {
  switch (extension) {
    case "js":
    case "mjs":
    case "cjs":
    case "ts":
    case "jsx":
    case "tsx":
      return highlightJavaScript(text);

    case "css":
      return highlightCSS(text);

    case "html":
    case "htm":
      return highlightHTML(text);

    case "py":
      return highlightPython(text);

    default:
      return escapeHtml(text);
  }
}

function createEntry(file) {
  const details = document.createElement("details");
  details.className = "script-entry";
  details.dataset.path = file.path;

  const summary = document.createElement("summary");
  summary.className = "script-summary";
  summary.innerHTML = `
    <span class="script-name">${file.name}</span>
    <span class="script-type">${getExtension(file.name) || "file"}</span>
  `;

  const body = document.createElement("div");
  body.className = "script-body";

  const actions = document.createElement("div");
  actions.className = "script-actions";

  const rawLink = document.createElement("a");
  rawLink.href = file.path;
  rawLink.target = "_blank";
  rawLink.rel = "noreferrer";
  rawLink.textContent = "Open file";

  const downloadLink = document.createElement("a");
  downloadLink.href = file.path;
  downloadLink.setAttribute("download", file.name);
  downloadLink.textContent = "Download";

  actions.append(rawLink, downloadLink);

  const status = document.createElement("div");
  status.className = "status";
  status.textContent = "Loading on open…";

  const pre = document.createElement("pre");
  pre.className = "code-block";
  pre.hidden = true;

  const code = document.createElement("code");
  pre.appendChild(code);

  body.append(actions, status, pre);
  details.append(summary, body);

  let loaded = false;

  details.addEventListener("toggle", async () => {
    if (!details.open || loaded) return;

    status.textContent = "Loading…";

    try {
      const response = await fetch(file.path);

      if (!response.ok) {
        throw new Error(`Could not load ${file.path}`);
      }

      const text = await response.text();
      const extension = getExtension(file.name);

      code.innerHTML = highlightByType(text, extension);
      pre.hidden = false;
      status.textContent = "";
      loaded = true;
    } catch (error) {
      status.textContent = error.message;
      status.classList.add("error");
    }
  });

  return details;
}

files.forEach((file) => {
  list.appendChild(createEntry(file));
});
