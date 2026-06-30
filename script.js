/* ============================================================
   NAV — mobile toggle + active link highlight
   ============================================================ */
const navToggle = document.getElementById('navToggle');
const navMobile = document.getElementById('navMobile');
navToggle.addEventListener('click', () => {
  const isOpen = navMobile.classList.toggle('is-open');
  navToggle.classList.toggle('is-active', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen);
});
document.querySelectorAll('.nav__mobile a').forEach(a => {
  a.addEventListener('click', () => {
    navMobile.classList.remove('is-open');
    navToggle.classList.remove('is-active');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

/* ============================================================
   THEME TOGGLE
   ============================================================ */
const themeToggle = document.getElementById('theme-toggle');
const themeStorageKey = 'portfolio-theme';

function applyTheme(theme){
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', nextTheme);
  if (themeToggle){
    themeToggle.setAttribute('aria-pressed', nextTheme === 'dark' ? 'true' : 'false');
    themeToggle.setAttribute('aria-label', nextTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    themeToggle.title = nextTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  }
}

const savedTheme = localStorage.getItem(themeStorageKey);
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
applyTheme(savedTheme || systemTheme);

if (themeToggle){
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(themeStorageKey, nextTheme);
    applyTheme(nextTheme);
  });
}

/* ============================================================
   SCROLL PROGRESS RAIL
   ============================================================ */
const scrollFill = document.getElementById('scrollFill');
function updateScrollRail(){
  const h = document.documentElement;
  const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
  scrollFill.style.width = scrolled + '%';
}
document.addEventListener('scroll', updateScrollRail, { passive: true });
updateScrollRail();

/* ============================================================
   SCROLL REVEAL — IntersectionObserver based fade/slide-in
   ============================================================ */
const revealTargets = document.querySelectorAll(
  '.section__head, .about__photo, .about__copy, .skill-card, .timeline__item, .project-card, .design__tile, .edu__item, .hobby, .contact__info, .contact__form'
);
revealTargets.forEach(el => el.classList.add('reveal'));

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting){
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

revealTargets.forEach(el => io.observe(el));

/* ============================================================
   CONTACT FORM — front-end only, no backend
   ============================================================ */
const contactForm = document.getElementById('contactForm');
const contactStatus = document.getElementById('contactStatus');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  // No backend is wired up. Hook this up to your own endpoint, formspree, etc.
  contactStatus.textContent = 'Message captured locally — connect a backend or service (e.g. Formspree) to actually send this.';
  contactForm.reset();
});

/* ============================================================
   THREE.JS — wireframe icosahedron "CAD viewport" hero object
   Subtle, performance-conscious: low poly count, capped pixel ratio,
   pauses when off-screen, respects prefers-reduced-motion.
   ============================================================ */
(function initHeroScene(){
  const canvas = document.getElementById('heroCanvas');
  const viewport = document.querySelector('.hero__viewport');
  const rotCoord = document.getElementById('rotCoord');
  if (!canvas || typeof THREE === 'undefined') return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);

  // Core wireframe geometry — icosahedron reads as a technical "node" object
  const coreGeo = new THREE.IcosahedronGeometry(1.7, 1);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0x4C84B0, wireframe: true, transparent: true, opacity: 0.85 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);

  // Inner solid-ish faint fill for depth, very subtle
  const fillMat = new THREE.MeshBasicMaterial({ color: 0x0B1D3A, transparent: true, opacity: 0.08 });
  const fill = new THREE.Mesh(coreGeo, fillMat);
  scene.add(fill);

  // Outer ring — orbiting accent points, like measurement markers
  const ringGeo = new THREE.TorusGeometry(2.5, 0.006, 8, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xD85A2C, transparent: true, opacity: 0.55 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2.3;
  scene.add(ring);

  const ring2 = new THREE.Mesh(ringGeo.clone(), new THREE.MeshBasicMaterial({ color: 0x7FB3D9, transparent: true, opacity: 0.35 }));
  ring2.rotation.x = Math.PI / 1.6;
  ring2.rotation.y = Math.PI / 5;
  scene.add(ring2);

  // Small node points at icosahedron vertices for a "schematic node" feel
  const pointsMat = new THREE.PointsMaterial({ color: 0xD85A2C, size: 0.045, transparent: true, opacity: 0.9 });
  const points = new THREE.Points(coreGeo, pointsMat);
  scene.add(points);

  function resize(){
    const size = viewport.clientWidth;
    if (size === 0) return;
    renderer.setSize(size, size, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let isVisible = true;
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => { isVisible = entry.isIntersecting; });
  }, { threshold: 0.05 });
  sectionObserver.observe(document.getElementById('hero'));

  let targetRotX = 0, targetRotY = 0;
  let pointerX = 0, pointerY = 0;

  window.addEventListener('pointermove', (e) => {
    pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  const clock = new THREE.Clock();

  function animate(){
    requestAnimationFrame(animate);
    if (!isVisible) return;

    const delta = clock.getDelta();
    const baseSpeed = prefersReducedMotion ? 0.04 : 0.12;

    core.rotation.y += delta * baseSpeed;
    core.rotation.x += delta * baseSpeed * 0.4;
    fill.rotation.copy(core.rotation);
    points.rotation.copy(core.rotation);

    ring.rotation.z += delta * 0.05;
    ring2.rotation.z -= delta * 0.035;

    if (!prefersReducedMotion){
      targetRotX += (pointerY * 0.3 - targetRotX) * 0.04;
      targetRotY += (pointerX * 0.3 - targetRotY) * 0.04;
      scene.rotation.x = targetRotX;
      scene.rotation.y = targetRotY;
    }

    if (rotCoord){
      const xDeg = ((core.rotation.x * 180 / Math.PI) % 360).toFixed(1);
      const yDeg = ((core.rotation.y * 180 / Math.PI) % 360).toFixed(1);
      rotCoord.textContent = `X ${Math.abs(xDeg)}° Y ${Math.abs(yDeg)}°`;
    }

    renderer.render(scene, camera);
  }
  animate();
})();