const svgNamespace = 'http://www.w3.org/2000/svg';

export function svgNode(tag, attributes = {}) {
  const element = document.createElementNS(svgNamespace, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
}

// Start in the reading area after the opening curtain. Replay when a section
// leaves that area and returns, but keep all copy visible if motion is disabled.
export function arrivals(opening, enabled, edge = .87) {
  const targets = new Map();
  const onScreen = new Set();
  let ready = false;
  let frame = 0;
  function update() {
    frame = 0;
    if (!ready || !enabled()) return;
    const limit = innerHeight * edge;
    const time = performance.now();
    const reading = [...onScreen].map(node => {
      const box = node.getBoundingClientRect();
      return [node, box.bottom > 0 && box.top < limit];
    });
    for (const [node, inBand] of reading) {
      const state = targets.get(node);
      const entering = inBand && !state.inBand;
      state.inBand = inBand;
      if (!entering || time - state.last < 1400 || node.matches(':focus-within')) continue;
      state.last = time;
      state.run();
      if (!state.repeat) {
        observer.unobserve(node);
        onScreen.delete(node);
        targets.delete(node);
      }
    }
  }
  function queue() {
    if (ready && !frame) frame = requestAnimationFrame(update);
  }
  const observer = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!targets.has(target)) continue;
      if (isIntersecting) onScreen.add(target);
      else {
        onScreen.delete(target);
        targets.get(target).inBand = false;
      }
    }
    queue();
  });
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  opening.then(() => {
    ready = true;
    queue();
  });
  return (node, run, repeat = false) => {
    targets.set(node, { run, repeat, inBand: false, last: -Infinity });
    observer.observe(node);
  };
}

export function revealType(node, play, { delay = 0, duration = 690, stagger = 40, offset = 105 } = {}) {
  if (!node.querySelector('.red-glyph')) {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const sources = [];
    while (walker.nextNode()) sources.push(walker.currentNode);
    for (const source of sources) {
      const fragment = document.createDocumentFragment();
      const tokens = source.data.match(/\s+|[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*|./gu) ?? [];
      for (const token of tokens) {
        if (/^\s/u.test(token)) {
          fragment.append(token);
          continue;
        }
        const clip = document.createElement('span');
        clip.className = 'red-glyph-clip';
        for (const letter of token) {
          const glyph = document.createElement('span');
          glyph.className = 'red-glyph';
          glyph.textContent = letter;
          clip.append(glyph);
        }
        fragment.append(clip);
      }
      source.replaceWith(fragment);
    }
  }
  const glyphs = [...node.querySelectorAll('.red-glyph')];
  const step = Math.min(stagger * 1.6, 880 / Math.max(1, glyphs.length - 1));
  return glyphs.map((glyph, index) => {
    glyph.getAnimations().forEach(animation => animation.cancel());
    return play(glyph, [
      { transform: `translateY(${offset}%) rotateX(-72deg)`, opacity: 0, easing: 'cubic-bezier(.25,.47,.26,1)' },
      { transform: 'translateY(-6%) rotateX(7deg)', opacity: 1, offset: .68, easing: 'cubic-bezier(.3,0,.26,1)' },
      { transform: 'translateY(0) rotateX(0)', opacity: 1 }
    ], duration * 1.53, delay + index * step, { easing: 'linear' });
  });
}

export function setupContourLines(enabled, preference) {
  const canvas = document.createElement('canvas');
  canvas.className = 'red-contours';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  if (!context) return;
  const hero = document.querySelector('#S01');
  document.body.prepend(canvas);

  const rows = 54;
  const levels = [.25, .37, .49, .61, .73];
  let cols, values, width, height, frame = 0, last = 0, time = 3.4, queued = false;
  const blend = (a, b, t) => a + (b - a) * t;
  const curve = t => t * t * (3 - 2 * t);
  function random(x, y, z) {
    let value = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1442695041);
    value = Math.imul(value ^ value >>> 13, 1274126177);
    return ((value ^ value >>> 16) >>> 0) / 4294967295;
  }
  function noise(x, y, z) {
    const a = Math.floor(x), b = Math.floor(y), c = Math.floor(z);
    const u = curve(x - a), v = curve(y - b), w = curve(z - c);
    const plane = depth => blend(
      blend(random(a, b, depth), random(a + 1, b, depth), u),
      blend(random(a, b + 1, depth), random(a + 1, b + 1, depth), u), v
    );
    return blend(plane(c), plane(c + 1), w);
  }
  function resize() {
    width = document.documentElement.clientWidth;
    height = innerHeight;
    cols = Math.max(33, Math.min(112, Math.round(rows * width / height)));
    values = new Float32Array((cols + 1) * (rows + 1));
    canvas.width = width;
    canvas.height = height;
    context.lineJoin = 'round';
    context.lineWidth = width > 2800 ? 1.6 : 1.2;
  }
  function paint() {
    const domainX = Math.max(1.65, 2.5 * width / height);
    for (let y = 0; y <= rows; y++) {
      for (let x = 0; x <= cols; x++) {
        const u = x / cols * domainX + 4.65;
        const v = y / rows * 2.5 + 7.4;
        const warp = noise(u * .77, v * .72, time * .63);
        values[y * (cols + 1) + x] = noise(u + warp * .64, v - warp * .7, time) * .77 + warp * .23;
      }
    }
    context.clearRect(0, 0, width, height);
    const dx = width / cols, dy = height / rows;
    for (const [index, level] of levels.entries()) {
      context.beginPath();
      context.strokeStyle = index % 2 ? '#f34d3642' : '#e83d2932';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const point = y * (cols + 1) + x;
          const a = values[point], b = values[point + 1];
          const d = values[point + cols + 1], c = values[point + cols + 2];
          const top = (a < level) !== (b < level);
          const right = (b < level) !== (c < level);
          const bottom = (d < level) !== (c < level);
          const left = (a < level) !== (d < level);
          if (!top && !right && !bottom && !left) continue;
          const edges = [];
          if (top) edges.push([(x + (level - a) / (b - a)) * dx, y * dy]);
          if (right) edges.push([(x + 1) * dx, (y + (level - b) / (c - b)) * dy]);
          if (bottom) edges.push([(x + (level - d) / (c - d)) * dx, (y + 1) * dy]);
          if (left) edges.push([x * dx, (y + (level - a) / (d - a)) * dy]);
          if (edges.length === 4 && ((a + b + c + d) / 4 < level) === (a < level)) edges.push(edges.shift());
          for (let edge = 0; edge < edges.length; edge += 2) {
            context.moveTo(...edges[edge]);
            context.lineTo(...edges[edge + 1]);
          }
        }
      }
      context.stroke();
    }
  }
  function tick(now) {
    if (now - last >= 33) {
      time += last ? Math.min(now - last, 66) * .00012 : 0;
      last = now;
      paint();
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    queued = false;
    const running = enabled() && !document.hidden && hero.getBoundingClientRect().bottom < innerHeight;
    if (running && !frame) frame = requestAnimationFrame(tick);
    if (!running && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    }
  }
  function queue() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(sync);
    }
  }
  resize();
  sync();
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', () => { resize(); queue(); });
  document.addEventListener('visibilitychange', sync);
  preference.addEventListener('change', sync);
}

export function setupSpecularButtons(enabled) {
  const targets = document.querySelectorAll('button:not(.red-fan-card), .site-header a, .career-links a, .profile-info a, .footer-meta a');
  for (const button of targets) {
    const light = document.createElement('span');
    light.className = 'red-specular-light';
    light.setAttribute('aria-hidden', 'true');
    button.classList.add('red-specular');
    if (button.matches('button:not(.red-fan-card), .header-contact, .profile-info a, .career-links a, .footer-meta a')) {
      button.classList.add('red-glass-button');
    }
    button.prepend(light);
  }
  document.addEventListener('pointermove', event => {
    if (!enabled() || event.pointerType === 'touch') return;
    const button = event.target.closest('.red-specular');
    if (!button) return;
    const box = button.getBoundingClientRect();
    const x = Math.max(0, Math.min(box.width, event.clientX - box.left));
    const y = Math.max(0, Math.min(box.height, event.clientY - box.top));
    const edge = Math.min(x, y, box.width - x, box.height - y);
    button.style.setProperty('--spec-x', `${(edge === x ? 0 : edge === box.width - x ? 100 : x / box.width * 100)}%`);
    button.style.setProperty('--spec-y', `${(edge === y ? 0 : edge === box.height - y ? 100 : y / box.height * 100)}%`);
  }, { passive: true });
}

export function setupCareerType(arrive, enabled, preference) {
  const career = document.querySelector('#S03');
  const segmenter = new Intl.Segmenter('zh', { granularity: 'grapheme' });
  const active = new Map();

  function makeField(node, speed) {
    const original = document.createElement('span');
    original.className = 'red-type-source';
    original.append(...node.childNodes);
    const output = document.createElement('span');
    output.className = 'red-type-output';
    output.setAttribute('aria-hidden', 'true');
    const glyphs = [...segmenter.segment(original.textContent)].map(({ segment }) => {
      const glyph = document.createElement('span');
      glyph.className = 'red-type-ink';
      glyph.textContent = segment;
      return glyph;
    });
    output.append(...glyphs);
    node.classList.add('red-type-field');
    if (enabled()) node.classList.add('red-type-pending');
    node.append(original, output);
    return { node, glyphs, speed, cursor: null, shown: 0 };
  }

  function run(target, fields, counter, offset = 0) {
    active.get(target)?.();
    let frame = 0;
    let delay = (counter ? 1720 : 0) + offset;
    if (counter) counter.year.classList.add('red-counting');
    const schedule = fields.map(field => {
      const start = delay;
      delay += field.glyphs.length * field.speed + 115;
      field.shown = 0;
      field.cursor = null;
      field.glyphs.forEach(glyph => glyph.classList.remove('is-lit', 'is-caret'));
      field.node.classList.remove('red-type-pending');
      field.node.classList.add('red-typing');
      return { field, start, finish: delay };
    });

    function settle() {
      cancelAnimationFrame(frame);
      active.delete(target);
      if (counter) {
        counter.value.textContent = counter.to;
        counter.year.classList.remove('red-counting');
      }
      for (const { field } of schedule) {
        field.cursor?.classList.remove('is-caret');
        field.node.classList.remove('red-typing');
      }
    }
    active.set(target, settle);
    const began = performance.now();
    function tick(now) {
      if (!enabled()) return settle();
      const elapsed = now - began;
      if (counter) {
        const t = Math.max(0, Math.min(1, (elapsed - offset) / 1530));
        counter.value.textContent = Math.round(counter.to - 32 * (1 - t) ** 2.15);
        if (t === 1) counter.year.classList.remove('red-counting');
      }
      for (const { field, start, finish } of schedule) {
        if (elapsed < start) continue;
        if (elapsed >= finish) {
          field.cursor?.classList.remove('is-caret');
          field.cursor = null;
          field.node.classList.remove('red-typing');
          continue;
        }
        const count = Math.min(field.glyphs.length, 1 + Math.floor((elapsed - start) / field.speed));
        if (count === field.shown) continue;
        field.cursor?.classList.remove('is-caret');
        for (let index = field.shown; index < count; index++) field.glyphs[index].classList.add('is-lit');
        field.shown = count;
        field.cursor = field.glyphs[count - 1];
        field.cursor?.classList.add('is-caret');
      }
      if (elapsed < delay) frame = requestAnimationFrame(tick);
      else settle();
    }
    frame = requestAnimationFrame(tick);
  }

  [...career.querySelectorAll('.timeline-group')].forEach((group, index) => {
    const year = group.querySelector('.timeline-year');
    const to = Number(year.textContent);
    const original = document.createElement('span');
    original.className = 'red-count-source';
    original.append(...year.childNodes);
    const value = document.createElement('span');
    value.className = 'red-count-value';
    value.setAttribute('aria-hidden', 'true');
    value.textContent = to;
    year.append(original, value);
    const fields = [...group.querySelectorAll('.timeline-date, .timeline-card h4, .timeline-role, .timeline-description')]
      .map(node => makeField(node, node.tagName === 'H4' ? 66 : 42));
    arrive(group, () => run(group, fields, { year, to, value }, 120 * index));
  });
  preference.addEventListener('change', () => {
    if (!enabled()) for (const settle of active.values()) settle();
  });
}

export function setupTechTitle(title, arrive, play) {
  const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
  const sources = [];
  while (walker.nextNode()) sources.push(walker.currentNode);
  const letters = [];
  for (const source of sources) {
    const fragment = document.createDocumentFragment();
    for (const letter of source.data) {
      if (letter === ' ') { fragment.append(letter); continue; }
      const tile = document.createElement('span');
      tile.className = 'red-tech-letter';
      const ink = document.createElement('span');
      ink.className = 'red-tech-ink';
      ink.textContent = letter;
      const overlay = svgNode('svg', { class: 'red-tech-outline', 'aria-hidden': 'true' });
      const trace = svgNode('text', { y: '0', 'font-size': '100' });
      trace.textContent = letter;
      overlay.append(trace);
      const note = document.createElement('span');
      note.className = 'red-tech-size';
      note.setAttribute('aria-hidden', 'true');
      tile.append(ink, overlay, note);
      letters.push({ tile, overlay, trace, note, letter });
      fragment.append(tile);
    }
    source.replaceWith(fragment);
  }
  function measure() {
    for (const { tile, overlay, trace, note, letter } of letters) {
      const bounds = trace.getBBox();
      if (bounds.width) overlay.setAttribute('viewBox', `${bounds.x - 2} ${bounds.y - 2} ${bounds.width + 4} ${bounds.height + 4}`);
      note.textContent = `${letter} · ${tile.offsetWidth}×${Math.round(bounds.height / 100 * parseFloat(getComputedStyle(title).fontSize))}`;
    }
  }
  document.fonts.ready.then(measure);
  new ResizeObserver(measure).observe(title);
  arrive(title, () => letters.forEach(({ tile }, index) => {
    play(tile, [{ '--tech-scan': 0 }, { '--tech-scan': 1, offset: .31 }, { '--tech-scan': 0 }], 970, index * 110, { fill: 'none' });
  }), true);
}
