import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const out = fileURLToPath(new URL('../assets/', import.meta.url));
mkdirSync(out, { recursive: true });
const themes = {
  dark: { bg: '#090c16', panel: '#101727', text: '#f5f7ff', muted: '#a8b5ce', line: '#26334a', cyan: '#55e6df', purple: '#b59aff', orange: '#ffba76' },
  light: { bg: '#f5f4ff', panel: '#ffffff', text: '#191b38', muted: '#535e7b', line: '#d7d9ed', cyan: '#007f83', purple: '#7046d5', orange: '#a84b08' },
};
const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
function svg(w, h, title, c, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title">
<title id="title">${esc(title)}</title>
<defs>
  <linearGradient id="accent"><stop stop-color="${c.cyan}"/><stop offset=".5" stop-color="${c.purple}"/><stop offset="1" stop-color="${c.orange}"/></linearGradient>
  <radialGradient id="aura"><stop stop-color="${c.purple}" stop-opacity=".2"/><stop offset="1" stop-color="${c.bg}" stop-opacity="0"/></radialGradient>
  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="${c.line}" stroke-width=".7"/></pattern>
</defs>
<style>
text{font-family:Segoe UI,Arial,sans-serif} .mono{font-family:Consolas,monospace;letter-spacing:1.5px}
.orbit{transform-origin:920px 206px;animation:orbit 28s linear infinite}
.counter{transform-origin:920px 206px;animation:orbit 40s linear reverse infinite}
.stream{stroke-dasharray:7 15;animation:stream 8s linear infinite}
.breathe{animation:breathe 4s ease-in-out infinite}.cursor{animation:blink 1.2s steps(2,end) infinite}
.rise{animation:rise 6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes orbit{to{transform:rotate(360deg)}}@keyframes stream{to{stroke-dashoffset:-220}}
@keyframes breathe{50%{opacity:.3}}@keyframes blink{50%{opacity:0}}@keyframes rise{50%{transform:translateY(-6px)}}
@media(prefers-reduced-motion:reduce){.orbit,.counter,.stream,.breathe,.cursor,.rise{animation:none}}
</style>
${body}
</svg>\n`;
}
for (const [theme, c] of Object.entries(themes)) {
  const hero = `
<rect x="1" y="1" width="1198" height="458" rx="22" fill="${c.bg}" stroke="${c.line}"/>
<rect x="730" y="20" width="449" height="365" fill="url(#grid)" opacity=".55"/>
<ellipse cx="915" cy="208" rx="267" ry="219" fill="url(#aura)"/>
<path d="M24 1H1176" stroke="url(#accent)" stroke-width="3"/>
<g class="mono" font-size="12" fill="${c.muted}"><text x="40" y="42">~/eddym06</text><text x="984" y="42">EDITION / 2026</text></g>
<path d="M40 67H1160" stroke="${c.line}"/>
<rect x="40" y="99" width="218" height="28" rx="14" fill="${c.panel}" stroke="${c.line}"/>
<circle class="breathe" cx="57" cy="113" r="4" fill="${c.cyan}"/>
<text x="70" y="117" class="mono" font-size="11" fill="${c.cyan}">IDEAS INTO SYSTEMS</text>
<text x="36" y="201" font-size="71" font-weight="800" letter-spacing="-3" fill="${c.text}">Eddy Manuel<tspan fill="${c.cyan}">.</tspan></text>
<text x="40" y="248" font-size="32" font-weight="500" letter-spacing="-.5" fill="${c.muted}">Piantini Martínez</text>
<text x="41" y="294" font-size="20" fill="${c.text}">Software developer. Curious by design.</text>
<g class="mono" font-size="12">
 <text x="42" y="339" fill="${c.cyan}">01 / AI</text><text x="171" y="339" fill="${c.purple}">02 / AUTOMATION</text><text x="388" y="339" fill="${c.orange}">03 / SYSTEMS</text>
</g>
<g fill="none" stroke="${c.line}"><circle cx="920" cy="206" r="139"/><circle cx="920" cy="206" r="110"/><path d="M760 206H1080M920 46V366" stroke-dasharray="2 8"/></g>
<g class="orbit" fill="none"><ellipse cx="920" cy="206" rx="145" ry="66" stroke="${c.cyan}" stroke-width="1.5"/><circle cx="1065" cy="206" r="6" fill="${c.cyan}" stroke="${c.bg}" stroke-width="3"/></g>
<g class="counter" fill="none"><ellipse cx="920" cy="206" rx="74" ry="149" stroke="${c.purple}" stroke-width="1.5"/><circle cx="920" cy="57" r="6" fill="${c.purple}" stroke="${c.bg}" stroke-width="3"/></g>
<circle class="stream" cx="920" cy="206" r="164" fill="none" stroke="${c.orange}" stroke-width="1" opacity=".6"/>
<rect x="864" y="150" width="112" height="112" rx="30" fill="${c.panel}" stroke="${c.line}"/>
<text x="920" y="218" text-anchor="middle" font-size="37" font-weight="700" fill="${c.text}">&lt;/&gt;</text>
<g class="mono" font-size="10" fill="${c.muted}"><text x="1033" y="110">EXPLORE</text><text x="766" y="319">BUILD</text></g>
<rect x="20" y="382" width="1160" height="58" rx="12" fill="${c.panel}" stroke="${c.line}"/>
<text x="40" y="417" font-family="Consolas,monospace" font-size="14" fill="${c.muted}"><tspan fill="${c.cyan}">❯</tspan> const mindset = [<tspan fill="${c.cyan}">'build'</tspan>, <tspan fill="${c.purple}">'experiment'</tspan>, <tspan fill="${c.orange}">'improve'</tspan>];</text>
<rect class="cursor" x="606" y="403" width="8" height="17" fill="${c.cyan}"/>
<text x="1128" y="417" text-anchor="end" class="mono" font-size="10" fill="${c.muted}">SANTO DOMINGO · DO</text>`;
  writeFileSync(`${out}hero-${theme}.svg`, svg(1200, 460, 'Eddy Manuel Piantini Martínez — AI, automation and systems. Animated digital laboratory. 2026.', c, hero));

  const cards = [
    { slug: 'project-mcp', n: '01', category: 'DEVELOPER TOOLS', title: 'AI meets the browser.', sub: 'Chrome DevTools Advanced MCP', color: c.cyan, art: `<rect x="440" y="38" width="128" height="88" rx="10" fill="${c.panel}" stroke="${c.cyan}"/><path d="M440 58H568" stroke="${c.line}"/><circle cx="451" cy="48" r="2" fill="${c.cyan}"/><circle cx="460" cy="48" r="2" fill="${c.purple}"/><circle cx="469" cy="48" r="2" fill="${c.orange}"/><text x="504" y="97" text-anchor="middle" font-size="30" fill="${c.cyan}">&lt;/&gt;</text><path class="stream" d="M406 92H440M568 92H602" stroke="${c.cyan}" stroke-width="2"/><circle cx="406" cy="92" r="5" fill="${c.cyan}"/><circle cx="602" cy="92" r="5" fill="${c.cyan}"/>` },
    { slug: 'project-n8n', n: '02', category: 'INTELLIGENT AUTOMATION', title: 'Less friction. More flow.', sub: 'n8n AI Assistant', color: c.purple, art: `<path class="stream" d="M426 92H483L524 52H577M483 92L524 133H577" fill="none" stroke="${c.purple}" stroke-width="2"/>${[[426,92],[483,92],[524,52],[577,52],[524,133],[577,133]].map(([x,y],i)=>`<rect class="${i>1?'breathe':''}" x="${x-10}" y="${y-10}" width="20" height="20" rx="6" fill="${c.panel}" stroke="${c.purple}" stroke-width="2"/>`).join('')}` },
    { slug: 'project-ortho', n: '03', category: 'EXPERIMENTAL RESEARCH', title: 'Rethinking context.', sub: 'OrthoSSM · Sequence modeling', color: c.orange, art: `<g fill="none" stroke="${c.orange}" stroke-width="1.5"><path class="rise" d="M412 100Q430 20 448 100T484 100T520 100T556 100T592 100"/><path d="M412 120Q430 40 448 120T484 120T520 120T556 120T592 120" opacity=".35"/><path d="M412 140H592" stroke="${c.line}"/></g><text x="502" y="52" text-anchor="middle" class="mono" font-size="12" fill="${c.muted}">STATE → MEMORY</text>` },
  ];
  for (const a of cards) writeFileSync(`${out}${a.slug}-${theme}.svg`, svg(640, 200, `${a.sub}: ${a.title}`, c, `<rect x="1" y="1" width="638" height="198" rx="16" fill="${c.panel}" stroke="${c.line}"/><rect x="1" y="27" width="3" height="58" rx="1" fill="${a.color}"/><text x="25" y="34" class="mono" font-size="10" fill="${a.color}">${a.n} / ${a.category}</text><text x="25" y="88" font-size="27" font-weight="700" letter-spacing="-.7" fill="${c.text}">${a.title}</text><text x="25" y="117" font-size="14" fill="${c.muted}">${a.sub}</text><path d="M25 151H615" stroke="${c.line}"/><text x="25" y="177" class="mono" font-size="10" fill="${a.color}">EXPLORE THE REPOSITORY</text><text x="613" y="179" text-anchor="end" font-size="21" fill="${a.color}">↗</text>${a.art}`));

  const fcc = `<rect x="1" y="1" width="1198" height="188" rx="16" fill="${c.panel}" stroke="${c.line}"/><text x="28" y="36" class="mono" font-size="12" fill="${c.cyan}">freeCodeCamp / PYTHON CERTIFICATION</text><text x="1172" y="36" text-anchor="end" class="mono" font-size="11" fill="${c.muted}">5 PROJECTS · ONE MILESTONE</text><path class="stream" d="M72 81H1102" stroke="url(#accent)" fill="none" stroke-width="2"/>${[['Config manager','PARSING'],['Budget app','OOP + FORMATTING'],['Polygon calculator','CLASSES + GEOMETRY'],['Hash table','DATA STRUCTURES'],['Tower of Hanoi','RECURSION']].map(([name,tag],i)=>{const x=28+i*233;return `<rect x="${x}" y="65" width="213" height="99" rx="12" fill="${c.bg}" stroke="${c.line}"/><text x="${x+15}" y="88" class="mono" font-size="10" fill="${c.cyan}">0${i+1} / COMPLETED</text><text x="${x+15}" y="118" font-size="17" font-weight="600" fill="${c.text}">${name}</text><text x="${x+15}" y="145" class="mono" font-size="9" fill="${c.muted}">${tag}</text>`}).join('')}`;
  writeFileSync(`${out}fcc-${theme}.svg`, svg(1200, 190, 'Five completed freeCodeCamp Python certification projects: Configuration Manager, Budget App, Polygon Area Calculator, Hash Table and Tower of Hanoi.', c, fcc));
}
console.log('Generated 10 themed, animated SVG assets.');
