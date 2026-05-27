/* ==========================================================================
   HEALIX SAHYOG FOUNDATION (HSF) - INTERACTIVITY & ANIMATIONS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize preloader first so it is guaranteed to handle locking and dismiss hooks
  try {
    initPreloader();
  } catch (err) {
    console.error('Error starting preloader:', err);
  }

  // 2. Initialize other components with error isolation
  const modules = [
    { name: 'Theme', fn: initTheme },
    { name: 'Particles', fn: initParticles },
    { name: 'Globe', fn: initGlobe },
    { name: 'ScrollReveal', fn: initScrollReveal },
    { name: 'StatsCounter', fn: initStatsCounter },
    { name: 'SeminarsGallery', fn: initSeminarsGallery },
    { name: 'StoriesGallery', fn: initStoriesGallery },
    { name: 'TestimonialsSlider', fn: initTestimonialsSlider },
    { name: 'PartnerForm', fn: initPartnerForm },
    { name: 'MobileMenu', fn: initMobileMenu }
  ];

  modules.forEach(mod => {
    try {
      mod.fn();
    } catch (err) {
      console.error(`Error initializing component [${mod.name}]:`, err);
    }
  });
});

/* ==========================================================================
   INTRO SPLASH PRELOADER MANAGER
   ========================================================================== */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  const minTime = 2800; // Enforce minimum display time to let hand silhouette draw completely
  const startTime = Date.now();

  const dismiss = () => {
    const elapsed = Date.now() - startTime;
    const delay = Math.max(0, minTime - elapsed);
    setTimeout(() => {
      preloader.classList.add('fade-out');
      document.body.style.overflow = ''; // Unlock scrolling
    }, delay);
  };

  // Lock scrolling during preloading phase
  document.body.style.overflow = 'hidden';

  // Bulletproof fallback: force hide preloader after 3.2s regardless of asset load speed
  setTimeout(() => {
    if (!preloader.classList.contains('fade-out')) {
      preloader.classList.add('fade-out');
      document.body.style.overflow = '';
    }
  }, 3200);

  if (document.readyState === 'complete') {
    dismiss();
  } else {
    window.addEventListener('load', dismiss);
  }
}

/* ==========================================================================
   THEME MANAGER (DARK / LIGHT MODE)
   ========================================================================== */
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  // Check saved theme or system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  
  if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

/* ==========================================================================
   FUTURISTIC PARTICLE BACKGROUND (CANVAS)
   ========================================================================== */
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let animationFrameId;
  let particlesArray = [];
  const maxDistance = 120; // Max line connection distance
  
  const mouse = {
    x: null,
    y: null,
    radius: 150
  };

  // Adjust canvas size
  function resizeCanvas() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
    initParticlesArray();
  }

  // Track mouse coordinates
  window.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Particle {
    constructor(x, y, directionX, directionY, size, color) {
      this.x = x;
      this.y = y;
      this.directionX = directionX;
      this.directionY = directionY;
      this.size = size;
      this.color = color;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
      ctx.fillStyle = this.color;
      ctx.fill();
    }

    update() {
      // Check boundaries
      if (this.x > canvas.width || this.x < 0) {
        this.directionX = -this.directionX;
      }
      if (this.y > canvas.height || this.y < 0) {
        this.directionY = -this.directionY;
      }

      // Mouse interactivity (push/pull effect)
      if (mouse.x !== null && mouse.y !== null) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouse.radius + this.size) {
          if (mouse.x < this.x && this.x < canvas.width - this.size * 10) {
            this.x += 1.5;
          }
          if (mouse.x > this.x && this.x > this.size * 10) {
            this.x -= 1.5;
          }
          if (mouse.y < this.y && this.y < canvas.height - this.size * 10) {
            this.y += 1.5;
          }
          if (mouse.y > this.y && this.y > this.size * 10) {
            this.y -= 1.5;
          }
        }
      }

      // Move particle
      this.x += this.directionX;
      this.y += this.directionY;
      this.draw();
    }
  }

  function initParticlesArray() {
    particlesArray = [];
    // Number of particles depends on screen width
    let numberOfParticles = Math.floor((canvas.width * canvas.height) / 11000);
    if (numberOfParticles > 120) numberOfParticles = 120;
    if (numberOfParticles < 30) numberOfParticles = 30;

    const orangeColor = 'rgba(255, 107, 0, 0.45)';
    const whiteColor = 'rgba(255, 255, 255, 0.15)';
    const darkThemeWhite = 'rgba(255, 255, 255, 0.15)';
    const lightThemeDark = 'rgba(15, 23, 42, 0.08)';

    for (let i = 0; i < numberOfParticles; i++) {
      let size = (Math.random() * 2) + 1; // small particles
      let x = (Math.random() * ((canvas.width - size * 2) - (size * 2)) + size * 2);
      let y = (Math.random() * ((canvas.height - size * 2) - (size * 2)) + size * 2);
      let directionX = (Math.random() * 0.8) - 0.4;
      let directionY = (Math.random() * 0.8) - 0.4;
      
      // Mix of orange glowing particles and white node particles
      let color = Math.random() > 0.4 ? orangeColor : whiteColor;

      particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
    }
  }

  // Draw connections between nodes
  function connect() {
    let opacityValue = 1;
    const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
    const lineColor = isLightTheme ? 'rgba(255, 107, 0, 0.08)' : 'rgba(255, 107, 0, 0.12)';
    const nodeLineColor = isLightTheme ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)';

    for (let a = 0; a < particlesArray.length; a++) {
      for (let b = a; b < particlesArray.length; b++) {
        let dx = particlesArray[a].x - particlesArray[b].x;
        let dy = particlesArray[a].y - particlesArray[b].y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          opacityValue = 1 - (distance / maxDistance);
          // If at least one is orange, use orange line, otherwise white/dark line
          const isOrangeConn = particlesArray[a].color.includes('255, 107') || particlesArray[b].color.includes('255, 107');
          ctx.strokeStyle = isOrangeConn ? lineColor.replace('0.12', opacityValue * 0.25).replace('0.08', opacityValue * 0.18) : nodeLineColor.replace('0.04', opacityValue * 0.1);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
          ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
          ctx.stroke();
        }
      }

      // Connect mouse
      if (mouse.x !== null && mouse.y !== null) {
        let dx = particlesArray[a].x - mouse.x;
        let dy = particlesArray[a].y - mouse.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouse.radius) {
          opacityValue = 1 - (distance / mouse.radius);
          ctx.strokeStyle = `rgba(255, 107, 0, ${opacityValue * 0.3})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }
  }

  let isParticlesVisible = true;

  function animate() {
    if (!isParticlesVisible) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
      particlesArray[i].update();
    }
    connect();
    animationFrameId = requestAnimationFrame(animate);
  }

  // Initialize
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Speed Optimization: Only run particle canvas updates when in viewport
  try {
    const particlesObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isParticlesVisible = entry.isIntersecting;
        if (isParticlesVisible) {
          cancelAnimationFrame(animationFrameId);
          animate();
        }
      });
    }, { threshold: 0.01 });
    particlesObserver.observe(canvas);
  } catch(e) {
    animate(); // Fallback if IntersectionObserver is not supported
  }
}

/* ==========================================================================
   REVOLVING 3D GLOBE WITH PEOPLE RING (CANVAS)
   ========================================================================== */
function initGlobe() {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationFrameId;

  const CX = canvas.width / 2;
  const CY = canvas.height / 2;
  const R_globe = 220;
  const R_ring = 280;
  const personSize = 24;
  const numPeople = 18;

  let globeRotation = 0;
  let ringRotation = 0;

  // Landmass coordinates (approximate polygons for world map representation)
  const landmasses = [
    // North America
    [[-160, 70], [-100, 75], [-60, 75], [-50, 50], [-80, 25], [-100, 15], [-120, 35]],
    // South America
    [[-80, 12], [-40, -5], [-40, -20], [-70, -55], [-75, -40], [-80, -15]],
    // Africa
    [[-17, 32], [15, 32], [33, 30], [50, 10], [40, -34], [18, -34], [8, 5]],
    // Europe
    [[-10, 36], [20, 70], [40, 70], [50, 55], [30, 36]],
    // Asia
    [[30, 36], [40, 70], [80, 75], [160, 70], [140, 35], [120, 10], [100, 5], [80, 10], [60, 15], [40, 25]],
    // Australia
    [[113, -22], [115, -35], [153, -38], [151, -15], [140, -12]],
    // Greenland
    [[-60, 80], [-30, 80], [-40, 60], [-50, 60]]
  ];

  // Helper: Ray casting point-in-polygon algorithm
  function pointInPolygon(point, vs) {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i][0], yi = vs[i][1];
      const xj = vs[j][0], yj = vs[j][1];
      const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Pre-generate grid points representing landmasses on a 3D sphere
  const earthDots = [];
  const step = 3.0; // Density of grid
  for (let lat = -80; lat <= 80; lat += step) {
    for (let lon = -180; lon <= 180; lon += step) {
      let isLand = false;
      for (let i = 0; i < landmasses.length; i++) {
        if (pointInPolygon([lon, lat], landmasses[i])) {
          isLand = true;
          break;
        }
      }
      if (isLand) {
        earthDots.push({ lat, lon });
      }
    }
  }

  function drawGlobe() {
    const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
    const landColor = isLightTheme ? 'rgba(255, 107, 0, opacity)' : 'rgba(255, 107, 0, opacity)';
    const boundaryColor = isLightTheme ? 'rgba(255, 107, 0, 0.3)' : 'rgba(255, 107, 0, 0.4)';
    
    // Draw space sphere (circular boundary underlay)
    ctx.beginPath();
    ctx.arc(CX, CY, R_globe, 0, Math.PI * 2);
    ctx.fillStyle = isLightTheme ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.01)';
    ctx.fill();
    ctx.strokeStyle = boundaryColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Map 3D points
    const activeDots = [];
    for (let i = 0; i < earthDots.length; i++) {
      const dot = earthDots[i];
      // Rotate longitude
      const lonRad = (dot.lon + globeRotation) * Math.PI / 180;
      const latRad = dot.lat * Math.PI / 180;

      // Spherical coordinates mapping
      const x = Math.cos(latRad) * Math.sin(lonRad);
      const y = -Math.sin(latRad);
      const z = Math.cos(latRad) * Math.cos(lonRad); // Depth

      // Project onto canvas coordinate space
      const screenX = CX + R_globe * x;
      const screenY = CY + R_globe * y;

      // Draw all front facing dots (z > 0) + slight wrap-around depth (z > -0.2)
      if (z > -0.2) {
        activeDots.push({ x: screenX, y: screenY, z: z });
      }
    }

    // Sort by depth (painter's algorithm for proper overlap layering)
    activeDots.sort((a, b) => a.z - b.z);

    // Draw earth points
    ctx.shadowBlur = isLightTheme ? 0 : 8;
    ctx.shadowColor = 'rgba(255, 107, 0, 0.4)';
    
    activeDots.forEach(dot => {
      const size = dot.z > 0 ? (dot.z + 0.6) * 2.0 : 0.8;
      const opacity = dot.z > 0 ? dot.z * 0.85 : (dot.z + 0.2) * 0.2;
      ctx.fillStyle = landColor.replace('opacity', opacity.toFixed(2));
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.shadowBlur = 0; // Reset shadow glow
  }

  function drawPeopleRing() {
    const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
    const people = [];

    // Calculate position vectors for each person in the ring
    for (let i = 0; i < numPeople; i++) {
      const angle = i * (2 * Math.PI / numPeople) + ringRotation;
      const px = CX + R_ring * Math.cos(angle);
      const py = CY + R_ring * Math.sin(angle);
      
      const shAngle = angle + Math.PI / 2; // Tangent direction for shoulders
      const shoulderHalf = personSize * 0.7;
      
      const sx1 = px - shoulderHalf * Math.cos(shAngle);
      const sy1 = py - shoulderHalf * Math.sin(shAngle);
      const sx2 = px + shoulderHalf * Math.cos(shAngle);
      const sy2 = py + shoulderHalf * Math.sin(shAngle);

      people.push({ px, py, sx1, sy1, sx2, sy2 });
    }

    // 1. Draw arms holding hands (linking circles together)
    ctx.strokeStyle = isLightTheme ? 'rgba(255, 107, 0, 0.3)' : 'rgba(255, 107, 0, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    for (let i = 0; i < numPeople; i++) {
      const p1 = people[i];
      const p2 = people[(i + 1) % numPeople];
      
      ctx.beginPath();
      ctx.moveTo(p1.sx1, p1.sy1);
      ctx.lineTo(p2.sx2, p2.sy2);
      ctx.stroke();
    }

    // 2. Draw shoulders and heads
    people.forEach(p => {
      // Shoulders
      ctx.strokeStyle = 'var(--accent-orange)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p.sx1, p.sy1);
      ctx.lineTo(p.sx2, p.sy2);
      ctx.stroke();

      // Head
      ctx.fillStyle = isLightTheme ? '#ffffff' : '#030712';
      ctx.strokeStyle = 'var(--accent-orange)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.px, p.py, personSize * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  let isGlobeVisible = true;

  function animate() {
    if (!isGlobeVisible) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw components
    drawGlobe();
    drawPeopleRing();

    // Increment rotations (Eastward earth rotation, slow Westward people ring rotation)
    globeRotation += 0.45; // Eastward rotation degrees
    ringRotation -= 0.0025; // Counter-rotation radians

    animationFrameId = requestAnimationFrame(animate);
  }

  // Speed Optimization: Only run globe canvas animation when in viewport
  try {
    const globeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isGlobeVisible = entry.isIntersecting;
        if (isGlobeVisible) {
          cancelAnimationFrame(animationFrameId);
          animate();
        }
      });
    }, { threshold: 0.01 });
    globeObserver.observe(canvas);
  } catch(e) {
    animate(); // Fallback if IntersectionObserver is not supported
  }
}

/* ==========================================================================
   SCROLL REVEAL (INTERSECTION OBSERVER)
   ========================================================================== */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Unobserve once revealed to keep layout performant
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));
}

/* ==========================================================================
   LIVE IMPACT STATS COUNTER
   ========================================================================== */
function initStatsCounter() {
  const statsSection = document.querySelector('.stats-section');
  const statNumbers = document.querySelectorAll('.stat-number');
  if (!statsSection || statNumbers.length === 0) return;

  let animated = false;

  const countUp = (element) => {
    const target = parseInt(element.getAttribute('data-target'), 10);
    const duration = 2000; // Animation duration in ms
    const startTime = performance.now();

    const animateCount = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Easing out quadratic
      const easeProgress = progress * (2 - progress);
      const currentValue = Math.floor(easeProgress * target);
      
      // Add '+' suffix if it's high impact
      element.textContent = currentValue.toLocaleString() + '+';

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        element.textContent = target.toLocaleString() + '+';
      }
    };

    requestAnimationFrame(animateCount);
  };

  const statsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        statNumbers.forEach(num => countUp(num));
        animated = true;
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.2
  });

  statsObserver.observe(statsSection);
}

/* ==========================================================================
   FULL-SCREEN AUTO CAROUSEL (SEMINARS & WORKSHOPS)
   Data is loaded from localStorage('hsf_seminars') so admin edits reflect live.
   ========================================================================== */

const DEFAULT_SEMINARS = [
  { id:'sem-1', tag:'Summit', title:'National Biomedical Summit', meta:'October 15, 2025 • Medical Science Auditorium', desc:'HSF directors hosting clinical partners, hospital representatives, and computational biologists to align diagnostic dataset mapping protocols and BioLabs algorithms.', img:'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1920' },
  { id:'sem-2', tag:'Bootcamp', title:'Healix Scholars Bootcamp', meta:'January 24, 2026 • IIT Campus Halls', desc:'A hands-on preparatory convention gathering government-supported high school students for mock testing diagnostics and elite engineering mentorship counseling.', img:'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1920' },
  { id:'sem-3', tag:'Hackathon', title:'SheSecure Safety Hackathon', meta:'March 12, 2026 • Tech Hub, NC', desc:'A collaborative hackathon bringing together female developers and safety volunteers to test local coordinate meshes and audio frequency beacons.', img:'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1920' },
  { id:'sem-4', tag:'Seminar', title:'Biomedical AI Seminar', meta:'May 08, 2026 • Research Labs', desc:'HSF researchers hosting academic heads to share models on neural network sequences and database alignments.', img:'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1920' }
];

function getSeminarsData() {
  try {
    const stored = localStorage.getItem('hsf_seminars');
    if (stored) { const p = JSON.parse(stored); if (Array.isArray(p) && p.length > 0) return p; }
  } catch(e) {}
  return DEFAULT_SEMINARS;
}

function buildCarouselSlides(wrapper, seminars) {
  wrapper.innerHTML = '';
  seminars.forEach((s, i) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide' + (i === 0 ? ' active' : '');
    slide.dataset.index = i;
    slide.innerHTML = `<div class="carousel-bg" style="background-image:url('${s.img}');"></div><div class="carousel-overlay"></div><div class="carousel-content"><span class="carousel-tag">${s.tag}</span><h2 class="carousel-title">${s.title}</h2><p class="carousel-meta">${s.meta}</p><p class="carousel-desc">${s.desc}</p></div>`;
    wrapper.appendChild(slide);
  });
}
function initSeminarsGallery() {
  const carousel    = document.getElementById('seminar-carousel');
  const wrapper     = carousel ? carousel.querySelector('.carousel-slides-wrapper') : null;
  const prevBtn     = document.getElementById('carousel-prev');
  const nextBtn     = document.getElementById('carousel-next');
  const dotsEl      = document.getElementById('carousel-dots');
  const progressBar = document.getElementById('carousel-progress-bar');
  const currentEl   = document.getElementById('carousel-current');
  const totalEl     = document.getElementById('carousel-total');

  if (!carousel || !wrapper) return;

  const INTERVAL = 5500;
  let currentIndex = 0;
  let autoplayTimer = null;
  let isPaused = false;

  function buildDots(count) {
    if (!dotsEl) return;
    dotsEl.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => { goTo(i); resetAutoplay(); });
      dotsEl.appendChild(dot);
    }
  }

  function loadSlides() {
    const seminars = getSeminarsData();
    buildCarouselSlides(wrapper, seminars);
    buildDots(seminars.length);
    if (totalEl) totalEl.textContent = seminars.length;
    currentIndex = 0;
    goTo(0);
  }

  function goTo(index) {
    const slides = Array.from(wrapper.querySelectorAll('.carousel-slide'));
    const dots   = dotsEl ? Array.from(dotsEl.querySelectorAll('.carousel-dot')) : [];
    if (slides.length === 0) return;
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    currentIndex = (index + slides.length) % slides.length;
    slides[currentIndex].classList.add('active');
    if (dots[currentIndex]) dots[currentIndex].classList.add('active');
    if (currentEl) currentEl.textContent = currentIndex + 1;
    startProgress();
  }

  function next() { goTo(currentIndex + 1); }
  function prev() { goTo(currentIndex - 1); }

  function startProgress() {
    if (!progressBar) return;
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';
    void progressBar.offsetWidth;
    progressBar.style.transition = `width ${INTERVAL}ms linear`;
    progressBar.style.width = '100%';
  }

  function startAutoplay() {
    clearInterval(autoplayTimer);
    autoplayTimer = setInterval(() => { if (!isPaused) next(); }, INTERVAL);
  }
  function resetAutoplay() { clearInterval(autoplayTimer); startAutoplay(); }

  carousel.addEventListener('mouseenter', () => { isPaused = true; });
  carousel.addEventListener('mouseleave', () => { isPaused = false; });

  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetAutoplay(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetAutoplay(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { prev(); resetAutoplay(); }
    if (e.key === 'ArrowRight') { next(); resetAutoplay(); }
  });

  let touchStartX = 0;
  carousel.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  carousel.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); resetAutoplay(); }
  }, { passive: true });

  // Live sync when admin panel saves changes in another tab
  window.addEventListener('storage', (e) => {
    if (e.key === 'hsf_seminars') {
      clearInterval(autoplayTimer);
      loadSlides();
      startAutoplay();
    }
  });

  loadSlides();
  startAutoplay();
}





/* ==========================================================================
   TESTIMONIALS CAROUSEL SLIDER
   ========================================================================== */
const TESTIMONIALS_DEFAULTS = [
  {
    id: 'testi-1',
    rating: 5,
    text: `"Healix Scholars has opened up IIT/NEET preparation pipelines for children who couldn't dream of expensive tutoring. Their students' results are a testament to systemic mentoring."`,
    name: "Principal, S.K. Govt School",
    role: "Secondary Academic Board",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop"
  },
  {
    id: 'testi-2',
    rating: 5,
    text: `"Partnering with BioLabs has dramatically augmented our researchers' clinical genomics capabilities. Their algorithms mapped dataset cohorts in record time."`,
    name: "Director, BioHealth Labs",
    role: "Biomedical Research Center",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop"
  },
  {
    id: 'testi-3',
    rating: 5,
    text: `"The SheSecure safety mesh system integrated within our campus perimeter has noticeably boosted female students' security assurance. Extremely responsive architecture."`,
    name: "Dean of Student Affairs",
    role: "State Technical University",
    img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop"
  },
  {
    id: 'testi-4',
    rating: 5,
    text: `"As a college student traveling late at night, the SheSecure live tracking mesh gives my family and me complete peace of mind. It's a lifesaver!"`,
    name: "Ananya Sastry",
    role: "Beneficiary & Tech Volunteer",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop"
  }
];

function getTestimonialsData() {
  try {
    const stored = localStorage.getItem('hsf_testimonials');
    if (stored) {
      const p = JSON.parse(stored);
      if (Array.isArray(p) && p.length > 0) return p;
    }
  } catch(e) {}
  return TESTIMONIALS_DEFAULTS;
}

function buildTestimonialsSlides(slider, data) {
  slider.innerHTML = '';
  data.forEach((t, i) => {
    const slide = document.createElement('div');
    slide.className = 'testimonial-slide';
    
    // Build stars string
    let starsHtml = '';
    const ratingVal = parseInt(t.rating || 5, 10);
    for (let s = 1; s <= 5; s++) {
      starsHtml += s <= ratingVal ? '★' : '☆';
    }

    slide.innerHTML = `
      <div class="testimonial-card">
        <span class="quote-icon">“</span>
        <div class="testimonial-stars">
          ${starsHtml.split('').map(char => `<span class="star">${char}</span>`).join('')}
        </div>
        <p class="testimonial-text">${t.text}</p>
        <div class="testimonial-photo-centered">
          <img src="${t.img}" alt="${t.name}" class="testimonial-large-img" onerror="this.src='https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200'">
        </div>
        <div class="testimonial-author-inline">
          <span class="author-name">${t.name}</span>
          <span class="author-role">${t.role}</span>
        </div>
      </div>
    `;
    slider.appendChild(slide);
  });
}

function initTestimonialsSlider() {
  const slider = document.querySelector('.testimonials-slider');
  const prevBtn = document.getElementById('slider-prev');
  const nextBtn = document.getElementById('slider-next');
  const dotsContainer = document.querySelector('.slider-dots');

  if (!slider) return;

  // Dynamically render slides
  const testimonials = getTestimonialsData();
  buildTestimonialsSlides(slider, testimonials);

  const slides = document.querySelectorAll('.testimonial-slide');
  if (slides.length === 0) return;

  let currentIndex = 0;
  let autoplayInterval;

  // Create dot paginators
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    slides.forEach((_, idx) => {
      const dot = document.createElement('span');
      dot.classList.add('slider-dot');
      if (idx === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goToSlide(idx));
      dotsContainer.appendChild(dot);
    });
  }

  const dots = document.querySelectorAll('.slider-dot');

  function updateSlider() {
    slider.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach((dot, idx) => {
      if (idx === currentIndex) dot.classList.add('active');
      else dot.classList.remove('active');
    });
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length;
    updateSlider();
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateSlider();
  }

  function goToSlide(idx) {
    currentIndex = idx;
    updateSlider();
    resetAutoplay();
  }

  function startAutoplay() {
    autoplayInterval = setInterval(nextSlide, 6000);
  }

  function resetAutoplay() {
    clearInterval(autoplayInterval);
    startAutoplay();
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      resetAutoplay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      resetAutoplay();
    });
  }

  startAutoplay();
}

/* ==========================================================================
   PARTNER FORM SUBMISSION & SUCCESS MODAL
   ========================================================================== */
function initPartnerForm() {
  const form = document.getElementById('partner-form');
  const modal = document.getElementById('success-modal');
  const modalClose = document.getElementById('modal-close');
  
  if (!form || !modal || !modalClose) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Collect values
    const name = document.getElementById('partner-name').value;
    const email = document.getElementById('partner-email').value;
    const org = document.getElementById('partner-org').value;
    const sector = document.getElementById('partner-role').value;
    const message = document.getElementById('partner-msg').value;
    const timestamp = new Date().toISOString();

    // Create submission object
    const newSubmission = {
      name,
      email,
      org,
      sector,
      message,
      timestamp
    };

    // Save to localStorage
    try {
      const submissions = JSON.parse(localStorage.getItem('hsf_submissions') || '[]');
      submissions.push(newSubmission);
      localStorage.setItem('hsf_submissions', JSON.stringify(submissions));
    } catch (err) {
      console.error('Error saving submission to localStorage:', err);
    }
    
    // Customize modal message
    const modalOrgName = document.getElementById('modal-org-name');
    if (modalOrgName) {
      modalOrgName.textContent = org || name;
    }

    // Show modal dialog
    modal.classList.add('active');

    // Reset Form
    form.reset();
  });

  modalClose.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Click outside modal content to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
}

/* ==========================================================================
   MOBILE EXPANDABLE MENU TOGGLE
   ========================================================================== */
function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    const isVisible = navLinks.style.display === 'flex';
    
    if (isVisible) {
      navLinks.style.display = '';
      toggle.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      `;
    } else {
      navLinks.style.display = 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '72px';
      navLinks.style.left = '0';
      navLinks.style.width = '100%';
      navLinks.style.background = 'var(--nav-bg)';
      navLinks.style.padding = '24px';
      navLinks.style.borderBottom = '1px solid var(--glass-border)';
      
      toggle.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      `;
    }
  });

  // Close mobile menu on clicking links
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        navLinks.style.display = '';
        toggle.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        `;
      }
    });
  });
}

/* ==========================================================================
   STORIES IN MOTION - VIDEO MODAL PLAYBACK
   ========================================================================== */
function initStoriesGallery() {
  const cards = document.querySelectorAll('.story-video-card');
  const modal = document.getElementById('video-modal');
  const modalClose = document.getElementById('video-modal-close');
  const player = document.getElementById('modal-video-player');

  if (cards.length === 0 || !modal || !modalClose || !player) return;

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const src = card.getAttribute('data-video-src');
      if (!src) return;

      player.src = src;
      player.load();
      modal.classList.add('active');
    });
  });

  const closeModal = () => {
    modal.classList.remove('active');
    player.pause();
    player.src = '';
  };

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}
