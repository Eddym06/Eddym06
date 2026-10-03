/** Refresh the public GitHub telemetry SVGs from GitHub's own pages and API. */
import { readFile, writeFile } from 'node:fs/promises';

const owner = 'Eddym06';
const token = process.env.GITHUB_TOKEN;
const headers = {
  accept: 'application/vnd.github+json',
  'user-agent': 'Eddym06-profile-telemetry',
  ...(token ? { authorization: `Bearer ${token}` } : {}),
};
const request = async (url, extraHeaders = {}) => {
  const response = await fetch(url, { headers: { ...headers, ...extraHeaders } });
  if (!response.ok) throw new Error(`GitHub returned ${response.status} for ${url}`);
  return response;
};

const [accountResponse, reposResponse, activityResponse] = await Promise.all([
  request(`https://api.github.com/users/${owner}`),
  request(`https://api.github.com/users/${owner}/repos?type=owner&per_page=100&sort=updated`),
  request(`https://github.com/users/${owner}/contributions`, { accept: 'text/html' }),
]);
const account = await accountResponse.json();
const repos = await reposResponse.json();
if (!Array.isArray(repos) || repos.length !== account.public_repos) {
  throw new Error(`Incomplete public repo response: API reports ${account.public_repos}, received ${repos?.length}`);
}

const html = await activityResponse.text();
const contributionMatch = html.match(/([\d,]+)\s+contributions?\s+in the last year/i);
if (!contributionMatch) throw new Error('GitHub contribution total was not present in the profile response.');
const contributions = Number(contributionMatch[1].replaceAll(',', ''));

const days = new Map();
const cells = html.match(/<td\b[^>]*\bdata-date="[^"]+"[^>]*>/g) ?? [];
for (const cell of cells) {
  const date = cell.match(/\bdata-date="([^"]+)"/)?.[1];
  const id = cell.match(/\bid="contribution-day-component-(\d+)-(\d+)"/)?.slice(1).map(Number);
  const level = Number(cell.match(/\bdata-level="([0-4])"/)?.[1]);
  if (!date || !id) continue;
  const [weekday, week] = id;
  const tooltip = html.match(new RegExp(`<tool-tip\\b(?=[^>]*\\bfor="contribution-day-component-${weekday}-${week}")[^>]*>([^<]+)<\\/tool-tip>`))?.[1] ?? '';
  const count = tooltip.match(/^([\d,]+) contribution/)?.[1];
  days.set(date, { date, weekday, week, count: count ? Number(count.replaceAll(',', '')) : 0, level });
}
const calendarTotal = [...days.values()].reduce((sum, day) => sum + day.count, 0);
if (days.size < 350 || calendarTotal !== contributions) {
  throw new Error(`Contribution calendar did not reconcile: ${days.size} days, tooltip sum ${calendarTotal}, heading ${contributions}.`);
}

const owned = repos.filter(repo => !repo.fork);
const stars = owned.reduce((sum, repo) => sum + repo.stargazers_count, 0);
const languageCounts = new Map();
for (const repo of owned) {
  const language = repo.language ?? 'Unspecified';
  languageCounts.set(language, (languageCounts.get(language) ?? 0) + 1);
}
const languages = [...languageCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
const updated = new Date().toISOString().slice(0, 10);

const themes = {
  dark: { bg: '#101727', panel: '#151f31', text: '#f5f7ff', muted: '#a8b5ce', line: '#26334a', cyan: '#55e6df', purple: '#b59aff', orange: '#ffba76', levels: ['#222b3b', '#174e52', '#168580', '#55c9bc', '#a3eee0'] },
  light: { bg: '#ffffff', panel: '#f5f4ff', text: '#191b38', muted: '#535e7b', line: '#d7d9ed', cyan: '#007f83', purple: '#7046d5', orange: '#a84b08', levels: ['#e8e9f1', '#c6eeee', '#8dd8d6', '#36a9a8', '#126e73'] },
};
const esc = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const save = async (name, content) => writeFile(`assets/github-${name}.svg`, content + '\n');

const languageStyles = {
  Python: { file: 'python', color: '#3776AB' },
  JavaScript: { file: 'javascript', color: '#F7DF1E' },
  TypeScript: { file: 'typescript', color: '#3178C6' },
  C: { file: 'c', color: '#659AD2' },
  HTML: { file: 'html5', color: '#E34F26' },
  Swift: { file: 'swift', color: '#F05138' },
};
for (const style of Object.values(languageStyles)) {
  const source = await readFile(new URL(`../assets/language-icons/${style.file}.svg`, import.meta.url), 'utf8');
  style.viewBox = source.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 128 128';
  style.art = source.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

for (const [theme, c] of Object.entries(themes)) {
  const cellsSvg = [...days.values()].sort((a, b) => a.week - b.week || a.weekday - b.weekday)
    .map(day => `<rect x="${48 + day.week * 14}" y="${106 + day.weekday * 14}" width="10" height="10" rx="3" fill="${c.levels[day.level]}" stroke="${c.bg}" stroke-width="1"><title>${esc(day.date)} · ${day.count} contributions</title></rect>`)
    .join('');
  const monthLabels = [...days.values()].filter(day => day.date.endsWith('-01')).map(day => `<text x="${48 + day.week * 14}" y="92">${new Date(day.date + 'T12:00:00Z').toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })}</text>`).join('');
  const legend = `<g font-family="Segoe UI,Arial,sans-serif" font-size="12" fill="${c.muted}"><text x="642" y="242" text-anchor="end">Less</text>${c.levels.map((fill, i) => `<rect x="${656 + i * 17}" y="230" width="12" height="12" rx="3" fill="${fill}"/>`).join('')}<text x="754" y="242">More</text></g>`;
  const activity = `<svg xmlns="http://www.w3.org/2000/svg" width="860" height="268" viewBox="0 0 860 268" role="img" aria-labelledby="title desc"><title id="title">GitHub contribution activity for ${owner}</title><desc id="desc">${contributions} contributions in the last year. Source: GitHub, refreshed ${updated} UTC.</desc><rect x="1" y="1" width="858" height="266" rx="16" fill="${c.bg}" stroke="${c.line}"/><text x="30" y="36" font-family="Segoe UI,Arial,sans-serif" font-size="18" font-weight="700" fill="${c.text}">Contribution activity</text><text x="830" y="36" text-anchor="end" font-family="Segoe UI,Arial,sans-serif" font-size="11" fill="${c.muted}">Updated ${updated} UTC</text><text x="30" y="60" font-family="Segoe UI,Arial,sans-serif" font-size="13" fill="${c.muted}">${contributions.toLocaleString('en-US')} contributions in the last year · from your public GitHub profile</text><g font-family="Segoe UI,Arial,sans-serif" font-size="10" fill="${c.muted}">${monthLabels}</g>${cellsSvg}<path d="M30 218H830" stroke="${c.line}"/><text x="30" y="242" font-family="Segoe UI,Arial,sans-serif" font-size="11" fill="${c.muted}">Each square represents one day</text>${legend}</svg>`;
  await save(`activity-${theme}`, activity);

  const metrics = [
    { label: 'Public repositories', value: account.public_repos, color: c.cyan },
    { label: 'Non-fork repositories', value: owned.length, color: c.purple },
    { label: 'Stars earned', value: stars, color: c.orange },
    { label: 'Member since', value: new Date(account.created_at).getUTCFullYear(), color: c.cyan },
  ];
  const metricSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="860" height="190" viewBox="0 0 860 190" role="img" aria-labelledby="title desc"><title id="title">${owner} GitHub account statistics</title><desc id="desc">${account.public_repos} public repositories, ${owned.length} non-fork repositories, ${stars} stars and GitHub account created ${new Date(account.created_at).getUTCFullYear()}. Refreshed ${updated} UTC from the GitHub API.</desc><rect x="1" y="1" width="858" height="188" rx="16" fill="${c.bg}" stroke="${c.line}"/><text x="30" y="36" font-family="Segoe UI,Arial,sans-serif" font-size="18" font-weight="700" fill="${c.text}">Account overview</text><text x="830" y="36" text-anchor="end" font-family="Segoe UI,Arial,sans-serif" font-size="11" fill="${c.muted}">Updated ${updated} UTC</text><text x="30" y="60" font-family="Segoe UI,Arial,sans-serif" font-size="13" fill="${c.muted}">Public repositories, earned stars and account history</text>${metrics.map((m, i) => { const x = 22 + i * 210; return `<rect x="${x}" y="82" width="198" height="84" rx="12" fill="${c.panel}" stroke="${c.line}"/><rect x="${x}" y="82" width="3" height="84" rx="1.5" fill="${m.color}"/><text x="${x + 17}" y="119" font-family="Segoe UI,Arial,sans-serif" font-size="29" font-weight="700" fill="${m.color}">${esc(m.value)}</text><text x="${x + 17}" y="146" font-family="Segoe UI,Arial,sans-serif" font-size="12" fill="${c.muted}">${esc(m.label)}</text>`; }).join('')}</svg>`;
  await save(`stats-${theme}`, metricSvg);

  const bars = languages.map(([language, count], i) => {
    const x = 32 + (i % 2) * 410;
    const y = 88 + Math.floor(i / 2) * 76;
    const style = languageStyles[language];
    const accent = style?.color ?? c.muted;
    const icon = style
      ? `<svg x="${x}" y="${y}" width="24" height="24" viewBox="${style.viewBox}">${style.art}</svg>`
      : `<g transform="translate(${x},${y})" fill="none" stroke="${c.muted}" stroke-width="1.6"><path d="M6 2h8l5 5v15H6Z"/><path d="M14 2v6h5M9 12h7M9 16h7"/></g>`;
    return `${icon}<text x="${x + 36}" y="${y + 17}" font-family="Segoe UI,Arial,sans-serif" font-size="16" font-weight="600" fill="${c.text}">${esc(language)}</text><text x="${x + 364}" y="${y + 17}" text-anchor="end" font-family="Segoe UI,Arial,sans-serif" font-size="13" fill="${c.muted}">${count} repositor${count === 1 ? 'y' : 'ies'}</text><rect x="${x + 36}" y="${y + 37}" width="328" height="7" rx="3.5" fill="${c.line}"/><rect x="${x + 36}" y="${y + 37}" width="${Math.max(8, Math.round(328 * count / Math.max(...languages.map(([, n]) => n))))}" height="7" rx="3.5" fill="${accent}"/>`;
  }).join('');
  const languageHeight = 110 + Math.ceil(languages.length / 2) * 76;
  const languageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="860" height="${languageHeight}" viewBox="0 0 860 ${languageHeight}" role="img" aria-labelledby="title desc"><title id="title">Primary languages across original public repositories</title><desc id="desc">Counts GitHub's primary language field for ${owned.length} non-fork public repositories; refreshed ${updated} UTC.</desc><rect x="1" y="1" width="858" height="${languageHeight - 2}" rx="16" fill="${c.bg}" stroke="${c.line}"/><text x="32" y="35" font-family="Segoe UI,Arial,sans-serif" font-size="18" font-weight="700" fill="${c.text}">Repository language mix</text><text x="828" y="35" text-anchor="end" font-family="Segoe UI,Arial,sans-serif" font-size="11" fill="${c.muted}">Updated ${updated} UTC</text><text x="32" y="59" font-family="Segoe UI,Arial,sans-serif" font-size="13" fill="${c.muted}">Primary language of each public repository · ${owned.length} projects, excluding forks</text>${bars}</svg>`;
  await save(`languages-${theme}`, languageSvg);
}

console.log(JSON.stringify({ updated, publicRepos: account.public_repos, originalRepos: owned.length, stars, contributionsLastYear: contributions, days: days.size, languages }, null, 2));
