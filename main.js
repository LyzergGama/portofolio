/* ============================================================
   main.js — Interactions, Carousel, Cursor, Scroll Effects
   Depends on: projects[] defined in js/projects.js
============================================================ */

/* ── DOM REFS ───────────────────────────────────────────── */
const mediaStack  = document.getElementById('media-stack');
const peekStrip   = document.getElementById('peek-strip');
const infoInner   = document.getElementById('info-inner');
const btnNext     = document.getElementById('btn-next');
const btnPrev     = document.getElementById('btn-prev');
const progressBar = document.getElementById('prog');

/* ── YOUTUBE HELPER ─────────────────────────────────────────
   Accepts any YouTube URL format:
     https://www.youtube.com/watch?v=XXXXXXXXXXX
     https://youtu.be/XXXXXXXXXXX
     https://youtube.com/shorts/XXXXXXXXXXX
   Returns the embed iframe src with autoplay + mute.
─────────────────────────────────────────────────────────── */
function getYouTubeId(url) {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function makeYouTubeEmbed(url) {
  const id = getYouTubeId(url);
  if (!id) return null;
  // autoplay=1, mute=1, loop=1, controls=0 for clean look
  // playlist=id needed for loop to work
  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0&playsinline=1`;
}

/* ── BUILD CAROUSEL DOM ─────────────────────────────────── */
projects.forEach((project, i) => {
  const slide = document.createElement('div');
  slide.className = 'media-item' + (i === 0 ? ' active' : '');
  slide.dataset.index = i;

  if (project.type === 'youtube') {
    // YouTube: use iframe embed, only load src when active (performance)
    const embedUrl = makeYouTubeEmbed(project.src);
    slide.innerHTML = `
      <iframe
        class="yt-iframe"
        src="${i === 0 ? embedUrl : ''}"
        data-src="${embedUrl}"
        frameborder="0"
        allow="autoplay; encrypted-media"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      ></iframe>`;

  } else if (project.type === 'video') {
    slide.innerHTML = `<video src="${project.src}" autoplay muted loop playsinline></video>`;

  } else {
    slide.innerHTML = `<img src="${project.src}" alt="${project.title}" loading="${i === 0 ? 'eager' : 'lazy'}" />`;
  }

  mediaStack.appendChild(slide);

  // ── Peek thumbnail ───────────────────────────────────────
  const thumb = document.createElement('div');
  thumb.className = 'peek-thumb' + (i === 0 ? ' active-peek' : '');
  thumb.dataset.index = i;

  // For YouTube, use the auto-generated thumbnail image
  if (project.type === 'youtube') {
    const id = getYouTubeId(project.src);
    thumb.innerHTML = `<img src="https://img.youtube.com/vi/${id}/mqdefault.jpg" alt="${project.title}" loading="lazy" />`;
  } else if (project.type === 'video') {
    thumb.innerHTML = `<video src="${project.src}" muted preload="none"></video>`;
  } else {
    thumb.innerHTML = `<img src="${project.src}" alt="${project.title}" loading="lazy" />`;
  }

  thumb.addEventListener('click', () => goTo(i));
  peekStrip.appendChild(thumb);
});

/* ── CAROUSEL STATE ─────────────────────────────────────── */
let current   = 0;
let animating = false;
const total   = projects.length;

function pad(n) {
  return String(n + 1).padStart(2, '0');
}

/* ── UPDATE INFO PANEL ──────────────────────────────────── */
function updateInfo(idx) {
  const p = projects[idx];

  infoInner.classList.remove('entered');

  setTimeout(() => {
    document.getElementById('info-cat').textContent   = p.category;
    document.getElementById('info-title').textContent = p.title;
    document.getElementById('info-desc').textContent  = p.desc;
    document.getElementById('ghost-num').textContent  = pad(idx);

    document.getElementById('slide-counter').innerHTML =
      `<span class="cur">${pad(idx)}</span> / ${pad(total - 1)}`;

    document.getElementById('works-count').textContent =
      `— ${pad(idx)} / ${pad(total - 1)}`;

    let meta = '';
    if (p.year)   meta += `<div class="meta-item"><div class="meta-label">Year</div><div class="meta-val">${p.year}</div></div>`;
    if (p.role)   meta += `<div class="meta-item"><div class="meta-label">Role</div><div class="meta-val">${p.role}</div></div>`;
    if (p.client) meta += `<div class="meta-item"><div class="meta-label">Client</div><div class="meta-val">${p.client}</div></div>`;
    document.getElementById('info-meta').innerHTML = meta;

    requestAnimationFrame(() => infoInner.classList.add('entered'));
  }, 120);
}

/* ── UPDATE MEDIA STACK ─────────────────────────────────── */
function updateMedia(newIdx, oldIdx) {
  const slides = mediaStack.querySelectorAll('.media-item');

  // Lazy-load YouTube iframe when it becomes active
  const newSlide = slides[newIdx];
  const iframe   = newSlide.querySelector('iframe.yt-iframe');
    if (iframe && iframe.getAttribute('src') === '') {
      iframe.src = iframe.dataset.src;
    }

  slides[oldIdx].classList.remove('active');
  slides[oldIdx].classList.add('prev');
  setTimeout(() => slides[oldIdx].classList.remove('prev'), 900);
  newSlide.classList.add('active');
}

/* ── UPDATE PEEK THUMBNAILS ─────────────────────────────── */
function updatePeeks(idx) {
  document.querySelectorAll('.peek-thumb').forEach((thumb, i) => {
    thumb.classList.toggle('active-peek', i === idx);
  });
}

/* ── GO TO SLIDE ────────────────────────────────────────── */
function goTo(newIdx) {
  if (animating || newIdx === current) return;
  animating = true;

  const old = current;
  current = ((newIdx % total) + total) % total;

  updateMedia(current, old);
  updateInfo(current);
  updatePeeks(current);

  setTimeout(() => { animating = false; }, 750);
}

/* ── INITIALISE ─────────────────────────────────────────── */
updateInfo(0);

/* ── BUTTON CONTROLS ────────────────────────────────────── */
btnNext.addEventListener('click', () => goTo(current + 1));
btnPrev.addEventListener('click', () => goTo(current - 1));

/* ── KEYBOARD NAVIGATION ────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') goTo(current + 1);
  if (e.key === 'ArrowLeft')  goTo(current - 1);
});

/* ── TOUCH SWIPE ON MEDIA ───────────────────────────────── */
let swipeStartX = null;

mediaStack.addEventListener('touchstart', e => {
  swipeStartX = e.touches[0].clientX;
}, { passive: true });

mediaStack.addEventListener('touchend', e => {
  if (swipeStartX === null) return;
  const delta = e.changedTouches[0].clientX - swipeStartX;
  if (Math.abs(delta) > 50) goTo(current + (delta < 0 ? 1 : -1));
  swipeStartX = null;
});

/* ── CUSTOM CURSOR ──────────────────────────────────────── */
const cursorDot  = document.getElementById('c-dot');
const cursorRing = document.getElementById('c-ring');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

(function tickCursor() {
  ringX += (mouseX - ringX) * 0.13;
  ringY += (mouseY - ringY) * 0.13;
  cursorDot.style.transform  = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
  requestAnimationFrame(tickCursor);
})();

document.querySelectorAll('a, button, .peek-thumb').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('hov'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('hov'));
});

/* ── SCROLL PROGRESS BAR ────────────────────────────────── */
window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  progressBar.style.width = pct + '%';
});

/* ── SCROLL REVEAL ──────────────────────────────────────── */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('vis');
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));