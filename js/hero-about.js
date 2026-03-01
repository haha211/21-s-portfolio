/* === Lenis 유틸: Lenis가 있으면 Lenis에 붙이고, 없으면 window scroll로 폴백 === */
function bindSmoothScroll(handler) {
  var lenis = window.__lenis;
  if (lenis && typeof lenis.on === 'function') {
    lenis.on('scroll', handler);
  } else {
    window.addEventListener('scroll', handler, { passive: true });
  }
}

/* === scroll-hint 버튼: Lenis로 스무스 스크롤 === */
(function () {
  var lenis = window.__lenis;
  document.querySelectorAll('.scroll-hint[data-target], .scroll-hint:not([data-target])').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-target') || '#about';
      var el = document.querySelector(id);
      if (!el) return;
      if (lenis && typeof lenis.scrollTo === 'function') {
        lenis.scrollTo(id, { duration: 1.0, offset: 0, force: true });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();

/* === Split(상어입) 진행도 + About 언더 노출/숨김 관리 ===*/
(function () {
  var root        = document.documentElement;
  var splitIntro  = document.querySelector('.split-intro');
  var splitPin    = document.querySelector('.split-pin');
  var about       = document.getElementById('about');
  var archive     = document.getElementById('archive');
  var aboutUnder  = document.querySelector('.about-under');
  if (!splitIntro || !splitPin || !about || !archive || !aboutUnder) return;
  var OPEN_DISTANCE_VH = 100;
  var UNDER_THRESHOLD  = 0.40;
  var DONE_EPS         = 0.995;
  function armSplitHeight() {  splitIntro.style.setProperty('--split-open-distance', OPEN_DISTANCE_VH + 'vh'); }
  function foldSplitHeight(){  splitIntro.style.setProperty('--split-open-distance', '0vh'); }
  armSplitHeight();
  var vh=0, openPx=0, splitTop=0, aboutTop=0, aboutBottom=0, archiveTop=0;
  function measure(){
    vh = window.innerHeight;
    openPx = vh * (OPEN_DISTANCE_VH/100);
    var rSplit = splitIntro.getBoundingClientRect();
    splitTop   = rSplit.top + window.scrollY;
    var rAbout = about.getBoundingClientRect();
    aboutTop    = rAbout.top + window.scrollY;
    aboutBottom = rAbout.bottom + window.scrollY;
    var rArch  = archive.getBoundingClientRect();
    archiveTop = rArch.top + window.scrollY;
  }
  function hardHide(){
    root.style.setProperty('--under-reveal', '0');
    root.style.setProperty('--under-scale',  '1');
    document.body.classList.remove('at-about');
    document.body.classList.remove('under-on');
    aboutUnder.style.visibility    = 'hidden';
    aboutUnder.style.opacity       = '0';
    aboutUnder.style.pointerEvents = 'none';
  }
  function softShow(){
    document.body.classList.add('under-on');
    aboutUnder.style.removeProperty('visibility');
    aboutUnder.style.removeProperty('opacity');
    aboutUnder.style.removeProperty('pointer-events');
  }
  function overlapsRange(rangeTop, rangeBottom){
    var y  = window.scrollY;
    var vt = y;
    var vb = y + vh;
    return (vb > rangeTop) && (vt < rangeBottom);
  }
  function update(){
    var rAboutNow = about.getBoundingClientRect();
    aboutTop    = rAboutNow.top + window.scrollY;
    aboutBottom = rAboutNow.bottom + window.scrollY;
    var rect     = splitIntro.getBoundingClientRect();
    var scrolled = Math.min(Math.max(-rect.top, 0), openPx);
    var progress = scrolled / openPx;
    root.style.setProperty('--split',    progress.toFixed(4));
    root.style.setProperty('--mouthPx', (progress * openPx).toFixed(1) + 'px');
    var startedOpening = progress > 0.02;
    if (!startedOpening){
      hardHide();
    } else {
      var y  = window.scrollY;
      var vt = y, vb = y + vh;
      var overlapsHeroToArchive = (vb > splitTop) && (vt < archiveTop);
      if (!overlapsHeroToArchive){ hardHide(); } else { softShow(); }
    }
    var UNDER_THRESHOLD_VAL = 0.40;
    if (progress > UNDER_THRESHOLD_VAL) {
      var reveal = Math.min(1, (progress - UNDER_THRESHOLD_VAL) / (1 - UNDER_THRESHOLD_VAL));
      root.style.setProperty('--under-reveal', reveal.toFixed(3));
      root.style.setProperty('--under-scale',  (0.985 + (reveal * 0.015)).toFixed(3));
    } else if (progress > 0) {
      root.style.setProperty('--under-reveal', '0');
      root.style.setProperty('--under-scale',  '1');
    } else {
      root.style.setProperty('--under-reveal', '0');
      root.style.setProperty('--under-scale',  '1');
    }
    if (progress >= DONE_EPS) {
      foldSplitHeight();
      document.body.classList.add('split-final');
    } else {
      armSplitHeight();
      document.body.classList.remove('split-final');
    }
    var inAbout = startedOpening && overlapsRange(aboutTop, aboutBottom);
    document.body.classList.toggle('at-about', inAbout);
  }
  measure(); update();
  bindSmoothScroll(update);
  window.addEventListener('resize', function(){ measure(); update(); });
  window.addEventListener('load', function(){ measure(); update(); });
})();
