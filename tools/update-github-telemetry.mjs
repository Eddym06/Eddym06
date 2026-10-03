/** Refresh the public GitHub telemetry SVGs from GitHub's own pages and API. */
import { mkdir, writeFile } from 'node:fs/promises';

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

for (const [theme, c] of Object.entries(themes)) {
  const cellsSvg = [...days.values()].sort((a, b) => a.week - b.week || a.weekday - b.weekday)
    .map(day => `<rect x="${48 + day.week * 14}" y="${78 + day.weekday * 14}" width="10" height="10" rx="3" fill="${c.levels[day.level]}" stroke="${c.bg}" stroke-width="1"><title>${esc(day.date)} · ${day.count} contributions</title></rect>`)
    .join('');
  const activity = `<svg xmlns="http://www.w3.org/2000/svg" width="860" height="216" viewBox="0 0 860 216" role="img" aria-labelledby="title desc"><title id="title">GitHub contribution activity for ${owner}</title><desc id="desc">${contributions} contributions in the last year. Source: GitHub, refreshed ${updated} UTC.</desc><rect x="1" y="1" width="858" height="214" rx="16" fill="${c.bg}" stroke="${c.line}"/><text x="30" y="38" font-family="Segoe UI,Arial,sans-serif" font-size="17" font-weight="700" fill="${c.text}">Contribution activity</text><text x="830" y="38" text-anchor="end" font-family="Consolas,monospace" font-size="11" fill="${c.muted}">SOURCE: GITHUB · ${updated} UTC</text><text x="30" y="67" font-family="Segoe UI,Arial,sans-serif" font-size="13" fill="${c.cyan}">${contributions.toLocaleString('en-US')} contributions in the last year</text>${cellsSvg}<g font-family="Segoe UI,Arial,sans-serif" font-size="10" fill="${c.muted}"><text x="792" y="180">Less</text>${c.levels.map((fill, i) => `<rect x="820" y="170" width="9" height="9" rx="2" fill="${fill}"/><rect x="${820 - (4 - i) * 13}" y="170" width="9" height="9" rx="2" fill="${fill}"/>`).join('')}<text x="830" y="198" text-anchor="end">More</text></g></svg>`;
  await save(`activity-${theme}`, activity);

  const metrics = [
    { label: 'PUBLIC REPOSITORIES', value: account.public_repos, color: c.cyan },
    { label: 'ORIGINAL REPOSITORIES', value: owned.length, color: c.purple },
    { label: 'STARS EARNED', value: stars, color: c.orange },
    { label: 'GITHUB MEMBER SINCE', value: new Date(account.created_at).getUTCFullYear(), color: c.cyan },
  ];
  const metricSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="860" height="150" viewBox="0 0 860 150" role="img" aria-labelledby="title desc"><title id="title">${owner} GitHub account statistics</title><desc id="desc">${account.public_repos} public repositories, ${owned.length} non-fork repositories, ${stars} stars and GitHub account created ${new Date(account.created_at).getUTCFullYear()}. Refreshed ${updated} UTC from the GitHub API.</desc><rect x="1" y="1" width="858" height="148" rx="16" fill="${c.bg}" stroke="${c.line}"/><text x="24" y="28" font-family="Consolas,monospace" font-size="10" letter-spacing="1.5" fill="${c.muted}">ACCOUNT SNAPSHOT / VERIFIED VIA GITHUB API / ${updated} UTC</text>${metrics.map((m, i) => { const x = 22 + i * 210; return `<rect x="${x}" y="44" width="198" height="84" rx="12" fill="${c.panel}" stroke="${c.line}"/><rect x="${x}" y="44" width="3" height="84" rx="1.5" fill="${m.color}"/><text x="${x + 17}" y="78" font-family="Segoe UI,Arial,sans-serif" font-size="25" font-weight="700" fill="${m.color}">${esc(m.value)}</text><text x="${x + 17}" y="104" font-family="Consolas,monospace" font-size="9" letter-spacing=".4" fill="${c.muted}">${esc(m.label)}</text>`; }).join('')}</svg>`;
  await save(`stats-${theme}`, metricSvg);

  const bars = languages.map(([language, count], i) => {
    const x = 24 + (i % 4) * 210;
    const y = 57 + Math.floor(i / 4) * 49;
    const accent = [c.cyan, c.purple, c.orange, c.cyan][i % 4];
    return `<circle cx="${x + 4}" cy="${y + 4}" r="4" fill="${accent}"/><text x="${x + 16}" y="${y + 8}" font-family="Segoe UI,Arial,sans-serif" font-size="13" font-weight="600" fill="${c.text}">${esc(language)}</text><rect x="${x}" y="${y + 18}" width="174" height="5" rx="2.5" fill="${c.line}"/><rect x="${x}" y="${y + 18}" width="${Math.max(7, Math.round(174 * count / Math.max(...languages.map(([, n]) => n))))}" height="5" rx="2.5" fill="${accent}"/><text x="${x + 190}" y="${y + 23}" text-anchor="end" font-family="Consolas,monospace" font-size="10" fill="${c.muted}">${count} repo${count === 1 ? '' : 's'}</text>`;
  }).join('');
  const languageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="860" height="166" viewBox="0 0 860 166" role="img" aria-labelledby="title desc"><title id="title">Primary languages across original public repositories</title><desc id="desc">Counts GitHub's primary language field for ${owned.length} non-fork public repositories; refreshed ${updated} UTC.</desc><rect x="1" y="1" width="858" height="164" rx="16" fill="${c.bg}" stroke="${c.line}"/><text x="24" y="29" font-family="Segoe UI,Arial,sans-serif" font-size="15" font-weight="700" fill="${c.text}">Repository language mix</text><text x="830" y="29" text-anchor="end" font-family="Consolas,monospace" font-size="10" fill="${c.muted}">PRIMARY LANGUAGE · ${owned.length} ORIGINAL REPOS · ${updated} UTC</text>${bars}</svg>`;
  await save(`languages-${theme}`, languageSvg);
}

console.log(JSON.stringify({ updated, publicRepos: account.public_repos, originalRepos: owned.length, stars, contributionsLastYear: contributions, days: days.size, languages }, null, 2));
