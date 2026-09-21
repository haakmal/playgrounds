export const COURSE_HEADING_RE = /^## \[\[(.+?)\]\]\s*$/m;

export function normalize(value) {
  return String(value ?? '').trim();
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseFrontmatter(markdown) {
  const text = String(markdown ?? '');
  if (!text.startsWith('---')) return { raw: '', start: -1, end: -1, data: new Map() };
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { raw: '', start: -1, end: -1, data: new Map() };
  const raw = match[1];
  const data = new Map();
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([^:#][^:]*?):\s*(.*)$/);
    if (!m) continue;
    data.set(m[1].trim(), m[2].trim());
  }
  return { raw: match[0], start: 0, end: match[0].length, data };
}

export function frontmatterValue(markdown, key) {
  return parseFrontmatter(markdown).data.get(key) ?? '';
}

export function parseYamlScalar(value) {
  const s = String(value ?? '').trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

export function parseAliases(markdown) {
  const fm = parseFrontmatter(markdown);
  if (!fm.raw) return [];
  const match = fm.raw.match(/^aliases:\s*\r?\n((?:\s+-\s+.*(?:\r?\n|$))*)/m);
  if (!match) return [];
  return match[1].split(/\r?\n/).map(line => line.match(/^\s*-\s+(.*)$/)?.[1]).filter(Boolean).map(parseYamlScalar);
}

export function studentIdFromMarkdown(filename, markdown) {
  const id = parseYamlScalar(frontmatterValue(markdown, 'ID'));
  if (id) return id;
  return filename.replace(/\.md$/i, '');
}

export function studentNameFromMarkdown(filename, markdown) {
  const aliases = parseAliases(markdown);
  if (aliases.length) return aliases[0];
  const heading = markdown.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  return filename.replace(/\.md$/i, '');
}

export function parseTags(markdown) {
  const raw = frontmatterValue(markdown, 'tags');
  if (!raw) return [];
  if (raw.startsWith('[') && raw.endsWith(']')) {
    return raw.slice(1, -1).split(',').map(v => v.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  }
  return raw.split(/\s*,\s*/).map(v => v.trim()).filter(Boolean);
}

export function hasTag(markdown, tag) {
  return parseTags(markdown).includes(tag);
}

export function addTagPreservingCurrentFormat(markdown, tag) {
  const fm = parseFrontmatter(markdown);
  if (!fm.raw) throw new Error('Student file has no frontmatter.');
  if (hasTag(markdown, tag)) return markdown;

  const raw = fm.raw;
  const tagLine = raw.match(/^tags:\s*(.*)$/m);
  if (!tagLine) throw new Error('Student file has no tags property.');
  const current = tagLine[1].trim();

  let replacement;
  if (!current) {
    replacement = `tags: ${tag}`;
  } else if (current.startsWith('[') && current.endsWith(']')) {
    const inner = current.slice(1, -1).trim();
    replacement = `tags: [${inner}${inner ? ', ' : ''}${tag}]`;
  } else {
    // v1 preserves the existing scalar `tags:` syntax by extending the value
    // as comma-separated entries. This does not invent a new frontmatter key
    // or convert the property into YAML list syntax.
    replacement = `tags: ${current}, ${tag}`;
  }

  const nextFrontmatter = fm.raw.replace(/^tags:\s*.*$/m, replacement);
  return nextFrontmatter === fm.raw ? markdown : nextFrontmatter + markdown.slice(fm.end);
}

export function courseBlock(course, tutor) {
  return `## [[${course}]]\nTutor:: [[${tutor}]]\n\n> [!warning] Warning\n> \n\n> [!notes] Notes\n> \n\n`;
}

export function hasCourseHeading(markdown, course) {
  const re = new RegExp(`^## \\[\\[${escapeRegExp(course)}\\]\\]\\s*$`, 'm');
  return re.test(markdown);
}

export function insertCourseBeforeGeneralFeedback(markdown, block) {
  const heading = /^## General Feedback\s*$/m;
  const match = heading.exec(markdown);
  if (!match) throw new Error('Could not find `## General Feedback` in the student file.');
  return `${markdown.slice(0, match.index).replace(/\s*$/, '\n\n')}${block}${markdown.slice(match.index)}`;
}

export function findCourseInstances(markdown, course) {
  const headingRe = new RegExp(`^## \\[\\[${escapeRegExp(course)}\\]\\]\\s*$`, 'gm');
  const matches = [...markdown.matchAll(headingRe)];
  return matches.map(m => m.index).filter(i => Number.isInteger(i));
}

export function makeNewStudentMarkdown({ id, name, email, tag, level, tutor, course }) {
  return `---\nID: ${id}\naliases:\n  - ${name}\nemail: ${email}\ntags: ${tag}\nlevel: ${level}\nmentor: false\nproblem: false\nhonours: false\nstudent: true\n---\n\n# ${name}\n${courseBlock(course, tutor)}## General Feedback\n`;
}

export function proposedExistingChange(markdown, { course, tutor, tag }) {
  let next = markdown;
  if (!hasTag(next, tag)) next = addTagPreservingCurrentFormat(next, tag);
  const block = courseBlock(course, tutor);
  next = insertCourseBeforeGeneralFeedback(next, block);
  return next;
}

export function classifyRecord({ existingMarkdown, course, tag, tutor }) {
  if (!existingMarkdown) return { state: 'new', reason: 'No student file was found.' };
  if (hasTag(existingMarkdown, tag)) return { state: 'recorded', reason: 'This course instance tag already exists.' };
  if (!tutor) return { state: 'review', reason: 'No tutor has been assigned to this Moodle group.' };
  if (!/^## General Feedback\s*$/m.test(existingMarkdown)) return { state: 'review', reason: 'Existing note has no `## General Feedback` anchor.' };
  return { state: 'change', reason: hasCourseHeading(existingMarkdown, course) ? 'Course heading already exists; this appears to be a new course instance.' : 'New course instance will be inserted.' };
}
