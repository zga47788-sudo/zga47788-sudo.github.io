'use strict';

const data = window.PORTFOLIO;
const pad = n => String(n).padStart(2, '0');
const staticReview = document.documentElement.hasAttribute('data-static-review');
const redReview = document.documentElement.hasAttribute('data-red-review');
const redMotion = document.documentElement.hasAttribute('data-red-motion');
const reducedMotion = matchMedia(staticReview ? 'all' : '(prefers-reduced-motion: reduce)');
let redMotionEffects;

if (redReview) {
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('#S01');
  const links = [...header.querySelectorAll('nav a')];
  const sections = links.map(link => document.querySelector(link.hash));
  let currentLink;
  let pending = false;

  function updateNavigation() {
    pending = false;
    const headerHeight = header.offsetHeight;
    const compact = redMotion
      ? window.scrollY >= Math.min(128, hero.offsetHeight * .16)
      : hero.getBoundingClientRect().bottom <= headerHeight;
    header.classList.toggle('is-compact', compact);
    const activeIndex = sections.findLastIndex(section => section.getBoundingClientRect().top <= headerHeight + innerHeight * .32);
    const nextLink = compact ? links[Math.max(0, activeIndex)] : undefined;
    if (nextLink === currentLink) return;
    currentLink?.removeAttribute('aria-current');
    nextLink?.setAttribute('aria-current', 'location');
    currentLink = nextLink;
  }

  function scheduleNavigation() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(updateNavigation);
  }

  addEventListener('scroll', scheduleNavigation, { passive: true });
  addEventListener('resize', scheduleNavigation);
  updateNavigation();

  for (const [id, title, translation] of [
    ['S02', '精选作品', 'Selected Works'],
    ['S03', '职业经历', 'Professional Experience'],
    ['S03A', '我能做什么', 'What I Do'],
    ['S04', '从参考到成片', 'From Reference to Delivery'],
    ['S05', '平面项目', 'Design Projects']
  ]) {
    const heading = document.querySelector(`#${id} .chapter-heading`);
    const chinese = heading.querySelector('.chapter-chinese');
    const english = heading.querySelector('.chapter-english');
    chinese.textContent = title;
    english.textContent = translation;
    english.lang = 'en';
    chinese.after(english);
    heading.querySelector('.chapter-description')?.remove();
  }

  const toolkitTitle = document.querySelector('#toolkit-title');
  toolkitTitle.lang = 'en';
  toolkitTitle.innerHTML = '<span>TOOLS</span> I USE';
}

const careersByYear = new Map();
for (const item of data.careers) {
  if (!careersByYear.has(item.year)) careersByYear.set(item.year, []);
  careersByYear.get(item.year).push(item);
}
document.querySelector('#timeline').innerHTML = [...careersByYear.keys()].sort().map(year => `
  <li class="timeline-group">
    <h3 class="timeline-year">${year}</h3>
    <ol class="timeline-entries">
      ${careersByYear.get(year).map(item => `
        <li class="timeline-entry${item.current ? ' is-current' : ''}">
          <p class="timeline-date">${item.date}</p>
          <div class="timeline-card">
            <h4>${item.company}</h4>
            <p class="timeline-role">${item.role}</p>
            <p class="timeline-description">${item.description}</p>
          </div>
        </li>
      `).join('')}
    </ol>
  </li>
`).join('');

const abilityArtwork = {
  'A-ABILITY-01': `
    <div class="workflow-preview">
      <div class="workflow-toolbar"><span>制作工作流</span><span lang="en">WORKFLOW / 01</span></div>
      <div class="workflow-canvas">
        <div class="workflow-node"><span lang="en">INPUT</span><strong>参考素材</strong><i></i><i></i><b class="workflow-signal"></b></div>
        <div class="workflow-node workflow-node-active"><span lang="en">BUILD</span><strong>生成编排</strong><i></i><i></i><b class="workflow-signal"></b></div>
        <div class="workflow-node"><span lang="en">OUTPUT</span><strong>剪辑交付</strong><i></i><i></i></div>
      </div>
    </div>`,
  'A-ABILITY-02': staticReview
    ? `<img src="assets/portfolio/ability-prototype.svg" alt="" width="216" height="144" loading="lazy" decoding="async">`
    : `
    <div class="prototype-preview">
      <div class="prototype-window">
        <span>审阅面板</span>
        <div><span>输入</span><i></i></div>
        <div><span>结果</span><i></i></div>
        <small>✓ 检查</small>
      </div>
    </div>`,
  'A-ABILITY-03': `<img src="assets/portfolio/ability-commerce.webp" alt="" width="526" height="405" loading="lazy" decoding="async">`,
  'A-ABILITY-04': `<img src="assets/portfolio/ability-design.webp" alt="" width="760" height="427" loading="lazy" decoding="async">`
};

const workflowSteps = [
  {
    phase: 'INPUT', title: '参考素材', icon: `
      <rect class="glass-icon-back" x="37" y="22" width="79" height="54" rx="10" transform="rotate(5 76 49)"/>
      <rect class="glass-icon-face" x="17" y="14" width="83" height="57" rx="10" transform="rotate(-7 59 42)"/>
      <path class="glass-icon-mark" d="m29 57 13-19a3 3 0 0 1 5-1l9 9 5-7a3 3 0 0 1 5-1l16 13a2 2 0 0 1-1 4l-50 6a2 2 0 0 1-2-4Z"/>
      <circle class="glass-icon-mark" cx="77" cy="29" r="4.5"/>`
  },
  {
    phase: 'BUILD', title: '生成编排', icon: `
      <g transform="rotate(-5 68 48)">
        <rect class="glass-icon-back" x="52" y="31" width="65" height="45" rx="9"/>
        <rect class="glass-icon-back" x="33" y="24" width="72" height="46" rx="9"/>
        <rect class="glass-icon-face" x="12" y="15" width="78" height="48" rx="9"/>
        <path class="glass-icon-mark" d="M45 29a2 2 0 0 1 3-2l15 11a2 2 0 0 1 0 4L48 53a2 2 0 0 1-3-2Z"/>
      </g>`
  },
  {
    phase: 'OUTPUT', title: '剪辑交付', icon: `
      <path class="glass-icon-face" d="M23 37h82v33a9 9 0 0 1-9 9H32a9 9 0 0 1-9-9Z"/>
      <g transform="rotate(-12 23 37)">
        <rect class="glass-icon-mark" x="23" y="22" width="82" height="15" rx="4"/>
        <path class="glass-icon-stripes" d="M35 22h10l10 15H45zm24 0h10l10 15H69zm24 0h10l10 15H93z"/>
      </g>
      <path class="glass-icon-mark" d="M57 47a2 2 0 0 1 3-2l14 9a2 2 0 0 1 0 4l-14 9a2 2 0 0 1-3-2Z"/>`
  }
];

const prototypeScene = `
  <div class="ability-object prototype-panel prototype-panel-main" data-ability-layer="dashboard">
    <svg viewBox="0 0 240 150" fill="none">
      <path d="M0 31h240" stroke="#ffffff24"/>
      <circle cx="18" cy="16" r="4" fill="var(--brand)"/>
      <path d="M30 16h28m155 0h11" stroke="#fff" stroke-opacity=".28" stroke-width="3" stroke-linecap="round"/>
      <rect x="16" y="50" width="81" height="81" rx="11" fill="#ffffff16" stroke="#ffffff26"/>
      <path d="m28 111 19-20 14 8 23-29m-15 1 15-1-2 14" stroke="#f5f4f1" stroke-opacity=".8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M115 57h78m-78 17h60m-60 17h39m-39 25h27" stroke="#fff" stroke-opacity=".3" stroke-width="5" stroke-linecap="round"/>
    </svg>
  </div>
  <div class="ability-object prototype-panel prototype-panel-check" data-ability-layer="review-panel">
    <svg viewBox="0 0 156 104" fill="none">
      <rect x="9" y="10" width="138" height="37" rx="8" fill="var(--brand)" opacity=".14"/>
      <circle cx="28" cy="28.5" r="11" fill="var(--brand)"/>
      <path d="m23 28 4 4 6-7" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M49 24h73m-73 10h49M49 64h63m-63 19h50" stroke="#fff" stroke-opacity=".53" stroke-width="3" stroke-linecap="round"/>
      <path d="m23 62 4 4 6-7m-10 22 4 4 6-7" stroke="#fff" stroke-opacity=".53" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>`;

function redAbilityArt(item) {
  if (item.id === 'A-ABILITY-01') {
    return `<ol class="workflow-glass" aria-label="制作工作流">${workflowSteps.map(step => `
      <li class="workflow-step" data-ability-layer="${step.phase.toLowerCase()}">
        <div class="workflow-glass-card">
          <span lang="en">${step.phase}</span>
          <strong>${step.title}</strong>
          <svg viewBox="0 0 128 88" fill="none" aria-hidden="true">${step.icon}</svg>
        </div>
      </li>`).join('')}
    </ol>`;
  }
  if (item.id === 'A-ABILITY-02') return prototypeScene;

  return `<div class="ability-object ability-frame" data-ability-layer="work-sample">${abilityArtwork[item.id]}</div>`;
}

document.querySelector('#ability-grid').innerHTML = data.abilities.map(item => `
  <article class="ability-card" data-asset="${item.id}">
    <div class="ability-copy">
      <p class="ability-kicker" lang="en">${item.label}</p>
      <h3>${item.title}</h3>
      <p class="ability-description">${item.description}</p>
    </div>
    ${redReview
      ? `<div class="ability-scene"${item.id === 'A-ABILITY-01' ? '' : ' aria-hidden="true"'}>${redAbilityArt(item)}</div>`
      : `<div class="ability-art" aria-hidden="true">${abilityArtwork[item.id]}</div>`}
  </article>
`).join('');

document.querySelector('.portrait-photo img').src = data.media['A-PORTRAIT'].src;

const posterWall = document.querySelector('#project-wall');
const posterTiles = data.posters.map(item => {
  const poster = document.createElement('figure');
  poster.className = 'wall-tile';

  if (item.src) {
    const image = document.createElement('img');
    image.src = item.src;
    image.alt = item.alt;
    image.width = 540;
    image.height = 960;
    image.loading = 'lazy';
    poster.append(image);
  } else {
    poster.classList.add('is-placeholder');
  }

  return poster;
});

function layoutPosterWall() {
  const columnCount = Number(getComputedStyle(posterWall).getPropertyValue('--wall-columns'));
  if (posterWall.children.length === columnCount) return;
  const columns = Array.from({ length: columnCount }, () => {
    const column = document.createElement('div');
    column.className = 'wall-column';
    return column;
  });
  posterTiles.forEach((poster, index) => columns[index % columnCount].append(poster));
  for (const column of columns) {
    const belt = document.createElement('div');
    belt.className = 'wall-belt';
    const run = document.createElement('div');
    run.className = 'wall-run';
    run.append(...column.children);
    const copies = ['before', 'after', 'tail'].map(position => {
      const copy = run.cloneNode(true);
      copy.classList.add('wall-repeat', `wall-repeat-${position}`);
      copy.setAttribute('aria-hidden', 'true');
      return copy;
    });
    belt.append(run, ...copies);
    column.append(belt);
  }
  posterWall.replaceChildren(...columns);
}
layoutPosterWall();
new ResizeObserver(layoutPosterWall).observe(posterWall.parentElement);

function projectTitle(item) {
  return redReview ? item.title.replace(/ · |，/g, ' ') : item.title;
}

function projectCover(item, ratio = item.ratio, loading = 'lazy') {
  const [width, height] = ratio === '9:16' ? [720, 1280] : [1440, 810];
  return projectImage(`project-${item.id}.webp`, `${projectTitle(item)} · 项目主视觉`, width, height, loading, loading === 'eager' ? 'high' : 'auto');
}

function projectImage(file, alt, width, height, loading, priority) {
  return `<picture>
    <source media="(max-width: 760px)" srcset="assets/portfolio/mobile/${file}">
    <img src="assets/portfolio/${file}" alt="${alt}" width="${width}" height="${height}" loading="${loading}" fetchpriority="${priority}" decoding="async">
  </picture>`;
}

function projectMark(item, loading = 'lazy') {
  return item.logo ? `<img class="project-logo" src="${item.logo}" alt="${item.mark}" loading="${loading}" decoding="async">` : item.mark;
}

document.querySelector('#project-list').innerHTML = data.projects.map(item => `
  <div class="project-case">
    ${redReview ? '' : `
      <div class="project-divider editorial-divider" aria-hidden="true">
        <strong>#${item.id}</strong><span class="divider-title">${item.label}</span><span class="divider-subtitle" lang="en">${item.labelEnglish}</span>
      </div>
    `}
    <article class="project-card" id="project-${item.id}">
      ${item.id === '06' ? `
        <div class="project-cover collection-cover" data-asset="A-PROJECT-06" role="img" aria-label="realme V60 Pro 超级新品金榜主视觉">
          <img src="assets/portfolio/collection-realme-product.webp" alt="" width="760" height="652" loading="lazy" decoding="async">
          <div class="collection-cover-type" aria-hidden="true">
            <span lang="en">realme V60 Pro</span>
            <strong>超级新品<br>金榜</strong>
          </div>
        </div>
      ` : `<div class="project-cover" data-asset="A-PROJECT-${item.id}">${projectCover(item)}</div>`}
      <div class="project-info">
        <div class="project-info-top"><span class="project-mark">${projectMark(item)}</span>${redReview ? '' : `<span>/${item.id}</span>`}</div>
        <div class="project-copy"><h3>${projectTitle(item)}</h3><p class="project-description">${item.description}</p></div>
        <button class="project-open" type="button" data-project="${item.id}" aria-label="查看${projectTitle(item)}的详情">查看项目 <span aria-hidden="true">↗</span></button>
      </div>
    </article>
  </div>
`).join('');

const fanFeatures = new Map();
if (redReview) {
  const original = document.querySelector('#S04 .video-shell');
  const fan = document.querySelector('#red-video-fan').content.firstElementChild.cloneNode(true);
  const deck = fan.querySelector('.red-fan-deck');
  const coverLines = {
    V01: 'M66 135h72m112 0h86m-43 0v-61h43m-43 61v61h43 M138 102h112v66H138z M336 54h70v40h-70z M336 115h70v40h-70z M336 176h70v40h-70z',
    V02: 'M57 76h146v118H57z M277 76h146v118H277z M111 117l35 18-35 18z M331 117l35 18-35 18z M216 135h48m-10-10 10 10-10 10',
    V03: 'M58 76h364v118H58z M179 76v118m122-118v118 M80 155l35-37 44 37 M203 154h73m-73-21h52m-52-21h73 M348 116l36 19-36 19z'
  };
  const tabList = original.querySelector('.video-tabs');
  for (const [id, video] of Object.entries(data.videos)) {
    const tab = tabList.querySelector(`[data-video="${id}"]`);
    const card = document.createElement('button');
    const playable = redMotion && Boolean(video.src);
    card.type = 'button';
    card.className = 'red-fan-card red-fan-feature';
    card.setAttribute('aria-label', `${playable ? '播放' : '选择'}${video.title}`);
    if (playable && video.poster) {
      const image = new Image();
      image.src = video.poster;
      image.alt = '';
      image.loading = 'lazy';
      card.append(image);
    } else {
      card.innerHTML = `<svg viewBox="0 0 480 270" aria-hidden="true"><path d="${coverLines[id]}"/></svg>`;
    }
    const label = document.createElement('span');
    label.className = 'red-fan-card-title';
    label.textContent = video.title;
    card.append(label);
    if (playable) {
      card.classList.add('red-fan-media');
      deck.classList.add('red-fan-has-media');
      const playIcon = document.createElement('span');
      playIcon.className = 'red-fan-play';
      playIcon.setAttribute('aria-hidden', 'true');
      card.append(playIcon);
    }
    card.addEventListener('click', () => selectVideo(tab, false, playable));
    fanFeatures.set(id, card);
    deck.append(card);
  }
  fan.append(tabList);
  original.replaceWith(fan);
}

const tabs = [...document.querySelectorAll('[data-video]')];
const stage = document.querySelector('.video-placeholder');
let videoAnimations = [];

function animateVideoChange(selected) {
  for (const animation of videoAnimations) animation.cancel();
  stage?.querySelector('.video-outgoing')?.remove();
  videoAnimations = [];
  if (reducedMotion.matches) return;

  const outgoing = document.createElement('div');
  outgoing.className = 'video-outgoing';
  outgoing.setAttribute('aria-hidden', 'true');
  outgoing.append(...Array.from(stage.children, child => child.cloneNode(true)));
  outgoing.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
  stage.append(outgoing);
  const fade = outgoing.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, easing: 'ease-out' });
  fade.finished.then(() => outgoing.remove(), () => outgoing.remove());
  videoAnimations.push(fade);

  const narrow = matchMedia('(max-width: 640px)').matches;
  const activeIndex = tabs.indexOf(selected);
  tabs.forEach((tab, index) => {
    const displacement = Math.sign(index - activeIndex) * (narrow ? 3 : 10);
    const peak = tab === selected
      ? `scale(${narrow ? 1.07 : 1.12}, 1.09)`
      : `translateX(${displacement}px) scale(.96)`;
    videoAnimations.push(tab.animate([
      { transform: 'none', easing: 'cubic-bezier(.22,.75,.35,1)' },
      { transform: peak, offset: .4, easing: 'ease-in-out' },
      { transform: tab === selected ? 'scale(.99)' : 'none', offset: .77 },
      { transform: 'none' }
    ], 410));
  });
}
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) videoAnimations.forEach(animation => animation.cancel());
});

function selectVideo(tab, moveFocus = false, playSelected = false) {
  const id = tab.dataset.video;
  const changed = tab.getAttribute('aria-selected') !== 'true';
  const finishFanChange = changed ? redMotionEffects?.prepareVideo(tab) : undefined;
  if (changed && !redReview) animateVideoChange(tab);
  const item = data.videos[id];
  tabs.forEach(button => { const active = button === tab; button.setAttribute('aria-selected', active); button.tabIndex = active ? 0 : -1; });
  document.querySelector('#video-panel').setAttribute('aria-labelledby', tab.id);
  if (redReview) {
    const otherCards = [...fanFeatures.keys()].filter(key => key !== id);
    [otherCards[0], id, otherCards[1]].forEach((key, index) => {
      const card = fanFeatures.get(key);
      card.dataset.slot = index - 1;
      card.setAttribute('aria-pressed', String(key === id));
    });
  } else {
    stage.dataset.asset = `${id} / P-${id}`;
    document.querySelector('#video-asset-id').textContent = `${id} / P-${id}`;
    document.querySelector('#video-monogram').textContent = id.slice(1);
  }
  document.querySelector('#video-placeholder-title').textContent = item.title;
  document.querySelector('#video-description').textContent = item.description;
  finishFanChange?.(playSelected);
  if (!changed && playSelected) redMotionEffects?.playVideo();
  if (moveFocus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectVideo(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectVideo(tabs[next], true); }
  });
});
if (redReview) selectVideo(tabs[0]);

const sheet = document.querySelector('#project-detail');
const closeDetail = document.querySelector('#close-detail');
let returnFocus = null;
let returnScroll = 0;
let detailLocked = false;
let detailClosing = false;
const detailImages = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.loading = 'eager';
    detailImages.unobserve(entry.target);
  }
}, { root: sheet, rootMargin: '240px 0px' });
function openProject(button) {
  if (sheet.open) return;
  const project = data.projects.find(item => item.id === button.dataset.project);
  returnFocus = button;
  returnScroll = window.scrollY;
  // Request the first images while the sheet is still sliding into view.
  document.querySelector('#detail-category').innerHTML = project.logo
    ? `<span class="detail-brand">${projectMark(project, 'eager')}</span><span>${project.label}</span>`
    : `<span>${project.label}</span>`;
  document.querySelector('#detail-title').textContent = projectTitle(project);
  document.querySelector('#detail-lead').textContent = project.description;
  const gallery = document.querySelector('#detail-gallery');
  const coverRatio = project.detailCoverRatio ?? project.ratio;
  const detailCover = (staticReview || redReview) && project.id === '06'
    ? ''
    : `<figure class="detail-figure detail-hero${coverRatio === '9:16' ? ' is-portrait' : ''}">${projectCover(project, coverRatio, 'eager')}</figure>`;
  gallery.dataset.asset = `A-PROJECT-DETAIL-${project.id}`;
  gallery.innerHTML = `
    ${detailCover}
    ${project.artwork.map(([title, width, height], index) => `
      <figure class="detail-figure${height > width * 3 ? ' is-long' : ''}">
        <figcaption>${title}</figcaption>
        ${projectImage(`detail-${project.id}-${pad(index + 1)}.webp`, title, width, height, index === 0 ? 'eager' : 'lazy', index === 0 && !detailCover ? 'high' : 'auto')}
      </figure>
    `).join('')}`;
  // Keep the live sticky stack at its current scroll position under the modal.
  const root = document.documentElement;
  root.classList.toggle('detail-gutter', root.clientWidth < window.innerWidth);
  root.classList.add('detail-open');
  detailLocked = true;
  sheet.showModal();
  sheet.scrollTop = 0;
  if (redMotionEffects?.detailScroller) redMotionEffects.detailScroller.scrollTop = 0;
  sheet.getBoundingClientRect();
  sheet.classList.add('is-presented');
  gallery.querySelectorAll('img[loading="lazy"]').forEach(image => detailImages.observe(image));
  closeDetail.focus({ preventScroll: true });
}
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => openProject(button)));
function restoreDetailState() {
  if (sheet.open || !detailLocked) return;
  detailLocked = false;
  detailClosing = false;
  detailImages.disconnect();
  sheet.classList.remove('is-presented');
  document.documentElement.classList.remove('detail-open', 'detail-gutter');
  window.scrollTo(0, returnScroll);
  returnFocus?.focus({ preventScroll: true });
}
function closeProject() {
  if (!sheet.open || detailClosing) return;
  detailClosing = true;
  sheet.classList.remove('is-presented');
  const finish = () => { sheet.close(); restoreDetailState(); };
  const slide = sheet.getAnimations().find(animation => animation.transitionProperty === 'translate');
  if (slide) slide.finished.then(finish, finish);
  else finish();
}
closeDetail.addEventListener('click', closeProject);
sheet.addEventListener('cancel', event => { event.preventDefault(); closeProject(); });
sheet.addEventListener('click', event => { if (event.target === sheet) { const box = sheet.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeProject(); } });
sheet.addEventListener('close', restoreDetailState);

// Map the authored 360×780 interface onto the generated phone's glass plane.
// Source corners are reviewed against the original 1672×941 scene, clockwise.
const heroScene = document.querySelector('.hero-scene');
const heroImage = document.querySelector('.hero-scene-image');
const heroUI = document.querySelector('.hero-phone-ui');
function alignHeroInterface() {
  if (!heroImage.naturalWidth) return;
  const width = heroScene.clientWidth, height = heroScene.clientHeight;
  const style = getComputedStyle(heroScene);
  const scale = Math.max(width / 1672, height / 941);
  const x = (width - 1672 * scale) * parseFloat(style.getPropertyValue('--scene-x')) / 100;
  const y = (height - 941 * scale) * parseFloat(style.getPropertyValue('--scene-y')) / 100;
  const points = [[871, 152], [1112, 121], [1005, 687], [747, 694]].map(([px, py]) => [px * scale + x, py * scale + y]);
  const source = [[0, 0], [360, 0], [360, 780], [0, 780]];
  const equations = [];
  source.forEach(([u, v], i) => { const [px, py] = points[i]; equations.push([u, v, 1, 0, 0, 0, -u * px, -v * px, px], [0, 0, 0, u, v, 1, -u * py, -v * py, py]); });
  for (let col = 0; col < 8; col++) {
    let pivot = col;
    for (let row = col + 1; row < 8; row++) if (Math.abs(equations[row][col]) > Math.abs(equations[pivot][col])) pivot = row;
    [equations[col], equations[pivot]] = [equations[pivot], equations[col]];
    const factor = equations[col][col];
    for (let k = col; k < 9; k++) equations[col][k] /= factor;
    for (let row = 0; row < 8; row++) if (row !== col) { const n = equations[row][col]; for (let k = col; k < 9; k++) equations[row][k] -= n * equations[col][k]; }
  }
  const [a, b, c, d, e, f, g, h] = equations.map(row => row[8]);
  heroUI.style.transform = `matrix3d(${[a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, c, f, 0, 1].join(',')})`;
  heroUI.dataset.aligned = 'true';
}
if (heroScene) {
  heroImage.addEventListener('load', alignHeroInterface);
  new ResizeObserver(alignHeroInterface).observe(heroScene);
  alignHeroInterface();
}

if (redMotion) {
  import('./red-motion.js?v=mobile-media').then(module => {
    redMotionEffects = module.initRedMotion(reducedMotion, data.videos);
  }).catch(error => console.warn('Black/red motion preview:', error));
}
