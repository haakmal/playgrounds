module.exports = async (params) => {
  const { app, quickAddApi } = params;

  const folder = "00 Notes/Logs";
  const week = window.moment().format("YYYY-[W]WW");
  const today = window.moment().format("YYYY-MM-DD");
  const periodEnd = window.moment().add(7, "days").format("YYYY-MM-DD");
  const uid = window.moment().format("YYYY-MM-DD-HH-mm-ss");
  const filename = `${week} Academic Log.md`;
  const filepath = `${folder}/${filename}`;

  // -----------------------------
  // CATEGORY PICKER
  // -----------------------------
  const categoryOptions = [
    "Teaching",
    "Research",
    "Leadership & Service",
    "Invisible Labour",
    "Key Wins / Impact Highlights"
  ];

  const category = await quickAddApi.suggester(categoryOptions, categoryOptions);
  if (!category) return;

  // -----------------------------
  // CATEGORY-SPECIFIC TYPE OPTIONS
  // CHANGED: type list now depends on category
  // CHANGED: subtype removed entirely
  // -----------------------------
  const typeMap = {
    "Teaching": ["curriculum development", "course delivery", "student supervision", "assessment", "other"],
    "Research": ["publication", "review", "grant", "collaboration", "project related", "other"],
    "Leadership & Service": ["committee", "governance", "leadership", "other"],
    "Invisible Labour": ["mentoring", "student support", "conflict resolution", "peer support", "other"],
    "Key Wins / Impact Highlights": []
  };

  const availableTypes = typeMap[category] ?? [];
  let type = "";

  if (availableTypes.length > 0) {
    type = await quickAddApi.suggester(availableTypes, availableTypes);
    if (!type) return;
  }

  // -----------------------------
  // PROMPTS
  // CHANGED: subtype prompt removed
  // -----------------------------
  // Text entry option
  //const impact = await quickAddApi.inputPrompt("Impact (optional)");
  //if (impact === null) return;

  // Dropdown option
  const impactLabels = ["Skip", "High", "Medium", "Low", "Future-focused"];
  const impactValues = ["", "high", "medium", "low", "future-focused"];
  const impact = await quickAddApi.suggester(impactLabels, impactValues, "What was the impact level (optional)?");
  if (impact === null) return;

  const description = await quickAddApi.inputPrompt("What did you do?");
  if (!description || !description.trim()) return;

  const evidence = await quickAddApi.inputPrompt("Share evidence if you can (optional)");
  if (evidence === null) return;

  // -----------------------------
  // SECTION + CATEGORY VALUE MAPS
  // -----------------------------
  const sectionMap = {
    "Teaching": "## 🎓 Teaching",
    "Research": "## 🔬 Research",
    "Leadership & Service": "## 🏛️ Leadership & Service",
    "Invisible Labour": "## 👁️ Invisible Labour",
    "Key Wins / Impact Highlights": "## 💥 Key Wins / Impact Highlights"
  };

  const categoryValueMap = {
    "Teaching": "teaching",
    "Research": "research",
    "Leadership & Service": "service",
    "Invisible Labour": "invisible",
    "Key Wins / Impact Highlights": "highlight"
  };

  const sectionHeader = sectionMap[category];
  const categoryValue = categoryValueMap[category];

  // -----------------------------
  // FIND OR CREATE THIS WEEK'S LOG
  // CHANGED: if missing, create scaffold automatically
  // -----------------------------
  let file = app.vault.getAbstractFileByPath(filepath);

  if (!file) {
    const scaffold = `---
aliases: ["${week} Academic Log"]
UID: "${uid}"
date: "${today}"
---

# 📅 ${week} Academic Log

date:: ${today}
period:: ${today} → ${periodEnd}
type:: academic-log

---

## 🎓 Teaching

---

## 🔬 Research

---

## 🏛️ Leadership & Service

---

## 👁️ Invisible Labour

---

## 💥 Key Wins / Impact Highlights

---

## 🏷️ Quick Tags
#academic-log #teaching #research #service #leadership #invisible-labour
`;

    await app.vault.create(filepath, scaffold);
    file = app.vault.getAbstractFileByPath(filepath);

    if (!file) {
      new Notice("Could not create this week's log: " + filepath);
      return;
    }
}

  // -----------------------------
  // BUILD ENTRY
  // CHANGED: no subtype
  // -----------------------------
  let entry = `- ${description}\n`;
  entry += `  [category:: ${categoryValue}]`;

  if (type && type.trim()) entry += ` [type:: ${type.trim()}]`;
  if (impact && impact.trim()) entry += ` [impact:: ${impact.trim()}]`;
  if (evidence && evidence.trim()) entry += ` [evidence:: ${evidence.trim()}]`;

  //entry += `\n`;

  // -----------------------------
  // READ FILE + FIND SECTION
  // -----------------------------
  const content = await app.vault.read(file);
  const lines = content.split("\n");

  const sectionIndex = lines.findIndex(line => line.trim() === sectionHeader);
  if (sectionIndex === -1) {
    new Notice(`Section not found: ${sectionHeader}`);
    return;
  }

  // -----------------------------
  // INSERT AT TOP OF SECTION
  // CHANGED: new entries go directly under heading, not at bottom
  // CHANGED: ensures clean blank-line spacing
  // -----------------------------
  let insertIndex = sectionIndex + 1;

  // Ensure exactly one blank line after header
  if (lines[insertIndex]?.trim() !== "") {
    lines.splice(insertIndex, 0, "");
  }

  // Insert directly after that blank line
  insertIndex = sectionIndex + 2;

  lines.splice(insertIndex, 0, entry);

  // -----------------------------
  // SAVE
  // -----------------------------
  await app.vault.modify(file, lines.join("\n"));
  new Notice(`Added entry to ${category}`);
};