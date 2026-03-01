/* === WORK: Reverse Peel === */ 
function bindWorkScroll(handler){
  var lenis = window.__lenis;
  if (lenis && typeof lenis.on === 'function') lenis.on('scroll', handler);
  else window.addEventListener('scroll', handler, { passive: true });
}
(function(){
  var stack = document.querySelector('#work.work-stack');
  if(!stack) return;
  var sections = Array.from(stack.querySelectorAll('.work-section'));
  var sticky = document.createElement('div');
  sticky.className = 'work-sticky';
  sections.forEach(sec=> sticky.appendChild(sec));
  stack.appendChild(sticky);
  stack.style.setProperty('--count', sections.length);
  var vh = ()=> window.innerHeight || 0;
  var target = 0, current = 0, ease = 0.16;
  var REVEAL_START = 0.60, REVEAL_RANGE = 0.40;
  function measureTarget(){
    var r = stack.getBoundingClientRect();
    target = Math.min(sections.length, Math.max(0, (-r.top)/vh()));
  }
  function render(){
    current += (target - current) * ease;
    sections.forEach((sec,i)=>{
      var reveal = 1;
      if(i>0){
        var u = current - (i-1);
        var norm = (u - REVEAL_START)/REVEAL_RANGE;
        reveal = Math.max(0, Math.min(1, norm));
      }
      sec.style.setProperty('--reveal', reveal);
      var hidden = reveal <= 0.001;
      sec.style.pointerEvents = hidden ? 'none':'auto';
      sec.setAttribute('aria-hidden', hidden ? 'true':'false');
    });
    window.__workProgress = current;
    requestAnimationFrame(render);
  }
  bindWorkScroll(measureTarget);
  window.addEventListener('resize', measureTarget);
  measureTarget(); render();
})();

/* === WORK: Hover Video === */
(function () {
  var heroes = document.querySelectorAll('#work .work-hero');
  var io = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      var hero = entry.target, video = hero.querySelector('.work-hover__video');
      if (!video) return;
      if (!entry.isIntersecting){
        video.pause(); video.currentTime=0; hero.classList.remove('is-open');
      }
    });
  }, { threshold: 0.01 });
  heroes.forEach(hero=>{
    var video = hero.querySelector('.work-hover__video');
    var file = hero.dataset.video, loaded=false;
    function ensure(){ if(!loaded&&file){ video.src='video/'+file; loaded=true; } }
    function play(){ ensure(); video.currentTime=0; video.play().catch(()=>{}); }
    function stop(){ video.pause(); video.currentTime=0; }
    hero.addEventListener('mouseenter', play);
    hero.addEventListener('mouseleave', stop);
    hero.addEventListener('click', e=>{
      if(window.matchMedia('(hover: none)').matches){
        e.preventDefault();
        var open = hero.classList.toggle('is-open');
        open? play(): stop();
      }
    });
    io.observe(hero);
  });
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden){
      document.querySelectorAll('#work .work-hover__video').forEach(v=>v.pause());
    }
  });
})();

/* === WORK: Heading Split === */
(function(){
  var root = document.querySelector('#work.work-stack');
  if(!root) return;
  function splitKeepBr(h){
    if(h.dataset.split==='1') return;
    var frag=document.createDocumentFragment(), i=0;
    h.childNodes.forEach(node=>{
      if(node.nodeType===3){
        for(let ch of node.nodeValue){
          var span=document.createElement('span');
          span.className='tchar'; span.textContent=ch;
          span.style.setProperty('--i',i++);
          if(ch===' '){ span.style.display='inline-block'; span.style.width='.33em'; }
          frag.appendChild(span);
          frag.appendChild(document.createTextNode('\u200B'));
        }
      } else if(node.nodeName==='BR'){ frag.appendChild(document.createElement('br')); i+=2; }
      else frag.appendChild(node.cloneNode(true));
    });
    h.innerHTML=''; h.appendChild(frag); h.dataset.split='1';
  }
  var headings=Array.from(root.querySelectorAll('.work-heading'));
  headings.forEach(splitKeepBr);
  var sections=Array.from(root.querySelectorAll('.work-section'));
  function tick(){
    sections.forEach(sec=>{
      var h=sec.querySelector('.work-heading'); if(!h) return;
      var r=parseFloat(getComputedStyle(sec).getPropertyValue('--reveal'))||0;
      if(r>=0.35) h.classList.add('is-inview');
      else if(r<=0.20) h.classList.remove('is-inview');
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* === Section Peek (fix: work-btn opens & not auto-closed) === */
(function(){
  const peeks = document.querySelectorAll('#work .section-peek');
  if(!peeks.length) return;
  const setOpen = (el, open) => {
    el.classList.toggle('is-open', open);
    el.setAttribute('aria-expanded', open ? 'true' : 'false');
    const tab = el.querySelector('.section-peek__tab');
    if(tab) tab.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  const closeAllExcept = keep => {
    peeks.forEach(p => { if (p !== keep) setOpen(p, false); });
  };
  peeks.forEach(peek=>{
    const tab = peek.querySelector('.section-peek__tab');
    if(!tab) return;
    tab.addEventListener('click', (e)=>{
      if (!window.matchMedia('(hover: hover)').matches) {
        e.stopPropagation();
        const willOpen = !peek.classList.contains('is-open');
        closeAllExcept(willOpen ? peek : null);
        setOpen(peek, willOpen);
      }
    });
  });
  document.querySelectorAll('#work .work-section .work-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const section = btn.closest('.work-section');
      const peek = section && section.querySelector('.section-peek');
      if(peek){
        closeAllExcept(peek);
        setOpen(peek, true);
      }
    });
  });
  document.addEventListener('click', (e)=>{
    const insidePanel = e.target.closest('.section-peek__panel');
    const insideTab   = e.target.closest('.section-peek__tab');
    const insideBtn   = e.target.closest('.work-btn');
    if(!insidePanel && !insideTab && !insideBtn){
      closeAllExcept(null);
    }
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){ closeAllExcept(null); }
  });
})();

/* === WORK: Breakpoint Open (open window by mode) === */
(function () {
  var URL_MAP = {
    "2": "https://sema-project.vercel.app/",
    "3": "https://areumeom.github.io/clone-coding/" 
  };
  function sizeFor(label){
    var w = 1440, h = 900;
    if (label.includes('1024')) { w = 1024; h = 768; }
    else if (label.includes('768')) { w = 768; h = 1024; }
    else if (label.includes('486')) { w = 486; h = 800; }
    return { w, h };
  }
  function openCentered(url, w, h){
    var left = Math.max(0, Math.round((window.screen.availWidth  - w) / 2));
    var top  = Math.max(0, Math.round((window.screen.availHeight - h) / 2));
    var feat = [
      'width='+w, 'height='+h,
      'left='+left, 'top='+top,
      'resizable=yes','scrollbars=yes'
    ].join(',');
    var winName = 'preview_'+w+'x'+h+'_'+(url.replace(/[^a-z0-9]/gi,'').slice(0,30));
    var win = window.open(url, winName, feat);
    if (win) { try { win.opener = null; } catch(_){} }
    if (!win || win.closed) window.open(url, '_blank');
  }
  document.querySelectorAll('.section-peek__tags.breakpoint-controls').forEach(function(ctrl){
    ctrl.addEventListener('click', function(e){
      var btn = e.target.closest('.mode-btn');
      if(!btn) return;
      var label = btn.textContent.toLowerCase().trim();
      var wh = sizeFor(label);
      var section = ctrl.closest('.work-section');
      if(!section) return;
      var layer = section.getAttribute('data-layer');
      var url = URL_MAP[layer];
      if(!url) return;
      openCentered(url, wh.w, wh.h);
    });
  });
})();
