import { createCarouselLens } from './carousel-lens.js?v=full-width-carousel';

const mediaRoot = 'assets/ecommerce/showcase/';
const gap = 12;
const pad = number => String(number).padStart(2, '0');
const wrap = (value, size) => ((value % size) + size) % size;

export function initEcommerceShowcase(showcase, preference) {
  const carousel = document.querySelector('[data-ecommerce-carousel]');
  const stage = carousel.querySelector('.ecommerce-carousel-stage');
  const track = carousel.querySelector('.ecommerce-carousel-track');
  const playMark = stage.querySelector('.ecommerce-carousel-current-play');
  const title = carousel.querySelector('.ecommerce-caption-title');
  const english = carousel.querySelector('.ecommerce-caption-english');
  const count = carousel.querySelector('.ecommerce-caption-count');
  const section = carousel.closest('section');
  const dialog = section.querySelector('.ecommerce-media-dialog');
  const dialogTitle = dialog.querySelector('h3');
  const dialogMedia = dialog.querySelector('.ecommerce-dialog-media');
  const promo = section.querySelector('.ecommerce-promo-player');
  const promoFrame = promo.parentElement;
  const items = [
    ...showcase.imageGroups.flatMap(group => group.images.map(number => ({
      title: group.title, english: group.english, file: `${group.prefix}-${number}`
    }))),
    ...showcase.clips.map(clip => ({ ...clip, video: true }))
  ];
  const cards = items.map((item, index) => {
    const card = document.createElement('div');
    card.className = 'ecommerce-carousel-card';
    card.dataset.carouselIndex = index;
    const image = new Image();
    image.alt = '';
    image.draggable = false;
    image.decoding = 'async';
    image.addEventListener('load', invalidate);
    card.append(image);
    if (item.video) {
      const play = document.createElement('span');
      play.className = 'ecommerce-carousel-play';
      play.textContent = '▶';
      card.append(play);
    }
    track.append(card);
    return card;
  });
  promo.src = `${mediaRoot}${showcase.promo.file}.mp4`;
  promo.poster = `${mediaRoot}${showcase.promo.file}.webp`;

  let width = 0;
  let height = 0;
  let layout;
  let position = 0;
  let goal = 0;
  let velocity = 0;
  let wheelAt = 0;
  let frame = 0;
  let lastTime = 0;
  let lastPosition = 0;
  let energy = 0;
  let revealAt;
  let introduced = preference.matches;
  let visible = false;
  let pointer;
  let opener;
  let selected = -1;
  let visibleCards = [];
  const lens = createCarouselLens(track, invalidate);

  function offset(distance) {
    return wrap(distance + layout.length / 2, layout.length) - layout.length / 2;
  }

  function nearest(at) {
    return layout.centers.reduce((best, center, index) =>
      Math.abs(offset(center - at)) < Math.abs(offset(layout.centers[best] - at)) ? index : best, 0);
  }

  function snap(at) {
    return at + offset(layout.centers[nearest(at)] - at);
  }

  function updateCaption(index) {
    if (selected === index) return;
    selected = index;
    title.textContent = items[index].title;
    english.textContent = items[index].english;
    count.textContent = `${pad(index + 1)} / ${pad(items.length)}`;
  }

  function render(progress = 1) {
    visibleCards = [];
    const scale = 1 - .2 * energy;
    const cardHeight = layout.height * scale;
    const centerY = height / 2 + (1 - progress) * layout.height * .82;
    const active = nearest(position);
    const halfViewport = width / 2 + Math.max(width * .16, 24);
    for (const [index, card] of cards.entries()) {
      const distance = offset(layout.centers[index] - position);
      const cardWidth = layout.widths[index] * scale;
      card.hidden = Math.abs(distance) > halfViewport + cardWidth / 2;
      if (card.hidden) continue;
      const image = card.firstElementChild;
      if (!image.hasAttribute('src')) image.src = `${mediaRoot}${items[index].file}.webp`;
      card.style.setProperty('--card-offset', `${distance}px`);
      card.style.setProperty('--card-width', `${cardWidth}px`);
      card.style.setProperty('--card-height', `${cardHeight}px`);
      card.style.top = `${centerY}px`;
      visibleCards.push({
        image, index, x: (width - cardWidth) / 2 + distance, y: centerY - cardHeight / 2,
        width: cardWidth, height: cardHeight, radius: 25
      });
    }
    track.style.opacity = Math.min(progress * 3, 1);
    lens?.draw(visibleCards, preference.matches ? 0 : progress);
    playMark.hidden = !(lens?.available && items[active].video && Math.abs(goal - position) < 12 && progress > .95);
  }

  function tick(now) {
    frame = 0;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, .035) : 1 / 60;
    lastTime = now;
    if (wheelAt && now - wheelAt > 150) {
      wheelAt = 0;
      goal = snap(goal);
      updateCaption(nearest(goal));
    }
    if (!pointer?.dragging) {
      const stiffness = wheelAt ? 80 : 55;
      const steps = Math.ceil(dt * 240);
      const stepTime = dt / steps;
      for (let step = 0; step < steps; step++) {
        velocity += (stiffness * (goal - position) - 2 * Math.sqrt(stiffness) * velocity) * stepTime;
        position += velocity * stepTime;
      }
    }
    const energyTarget = preference.matches ? 0 : Math.min(Math.abs(position - lastPosition) / dt / 2600, 1);
    energy += (energyTarget - energy) * (1 - Math.exp(-dt / (energyTarget > energy ? .07 : .35)));
    lastPosition = position;
    const moving = Math.abs(goal - position) >= .05 || Math.abs(velocity) >= .5;
    if (!moving) {
      position = goal;
      velocity = 0;
    }
    const linear = introduced ? 1 : Math.min((now - (revealAt ??= now)) / 2100, 1);
    introduced = linear === 1;
    render(1 - (1 - linear) ** 5);
    if (wheelAt || moving || energy > .001 || !introduced || pointer?.dragging) invalidate();
    else lastTime = 0;
  }

  function invalidate() {
    if (visible && layout && !frame) frame = requestAnimationFrame(tick);
  }

  function finishIntro() {
    introduced = true;
    track.style.opacity = 1;
  }

  function select(at) {
    finishIntro();
    wheelAt = 0;
    goal = snap(at);
    updateCaption(nearest(goal));
    if (preference.matches) {
      velocity = 0;
      position = goal;
      lastPosition = goal;
    }
    invalidate();
  }

  function step(direction) {
    if (!layout) return;
    const index = wrap(nearest(goal) + direction, items.length);
    select(goal + offset(layout.centers[index] - goal));
  }

  function openMedia(item, trigger, video) {
    opener = trigger;
    dialogTitle.textContent = item.title;
    dialog.classList.toggle('is-portrait', Boolean(item.video));
    dialog.classList.toggle('is-promo', video === promo);
    const wasPlaying = video && !video.paused;
    const media = video ?? (item.video ? document.createElement('video') : new Image());
    if (!video) {
      media.src = `${mediaRoot}${item.file}.${item.video ? 'mp4' : 'webp'}`;
      if (item.video) {
        media.controls = true;
        media.playsInline = true;
        media.poster = `${mediaRoot}${item.file}.webp`;
        media.setAttribute('aria-label', item.title);
      } else {
        media.alt = item.title;
      }
    }
    dialogMedia.append(media);
    dialog.showModal();
    if (wasPlaying || item.video) media.play().catch(() => {});
  }

  dialog.addEventListener('close', () => {
    const media = dialogMedia.firstElementChild;
    if (media === promo) {
      const wasPlaying = !promo.paused;
      promoFrame.append(promo);
      if (wasPlaying) promo.play().catch(() => {});
    } else if (media instanceof HTMLVideoElement) {
      media.pause();
      media.removeAttribute('src');
      media.load();
    }
    dialogMedia.replaceChildren();
    opener?.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  const expand = section.querySelector('.ecommerce-promo-expand');
  expand.addEventListener('click', () => openMedia(showcase.promo, expand, promo));

  carousel.querySelectorAll('[data-carousel-step]').forEach(button => {
    button.addEventListener('click', () => step(Number(button.dataset.carouselStep)));
  });
  stage.addEventListener('keydown', event => {
    if (!layout) return;
    const steps = { ArrowLeft: -1, ArrowRight: 1 };
    if (event.key in steps) {
      event.preventDefault();
      step(steps[event.key]);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openMedia(items[nearest(goal)], stage);
    }
  });

  stage.addEventListener('wheel', event => {
    if (!layout || event.ctrlKey) return;
    const horizontal = event.shiftKey ? event.deltaX || event.deltaY : event.deltaX;
    if (!horizontal || (!event.shiftKey && Math.abs(horizontal) <= Math.abs(event.deltaY))) return;
    event.preventDefault();
    if (preference.matches) {
      step(Math.sign(horizontal));
      return;
    }
    finishIntro();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1;
    goal += Math.max(-120, Math.min(120, horizontal * unit)) * 1.25;
    updateCaption(nearest(goal));
    wheelAt = performance.now();
    invalidate();
  }, { passive: false });

  stage.addEventListener('pointerdown', event => {
    if (!layout || !event.isPrimary || event.button !== 0) return;
    finishIntro();
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, start: position, samples: [] };
    invalidate();
  });

  stage.addEventListener('pointermove', event => {
    if (event.pointerId !== pointer?.id) return;
    const distance = event.clientX - pointer.x;
    if (!pointer.dragging) {
      if (Math.abs(distance) < (event.pointerType === 'touch' ? 10 : 5)) return;
      if (event.pointerType === 'touch' && Math.abs(event.clientY - pointer.y) > Math.abs(distance)) return;
      pointer.dragging = true;
      pointer.start = position;
      stage.setPointerCapture(pointer.id);
      stage.classList.add('is-dragging');
    }
    position = goal = pointer.start - distance;
    velocity = 0;
    wheelAt = 0;
    const time = performance.now();
    pointer.samples.push({ position, time });
    while (pointer.samples.length > 2 && time - pointer.samples[0].time > 100) pointer.samples.shift();
    updateCaption(nearest(position));
    invalidate();
  });

  stage.addEventListener('pointerup', event => {
    if (event.pointerId !== pointer?.id) return;
    if (pointer.dragging) {
      const first = pointer.samples[0];
      const last = pointer.samples.at(-1);
      if (!preference.matches && last.time > first.time && performance.now() - last.time < 70) {
        velocity = Math.max(-2200, Math.min(2200, 1000 * (last.position - first.position) / (last.time - first.time)));
      }
      select(position + velocity * .32);
    } else {
      const box = stage.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      const hit = visibleCards.find(card => x >= card.x && x <= card.x + card.width
        && Math.abs(y - height / 2) <= card.height / 2 + (lens?.available ? height * .21 : 0));
      if (hit) {
        if (hit.index === nearest(goal)) openMedia(items[hit.index], stage);
        else select(goal + offset(layout.centers[hit.index] - goal));
      }
    }
    pointer = undefined;
    stage.classList.remove('is-dragging');
  });

  for (const event of ['pointercancel', 'lostpointercapture']) {
    stage.addEventListener(event, () => {
      if (!pointer) return;
      if (pointer.dragging) select(position);
      pointer = undefined;
      stage.classList.remove('is-dragging');
    });
  }

  new ResizeObserver(([{ contentRect }]) => {
    if (!contentRect.width || !contentRect.height) return;
    width = contentRect.width;
    height = contentRect.height;
    const cardHeight = height * .45;
    const widths = items.map(item => cardHeight * (item.video ? 9 / 16 : 1));
    let length = 0;
    const centers = widths.map(cardWidth => {
      const center = length + cardWidth / 2;
      length += cardWidth + gap;
      return center;
    });
    layout = { height: cardHeight, widths, centers, length };
    velocity = 0;
    position = goal = lastPosition = centers[Math.max(selected, 0)];
    updateCaption(nearest(position));
    lens?.resize(width, height);
    invalidate();
  }).observe(stage);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) invalidate();
    else {
      cancelAnimationFrame(frame);
      frame = lastTime = 0;
    }
  }).observe(stage);
  preference.addEventListener('change', () => {
    if (layout && preference.matches) select(goal);
    invalidate();
  });
}
