/* ==== Lenis + ScrollTrigger 전역 초기화 ==== */
(function () {
  if (window.gsap && window.ScrollTrigger) { gsap.registerPlugin(ScrollTrigger); }
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lenis = new Lenis({
    duration: 1.2,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    wheelMultiplier: 1,
    smoothTouch: false,
    gestureDirection: 'vertical'
  });
  window.__lenis = lenis;
  if (reduceMotion) lenis.stop();
  lenis.on('scroll', function () { if (window.ScrollTrigger) ScrollTrigger.update(); });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id && id.length > 1 && document.querySelector(id)) {
      e.preventDefault();
      lenis.scrollTo(id, { offset: 0, duration: 1.0, force: true });
    }
  });
  window.addEventListener('load', function () {
    if (location.hash && document.querySelector(location.hash)) {
      setTimeout(function () { lenis.scrollTo(location.hash, { duration: 0.9 }); }, 0);
    }
  });
})();
"use strict";

/* ===00) 내비 앵커 보정 ==== */
(function fixNavHrefs(){
  document.querySelectorAll('.nav a').forEach(a=>{
    const txt = (a.textContent || "").trim().toLowerCase();
    if (txt.includes('work') && (a.getAttribute('href') || '#') === '#') {
      a.setAttribute('href', '#work');
    }
  });
})();

/* === 01) a[href="#"] === */
$(document).on('click', 'a[href="#"]:not(.work-btn):not([data-keep-click])', function (e) {
  e.preventDefault();
});

/* === 02) Hero 하단 보조 블록 강제 귀속 === */
(function(){
  function getHeroWrap(){
    return (
      document.querySelector('.split-intro .split-pin .wrap') ||
      document.querySelector('.split-pin .wrap') ||
      document.querySelector('.wrap')
    );
  }
  const SELECTORS = [
    '.scroll-hint[role="button"]',
    '.scroll-word',
    '.thumbs'
  ];
  function relocate() {
    const heroWrap = getHeroWrap();
    if(!heroWrap) return;
    const cs = window.getComputedStyle(heroWrap);
    if (cs.position === 'static') heroWrap.style.position = 'relative';
    SELECTORS.forEach(sel=>{
      document.querySelectorAll(sel).forEach(node=>{
        if(!node) return;
        if(node.closest('.wrap') === heroWrap) return;
        heroWrap.appendChild(node);
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', relocate);
  } else { relocate(); }
  window.addEventListener('load', function(){ setTimeout(relocate, 0); });
  const mo = new MutationObserver(function(muts){
    let need = false;
    muts.forEach(m=>{
      if (need) return;
      if (m.type === 'childList') {
        const changed = [...(m.addedNodes||[]), ...(m.removedNodes||[])];
        need = changed.some(n=>{
          if (!(n instanceof Element)) return false;
          if (n.matches && SELECTORS.some(s=>n.matches(s))) return true;
          return !!(n.querySelector && SELECTORS.some(s=>n.querySelector(s)));
        });
      }
    });
    if (need) relocate();
  });
  mo.observe(document.body, {subtree:true, childList:true});
})();

/* === 03) 스크롤 힌트: Lenis 스크롤 === */
(function(){
  const lenis = window.__lenis;
  document.querySelectorAll('.scroll-hint[data-target], .scroll-hint:not([data-target])').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-target') || '#about';
      const el = document.querySelector(id);
      if(!el) return;
      if (lenis && typeof lenis.scrollTo === 'function') {
        lenis.scrollTo(id, { duration: 1.0, offset: 0, force: true });
      } else {
        el.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
  });
})();

/* === 05) About 딤 유지 + 배지 와이프 === */
(function(){
  const root    = document.documentElement;
  const photo   = document.querySelector('.about-stage__photo');
  const resume  = document.querySelector('.resume');
  const badges  = Array.from(document.querySelectorAll('.about-stage .glass-badge'));
  if (!photo || !resume) return;
  badges.forEach((b, i) => { b.classList.add('pre-wipe'); b.style.setProperty('--i', i); });
  let isWiping = false;
  let wasFullyHidden = true;
  const MAX_DIM = 0.80;
  const WIPE_TRIGGER = 0.60;
  const updateDimByRange = () => {
    const viewportTop    = window.scrollY;
    const viewportBottom = viewportTop + window.innerHeight;
    const photoTop       = photo.getBoundingClientRect().top + window.scrollY;
    const resumeBottom   = resume.getBoundingClientRect().bottom + window.scrollY;
    const dimOn = (viewportBottom > photoTop) && (viewportTop < resumeBottom);
    root.style.setProperty('--under-dim', dimOn ? MAX_DIM : 0);
  };
  const startWipe = () => {
    if (isWiping) return;
    isWiping = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      badges.forEach(b => b.classList.add('wiping'));
    }));
  };
  const resetBadges = () => {
    badges.forEach(b => b.classList.remove('wiping'));
    document.body.offsetHeight; isWiping = false;
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const ratio = entry.intersectionRatio || 0;
        if (ratio === 0) { wasFullyHidden = true; resetBadges(); }
        else if (ratio >= WIPE_TRIGGER && wasFullyHidden) { wasFullyHidden = false; startWipe(); }
      });
    }, { threshold: [0, 0.01, .2, .4, .6, .8, 1] });
    io.observe(photo);
  } else { startWipe(); }
  updateDimByRange();
  window.addEventListener('scroll', updateDimByRange, {passive: true});
  window.addEventListener('resize', updateDimByRange);
  requestAnimationFrame(updateDimByRange);
})();

/* === 상단 음영(박스 섀도우) : resume 구간에서만 표시 === */
(function(){
  const root   = document.documentElement;
  const resume = document.querySelector('.resume');
  if (!resume) return;
  let shadow = document.querySelector('.top-shadow');
  if (!shadow) {
    shadow = document.createElement('div');
    shadow.className = 'top-shadow mouth-top';
    document.body.appendChild(shadow);
  } else { shadow.classList.add('mouth-top');}
  const FADE_PX = 200;
  const MAX_OPA = 1.0;
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  function updateTopShadow(){
    const viewportTop    = window.scrollY;
    const viewportBottom = viewportTop + window.innerHeight;
    const rect = resume.getBoundingClientRect();
    const resumeTop    = rect.top + window.scrollY;
    const resumeBottom = rect.bottom + window.scrollY;
    const inRange = (viewportBottom > resumeTop) && (viewportTop < resumeBottom);
    if (!inRange) {root.style.setProperty('--topshadow', '0'); return;}
    let opa = 1;
    const enterDist = viewportBottom - resumeTop;
    if (enterDist < FADE_PX) {opa = clamp(enterDist / FADE_PX, 0, 1);}
    const exitDist = resumeBottom - viewportTop;
    if (exitDist < FADE_PX) {opa = Math.min(opa, clamp(exitDist / FADE_PX, 0, 1));}
    root.style.setProperty('--topshadow', (opa * MAX_OPA).toFixed(3));
  }
  updateTopShadow();
  window.addEventListener('scroll', updateTopShadow, {passive: true});
  window.addEventListener('resize', updateTopShadow);
})();

/* === 08) RESUME 인뷰 애니메이션 === */
(function(){
  const resume = document.querySelector('.resume');
  if(!resume) return;
  const titles = resume.querySelectorAll('.resume-sec-title');
  titles.forEach(title => {
    if (title.dataset.split === '1') return;
    const raw = title.textContent;
    const frag = document.createDocumentFragment();
    let i = 0;
    for (const ch of raw) {
      const span = document.createElement('span');
      span.className = 'tchar';
      span.style.setProperty('--i', i++);
      span.textContent = ch;
      frag.appendChild(span);
    }
    title.textContent = ''; title.appendChild(frag); title.dataset.split = '1';
  });
  const sections = resume.querySelectorAll('.resume-section');
  sections.forEach(section => {
    const items = section.querySelectorAll('.resume-item');
    items.forEach((li, idx) => { li.style.setProperty('--d', idx); });
  });
  const opts = { root: null, rootMargin: '-12% 0px -12% 0px', threshold: [0, 0.15, 0.35, 0.6, 1] };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const el = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) el.classList.add('is-inview');
        else el.classList.remove('is-inview');
      });
    }, opts);
    sections.forEach(sec => io.observe(sec));
  } else {
    const onScroll = () => {
      const vh = window.innerHeight;
      sections.forEach(sec => {
        const r = sec.getBoundingClientRect();
        const midVisible = r.top < vh * 0.65 && r.bottom > vh * 0.35;
        sec.classList.toggle('is-inview', midVisible);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll);
  }
})();

/* === 09) NAV 게이지 (확장판) === */
(function(){
  const root    = document.documentElement;
  const about   = document.getElementById('about');
  const work    = document.getElementById('work');
  const archive = document.getElementById('archive');
  const contact = document.getElementById('contact');
  if (!about || !work || !archive || !contact) return;
function sectionProgress(section){
  const vh = window.innerHeight;
  const r  = section.getBoundingClientRect();
  const top = section.offsetTop;
  const height = section.offsetHeight;

  if (height <= vh) {
    const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    return Math.min(1, visible / Math.max(1, Math.min(height, vh)));
  }

  const docTop = window.scrollY;
  const bottom = top + height;
  const viewTop = docTop;
  const viewBottom = docTop + vh;
  if (viewBottom <= top)  return 0;
  if (viewTop >= bottom)  return 1;
  const totalScrollable = Math.max(height - vh, 1);
  const scrolledInside  = Math.min(Math.max(viewTop - top, 0), totalScrollable);
  return scrolledInside / totalScrollable;
}
  function overlapsViewport(section){
    const vh = window.innerHeight;
    const viewTop = window.scrollY;
    const viewBottom = viewTop + vh;
    const top = section.offsetTop;
    const bottom = top + section.offsetHeight;
    return (viewBottom > top) && (viewTop < bottom);
  }
  function updateGauges(){
    let infoP    = sectionProgress(about);
    let workP    = sectionProgress(work);
    let archiveP = sectionProgress(archive);
    let contactP = sectionProgress(contact);
    const inWork    = overlapsViewport(work);
    const inArchive = overlapsViewport(archive);
    const inContact = overlapsViewport(contact);
    if (inWork || inArchive || inContact) infoP = 0;
    if (inArchive || inContact)           workP = 0;
    if (inContact)                        archiveP = 0; 
    root.style.setProperty('--nav-info-p',    infoP.toFixed(4));
    root.style.setProperty('--nav-work-p',    workP.toFixed(4));
    root.style.setProperty('--nav-archive-p', archiveP.toFixed(4));
    root.style.setProperty('--nav-contact-p', contactP.toFixed(4));
  }
  updateGauges();
  window.addEventListener('scroll', updateGauges, {passive:true});
  window.addEventListener('resize', updateGauges);
  window.addEventListener('load', updateGauges);
  setTimeout(updateGauges, 0);
})(); 

/* === 09.5) UI 톤 토글러 (Hero/Archive/Contact=검정, About/Work=흰) === */
(function(){
  const body    = document.body;
  const hero    = document.querySelector('.split-intro');
  const archive = document.getElementById('archive');
  const contact = document.getElementById('contact');
  if (!hero || !archive || !contact) return;

  function inView(el, topPad=0.15, botPad=0.15){
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const topZone = vh * topPad, botZone = vh * (1 - botPad);
    return r.top < botZone && r.bottom > topZone;
  }
  function applyTone(){
    const isDarkText =
      inView(hero, 0.00, 0.70) ||
      inView(archive) ||
      inView(contact);
    body.classList.toggle('ui-light', !!isDarkText);
  }
  const lenis = window.__lenis;
  if (lenis && typeof lenis.on === 'function') {
    lenis.on('scroll', applyTone);
  } else {
    window.addEventListener('scroll', applyTone, { passive:true });
  }
  window.addEventListener('resize', applyTone);
  window.addEventListener('load', applyTone);
  applyTone();
})();

/* === 10) Skills z-index 리프트 === */
(function(){
  const skillsWrap = document.querySelector('.skills');
  if(!skillsWrap) return;
  const cards = Array.from(skillsWrap.querySelectorAll('.skill-oval'));
  if (!cards.length) return;
  cards.forEach(card => {
    const z = window.getComputedStyle(card).zIndex;
    card.dataset.baseZ = (z === 'auto' ? '0' : z);
  });
  let elevated = null;
  const TOP_Z = 9999;
  function lift(card){
    if (elevated && elevated !== card){ restore(elevated); }
    if (elevated === card && card.style.zIndex === String(TOP_Z)) return;
    if (!card.dataset.baseZ){
      const z = window.getComputedStyle(card).zIndex;
      card.dataset.baseZ = (z === 'auto' ? '0' : z);
    }
    card.style.zIndex = String(TOP_Z);
    elevated = card;
  }
  function restore(card){
    const base = card?.dataset?.baseZ ?? '0';
    card.style.zIndex = base;
    if (elevated === card) elevated = null;
  }
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => lift(card));
    card.addEventListener('mouseleave', () => restore(card));
  });
  cards.forEach(card => {
    card.setAttribute('tabindex', '0');
    card.addEventListener('focusin',   () => lift(card));
    card.addEventListener('focusout',  () => restore(card));
  });
  skillsWrap.addEventListener('mouseleave', () => { if (elevated) restore(elevated); });
  window.addEventListener('resize', () => {
    cards.forEach(card => {
      if (!card.matches(':hover') && document.activeElement !== card){
        restore(card);
      }
    });
  });
})();

/* === 11) ARCHIVE: 글자 스트로크 루프 === */
document.addEventListener("DOMContentLoaded", () => {
  const archive = document.querySelector("#archive");
  if (!archive) return;
  const wordGroups = archive.querySelectorAll(".word-group");
  if (!wordGroups.length) return;
  wordGroups.forEach(el => { if (!el.hasAttribute("data-text")) el.setAttribute("data-text", el.textContent); });
  let current = 0;
  const DURATION = 500;
  let timer = null;
  const loop = () => {
    wordGroups.forEach(el => el.classList.remove("active"));
    wordGroups[current].classList.add("active");
    timer = setTimeout(() => {
      wordGroups[current].classList.remove("active");
      current = (current + 1) % wordGroups.length;
      loop();
    }, DURATION);
  };
  const start = () => { if (!timer) loop(); };
  const stop = () => {
    if (timer) { clearTimeout(timer); timer = null; }
    wordGroups.forEach(el => el.classList.remove("active"));
  };
  const io = new IntersectionObserver(
    entries => { entries.forEach(entry => (entry.isIntersecting ? start() : stop())); },
    {threshold: 0.2}
  );
  io.observe(archive);
});
(function(){
  const roots = [document.getElementById('archive'), document.getElementById('contact')].filter(Boolean);
  if (!roots.length) return;
  function splitTextNodes(el){
    if (!el || el.dataset.split === '1') return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode(node){
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        return node.nodeValue.replace(/\s+/g,'').length
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const str  = node.nodeValue;
      const frag = document.createDocumentFragment();
      let i = 0;
      for (let ch of str){
        const span = document.createElement('span');
        span.className = 'tchar';
        span.style.setProperty('--i', i++);
        span.textContent = (ch === '\n') ? ' ' : ch;
        frag.appendChild(span);
      }
      node.parentNode.replaceChild(frag, node);
    });
    el.dataset.split = '1';
  }
  roots.forEach(root => {
    root.querySelectorAll('.animated-tit, .note-eyebrow, .cv-link').forEach(splitTextNodes);
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting) el.classList.add('is-inview');
      else if (entry.intersectionRatio === 0) el.classList.remove('is-inview');
    });
  }, { root: null, rootMargin: '-10% 0px -10% 0px', threshold: [0, .2, .6, 1] });
  roots.forEach(root => {
    root.querySelectorAll('.animated-tit, .note-eyebrow, .cv-link, .note-panel.note-default').forEach(el => io.observe(el));
  });
})();


/* === 12) Work overlay hover logic (z-index 수정판) === */
(function(){
  const overlay = document.getElementById('workOverlay') || document.querySelector('.work-overlay');
  if(!overlay) return;
  if (!document.getElementById('thumb-hover-style')) {
    const css = `
    .work-overlay{ position:fixed !important; inset:0 !important; z-index:12 !important; pointer-events:none; }
    .thumbs{ position:absolute; z-index:60; }
    .thumb-item:hover .thumb-cap{ color:#fff; }
    .thumb-item:hover .thumb{ border-color:#fff; box-shadow:0 2px 10px rgba(0,0,0,.2); }
    body.overlay-on .thumbs .thumb-cap{ color:#fff !important; }
    body.overlay-on .thumbs .thumb{ border-color: rgba(255,255,255,.35); }
    body.overlay-on .thumbs .thumb-item.is-hover .thumb{ border-color:#fff; }
    .work-titles{ z-index:61; }
    `;
    const s = document.createElement('style');
    s.id = 'thumb-hover-style';
    s.textContent = css;
    document.head.appendChild(s);
  }
  const layers = overlay.querySelectorAll('.work-layer');
  const thumbsWrap = document.querySelector('.thumbs');
  const thumbs = document.querySelectorAll('.thumb-item');
  const titles = document.querySelectorAll('.work-title');
  const getTitle = (idx) => document.querySelector(`.work-title[data-work="${idx}"]`);
  const getLayer = (idx) => overlay.querySelector(`.work-layer[data-work="${idx}"]`);
  function anyActive(){ return Array.from(layers).some(l => l.classList.contains('is-active')); }
  function showWork(idx){
    const layer = getLayer(idx);
    const title = getTitle(idx);
    if(!layer || !title) return;
    layers.forEach(l => l.classList.toggle('is-active', l === layer));
    titles.forEach(t => t.classList.toggle('is-active', t === title));
    document.body.classList.add('overlay-on');
  }
  function hideWork(idx){
    const layer = getLayer(idx);
    const title = getTitle(idx);
    if(layer) layer.classList.remove('is-active');
    if(title) title.classList.remove('is-active');
    if(!anyActive()) document.body.classList.remove('overlay-on');
  }
  function hideAll(){
    layers.forEach(l => l.classList.remove('is-active'));
    titles.forEach(t => t.classList.remove('is-active'));
    document.body.classList.remove('overlay-on');
    thumbs.forEach(i=>i.classList.remove('is-hover'));
  }
  thumbs.forEach(item => {
    const idx = item.dataset.work;
    item.addEventListener('mouseenter', () => { item.classList.add('is-hover'); showWork(idx); });
    item.addEventListener('mouseleave', () => { item.classList.remove('is-hover'); hideWork(idx); });
    item.setAttribute('tabindex','0');
    item.addEventListener('focus', () => { item.classList.add('is-hover'); showWork(idx); });
    item.addEventListener('blur',  () => { item.classList.remove('is-hover'); hideWork(idx); });
  });
  if (thumbsWrap) { thumbsWrap.addEventListener('mouseleave', hideAll); }
})();

/* === 13) UI 포탈: .ui를 마스크되는 .wrap 밖(=body)으로 이동 === */
(function(){
  const ui = document.querySelector('.ui');
  if (!ui || ui.__ported) return;
  let portal = document.getElementById('ui-portal');
  if (!portal) {
    portal = document.createElement('div');
    portal.id = 'ui-portal';
    portal.style.position = 'fixed';
    portal.style.inset = '0';
    portal.style.pointerEvents = 'none';
    portal.style.zIndex = '2000';
    document.body.appendChild(portal);
  }
  portal.appendChild(ui);
ui.style.pointerEvents = 'none';
ui.style.width = '0'; 
ui.style.height = '0';
ui.style.overflow = 'visible';
  ui.__ported = true;
})();
/* 13.1) UI 포탈 자식 pointer-events 복구 (네비/텍스트/썸네일 클릭 살리기) */
(function ensureUiPortalPointerEvents(){
  var id = 'ui-portal-pe-style';
  var s = document.getElementById(id);
  if (!s) {
    s = document.createElement('style');
    s.id = id;
    document.head.appendChild(s);
  }
  s.textContent = `
    #ui-portal .ui .brand,
    #ui-portal .ui .nav,
    #ui-portal .ui .nav a,
    #ui-portal .ui .profile,
    #ui-portal .ui .scroll-hint,
    #ui-portal .ui .scroll-word,
    /* ✅ 썸네일 클릭 허용 */
    #ui-portal .ui .thumbs,
    #ui-portal .ui .thumbs *{
      pointer-events: auto;
    }
  `;
})();

/* 13.2) 히어로 썸네일(.thumbs)도 클릭 허용 */
(function ensureThumbsPointerEvents(){
  var id = 'ui-portal-pe-style-thumbs';
  if (document.getElementById(id)) return;
  var s = document.createElement('style');
  s.id = id;
  s.textContent = `
    #ui-portal .ui .thumbs,
    #ui-portal .ui .thumbs * {
      pointer-events: auto;
    }
  `;
  document.head.appendChild(s);
})();

/* 14) Hero 썸네일 → Work 섹션 정밀 점프 (1번만 피드백 보정) */
(function heroThumbsRouter(){
  const work   = document.getElementById('work');
  const thumbs = document.querySelectorAll('.thumbs .thumb-item[data-work]');
  if (!work || !thumbs.length) return;

  const lenis = window.__lenis;
  const vh = () => window.innerHeight || 0;
  const FIRST = 0.06;
  const HIT   = 0.58;
  const SHIFT = 1;
  function desiredProgress(k){
    return (k === 1) ? FIRST : ((k - 1 - SHIFT) + HIT);
  }
  function yForProgress(p){
    const workTop = work.getBoundingClientRect().top + window.scrollY;
    return workTop + p * vh();
  }
  function scrollToY(y, duration){
    if (lenis && typeof lenis.scrollTo === 'function') {
      lenis.scrollTo(y, { duration: duration ?? 0.9, easing: t => t, force: true, lock: true });
    } else {
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
  function goTo(k){
    const p  = desiredProgress(k);
    const y0 = yForProgress(p);
    scrollToY(y0, 0.8);
    if (k !== 1) return;
    let tries = 0;
    const MAX  = 24;
    const EPS  = 0.02;
    const STEP = 0.08;
    (function correct(){
      const prog = window.__workProgress;
      if (typeof prog !== 'number') { if (tries++ < MAX) requestAnimationFrame(correct); return; }
      const delta = prog - p;
      if (Math.abs(delta) <= EPS) return;
      const next = prog - Math.sign(delta) * Math.min(Math.abs(delta), STEP);
      scrollToY(yForProgress(next), 0.22);
      if (tries++ < MAX) requestAnimationFrame(correct);
    })();
  }
  thumbs.forEach((el) => {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    el.style.cursor = 'pointer';
    function act(e){
      e.preventDefault();
      e.stopPropagation();
      const k = Number(e.currentTarget.dataset.work);
      if (!k) return;
      goTo(k);
    }
    el.addEventListener('click', act);
    el.addEventListener('keydown', (e)=>{ if (e.key === 'Enter' || e.key === ' ') act(e); });
  });
})();
(function brandToAbsoluteTop(){
  const brand = document.querySelector('a.brand[href="#hero"]');
  if (!brand) return;
  const lenis = window.__lenis;
  function goTop(e){
    e.preventDefault(); 
    e.stopPropagation();
    if (lenis && typeof lenis.scrollTo === 'function') {
      lenis.scrollTo(0, { duration: 0.9, easing: t => t, force: true, lock: true });
      setTimeout(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, 950);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, 950);
    }
    try { history.replaceState(null, '', location.pathname + location.search); } catch {}
  }
  brand.addEventListener('click', goTop);
  brand.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ' ') goTop(e);
  });
})();
