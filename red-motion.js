import { arrivals, revealType, setupCareerType, setupContourLines, setupSpecularButtons, setupTechTitle, svgNode } from './red-effects.js';

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const ease = 'cubic-bezier(.22,1,.36,1)';
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (a, b, progress) => a + (b - a) * progress;
const smooth = progress => progress * progress * (3 - 2 * progress);

export function initRedMotion(preference, videos) {
  const root = document.documentElement;
  const running = new Set();
  const enabled = () => !preference.matches;
  function play(node, frames, duration, delay = 0, extra = {}) {
    if (!enabled()) return;
    const effect = node.animate(frames, { duration, delay, easing: ease, fill: 'backwards', ...extra });
    running.add(effect);
    const release = () => running.delete(effect);
    effect.finished.then(release, release);
    return effect;
  }
  function syncPreference() {
    root.classList.toggle('red-motion-live', enabled());
    if (!enabled()) running.forEach(effect => effect.cancel());
  }
  preference.addEventListener('change', syncPreference);
  syncPreference();

  const opening = introCurtain(play, enabled);
  const arrive = arrivals(opening, enabled);
  setupContourLines(enabled, preference);
  setupSpecularButtons(enabled);
  setupCareerType(arrivals(opening, enabled, .70), enabled, preference);
  setupHero(play, enabled, preference, opening);
  setupNavigation(play, enabled);
  const fan = setupFan(play, enabled, videos, arrive, preference);
  return { ...fan, ...setupSections(play, enabled, preference, arrive, arrivals(opening, enabled, .63)) };
}

function introCurtain(play, enabled) {
  if (!enabled() || location.hash || scrollY > 0) return Promise.resolve();
  const curtain = document.createElement('div');
  curtain.className = 'red-loading-curtain';
  curtain.setAttribute('aria-hidden', 'true');
  const count = document.createElement('span');
  curtain.append(count);
  document.body.append(curtain);
  const started = performance.now();
  const panel = $('.red-hero-panel');
  const maximum = 3200;
  let frame, departing = false;
  return new Promise(resolve => {
    const events = new AbortController();
    const timeout = setTimeout(() => finish(false), maximum + 850);
    function remove() {
      clearTimeout(timeout);
      events.abort();
      cancelAnimationFrame(frame);
      curtain.remove();
      resolve();
    }
    function finish(animate) {
      if (!animate || !enabled()) return remove();
      if (departing) return;
      departing = true;
      count.textContent = '100';
      const slide = play(curtain, [{ translate: '0 0' }, { translate: '0 -102%' }], 600, 160, { fill: 'both' });
      if (slide) {
        slide.finished.then(remove, remove);
      } else remove();
    }
    function tick(now) {
      if (!enabled() || document.hidden) return finish(false);
      const elapsed = now - started;
      const ready = panel.complete && document.fonts.status === 'loaded';
      const pace = clamp(elapsed / 2450);
      count.textContent = String(Math.floor(Math.min(ready ? 100 : 96, 100 * pace ** .88))).padStart(2, '0');
      if ((pace === 1 && ready) || elapsed >= maximum) finish(true);
      else frame = requestAnimationFrame(tick);
    }
    const skip = () => finish(false);
    for (const event of ['keydown', 'scroll', 'pointerdown', 'pagehide']) {
      addEventListener(event, skip, { signal: events.signal, passive: true });
    }
    count.textContent = '00';
    frame = requestAnimationFrame(tick);
  });
}

function setupHero(play, enabled, preference, opening) {
  const hero = $('#S01');
  const art = $('.red-hero-art', hero);
  const portrait = $('.red-hero-panel', art);
  const scene = portrait.parentElement;
  const cards = ['tiktok', 'jimeng', 'codex', 'photoshop', 'dsh', 'youtube', 'instagram', 'minimax']
    .map(id => $(`[data-orbit-card="${id}"]`, art));
  const echoDelays = [100, 190, 290];
  const echoOpacity = [.38, .22, .10];
  const ghosts = cards.map(card => echoDelays.map(() => {
    const ghost = document.createElement('span');
    ghost.className = 'red-orbit-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    card.before(ghost);
    return ghost;
  }));

  const outer = [$('.red-hero-orbit-back path', art), $('.red-hero-orbit-front path:last-child', art)];
  const inner = [
    'M153 394C153 287 326 169 557 148S975 177 975 313',
    'M153 394C153 470 367 516 598 497S975 417 975 313'
  ].map((d, side) => {
    const path = svgNode('path', { d, class: 'red-orbit-secondary' });
    outer[side].ownerSVGElement.append(path);
    return path;
  });
  const tracks = [outer, inner].map((paths, trackIndex) => {
    const [back, front] = paths.map(path => path.getTotalLength());
    const total = back + front;
    const points = Array.from({ length: 193 }, (_, index) => {
      const distance = index / 192 * total;
      const forward = distance >= back;
      const length = forward ? front : back;
      const local = forward ? distance - back : distance;
      const { x, y } = paths[Number(forward)].getPointAtLength(forward ? length - local : local);
      return { x: x / 1120, y: y / 725, front: forward, depth: Math.sin(Math.PI * local / length) };
    });
    return {
      points, frontStart: back / total, clock: null,
      name: trackIndex ? 'inner' : 'outer',
      badgeScale: trackIndex ? .88 : 1,
      duration: trackIndex ? 21600 : 17400,
      foreground: trackIndex ? 4 : 6
    };
  });

  const word = $('.red-hero-word', hero);
  const belt = document.createElement('div');
  belt.className = 'red-word-belt';
  const label = document.createElement('span');
  label.textContent = word.textContent;
  belt.append(label);
  for (const side of ['previous', 'next']) {
    const clone = label.cloneNode(true);
    clone.className = `red-word-${side}`;
    belt.append(clone);
  }
  word.replaceChildren(belt);

  const echoes = Array.from({ length: 2 }, () => {
    const echo = portrait.cloneNode();
    echo.classList.add('red-portrait-echo');
    echo.setAttribute('aria-hidden', 'true');
    portrait.before(echo);
    return echo;
  });
  const fine = matchMedia('(pointer: fine) and (hover: hover)');
  const pointer = { x: 0, y: 0 };
  const follow = [18, 56, 96].map(response => ({ x: 0, y: 0, response }));
  let visible = false, started = false, ready = false, running = false;
  let frame = 0, last = 0, depthTimer = 0;
  let width, height, focus, wordMotion;
  let rotors = [];

  function updateDepth() {
    for (const track of tracks) track.time = Number(track.clock?.currentTime);
    for (const { node, delay, copy, track } of rotors) {
      const phase = ((track.time - delay) % track.period) / track.period;
      const front = phase >= track.frontStart;
      const layer = front ? String(track.foreground - Number(copy > 0)) : '0';
      if (node.style.zIndex !== layer) {
        node.style.zIndex = layer;
        if (copy) node.style.opacity = echoOpacity[copy - 1] * (front ? 1 : .7);
      }
    }
  }

  function measure() {
    width = art.clientWidth;
    height = art.clientHeight;
    const box = art.getBoundingClientRect();
    const panelWidth = portrait.offsetWidth;
    const panelHeight = portrait.offsetHeight;
    focus = {
      x: box.left + scrollX + width / 2,
      y: box.top + scrollY + portrait.offsetTop + panelHeight / 2,
      halfWidth: panelWidth / 2,
      halfHeight: panelHeight / 2,
      rangeX: clamp(panelWidth * .115, 24, 86),
      rangeY: clamp(panelHeight * .06, 18, 64)
    };
    if (!started || !enabled() || !width) return;

    const mobile = innerWidth <= 700;
    const originX = (1 - width / hero.clientWidth) / 2;
    const clocks = tracks.map(track => track.clock ? Number(track.clock.currentTime) / track.period : 0);
    rotors.forEach(({ animation }) => animation.cancel());
    rotors = [];
    const slots = cards.map((card, index) => {
      const style = getComputedStyle(card);
      return {
        card,
        ghosts: ghosts[index],
        x: parseFloat(style.getPropertyValue('--orbit-x')) / 100,
        y: parseFloat(style.getPropertyValue('--orbit-y')) / 100,
        front: Number(style.getPropertyValue('--orbit-depth')) > 1,
        width: card.offsetWidth,
        height: card.offsetHeight,
        corner: style.borderRadius
      };
    });

    tracks.forEach((track, trackIndex) => {
      const lane = slots.filter((_, index) => index % tracks.length === trackIndex);
      const { points } = track;
      const segments = points.length - 1;
      const spacing = segments / lane.length;
      track.period = track.duration * (mobile ? 1.25 : 1);
      const time = clocks[trackIndex] * track.period;

      // Start near the static slots while leaving four even gaps on each rail.
      let best = Infinity, origin = 0;
      for (let start = 0; start < spacing; start++) {
        const cost = lane.reduce((sum, slot, index) => {
          const point = points[start + index * spacing];
          return sum + (point.x - slot.x) ** 2 + .5 * (point.y - slot.y) ** 2 + (point.front === slot.front ? 0 : 10);
        }, 0);
        if (cost < best) { best = cost; origin = start; }
      }

      lane.forEach((slot, index) => {
        const phase = (origin + index * spacing + trackIndex * 10) / segments;
        const radius = Math.hypot(slot.width, slot.height) / (2 * width);
        const keyframes = points.map(({ x, y, front, depth }) => {
          const scale = (.81 + depth * (front ? (mobile ? .16 : .28) : -.14)) * track.badgeScale;
          const bank = (x - .5) * (front ? -34 : 24) * depth;
          const margin = radius * scale + 2 / width;
          const safeX = mobile ? clamp(x, -originX + margin, 1 + originX - margin) : x;
          return { transform: `translate3d(${(safeX - slot.x) * width}px, ${(y - slot.y) * height}px, 0) translate(-50%, -50%) rotate(${bank}deg) scale(${scale})` };
        });
        slot.ghosts.forEach(ghost => {
          ghost.style.left = `${slot.x * 100}%`;
          ghost.style.top = `${slot.y * 100}%`;
          ghost.style.width = `${slot.width}px`;
          ghost.style.height = `${slot.height}px`;
          ghost.style.borderRadius = slot.corner;
        });
        slot.card.dataset.orbitTrack = track.name;
        [slot.card, ...slot.ghosts].forEach((node, copy) => {
          const lag = copy ? echoDelays[copy - 1] : 0;
          const delay = -(1 + phase) * track.period + lag;
          const animation = node.animate(keyframes, { duration: track.period, delay, iterations: Infinity });
          animation.currentTime = time;
          if (!running) animation.pause();
          if (index === 0 && copy === 0) track.clock = animation;
          rotors.push({ node, animation, delay, copy, track });
        });
      });
    });

    const gap = mobile ? 52 : 86;
    const wordWidth = label.offsetWidth + gap;
    const speed = mobile ? 50 : clamp(innerWidth * .095, 105, 330);
    const duration = wordWidth / speed * 1000;
    const progress = wordMotion?.effect.getComputedTiming().progress ?? 0;
    wordMotion?.cancel();
    belt.style.setProperty('--word-gap', `${gap}px`);
    wordMotion = belt.animate([
      { transform: 'translate3d(0, 0, 0)' },
      { transform: `translate3d(${-wordWidth}px, 0, 0)` }
    ], { duration, iterations: Infinity });
    wordMotion.currentTime = progress * duration;
    if (!running) wordMotion.pause();
    updateDepth();
  }

  function positionPortrait(image, pose) {
    image.style.transform = `translate3d(calc(-50% + ${pose.x * focus.rangeX}px), ${pose.y * focus.rangeY}px, 0) perspective(1050px) rotateX(${-pose.y * 6}deg) rotateY(${pose.x * 9}deg)`;
  }

  function wakePointer() {
    if (running && !frame) {
      last = 0;
      frame = requestAnimationFrame(trackPointer);
    }
  }
  function trackPointer(now) {
    frame = 0;
    if (!running) return;
    const delta = last ? clamp(now - last, 0, 50) : 1000 / 60;
    last = now;
    for (const pose of follow) {
      const gain = 1 - Math.exp(-delta / pose.response);
      pose.x = Math.abs(pointer.x - pose.x) < .001 ? pointer.x : lerp(pose.x, pointer.x, gain);
      pose.y = Math.abs(pointer.y - pose.y) < .001 ? pointer.y : lerp(pose.y, pointer.y, gain);
    }
    const lead = follow[0];
    scene.style.translate = `${lead.x * focus.rangeX * .09}px ${lead.y * focus.rangeY * .09}px`;
    positionPortrait(portrait, lead);
    echoes.forEach((echo, index) => {
      const lag = follow[index + 1];
      const speed = Math.hypot(lead.x - lag.x, lead.y - lag.y);
      positionPortrait(echo, lag);
      echo.style.opacity = clamp(speed * (index === 0 ? .48 : .27), 0, index === 0 ? .29 : .17);
    });
    if (follow.some(pose => pose.x !== pointer.x || pose.y !== pointer.y)) frame = requestAnimationFrame(trackPointer);
  }
  function centerPointer() {
    pointer.x = 0;
    pointer.y = 0;
    wakePointer();
  }
  hero.addEventListener('pointermove', event => {
    if (!enabled() || !fine.matches || event.pointerType === 'touch' || !focus?.halfWidth) return;
    const x = (event.pageX - focus.x) / focus.halfWidth;
    const y = (event.pageY - focus.y) / focus.halfHeight;
    const influence = 1 - smooth(clamp((Math.max(Math.abs(x), Math.abs(y)) - 1) / 1.1));
    pointer.x = clamp(x, -1, 1) * influence;
    pointer.y = clamp(y, -1, 1) * influence;
    wakePointer();
  }, { passive: true });
  hero.addEventListener('pointerleave', centerPointer);
  hero.addEventListener('pointercancel', centerPointer);
  fine.addEventListener('change', centerPointer);

  function update() {
    if (ready && visible && !started && enabled()) {
      started = true;
      measure();
      play(portrait, [{ translate: '0 16px', scale: .97, opacity: .2 }, { translate: '0 0', scale: 1, opacity: 1 }], 650);
      play(word, [{ clipPath: 'inset(100% 0 0)', opacity: .3 }, { clipPath: 'inset(0)', opacity: 1 }], 650, 120);
      outer.forEach(path => {
        const track = path.ownerSVGElement;
        play(track, [{ opacity: 0 }, { opacity: getComputedStyle(track).opacity }], 520, 220);
      });
      cards.forEach((card, index) => {
        const delay = 240 + index * 45;
        play(card, [{ opacity: 0 }, { opacity: 1 }], 420, delay);
        ghosts[index].forEach(ghost => play(ghost, [{ opacity: 0 }, { opacity: Number(ghost.style.opacity) }], 520, delay + 160));
      });
      $$('.red-hero-identity h1 > span', hero).forEach((line, index) => {
        revealType(line, play, { delay: 310 + 160 * index, duration: 590, stagger: 38 });
      });
      play($('.red-hero-identity p', hero), [{ opacity: 0, translate: '0 10px' }, { opacity: 1, translate: '0 0' }], 820, 590);
      revealType($('.red-hero-caption', hero), play, { delay: 385, duration: 590, stagger: 22, offset: 78 });
    }
    const active = enabled() && started && visible && !document.hidden;
    if (active === running) return;
    running = active;
    const method = active ? 'play' : 'pause';
    rotors.forEach(({ animation }) => animation[method]());
    wordMotion?.[method]();
    if (active) {
      updateDepth();
      depthTimer = setInterval(updateDepth, 65);
      wakePointer();
    } else {
      clearInterval(depthTimer);
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }).observe(hero);
  new ResizeObserver(measure).observe(art);
  document.fonts.ready.then(measure);
  document.addEventListener('visibilitychange', update);
  preference.addEventListener('change', () => {
    if (!enabled()) {
      centerPointer();
      follow.forEach(pose => { pose.x = 0; pose.y = 0; });
      scene.style.removeProperty('translate');
      portrait.style.removeProperty('transform');
      rotors.forEach(({ node, animation }) => {
        animation.cancel();
        node.style.removeProperty('z-index');
      });
      rotors = [];
      tracks.forEach(track => { track.clock = null; });
      wordMotion?.cancel();
      wordMotion = null;
    } else if (started) {
      measure();
    }
    update();
  });
  opening.then(() => { ready = true; update(); });
}

function setupNavigation(play, enabled) {
  const header = $('.site-header');
  const nav = $('.site-header nav');
  const fluid = svgNode('svg', { viewBox: '0 0 600 96', preserveAspectRatio: 'none', class: 'red-nav-fluid', 'aria-hidden': 'true' });
  const closed = 'M295 46C294 46 294 47 294 48S294 50 295 50H305C306 50 306 49 306 48S306 46 305 46Z';
  const pulled = 'M180 24C124 18 88 33 87 49S119 77 183 67H419C479 78 514 62 514 47S480 16 419 24Z';
  const swollen = 'M52 9C20 9 2 26 4 50S26 92 55 86H547C581 91 599 74 596 49S580 6 546 10Z';
  const open = 'M48 1C22 1 1 21 1 48S22 95 48 95H552C578 95 599 75 599 48S578 1 552 1Z';
  const skin = svgNode('path', { d: closed });
  fluid.append(skin);
  const glow = document.createElement('span');
  glow.className = 'red-nav-glow';
  glow.setAttribute('aria-hidden', 'true');
  nav.prepend(fluid, glow);
  nav.classList.add('has-red-fluid');
  let compact = header.classList.contains('is-compact'), currentLink, morph, droplet;
  skin.setAttribute('d', compact ? open : closed);
  function morphNavigation() {
    const next = header.classList.contains('is-compact');
    if (next === compact) return;
    compact = next;
    const from = getComputedStyle(skin).d;
    morph?.cancel();
    skin.setAttribute('d', next ? open : closed);
    if (!enabled()) return;
    const frames = next ? [pulled, swollen, open] : [swollen, pulled, closed];
    morph = play(skin, [
      { d: from, opacity: 1 },
      ...frames.map((shape, index) => ({
        d: `path("${shape}")`,
        opacity: !next && index === 2 ? 0 : 1,
        offset: [.31, .67, 1][index]
      }))
    ], next ? 690 : 480, 0, { easing: 'cubic-bezier(.24,.56,.31,1)' });
  }
  function update() {
    const current = $('[aria-current]', nav);
    if (current) {
      const rect = current.getBoundingClientRect();
      const bounds = nav.getBoundingClientRect();
      glow.style.width = `${rect.width}px`;
      glow.style.height = `${rect.height}px`;
      glow.style.translate = `${rect.left - bounds.left - nav.clientLeft}px ${rect.top - bounds.top - nav.clientTop}px`;
      if (current !== currentLink) {
        const direction = currentLink && rect.left < currentLink.getBoundingClientRect().left ? 1 : -1;
        droplet?.cancel();
        droplet = play(glow, [
          { translate: `${direction * 23}px 4px`, scale: '.2 .45', opacity: 0 },
          { translate: `${direction * 13}px 3px`, scale: '1.4 .65', opacity: .82, offset: .3 },
          { translate: `${direction * -3}px 0`, scale: '.72 1', opacity: .3, offset: .72 },
          { translate: '0 0', scale: '.2 .35', opacity: 0 }
        ], 565, 0, { pseudoElement: '::after' });
      }
    }
    currentLink = current;
    glow.classList.toggle('is-visible', Boolean(current));
  }
  new MutationObserver(update).observe(nav, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
  new MutationObserver(morphNavigation).observe(header, { attributes: true, attributeFilter: ['class'] });
  new ResizeObserver(update).observe(nav);
  update();
}

function setupFan(play, enabled, videos, arrive, preference) {
  const fan = $('.red-video-fan');
  const deck = $('.red-fan-deck', fan);
  const cards = $$('.red-fan-card', deck);
  const tabs = $('.video-tabs', fan);
  const title = $('#video-placeholder-title', fan);
  const description = $('#video-description', fan);
  const unfoldMs = 2550;
  const switchMs = 1300;
  const caption = document.createElement('div');
  caption.className = 'red-video-caption-mask';
  description.before(caption);
  caption.append(description);
  const marker = document.createElement('span');
  marker.className = 'red-video-marker';
  marker.setAttribute('aria-hidden', 'true');
  tabs.prepend(marker);

  const effects = new Set();
  const playback = setupVideoPlayer(deck, videos, enabled);
  playback.select($('[aria-selected=true]', tabs).dataset.video);
  const moveMarker = tab => {
    marker.style.width = `${tab.offsetWidth}px`;
    marker.style.height = `${tab.offsetHeight}px`;
    marker.style.translate = `${tab.offsetLeft}px ${tab.offsetTop}px`;
  };
  new ResizeObserver(() => moveMarker($('[aria-selected=true]', tabs))).observe(tabs);
  moveMarker($('[aria-selected=true]', tabs));

  function pose(card, base = false) {
    const style = getComputedStyle(card);
    const matrix = new DOMMatrix(style.transform);
    const rect = base ? null : card.getBoundingClientRect();
    return {
      x: rect ? rect.x + rect.width / 2 : card.offsetLeft + card.offsetWidth / 2,
      y: rect ? rect.y + rect.height / 2 : card.offsetTop + card.offsetHeight / 2,
      matrix,
      angle: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI + (base ? 0 : parseFloat(style.rotate) || 0),
      scale: Math.hypot(matrix.a, matrix.b) * (base ? 1 : parseFloat(style.scale) || 1),
      width: card.offsetWidth
    };
  }
  function retain(animation) {
    if (!animation) return;
    effects.add(animation);
    const release = () => effects.delete(animation);
    animation.finished.then(release, release);
  }
  function captionPose() {
    const candidates = [description, ...$$('.red-video-outgoing', caption)];
    return candidates.map(element => {
      const style = getComputedStyle(element);
      return { text: element.textContent, translate: style.translate, opacity: Number(style.opacity) };
    }).reduce((front, candidate) => candidate.opacity > front.opacity ? candidate : front);
  }
  function swapCaption(previous) {
    if (previous.opacity > .04) {
      const clone = document.createElement('p');
      clone.setAttribute('aria-hidden', 'true');
      clone.className = 'red-video-outgoing red-outgoing-description';
      clone.textContent = previous.text;
      description.after(clone);
      const outgoing = play(clone, [
        { translate: previous.translate, opacity: previous.opacity },
        { translate: '0 -5px', opacity: 0 }
      ], 200);
      outgoing.finished.then(() => clone.remove(), () => clone.remove());
      retain(outgoing);
    }
    retain(play(description, [{ translate: '0 16px', opacity: 0 }, { translate: '0 0', opacity: 1 }], 680, 190));
  }

  let titlePreview, titleFrame = 0;
  function settleTitle() {
    cancelAnimationFrame(titleFrame);
    titlePreview?.remove();
    titlePreview = undefined;
  }
  function shuffleTitle(previous) {
    const finalTitle = title.textContent;
    if (previous === finalTitle) return;
    const source = [...previous];
    const target = [...finalTitle];
    const symbols = '工日木田目中川回文由山立';
    const start = performance.now();
    let lastStep = -1;
    titlePreview = document.createElement('h3');
    titlePreview.className = 'red-video-title-preview';
    titlePreview.setAttribute('aria-hidden', 'true');
    titlePreview.textContent = previous;
    title.after(titlePreview);
    function tick(now) {
      const elapsed = now - start;
      const progress = elapsed / 1110;
      if (!enabled() || progress >= 1) return settleTitle();
      const step = Math.floor(elapsed / 55);
      if (step !== lastStep) {
        const letters = target.map((letter, index) => {
          const order = index / Math.max(1, target.length - 1);
          if (letter === source[index] || /\s/u.test(letter) || progress >= .47 + .49 * order) return letter;
          if (progress < .05 + .10 * order) return source[index] ?? '　';
          return symbols[(step * 5 + index * 7) % symbols.length];
        });
        titlePreview.textContent = letters.join('');
        lastStep = step;
      }
      titleFrame = requestAnimationFrame(tick);
    }
    titleFrame = requestAnimationFrame(tick);
  }

  let moving;
  function finishDeck() {
    clearTimeout(moving);
    deck.classList.remove('red-fan-moving');
    playback.sync();
  }
  function holdDeck(duration) {
    clearTimeout(moving);
    deck.classList.add('red-fan-moving');
    moving = setTimeout(finishDeck, duration);
  }
  function clearEffects() {
    effects.forEach(effect => effect.cancel());
    effects.clear();
  }
  function packedPoses() {
    const middle = pose(cards.find(card => card.dataset.slot === '0'), true);
    const narrow = innerWidth <= 900;
    return cards.map(card => {
      const slot = Number(card.dataset.slot);
      const current = pose(card, true);
      const angle = -current.angle + slot * 2.5;
      const scale = .85 * middle.width / current.width;
      const offset = new DOMMatrix().rotate(angle).scale(scale)
        .transformPoint({ x: current.matrix.e, y: current.matrix.f });
      const x = middle.x - current.x - offset.x + slot * (narrow ? 6 : 13);
      const y = middle.y - current.y - offset.y + (slot ? (narrow ? 18 : 28) : 0);
      return {
        x, y,
        translate: `${x}px ${y}px`,
        rotate: `${angle}deg`,
        scale
      };
    });
  }
  function arm() {
    if (!enabled() || deck.matches(':focus-within') || playback.surface?.classList.contains('is-started')) return;
    packedPoses().forEach((packed, index) => {
      cards[index].style.setProperty('--fan-pack-position', packed.translate);
      cards[index].style.setProperty('--fan-pack-angle', packed.rotate);
      cards[index].style.setProperty('--fan-pack-scale', packed.scale);
    });
    deck.classList.add('red-fan-armed');
  }
  arm();
  new ResizeObserver(() => {
    if (deck.classList.contains('red-fan-armed')) arm();
  }).observe(deck);
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) arm();
  }).observe(deck);
  deck.addEventListener('focusin', () => deck.classList.remove('red-fan-armed'));
  preference.addEventListener('change', () => {
    if (enabled()) return;
    settleTitle();
    finishDeck();
    deck.classList.remove('red-fan-armed');
  });
  arrive(title.parentElement, () => {
    if (!titlePreview) revealType(title, play, { duration: 750, stagger: 62 }).forEach(retain);
  }, true);
  arrive(deck, () => {
    if (!deck.classList.contains('red-fan-armed')) return;
    const packed = packedPoses();
    holdDeck(unfoldMs + 205);
    deck.classList.remove('red-fan-armed');
    const narrow = innerWidth <= 900;
    cards.forEach((card, index) => {
      const slot = Number(card.dataset.slot);
      const start = packed[index];
      const stacked = { translate: start.translate, rotate: start.rotate, scale: start.scale, opacity: 1 };
      retain(play(card, [
        stacked,
        { ...stacked, offset: .20, easing: 'ease-in-out' },
        { translate: `${start.x}px ${start.y - (narrow ? 7 : 16)}px`, rotate: start.rotate, scale: start.scale * 1.035, opacity: 1, offset: .41, easing: 'cubic-bezier(.32,.14,.32,.98)' },
        { translate: `${slot * (narrow ? 4 : 25)}px ${slot ? (narrow ? -5 : -20) : -8}px`, rotate: `${slot * (narrow ? 2 : 5)}deg`, scale: 1.025, opacity: 1, offset: .84, easing: 'cubic-bezier(.3,0,.23,1)' },
        { translate: '0 0', rotate: '0deg', scale: 1, opacity: 1 }
      ], unfoldMs, slot === -1 ? 90 : slot === 1 ? 180 : 0, { easing: 'linear' }));
      const label = $('.red-fan-card-title', card);
      if (slot && label) retain(play(label, [{ opacity: 0 }, { opacity: 1 }], 600, 1250));
    });
    retain(play(description, [{ translate: '0 18px', opacity: 0 }, { translate: '0 0', opacity: 1 }], 780, 1200));
  }, true);

  function prepareVideo(tab) {
    const previous = enabled() ? cards.map(card => pose(card)) : [];
    const oldTitle = titlePreview?.textContent ?? title.textContent;
    const oldDescription = enabled() ? captionPose() : null;
    settleTitle();
    clearEffects();
    deck.classList.remove('red-fan-armed');
    $$('.red-video-outgoing', fan).forEach(node => node.remove());
    return (playSelected = false) => {
      moveMarker(tab);
      playback.select(tab.dataset.video);
      if (playSelected) playback.play();
      if (!enabled()) return;
      holdDeck(switchMs + 25);
      const next = cards.map(card => pose(card));
      cards.forEach((card, index) => {
        const before = previous[index];
        const after = next[index];
        const x = before.x - after.x + after.matrix.e;
        const y = before.y - after.y + after.matrix.f;
        const scale = before.scale * before.width / after.width;
        if (Math.abs(x - after.matrix.e) < .5 && Math.abs(y - after.matrix.f) < .5 && Math.abs(scale - 1) < .01 && before.angle === after.angle) return;
        const frames = [
          { transform: `translate(${x}px, ${y}px) rotate(${before.angle}deg) scale(${scale})`, easing: 'cubic-bezier(.34,.16,.36,.9)' },
          { transform: `translate(${lerp(x, after.matrix.e, .73)}px, ${lerp(y, after.matrix.f, .73) - (card.dataset.slot === '0' ? 28 : 5)}px) rotate(${after.angle * .83}deg) scale(${lerp(scale, after.scale, .78)})`, offset: .58, easing: 'cubic-bezier(.28,.65,.27,1)' },
          { transform: after.matrix.toString() }
        ];
        retain(play(card, frames, switchMs, 0, { easing: 'linear' }));
        if (playSelected && card.dataset.slot === '0' && playback.surface) {
          retain(play(playback.surface, frames, switchMs, 0, { easing: 'linear' }));
        }
      });
      shuffleTitle(oldTitle);
      swapCaption(oldDescription);
    };
  }
  function playCurrent() {
    if (deck.matches('.red-fan-armed, .red-fan-moving')) {
      clearEffects();
      finishDeck();
      deck.classList.remove('red-fan-armed');
    }
    playback.play();
  }
  return { prepareVideo, playVideo: playCurrent };
}

function setupVideoPlayer(deck, videos, enabled) {
  if (!Object.values(videos).some(video => video.src)) return { select() {}, play() {}, sync() {} };
  const surface = document.createElement('div');
  surface.className = 'red-fan-player';
  surface.innerHTML = `
    <video playsinline preload="none" disablepictureinpicture disableremoteplayback hidden></video>
    <p class="red-video-status" role="status" hidden></p>
    <div class="red-video-controls" role="group" aria-label="播放控制">
      <button class="red-video-toggle" type="button" aria-label="播放" title="播放">▶</button>
      <span class="red-video-clock">0:00 / 0:00</span>
      <input class="red-video-progress" type="range" min="0" max="0" step=".1" value="0" aria-label="播放进度" disabled>
      <div class="red-video-audio">
        <button class="red-video-mute" type="button" aria-label="静音" title="静音">音</button>
        <input class="red-video-volume" type="range" min="0" max="1" step=".05" value="1" aria-label="音量">
      </div>
      <button class="red-video-size-action" type="button" aria-label="放大观看" title="放大观看" aria-haspopup="dialog">⛶</button>
    </div>
  `;
  const player = $('video', surface);
  const status = $('.red-video-status', surface);
  const toggle = $('.red-video-toggle', surface);
  const clock = $('.red-video-clock', surface);
  const progress = $('.red-video-progress', surface);
  const sound = $('.red-video-mute', surface);
  const volume = $('.red-video-volume', surface);
  const expand = $('.red-video-size-action', surface);
  deck.append(surface);

  const dialog = document.createElement('dialog');
  dialog.className = 'red-video-dialog';
  dialog.setAttribute('aria-labelledby', 'red-video-dialog-title');
  dialog.innerHTML = '<h3 id="red-video-dialog-title"></h3>';
  const dialogTitle = $('h3', dialog);
  document.body.append(dialog);
  let coveredCard, inView = false, loopWanted = false, soundMuted = false;
  let playAttempt = 0;

  function showStatus(message = '') {
    status.textContent = message;
    status.hidden = !message;
  }

  function labelButton(button, label, symbol) {
    button.setAttribute('aria-label', label);
    button.title = label;
    button.textContent = symbol;
  }
  function formatTime(seconds) {
    const whole = Math.floor(seconds);
    return Math.floor(whole / 60) + ':' + String(whole % 60).padStart(2, '0');
  }
  function updateTime() {
    const duration = Number.isFinite(player.duration) ? player.duration : 0;
    progress.disabled = !duration;
    progress.max = duration;
    progress.value = player.currentTime;
    clock.textContent = formatTime(player.currentTime) + ' / ' + formatTime(duration);
  }
  function updateAudio() {
    volume.value = player.muted ? 0 : player.volume;
    const silent = player.muted || player.volume === 0;
    labelButton(sound, silent ? '开启声音' : '静音', silent ? '静' : '音');
  }
  for (const event of ['loadedmetadata', 'durationchange', 'timeupdate', 'emptied']) {
    player.addEventListener(event, updateTime);
  }
  for (const event of ['play', 'pause', 'ended']) {
    player.addEventListener(event, () => labelButton(toggle, player.paused ? '播放' : '暂停', player.paused ? '▶' : 'Ⅱ'));
  }
  player.addEventListener('volumechange', updateAudio);
  player.addEventListener('waiting', () => {
    if (!player.hidden && !player.paused) showStatus('视频加载中…');
  });
  player.addEventListener('playing', () => showStatus());
  player.addEventListener('pause', () => { if (!player.error) showStatus(); });
  player.addEventListener('error', () => {
    loopWanted = false;
    if (!player.hidden) showStatus('视频加载失败，请点击播放重试');
  });
  progress.addEventListener('input', () => { player.currentTime = Number(progress.value); });
  sound.addEventListener('click', () => {
    soundMuted = !player.muted && player.volume > 0;
    if (!soundMuted && player.volume === 0) player.volume = 1;
    player.muted = soundMuted;
  });
  volume.addEventListener('input', () => {
    player.volume = Number(volume.value);
    soundMuted = false;
    player.muted = false;
  });

  function revealPlayer() {
    player.hidden = false;
    surface.classList.add('is-started');
    coveredCard = $('.red-fan-card[data-slot="0"]', deck);
    const wasFocused = document.activeElement === coveredCard;
    if (coveredCard) coveredCard.inert = true;
    if (wasFocused) toggle.focus({ preventScroll: true });
  }
  function playVideo() {
    if (surface.hidden) return;
    revealPlayer();
    if (player.error) player.load();
    if (player.readyState < 3) showStatus('视频加载中…');
    const attempt = ++playAttempt;
    player.play().catch(error => {
      if (attempt !== playAttempt || error.name === 'AbortError') return;
      loopWanted = false;
      showStatus(error.name === 'NotAllowedError' ? '点击播放开始观看' : '视频加载失败，请点击播放重试');
    });
  }
  function sync() {
    const moving = deck.matches('.red-fan-armed, .red-fan-moving');
    if (document.hidden || (!inView && !dialog.open && !moving)) {
      player.pause();
      return;
    }
    if (enabled() && loopWanted && player.paused && !moving) {
      playVideo();
    }
  }
  function togglePlayback() {
    if (player.paused) {
      loopWanted = player.loop;
      playVideo();
    } else {
      loopWanted = false;
      player.pause();
    }
  }
  toggle.addEventListener('click', togglePlayback);
  player.addEventListener('click', togglePlayback);
  function movePlayer(parent) {
    if (parent.moveBefore) {
      parent.moveBefore(surface, null);
    } else {
      const wasPlaying = !player.paused;
      parent.append(surface);
      if (wasPlaying) player.play().catch(() => {});
    }
  }

  expand.addEventListener('click', () => {
    if (dialog.open) {
      dialog.close();
      return;
    }
    dialog.style.setProperty('--inline-video-width', `${surface.offsetWidth}px`);
    for (const animation of surface.getAnimations()) animation.cancel();
    revealPlayer();
    dialog.showModal();
    movePlayer(dialog);
    labelButton(expand, '返回网页', '↙');
    expand.removeAttribute('aria-haspopup');
    expand.focus();
    sync();
  });
  dialog.addEventListener('close', () => {
    movePlayer(deck);
    labelButton(expand, '放大观看', '⛶');
    expand.setAttribute('aria-haspopup', 'dialog');
    expand.focus({ preventScroll: true });
  });

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting && entry.intersectionRatio >= .25;
    sync();
  }, { threshold: .25 }).observe(surface);
  document.addEventListener('visibilitychange', sync);
  function select(id) {
    const item = videos[id];
    if (dialog.open) dialog.close();
    playAttempt++;
    player.pause();
    player.hidden = true;
    showStatus();
    surface.hidden = !item.src;
    surface.classList.remove('is-started');
    player.loop = Boolean(item.loop);
    player.defaultMuted = player.loop;
    player.muted = player.loop || soundMuted;
    loopWanted = player.loop;
    surface.classList.toggle('is-looping', player.loop);
    if (coveredCard) coveredCard.inert = false;
    coveredCard = undefined;
    if (!item.src) {
      if (player.hasAttribute('src')) {
        player.removeAttribute('src');
        player.load();
      }
      return;
    }
    const mobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
    player.src = mobile && item.mobileSrc ? item.mobileSrc : item.src;
    player.poster = item.poster ?? '';
    player.setAttribute('aria-label', item.title);
    dialogTitle.textContent = item.title;
  }
  return { surface, select, play: playVideo, sync };
}

function setupSections(play, enabled, preference, arrive, read) {
  function rise(node, distance, duration, delay = 0) {
    return play(node, [{ opacity: 0, translate: `0 ${distance}px` }, { opacity: 1, translate: '0 0' }], duration, delay);
  }
  function mask(node, duration, delay = 0, offset = '104%') {
    return play(node, [
      { clipPath: 'inset(100% -12% -14%)', translate: `0 ${offset}` },
      { clipPath: 'inset(-12% -12% -14%)', translate: '0 0' }
    ], duration, delay);
  }

  const manifesto = $('.red-manifesto');
  const quote = $('blockquote', manifesto);
  const note = $('.red-manifesto-note', manifesto);
  const finalStroke = $('path:last-child', note);
  const [crossbar, underline] = finalStroke.getAttribute('d').split('M49');
  const flourish = finalStroke.cloneNode();
  finalStroke.setAttribute('d', crossbar);
  flourish.setAttribute('d', `M49${underline}`);
  finalStroke.after(flourish);
  read(quote, () => {
    const lines = $$('blockquote p > span', manifesto);
    lines.forEach((line, index) => {
      revealType(line, play, { duration: 800, delay: index * 260, stagger: 48, offset: 110 });
    });
    play(lines[0], [{ opacity: 0 }, { opacity: 1 }], 750, 60, { pseudoElement: '::before' });
    play(lines.at(-1), [{ opacity: 0 }, { opacity: 1 }], 720, 920, { pseudoElement: '::after' });
    play($('em', quote), [{ color: 'var(--fg)' }, { color: 'var(--brand)' }], 770, 760);
    let delay = 1860;
    const strokes = $$('path', note);
    const lengths = strokes.map(path => path.getTotalLength());
    const total = lengths.reduce((sum, length) => sum + length, 0);
    strokes.forEach((path, index) => {
      const length = lengths[index];
      const duration = 2300 * length / total;
      path.getAnimations().forEach(effect => effect.cancel());
      play(path, [{ strokeDasharray: `${length} ${length}`, strokeDashoffset: length }, { strokeDasharray: `${length} ${length}`, strokeDashoffset: 0 }], duration, delay, { easing: 'cubic-bezier(.36,.08,.65,.96)' });
      delay += duration;
    });
  }, true);

  for (const heading of $$('.chapter-heading')) {
    arrive(heading, () => {
      mask($('.chapter-number', heading), 1190, 0, '60%');
      play($('.chapter-title-group', heading), [{ scale: '1 0' }, { scale: '1 1' }], 590, 40, { pseudoElement: '::before' });
      revealType($('.chapter-chinese', heading), play, { duration: 760, delay: 120, stagger: 74 });
      revealType($('.chapter-english', heading), play, { duration: 490, delay: 330, stagger: 23 });
    }, true);
  }
  for (const [index, divider] of $$('.chapter-divider').entries()) {
    divider.classList.toggle('red-divider-reverse', index % 2 === 1);
    arrive(divider, () => play(divider, [{ scale: '0 1' }, { scale: '1 1' }], 650, 0, { pseudoElement: '::before' }));
  }

  const career = $('#S03');
  const timeline = $('#timeline');
  const years = $$('.timeline-group', timeline);
  let careerVisible = false, stackVisible = false, frame = 0;
  const list = $('#project-list');
  const cases = $$('.project-case', list);
  const stackMedia = matchMedia('(min-width: 1001px) and (min-height: 760px)');
  let caseLayout = [];
  function updateScroll() {
    frame = 0;
    if (!enabled()) return;
    if (careerVisible) {
      const readingLine = innerHeight * .55;
      const rects = years.map(group => group.getBoundingClientRect());
      const current = rects.findLastIndex(rect => rect.top <= readingLine);
      years.forEach((group, index) => {
        group.classList.toggle('red-year-reading', index === current);
        group.style.setProperty('--year-fill', clamp((readingLine - rects[index].top) / (rects[index].height * .64)));
      });
    }
    if (stackVisible && list.classList.contains('red-project-stack')) {
      const top = list.getBoundingClientRect().top;
      let layersBehind = 0;
      for (let index = caseLayout.length - 2; index >= 0; index--) {
        const previous = caseLayout[index];
        const next = caseLayout[index + 1];
        const edge = previous.pin + previous.height;
        const progress = clamp((edge - top - next.offset) / Math.max(1, edge - next.pin));
        const depth = smooth(progress);
        layersBehind = depth * (1 + layersBehind);
        const shadingDepth = Math.min(2.6, layersBehind);
        cases[index].style.setProperty('--case-scale', Math.max(.76, 1 - .06 * layersBehind));
        cases[index].style.setProperty('--case-angle', `${(index % 2 ? -1 : 1) * 8.5 * depth}deg`);
        cases[index].style.setProperty('--case-blur', `${3.8 * shadingDepth}px`);
        cases[index].style.setProperty('--case-dim', 1 - .65 ** shadingDepth);
      }
    }
  }
  function scheduleScroll() {
    if (enabled() && (careerVisible || stackVisible) && !frame) frame = requestAnimationFrame(updateScroll);
  }
  const scrollObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.target === career) careerVisible = entry.isIntersecting;
      else stackVisible = entry.isIntersecting;
    }
    scheduleScroll();
  });
  scrollObserver.observe(career);
  scrollObserver.observe(list);
  addEventListener('scroll', scheduleScroll, { passive: true });

  const header = $('.site-header');
  function measureStack() {
    const gap = parseFloat(getComputedStyle(list).rowGap);
    const pinTop = Math.max(header.offsetHeight + 16, Math.round(innerHeight * .2));
    let offset = 0;
    caseLayout = cases.map(card => {
      const height = card.offsetHeight;
      const pin = pinTop;
      const layout = { offset, height, pin };
      offset += height + gap;
      card.style.setProperty('--case-pin', `${pin}px`);
      return layout;
    });
    const canFit = caseLayout.every(({ height, pin }) => height + pin < innerHeight - 20);
    list.classList.toggle('red-project-stack', enabled() && stackMedia.matches && canFit);
    scheduleScroll();
  }
  const resize = new ResizeObserver(measureStack);
  cases.forEach(card => resize.observe(card));
  addEventListener('resize', measureStack);
  preference.addEventListener('change', measureStack);
  measureStack();

  for (const card of cases) {
    const info = $('.project-info', card);
    arrive(info, () => {
      rise($('.project-info-top', info), 16, 750);
      revealType($('h3', info), play, { delay: 140, duration: 710, stagger: 55 });
      rise($('.project-description', info), 18, 810, 610);
      rise($('.project-open', info), 12, 710, 750);
      const coverType = $('.collection-cover-type', card);
      if (coverType) mask(coverType, 420, 40, '30%');
    }, true);
  }
  const promo = $('.ecommerce-promo');
  const promoFrame = $('.ecommerce-promo-frame', promo);
  arrive($('.ecommerce-carousel-stage'), () => {
    rise($('.ecommerce-carousel-toolbar'), 12, 710, 280);
  }, true);
  arrive(promoFrame, () => {
    mask(promoFrame, 810, 40, '30%');
    revealType($('h3', promo), play, { delay: 140, duration: 710, stagger: 55 });
    rise($('.ecommerce-promo-expand', promo), 12, 710, 750);
  }, true);
  list.addEventListener('focusin', ({ target }) => {
    if (!target.matches('.project-open:focus-visible')) return;
    const card = target.closest('.project-case');
    card.getAnimations({ subtree: true }).forEach(effect => effect.cancel());
    if (!list.classList.contains('red-project-stack')) return;
    requestAnimationFrame(() => {
      if (document.activeElement !== target) return;
      const rect = target.getBoundingClientRect();
      if (target.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2))) return;
      const { offset, pin } = caseLayout[cases.indexOf(card)];
      window.scrollTo(0, scrollY + list.getBoundingClientRect().top + offset - pin);
    });
  });

  setupProfile(enabled, preference);
  for (const card of $$('.ability-card')) {
    arrive($('.ability-copy', card), () => {
      rise($('.ability-kicker', card), 10, 680);
      revealType($('h3', card), play, { duration: 700, delay: 95, stagger: 58 });
      rise($('.ability-description', card), 12, 820, 430);
    }, true);
    arrive($('.ability-scene', card), () => {
      const steps = $$('.workflow-step', card);
      if (steps.length) {
        steps.forEach((step, index) => rise(step, 29, 810, 140 * index));
      } else {
        const panels = $$('.prototype-panel', card);
        (panels.length ? panels : [$('.ability-scene', card)]).forEach((panel, index) => rise(panel, 24, 740, 130 + 115 * index));
      }
    }, true);
  }

  const toolkit = $('.toolkit-list');
  const movingTools = matchMedia('(min-width: 761px)');
  toolkit.setAttribute('role', 'group');
  toolkit.setAttribute('aria-labelledby', 'toolkit-title');
  const syncToolFocus = () => {
    if (enabled() && movingTools.matches) toolkit.tabIndex = 0;
    else toolkit.removeAttribute('tabindex');
  };
  movingTools.addEventListener('change', syncToolFocus);
  preference.addEventListener('change', syncToolFocus);
  syncToolFocus();
  setupTechTitle($('.toolkit-heading'), arrive, play);
  $$('.toolkit-track', toolkit).forEach((track, index) => {
    const viewport = document.createElement('div');
    viewport.className = 'red-tool-window';
    const belt = document.createElement('div');
    belt.className = 'toolkit-belt';
    const copy = track.cloneNode(true);
    copy.classList.add('toolkit-repeat');
    copy.setAttribute('aria-hidden', 'true');
    track.before(viewport);
    belt.append(track, copy);
    viewport.append(belt);
    const speed = index === 0 ? 18 : 21;
    new ResizeObserver(() => belt.style.setProperty('--tool-duration', `${track.offsetWidth / speed}s`)).observe(track);
  });
  const loops = new IntersectionObserver(entries => {
    for (const entry of entries) entry.target.classList.toggle('red-loop-visible', entry.isIntersecting);
  });
  loops.observe($('.wall-viewport'));
  loops.observe(toolkit);
  $$('.ability-card').forEach(card => loops.observe(card));
  const syncVisibility = () => document.documentElement.classList.toggle('red-motion-suspended', document.hidden);
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();

  return { detailScroller: setupDetail(enabled, preference) };
}

function setupProfile(enabled, preference) {
  const frame = $('.profile-frame');
  const card = $('.profile-card', frame);
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  function reset() { card.classList.remove('red-profile-tilting'); }
  frame.addEventListener('pointermove', event => {
    if (!enabled() || !fine.matches || event.pointerType === 'touch') return;
    const rect = frame.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width);
    const y = clamp((event.clientY - rect.top) / rect.height);
    const values = {
      'tilt-x': `${(.5 - y) * 16}deg`,
      'tilt-y': `${(x - .5) * 16}deg`,
      'portrait-x': `${(.5 - x) * 12}px`,
      'portrait-y': `${(.5 - y) * 12}px`,
      'light-x': `${x * 100}%`,
      'light-y': `${y * 100}%`
    };
    for (const [name, value] of Object.entries(values)) card.style.setProperty(`--${name}`, value);
    card.classList.add('red-profile-tilting');
  });
  frame.addEventListener('pointerleave', reset);
  frame.addEventListener('pointercancel', reset);
  preference.addEventListener('change', reset);
  fine.addEventListener('change', reset);
}

function setupDetail(enabled, preference) {
  const sheet = $('#project-detail');
  const scroller = document.createElement('div');
  scroller.className = 'red-detail-scroll';
  scroller.append(...sheet.children);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('red-detail-wave');
  svg.setAttribute('viewBox', '0 0 1000 154');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(svg.namespaceURI, 'path');
  svg.append(path);
  sheet.append(svg, scroller);
  sheet.classList.add('red-wave-ready');

  let frame = 0, height = 0;
  function paint(value) {
    height = value;
    path.style.opacity = clamp(value / 7);
    path.setAttribute('d', value > .35
      ? `M0 134 Q0 124 13 122 Q500 ${122 - 2 * value} 987 122 Q1000 124 1000 134 V154 H0Z`
      : '');
  }
  function reset() { cancelAnimationFrame(frame); paint(0); }
  new MutationObserver(() => {
    cancelAnimationFrame(frame);
    if (!sheet.open || !enabled()) return reset();
    const opening = sheet.classList.contains('is-presented');
    const peak = innerWidth <= 640 ? 65 : 80;
    const start = opening ? peak : height;
    const duration = opening ? 520 : 380;
    const time = performance.now();
    function tick(now) {
      const progress = clamp((now - time) / duration);
      paint(opening ? start * (1 - smooth(progress)) : lerp(start, peak, smooth(progress)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    paint(start);
    frame = requestAnimationFrame(tick);
  }).observe(sheet, { attributes: true, attributeFilter: ['class', 'open'] });
  preference.addEventListener('change', reset);
  return scroller;
}

