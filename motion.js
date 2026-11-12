'use strict';

if (!redReview) {
// Each group starts once. Its text parts arrive in reading order.
const revealObserver = new IntersectionObserver(entries => {
  for (const { target, isIntersecting } of entries) {
    if (!isIntersecting) continue;
    if (!reducedMotion.matches) {
      if (target.matches('.hero')) target.classList.add('motion-intro');
      else if (target.matches('.profile-card')) target.classList.add('portrait-intro');
      else target.classList.add('is-revealed');
    } else if (target.classList.contains('motion-reveal')) {
      target.classList.add('is-revealed');
    }
    revealObserver.unobserve(target);
  }
}, { rootMargin: '0px 0px -64px 0px' });

function prepareReveal(group, parts = [group], interval = 100) {
  group.classList.add('motion-reveal');
  Array.from(parts).forEach((part, index) => {
    part.classList.add('reveal-piece');
    if (index) part.style.setProperty('--reveal-delay', `${index * interval}ms`);
  });
  revealObserver.observe(group);
}

for (const heading of document.querySelectorAll('.chapter-heading')) {
  prepareReveal(heading, heading.querySelectorAll(
    '.chapter-number, .chapter-english, .chapter-phrase, .chapter-chinese:not(:has(.chapter-phrase)), .chapter-description'
  ), 110);
}
for (const copy of document.querySelectorAll('.project-copy, .ability-copy')) {
  prepareReveal(copy, copy.children, 135);
}
for (const group of document.querySelectorAll(
  '.timeline-group, .education, .career-links, .project-info-top'
)) prepareReveal(group);
revealObserver.observe(document.querySelector('.hero'));

// Pause loops as soon as their viewport leaves the page.
const loopObserver = new IntersectionObserver(entries => {
  for (const { target, isIntersecting } of entries) {
    target.classList.toggle('motion-in-view', isIntersecting);
  }
});
for (const loop of document.querySelectorAll('.wall-viewport, .workflow-preview')) {
  loopObserver.observe(loop);
}

const toolkit = document.querySelector('.toolkit-list');
for (const track of toolkit.querySelectorAll('.toolkit-track')) {
  const viewport = document.createElement('div');
  viewport.className = 'toolkit-window';
  const belt = document.createElement('div');
  belt.className = 'toolkit-belt';
  const copy = track.cloneNode(true);
  copy.classList.add('toolkit-repeat');
  copy.setAttribute('aria-hidden', 'true');
  track.before(viewport);
  belt.append(track, copy);
  viewport.append(belt);
}
loopObserver.observe(toolkit);

// Tilt the visual card against a stationary pointer target. Touch stays static.
const profileFrame = document.querySelector('.profile-frame');
const profile = profileFrame.querySelector('.profile-card');
const finePointer = matchMedia('(min-width: 641px) and (hover: hover) and (pointer: fine)');
const resetProfile = () => {
  profile.classList.remove('is-tilting');
  for (const name of ['tilt-x', 'tilt-y', 'portrait-x', 'portrait-y', 'light-x', 'light-y']) {
    profile.style.removeProperty(`--${name}`);
  }
};
profileFrame.addEventListener('pointermove', event => {
  if (event.pointerType === 'touch' || !finePointer.matches || reducedMotion.matches) return;
  const { left, top, width, height } = profileFrame.getBoundingClientRect();
  const x = (event.clientX - left) / width;
  const y = (event.clientY - top) / height;
  profile.classList.add('is-tilting');
  profile.style.setProperty('--tilt-x', `${(0.5 - y) * 11}deg`);
  profile.style.setProperty('--tilt-y', `${(x - 0.5) * 13}deg`);
  profile.style.setProperty('--portrait-x', `${(x - 0.5) * -9}px`);
  profile.style.setProperty('--portrait-y', `${(y - 0.5) * -9}px`);
  profile.style.setProperty('--light-x', `${x * 100}%`);
  profile.style.setProperty('--light-y', `${y * 100}%`);
});
profileFrame.addEventListener('pointerleave', resetProfile);
profileFrame.addEventListener('pointercancel', resetProfile);
finePointer.addEventListener('change', resetProfile);
if (finePointer.matches) revealObserver.observe(profile);

// Read the next case's natural position from the list, independently of its pin.
const stack = document.querySelector('#project-list');
const cases = [...stack.querySelectorAll('.project-case')];
const header = document.querySelector('.site-header');
let caseLayout = [];
let stackVisible = false;
let stackFrame = 0;

function updateStack() {
  stackFrame = 0;
  if (reducedMotion.matches || !stackVisible) return;
  const listTop = stack.getBoundingClientRect().top;
  const scaleDepth = window.innerWidth > 640 ? .095 : .05;
  const scales = caseLayout.slice(1).map((next, index) => {
    const current = caseLayout[index];
    const nextTop = listTop + next.offset;
    const currentBottom = current.pin + current.height;
    const distance = Math.max(1, currentBottom - next.pin);
    const progress = Math.min(1, Math.max(0, (currentBottom - nextTop) / distance));
    const eased = progress * progress * (3 - 2 * progress);
    return 1 - eased * scaleDepth;
  });
  scales.forEach((scale, index) => cases[index].style.setProperty('--project-scale', scale));
}

function queueStack() {
  if (stackVisible && !reducedMotion.matches && !stackFrame) stackFrame = requestAnimationFrame(updateStack);
}

function measureStack() {
  const headerBottom = header.offsetHeight + 12;
  const viewportBottom = document.documentElement.clientHeight - 16;
  const gap = parseFloat(getComputedStyle(stack).rowGap);
  let offset = 0;
  caseLayout = cases.map(card => {
    const height = parseFloat(getComputedStyle(card).height);
    const layout = { offset, height, pin: Math.min(headerBottom, viewportBottom - height) };
    offset += height + gap;
    return layout;
  });
  cases.forEach((card, index) => card.style.setProperty('--project-pin', `${caseLayout[index].pin}px`));
  queueStack();
}

function setStackMode() {
  stack.classList.toggle('motion-stack', !reducedMotion.matches);
  if (!reducedMotion.matches) measureStack();
  resetProfile();
}
setStackMode();
reducedMotion.addEventListener('change', setStackMode);
const stackResize = new ResizeObserver(measureStack);
cases.forEach(card => stackResize.observe(card));
window.addEventListener('resize', measureStack);
window.addEventListener('scroll', queueStack, { passive: true });
stack.addEventListener('focusin', ({ target }) => {
  if (reducedMotion.matches || !target.matches('.project-open:focus-visible')) return;
  requestAnimationFrame(() => {
    if (document.activeElement !== target || reducedMotion.matches) return;
    const box = target.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    if (target.contains(hit)) return;
    const card = target.closest('.project-case');
    const { offset, pin } = caseLayout[cases.indexOf(card)];
    window.scrollTo(0, scrollY + stack.getBoundingClientRect().top + offset - pin);
  });
});
new IntersectionObserver(([entry]) => {
  stackVisible = entry.isIntersecting;
  queueStack();
}).observe(stack);
}
