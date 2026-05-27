/* ==========================================================================
   HEALIX SAHYOG FOUNDATION (HSF) - ADMIN PANEL JS
   ========================================================================== */

// Initialize Supabase if configuration parameters are present in config.js
let supabaseClient = null;
if (window.HSF_CONFIG && window.HSF_CONFIG.supabaseUrl && window.HSF_CONFIG.supabaseKey) {
  try {
    supabaseClient = supabase.createClient(window.HSF_CONFIG.supabaseUrl, window.HSF_CONFIG.supabaseKey);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Admin features
  initAdminTheme();
  initAdminAuth();
});

/* ==========================================================================
   ADMIN PORTAL PASSCODE BARRIER (AUTHORIZATION MANAGER)
   ========================================================================== */
function initAdminAuth() {
  const authOverlay = document.getElementById('auth-overlay');
  const authForm = document.getElementById('auth-form');
  const authPasscode = document.getElementById('auth-passcode');
  const authErrorMsg = document.getElementById('auth-error-msg');

  if (!authOverlay || !authForm || !authPasscode) {
    // If elements don't exist, fallback to loading dashboard directly
    initDashboard();
    return;
  }

  // Check if session storage already holds authorization token
  const isAuthenticated = sessionStorage.getItem('hsf_admin_authenticated') === 'true';

  if (isAuthenticated) {
    authOverlay.classList.add('hidden');
    initDashboard();
  } else {
    // Listen for authentication submission
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const enteredCode = authPasscode.value.trim();
      const correctPasscode = 'hsf2026'; // Standard secure frontend passcode for HSF Admin Panel

      if (enteredCode === correctPasscode) {
        // Authorize access
        sessionStorage.setItem('hsf_admin_authenticated', 'true');
        authOverlay.classList.add('hidden');
        
        // Hide error state
        authPasscode.classList.remove('error-border');
        if (authErrorMsg) authErrorMsg.style.display = 'none';
        
        // Load stats dashboard and toast alert
        initDashboard();
        showToast("Access authorized. Welcome back, Admin.", "success");
      } else {
        // Display validation error
        authPasscode.classList.add('error-border');
        if (authErrorMsg) authErrorMsg.style.display = 'block';
        authPasscode.value = '';
        authPasscode.focus();
      }
    });

    // Reset error boundary styling on focus/typing
    authPasscode.addEventListener('input', () => {
      authPasscode.classList.remove('error-border');
      if (authErrorMsg) authErrorMsg.style.display = 'none';
    });
  }
}

/* ==========================================================================
   THEME MANAGER (DARK / LIGHT MODE)
   ========================================================================== */
function initAdminTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  // Sync theme with localStorage (shared with index.html)
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
   ADMIN TAB SWITCHING
   ========================================================================== */
function initAdminTabs() {
  const tabs   = document.querySelectorAll('.admin-tab');
  const panels = document.querySelectorAll('.tab-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

/* ==========================================================================
   SEMINARS CMS — Live sync with main website carousel
   Stores data in localStorage key: 'hsf_seminars'
   ========================================================================== */
const SEM_DEFAULTS = [
  { id:'sem-1', tag:'Summit', title:'National Biomedical Summit', meta:'October 15, 2025 • Medical Science Auditorium', desc:'HSF directors hosting clinical partners, hospital representatives, and computational biologists to align diagnostic dataset mapping protocols and BioLabs algorithms.', img:'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1920' },
  { id:'sem-2', tag:'Bootcamp', title:'Healix Scholars Bootcamp', meta:'January 24, 2026 • IIT Campus Halls', desc:'A hands-on preparatory convention gathering government-supported high school students for mock testing diagnostics and elite engineering mentorship counseling.', img:'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1920' },
  { id:'sem-3', tag:'Hackathon', title:'SheSecure Safety Hackathon', meta:'March 12, 2026 • Tech Hub, NC', desc:'A collaborative hackathon bringing together female developers and safety volunteers to test local coordinate meshes and audio frequency beacons.', img:'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1920' },
  { id:'sem-4', tag:'Seminar', title:'Biomedical AI Seminar', meta:'May 08, 2026 • Research Labs', desc:'HSF researchers hosting academic heads to share models on neural network sequences and database alignments.', img:'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1920' }
];

function compressImage(file, maxSize, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height *= maxSize / width;
          width = maxSize;
        } else {
          width *= maxSize / height;
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      callback(e.target.result);
    };
    img.src = e.target.result;
  };
  reader.onerror = () => {
    showToast('Failed to read file.', 'error');
  };
  reader.readAsDataURL(file);
}

async function syncSeminarsToSupabase(data) {
  if (!supabaseClient) return;
  try {
    const { error: deleteError } = await supabaseClient
      .from('hsf_seminars')
      .delete()
      .neq('id', 'none');
    if (deleteError) throw deleteError;
    
    if (data.length > 0) {
      const rows = data.map((item, index) => ({
        id: item.id,
        tag: item.tag,
        title: item.title,
        meta: item.meta || '',
        desc_text: item.desc || '',
        img: item.img || '',
        order_index: index
      }));
      const { error: insertError } = await supabaseClient
        .from('hsf_seminars')
        .insert(rows);
      if (insertError) throw insertError;
    }
  } catch (err) {
    console.error('Failed to sync seminars to Supabase:', err);
  }
}

function loadSemCMS() {
  try {
    const s = localStorage.getItem('hsf_seminars');
    if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length) return p; }
  } catch(e) {}
  return JSON.parse(JSON.stringify(SEM_DEFAULTS)); // deep copy
}

function saveSemCMS(data) {
  localStorage.setItem('hsf_seminars', JSON.stringify(data));
  if (supabaseClient) {
    syncSeminarsToSupabase(data);
  }
}

function initSeminarsCMS() {
  const grid        = document.getElementById('seminars-cms-grid');
  const addBtn      = document.getElementById('sem-add-btn');
  const resetBtn    = document.getElementById('sem-reset-btn');
  const modal       = document.getElementById('sem-modal');
  const modalTitle  = document.getElementById('sem-modal-title');
  const modalForm   = document.getElementById('sem-modal-form');
  const modalCancel = document.getElementById('sem-modal-cancel');
  const editIdInput = document.getElementById('sem-edit-id');
  const fTag        = document.getElementById('sem-f-tag');
  const fTitle      = document.getElementById('sem-f-title');
  const fMeta       = document.getElementById('sem-f-meta');
  const fDesc       = document.getElementById('sem-f-desc');
  const fImg        = document.getElementById('sem-f-img');        // hidden value store
  const fileInput   = document.getElementById('sem-f-img-file');   // real file picker
  const urlInput    = document.getElementById('sem-f-img-url');    // fallback URL input
  const dropZone    = document.getElementById('sem-drop-zone');
  const imgPreview  = document.getElementById('sem-img-preview');
  const previewImg  = document.getElementById('sem-preview-img');
  const removeBtn   = document.getElementById('sem-preview-remove');

  if (!grid) return;

  let seminars     = loadSemCMS();
  let dragSrcIndex = null;

  // ============================================================
  //  IMAGE UPLOAD HELPERS
  // ============================================================
  function setImage(dataUrl) {
    fImg.value = dataUrl;
    previewImg.src = dataUrl;
    imgPreview.style.display = 'block';
    dropZone.classList.add('has-image');   // hides drop zone
    if (urlInput) urlInput.value = '';     // clear URL field
  }

  function clearImage() {
    fImg.value = '';
    previewImg.src = '';
    imgPreview.style.display = 'none';
    dropZone.classList.remove('has-image');
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';
  }

  function readFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (PNG, JPG, WEBP).', 'error');
      return;
    }
    compressImage(file, 800, (compressedBase64) => {
      setImage(compressedBase64);
    });
  }

  // ---- Drop Zone events ----
  if (dropZone) {
    // Click → open file browser
    dropZone.addEventListener('click', () => fileInput && fileInput.click());

    dropZone.addEventListener('dragenter', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragover',  (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    });
  }

  // ---- File input change ----
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) readFile(fileInput.files[0]);
    });
  }

  // ---- URL fallback input ----
  if (urlInput) {
    urlInput.addEventListener('input', () => {
      const url = urlInput.value.trim();
      if (url) {
        fImg.value = url;
        previewImg.src = url;
        imgPreview.style.display = 'block';
        dropZone.classList.add('has-image');
      } else {
        clearImage();
      }
    });
  }

  // ---- Remove image ----
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => { e.stopPropagation(); clearImage(); });
  }

  // ============================================================
  //  CARD GRID RENDER
  // ============================================================
  function renderGrid() {
    grid.innerHTML = '';
    seminars.forEach((s, i) => {
      const card = document.createElement('div');
      card.className = 'sem-card';
      card.draggable = true;
      card.dataset.index = i;

      // Thumbnail: base64 or URL both work as src
      const thumbHtml = s.img
        ? `<img class="sem-card-thumb" src="${s.img}" alt="${s.title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="sem-card-thumb-placeholder" style="display:none;">Image not found</div>`
        : `<div class="sem-card-thumb-placeholder">No image set</div>`;

      card.innerHTML = `
        <span class="sem-order-badge">#${i + 1}</span>
        ${thumbHtml}
        <div class="sem-drag-handle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/><circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/></svg>
        </div>
        <div class="sem-card-body">
          <span class="sem-card-tag-pill">${s.tag}</span>
          <div class="sem-card-title-text">${s.title}</div>
          <div class="sem-card-meta-text">${s.meta}</div>
          <div class="sem-card-actions">
            <button class="sem-btn-edit" data-idx="${i}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button class="sem-btn-delete" data-idx="${i}" title="Delete slide">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>`;

      card.querySelector('.sem-btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        openModal('edit', i);
      });

      card.querySelector('.sem-btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete "${s.title}"? This cannot be undone.`)) {
          seminars.splice(i, 1);
          saveSemCMS(seminars);
          renderGrid();
          showToast('Slide deleted and carousel updated.', 'success');
        }
      });

      // Drag-to-reorder
      card.addEventListener('dragstart', () => { dragSrcIndex = i; card.style.opacity = '0.4'; });
      card.addEventListener('dragend',   () => { card.style.opacity = '1'; });
      card.addEventListener('dragover',  (e) => { e.preventDefault(); card.style.boxShadow = '0 0 0 2px var(--accent-orange)'; });
      card.addEventListener('dragleave', ()  => { card.style.boxShadow = ''; });
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.style.boxShadow = '';
        if (dragSrcIndex !== null && dragSrcIndex !== i) {
          const moved = seminars.splice(dragSrcIndex, 1)[0];
          seminars.splice(i, 0, moved);
          dragSrcIndex = null;
          saveSemCMS(seminars);
          renderGrid();
          showToast('Slide order updated on the website.', 'info');
        }
      });

      grid.appendChild(card);
    });
  }

  // ============================================================
  //  MODAL OPEN / CLOSE
  // ============================================================
  function openModal(mode, idx) {
    editIdInput.value = idx !== undefined ? idx : '';
    clearImage();

    if (mode === 'edit' && idx !== undefined) {
      const s = seminars[idx];
      modalTitle.textContent = 'Edit Slide';
      fTag.value   = s.tag;
      fTitle.value = s.title;
      fMeta.value  = s.meta;
      fDesc.value  = s.desc;
      // Pre-load existing image
      if (s.img) setImage(s.img);
    } else {
      modalTitle.textContent = 'Add New Slide';
      fTag.value = fTitle.value = fMeta.value = fDesc.value = '';
    }
    modal.classList.add('active');
  }

  function closeModal() { modal.classList.remove('active'); clearImage(); }

  if (addBtn)      addBtn.addEventListener('click', () => openModal('add'));
  if (modalCancel) modalCancel.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // ============================================================
  //  FORM SUBMIT
  // ============================================================
  modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!fImg.value) {
      showToast('Please upload or provide an image.', 'error');
      return;
    }
    const idx = editIdInput.value !== '' ? parseInt(editIdInput.value, 10) : null;
    const newSlide = {
      id:    idx !== null ? seminars[idx].id : 'sem-' + Date.now(),
      tag:   fTag.value.trim(),
      title: fTitle.value.trim(),
      meta:  fMeta.value.trim(),
      desc:  fDesc.value.trim(),
      img:   fImg.value
    };
    if (idx !== null) {
      seminars[idx] = newSlide;
      showToast('Slide updated — carousel is live!', 'success');
    } else {
      seminars.push(newSlide);
      showToast('New slide added — carousel is live!', 'success');
    }
    saveSemCMS(seminars);
    renderGrid();
    closeModal();
  });

  // ---- Reset to defaults ----
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all slides to default? Your changes will be lost.')) {
        seminars = JSON.parse(JSON.stringify(SEM_DEFAULTS));
        saveSemCMS(seminars);
        renderGrid();
        showToast('Slides reset to defaults.', 'info');
      }
    });
  }

  renderGrid();

  // Async fetch from Supabase to sync fresh seminars
  if (supabaseClient) {
    supabaseClient.from('hsf_seminars').select('*').order('order_index', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching seminars from Supabase:', error);
        } else if (data && data.length > 0) {
          const formatted = data.map(item => ({
            id: item.id,
            tag: item.tag,
            title: item.title,
            meta: item.meta,
            desc: item.desc_text || item.desc || '',
            img: item.img
          }));
          localStorage.setItem('hsf_seminars', JSON.stringify(formatted));
          seminars = formatted;
          renderGrid();
        }
      });
  }
}


/* ==========================================================================
   TESTIMONIALS CMS — Live sync with main website reviews
   Stores data in localStorage key: 'hsf_testimonials'
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

async function syncTestimonialsToSupabase(data) {
  if (!supabaseClient) return;
  try {
    const { error: deleteError } = await supabaseClient
      .from('hsf_testimonials')
      .delete()
      .neq('id', 'none');
    if (deleteError) throw deleteError;
    
    if (data.length > 0) {
      const rows = data.map((item, index) => ({
        id: item.id,
        rating: parseInt(item.rating || 5, 10),
        text: item.text || '',
        name: item.name || '',
        role: item.role || '',
        img: item.img || '',
        order_index: index
      }));
      const { error: insertError } = await supabaseClient
        .from('hsf_testimonials')
        .insert(rows);
      if (insertError) throw insertError;
    }
  } catch (err) {
    console.error('Failed to sync testimonials to Supabase:', err);
  }
}

function loadTestiCMS() {
  try {
    const t = localStorage.getItem('hsf_testimonials');
    if (t) { const p = JSON.parse(t); if (Array.isArray(p) && p.length) return p; }
  } catch(e) {}
  return JSON.parse(JSON.stringify(TESTIMONIALS_DEFAULTS)); // deep copy
}

function saveTestiCMS(data) {
  localStorage.setItem('hsf_testimonials', JSON.stringify(data));
  if (supabaseClient) {
    syncTestimonialsToSupabase(data);
  }
}

function initTestimonialsCMS() {
  const grid        = document.getElementById('testimonials-cms-grid');
  const addBtn      = document.getElementById('testi-add-btn');
  const resetBtn    = document.getElementById('testi-reset-btn');
  const modal       = document.getElementById('testi-modal');
  const modalTitle  = document.getElementById('testi-modal-title');
  const modalForm   = document.getElementById('testi-modal-form');
  const modalCancel = document.getElementById('testi-modal-cancel');
  const editIdInput = document.getElementById('testi-edit-id');
  const fName       = document.getElementById('testi-f-name');
  const fRole       = document.getElementById('testi-f-role');
  const fRating     = document.getElementById('testi-f-rating');
  const fText       = document.getElementById('testi-f-text');
  const fImg        = document.getElementById('testi-f-img');        // hidden value store
  const fileInput   = document.getElementById('testi-f-img-file');   // real file picker
  const urlInput    = document.getElementById('testi-f-img-url');    // fallback URL input
  const dropZone    = document.getElementById('testi-drop-zone');
  const imgPreview  = document.getElementById('testi-img-preview');
  const previewImg  = document.getElementById('testi-preview-img');
  const removeBtn   = document.getElementById('testi-preview-remove');

  if (!grid) return;

  let testimonials = loadTestiCMS();
  let dragSrcIndex = null;

  // ============================================================
  //  IMAGE UPLOAD HELPERS
  // ============================================================
  function setImage(dataUrl) {
    fImg.value = dataUrl;
    previewImg.src = dataUrl;
    imgPreview.style.display = 'block';
    dropZone.classList.add('has-image');   // hides drop zone
    if (urlInput) urlInput.value = '';     // clear URL field
  }

  function clearImage() {
    fImg.value = '';
    previewImg.src = '';
    imgPreview.style.display = 'none';
    dropZone.classList.remove('has-image');
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';
  }

  function readFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please upload a valid image file (PNG, JPG, WEBP).', 'error');
      return;
    }
    compressImage(file, 300, (compressedBase64) => {
      setImage(compressedBase64);
    });
  }

  // ---- Drop Zone events ----
  if (dropZone) {
    dropZone.addEventListener('click', () => fileInput && fileInput.click());
    dropZone.addEventListener('dragenter', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragover',  (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    });
  }

  // ---- File input change ----
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) readFile(fileInput.files[0]);
    });
  }

  // ---- URL fallback input ----
  if (urlInput) {
    urlInput.addEventListener('input', () => {
      const url = urlInput.value.trim();
      if (url) {
        fImg.value = url;
        previewImg.src = url;
        imgPreview.style.display = 'block';
        dropZone.classList.add('has-image');
      } else {
        clearImage();
      }
    });
  }

  // ---- Remove image ----
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => { e.stopPropagation(); clearImage(); });
  }

  // ============================================================
  //  CARD GRID RENDER
  // ============================================================
  function renderGrid() {
    grid.innerHTML = '';
    testimonials.forEach((t, i) => {
      const card = document.createElement('div');
      card.className = 'sem-card';
      card.draggable = true;
      card.dataset.index = i;

      const thumbHtml = t.img
        ? `<img class="sem-card-thumb" src="${t.img}" alt="${t.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="sem-card-thumb-placeholder" style="display:none;">Image not found</div>`
        : `<div class="sem-card-thumb-placeholder">No image set</div>`;

      // Build stars string
      let starsHtml = '';
      const ratingVal = parseInt(t.rating || 5, 10);
      for (let s = 1; s <= 5; s++) {
        starsHtml += s <= ratingVal ? '★' : '☆';
      }

      card.innerHTML = `
        <span class="sem-order-badge">#${i + 1}</span>
        ${thumbHtml}
        <div class="sem-drag-handle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/><circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/></svg>
        </div>
        <div class="sem-card-body">
          <span class="sem-card-tag-pill" style="background: rgba(255, 107, 0, 0.15); color: var(--accent-orange); border-color: rgba(255,107,0,0.3); font-size: 0.75rem;">${starsHtml}</span>
          <div class="sem-card-title-text" style="-webkit-line-clamp: 2; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; height: 2.6rem;">${t.text}</div>
          <div class="sem-card-meta-text" style="font-weight: 700; color: var(--accent-orange); margin-bottom: 2px;">${t.name}</div>
          <div class="sem-card-meta-text" style="font-size: 0.72rem; margin-bottom: 12px;">${t.role}</div>
          <div class="sem-card-actions">
            <button class="sem-btn-edit" data-idx="${i}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button class="sem-btn-delete" data-idx="${i}" title="Delete testimonial">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>`;

      card.querySelector('.sem-btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        openModal('edit', i);
      });

      card.querySelector('.sem-btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete testimonial from "${t.name}"? This cannot be undone.`)) {
          testimonials.splice(i, 1);
          saveTestiCMS(testimonials);
          renderGrid();
          showToast('Testimonial deleted.', 'success');
        }
      });

      // Drag-to-reorder
      card.addEventListener('dragstart', () => { dragSrcIndex = i; card.style.opacity = '0.4'; });
      card.addEventListener('dragend',   () => { card.style.opacity = '1'; });
      card.addEventListener('dragover',  (e) => { e.preventDefault(); card.style.boxShadow = '0 0 0 2px var(--accent-orange)'; });
      card.addEventListener('dragleave', ()  => { card.style.boxShadow = ''; });
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.style.boxShadow = '';
        if (dragSrcIndex !== null && dragSrcIndex !== i) {
          const moved = testimonials.splice(dragSrcIndex, 1)[0];
          testimonials.splice(i, 0, moved);
          dragSrcIndex = null;
          saveTestiCMS(testimonials);
          renderGrid();
          showToast('Testimonial order updated on the website.', 'info');
        }
      });

      grid.appendChild(card);
    });
  }

  // ============================================================
  //  MODAL OPEN / CLOSE
  // ============================================================
  function openModal(mode, idx) {
    editIdInput.value = idx !== undefined ? idx : '';
    clearImage();

    if (mode === 'edit' && idx !== undefined) {
      const t = testimonials[idx];
      modalTitle.textContent = 'Edit Testimonial';
      fName.value   = t.name;
      fRole.value   = t.role;
      fRating.value = t.rating || 5;
      fText.value   = t.text;
      // Pre-load existing image
      if (t.img) setImage(t.img);
    } else {
      modalTitle.textContent = 'Add New Testimonial';
      fName.value = fRole.value = fText.value = '';
      fRating.value = '5';
    }
    modal.classList.add('active');
  }

  function closeModal() { modal.classList.remove('active'); clearImage(); }

  if (addBtn)      addBtn.addEventListener('click', () => openModal('add'));
  if (modalCancel) modalCancel.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // ============================================================
  //  FORM SUBMIT
  // ============================================================
  modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!fImg.value) {
      showToast('Please upload or provide an image/photo.', 'error');
      return;
    }
    const idx = editIdInput.value !== '' ? parseInt(editIdInput.value, 10) : null;
    const newTesti = {
      id:     idx !== null ? testimonials[idx].id : 'testi-' + Date.now(),
      name:   fName.value.trim(),
      role:   fRole.value.trim(),
      rating: parseInt(fRating.value, 10),
      text:   fText.value.trim(),
      img:    fImg.value
    };
    if (idx !== null) {
      testimonials[idx] = newTesti;
      showToast('Testimonial updated successfully!', 'success');
    } else {
      testimonials.push(newTesti);
      showToast('New testimonial added successfully!', 'success');
    }
    saveTestiCMS(testimonials);
    renderGrid();
    closeModal();
  });

  // ---- Reset to defaults ----
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all testimonials to default? Your changes will be lost.')) {
        testimonials = JSON.parse(JSON.stringify(TESTIMONIALS_DEFAULTS));
        saveTestiCMS(testimonials);
        renderGrid();
        showToast('Testimonials reset to defaults.', 'info');
      }
    });
  }

  renderGrid();

  // Async fetch from Supabase to sync fresh testimonials
  if (supabaseClient) {
    supabaseClient.from('hsf_testimonials').select('*').order('order_index', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching testimonials from Supabase:', error);
        } else if (data && data.length > 0) {
          localStorage.setItem('hsf_testimonials', JSON.stringify(data));
          testimonials = data;
          renderGrid();
        }
      });
  }
}


/* ==========================================================================
   DASHBOARD DATABASE MANAGEMENT

   ========================================================================== */
function initDashboard() {
  // Initialize tab switching and Seminars CMS
  initAdminTabs();
  initSeminarsCMS();
  initTestimonialsCMS();


  const tableBody = document.getElementById('table-body');
  const emptyState = document.getElementById('empty-state');
  const submissionsTable = document.getElementById('submissions-table');
  const seedDataBtn = document.getElementById('seed-data-btn');
  
  // Filter Inputs
  const searchFilter = document.getElementById('search-filter');
  const sectorFilter = document.getElementById('sector-filter');
  
  // Stat Values
  const statTotal = document.getElementById('stat-total');
  const statTopSector = document.getElementById('stat-top-sector');
  const statLastDate = document.getElementById('stat-last-date');
  
  // Actions
  const downloadPdfBtn = document.getElementById('download-pdf-btn');
  const clearDbBtn = document.getElementById('clear-db-btn');
  
  // Modal Elements
  const confirmationModal = document.getElementById('confirmation-modal');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const modalConfirmBtn = document.getElementById('modal-confirm-btn');

  // Local State
  let allSubmissions = [];
  let filteredSubmissions = [];

  // Load and refresh data from local storage
  function fetchSubmissions() {
    try {
      allSubmissions = JSON.parse(localStorage.getItem('hsf_submissions') || '[]');
      
      // Sort submissions chronologically, newest first
      allSubmissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (err) {
      console.error('Failed to parse submissions database:', err);
      allSubmissions = [];
    }
    applyFilters();

    // Async fetch from Supabase to sync fresh submissions
    if (supabaseClient) {
      supabaseClient.from('hsf_submissions').select('*')
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching submissions from Supabase:', error);
          } else if (data) {
            const formatted = data.map(item => ({
              name: item.name,
              email: item.email,
              org: item.org,
              sector: item.sector,
              message: item.message,
              timestamp: item.created_at
            }));
            // Sort chronologically, newest first
            formatted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            localStorage.setItem('hsf_submissions', JSON.stringify(formatted));
            allSubmissions = formatted;
            applyFilters();
          }
        });
    }
  }

  // Calculate and update top stats panels
  function updateStats() {
    // 1. Total Submissions Count
    statTotal.textContent = allSubmissions.length;

    if (allSubmissions.length === 0) {
      statTopSector.textContent = "None";
      statLastDate.textContent = "Never";
      return;
    }

    // 2. Compute Top Active Sector
    const sectorCounts = {};
    allSubmissions.forEach(sub => {
      if (sub.sector) {
        sectorCounts[sub.sector] = (sectorCounts[sub.sector] || 0) + 1;
      }
    });

    let topSectorName = "None";
    let maxCount = 0;
    Object.entries(sectorCounts).forEach(([sector, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topSectorName = sector;
      }
    });
    // Truncate sector name if too long for display card
    if (topSectorName.length > 25) {
      statTopSector.textContent = topSectorName.substring(0, 22) + "...";
      statTopSector.title = topSectorName;
    } else {
      statTopSector.textContent = topSectorName;
      statTopSector.removeAttribute('title');
    }

    // 3. Compute Time of Last Submission
    const newestSub = allSubmissions[0]; // Already sorted newest first
    if (newestSub && newestSub.timestamp) {
      const date = new Date(newestSub.timestamp);
      statLastDate.textContent = formatDateShort(date);
    } else {
      statLastDate.textContent = "Never";
    }
  }

  // Format date helper for stats dashboard
  function formatDateShort(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just Now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    // Otherwise return MM/DD format
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // Helper to format full date-time string
  function formatDateTime(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  // Render rows dynamically based on current filtered state
  function renderTable() {
    tableBody.innerHTML = '';

    if (filteredSubmissions.length === 0) {
      submissionsTable.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    submissionsTable.style.display = 'table';
    emptyState.style.display = 'none';

    filteredSubmissions.forEach((sub, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="col-date">${formatDateTime(sub.timestamp)}</td>
        <td class="col-name">${escapeHtml(sub.name || '')}</td>
        <td class="col-email">
          <a href="mailto:${escapeHtml(sub.email || '')}" class="footer-link" style="color: var(--accent-orange); text-decoration: underline;">
            ${escapeHtml(sub.email || '')}
          </a>
        </td>
        <td class="col-org">${escapeHtml(sub.org || '')}</td>
        <td class="col-sector"><span class="sector-badge">${escapeHtml(sub.sector || 'Colleges & Universities')}</span></td>
        <td class="col-message">${escapeHtml(sub.message || '')}</td>
        <td class="col-actions">
          <button class="action-btn-danger" data-index="${index}" title="Delete Record">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Bind event listeners to delete buttons
    document.querySelectorAll('.action-btn-danger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filteredIndex = parseInt(btn.getAttribute('data-index'), 10);
        const subToDelete = filteredSubmissions[filteredIndex];
        
        // Find actual index in primary array
        const realIndex = allSubmissions.findIndex(sub => 
          sub.timestamp === subToDelete.timestamp && 
          sub.email === subToDelete.email
        );

        if (realIndex !== -1) {
          allSubmissions.splice(realIndex, 1);
          localStorage.setItem('hsf_submissions', JSON.stringify(allSubmissions));
          
          if (supabaseClient) {
            supabaseClient.from('hsf_submissions')
              .delete()
              .eq('email', subToDelete.email)
              .eq('created_at', subToDelete.timestamp)
              .then(({ error }) => {
                if (error) {
                  console.error('Failed to delete submission from Supabase:', error);
                } else {
                  console.log('Submission successfully deleted from Supabase.');
                }
              });
          }

          showToast(`Deleted submission from ${subToDelete.name}`, 'info');
          fetchSubmissions(); // Re-fetch and re-render
        }
      });
    });
  }

  // HTML escaping to prevent XSS injection
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Perform search and dropdown filtering
  function applyFilters() {
    const searchText = searchFilter.value.toLowerCase().trim();
    const selectedSector = sectorFilter.value;

    filteredSubmissions = allSubmissions.filter(sub => {
      // 1. Search text match (Name, Email, Org, Message)
      const nameMatch = (sub.name || '').toLowerCase().includes(searchText);
      const emailMatch = (sub.email || '').toLowerCase().includes(searchText);
      const orgMatch = (sub.org || '').toLowerCase().includes(searchText);
      const msgMatch = (sub.message || '').toLowerCase().includes(searchText);
      
      const textMatch = !searchText || (nameMatch || emailMatch || orgMatch || msgMatch);

      // 2. Dropdown sector match
      const sectorMatch = selectedSector === 'all' || sub.sector === selectedSector;

      return textMatch && sectorMatch;
    });

    updateStats();
    renderTable();
  }

  // Event Listeners for Filters
  searchFilter.addEventListener('input', applyFilters);
  sectorFilter.addEventListener('change', applyFilters);

  // Clear Database Actions
  clearDbBtn.addEventListener('click', () => {
    if (allSubmissions.length === 0) {
      showToast("Submissions database is already empty.", "info");
      return;
    }
    confirmationModal.classList.add('active');
  });

  modalCancelBtn.addEventListener('click', () => {
    confirmationModal.classList.remove('active');
  });

  confirmationModal.addEventListener('click', (e) => {
    if (e.target === confirmationModal) {
      confirmationModal.classList.remove('active');
    }
  });

  modalConfirmBtn.addEventListener('click', () => {
    localStorage.setItem('hsf_submissions', JSON.stringify([]));
    if (supabaseClient) {
      supabaseClient.from('hsf_submissions')
        .delete()
        .neq('name', 'none')
        .then(({ error }) => {
          if (error) {
            console.error('Failed to clear submissions in Supabase:', error);
          } else {
            console.log('Submissions successfully cleared in Supabase.');
          }
        });
    }
    confirmationModal.classList.remove('active');
    showToast("Cleared all submissions from database.", "success");
    fetchSubmissions();
  });

  // ==========================================
  // PDF REPORT EXPORT FUNCTIONALITY
  // ==========================================
  downloadPdfBtn.addEventListener('click', () => {
    if (filteredSubmissions.length === 0) {
      showToast("No data available to export in PDF.", "info");
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      
      // Initialize wide landscape document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Report metadata
      const today = new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // 1. Draw Corporate Branding Letterhead
      // Theme Dark Navy block top border
      doc.setFillColor(3, 7, 18);
      doc.rect(0, 0, 297, 12, 'F');
      
      // Brand Accent Orange Thin Line
      doc.setFillColor(255, 107, 0);
      doc.rect(0, 12, 297, 1.5, 'F');

      // Logo Initials (Interlocking Monogram Representation in PDF)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(255, 107, 0);
      doc.text("HSF", 14, 28);

      // Full Name Title next to monogram
      doc.setFontSize(16);
      doc.setTextColor(3, 7, 18);
      doc.text("HEALIX SAHYOG FOUNDATION", 40, 23);
      
      // Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 110, 120);
      doc.text("Empowering healthcare, education, and social innovation through technology.", 40, 28);

      // Right-aligned report details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(3, 7, 18);
      doc.text("COLLABORATION PARTNERS REPORT", 200, 23);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 110, 120);
      doc.text(`Generated: ${today}`, 200, 28);
      doc.text(`Total Records Displayed: ${filteredSubmissions.length}`, 200, 32);
      
      // Sector filter active notification if not 'all'
      const activeSecFilter = sectorFilter.value;
      if (activeSecFilter !== 'all') {
        doc.text(`Active Filter (Sector): ${activeSecFilter}`, 200, 36);
      }

      // Divider Line
      doc.setDrawColor(230, 235, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 40, 283, 40);

      // 2. Prepare Data for Table Rendering
      const tableHeaders = [
        ['S.No', 'Date & Time', 'Full Name', 'Email Address', 'Organization', 'Your Sector', 'Collaboration Message / Intent']
      ];

      const tableData = filteredSubmissions.map((sub, index) => {
        const dateFormatted = formatDateTime(sub.timestamp);
        return [
          index + 1,
          dateFormatted,
          sub.name || '',
          sub.email || '',
          sub.org || '',
          sub.sector || 'Colleges & Universities',
          sub.message || ''
        ];
      });

      // 3. Render Table using AutoTable plugin
      doc.autoTable({
        startY: 45,
        margin: { left: 14, right: 14 },
        head: tableHeaders,
        body: tableData,
        theme: 'striped',
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          cellPadding: 3.5,
          overflow: 'linebreak',
          lineColor: [230, 235, 240],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [10, 17, 32], // Dark-navy brand background
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          cellPadding: 4
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Light Slate grey alternating background
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' }, // S.No
          1: { cellWidth: 32 },                  // Date
          2: { cellWidth: 35, fontStyle: 'bold' },// Name
          3: { cellWidth: 42 },                  // Email
          4: { cellWidth: 35 },                  // Org
          5: { cellWidth: 40 },                  // Sector
          6: { cellWidth: 'auto' }               // Message
        },
        didDrawPage: function(data) {
          // Page Numbering Footer
          const str = "Page " + doc.internal.getNumberOfPages();
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          
          // Print page number bottom right
          doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
          
          // Print brand copyright bottom left
          doc.text("© 2026 Healix Sahyog Foundation. Confidential report for administrative review.", 180, doc.internal.pageSize.height - 10);
        }
      });

      // 4. Save and Download
      doc.save("HSF_Partner_Submissions_Report.pdf");
      showToast("PDF report downloaded successfully.", "success");
    } catch (err) {
      console.error('PDF export process failed:', err);
      showToast("Failed to generate PDF report. Check console details.", "danger");
    }
  });

  // Event listener for Demo seeding button
  if (seedDataBtn) {
    seedDataBtn.addEventListener('click', () => {
      const mockData = [
        {
          name: "Dr. Sarah Chen",
          email: "sarah.chen@university.edu",
          org: "Stanford Medical Labs",
          sector: "Colleges & Universities",
          message: "Would like to collaborate on the biomedical research initiative for cardiac biosensors and health metrics.",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
        },
        {
          name: "Dr. Jonathan Vance",
          email: "j.vance@bostonclinical.org",
          org: "Boston General Hospital",
          sector: "Hospitals & Clinical Networks",
          message: "Interested in deploying Healix clinical safety tools in our emergency ward and running pilot trials.",
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString() // 12 hours ago
        },
        {
          name: "Alice Johnson",
          email: "contact@greentech.org",
          org: "Sahyog Green Earth NGO",
          sector: "Non-Governmental Organizations",
          message: "Seeking scholarship slots for local youth under Healix Scholars to elevate computer literacy.",
          timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString() // 1.5 days ago
        },
        {
          name: "Prof. Marcus Aurelius",
          email: "marcus@research.net",
          org: "Independent Biotech Laboratory",
          sector: "Independent Researchers",
          message: "I want to publish my biomedical data under HSF open science framework and integrate our telemetry API.",
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString() // 3 days ago
        },
        {
          name: "Robert Baratheon",
          email: "robert@stormsend.org",
          org: "Baratheon Philanthropies",
          sector: "Sponsors & Philanthropists",
          message: "Willing to sponsor the next SheSecure outreach program with $50,000 in funding for regional chapters.",
          timestamp: new Date(Date.now() - 86400000 * 5).toISOString() // 5 days ago
        }
      ];

      localStorage.setItem('hsf_submissions', JSON.stringify(mockData));
      if (supabaseClient) {
        const rows = mockData.map(item => ({
          name: item.name,
          email: item.email,
          org: item.org,
          sector: item.sector,
          message: item.message,
          created_at: item.timestamp
        }));
        supabaseClient.from('hsf_submissions')
          .insert(rows)
          .then(({ error }) => {
            if (error) {
              console.error('Failed to seed submissions in Supabase:', error);
            } else {
              console.log('Submissions successfully seeded in Supabase.');
            }
          });
      }
      showToast("Demo database populated successfully!", "success");
      fetchSubmissions();
    });
  }

  // Fetch initial records
  fetchSubmissions();
}

/* ==========================================================================
   TOAST NOTIFICATION ENGINE
   ========================================================================== */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.classList.add('toast-notification');

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `
      <svg class="toast-success-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    `;
  } else {
    // Info / Warning Icon
    iconSvg = `
      <svg class="toast-info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    `;
  }

  toast.innerHTML = `
    ${iconSvg}
    <span>${message}</span>
  `;

  container.appendChild(toast);
  
  // Animate Entry
  setTimeout(() => {
    toast.classList.add('active');
  }, 10);

  // Animate Exit & Remove
  setTimeout(() => {
    toast.classList.remove('active');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}
