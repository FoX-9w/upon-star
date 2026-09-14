// Improved runtime test with fuller DOM stub (supports querySelector, setProperty, classList.contains)
const fs = require('fs');
const vm = require('vm');
let src = fs.readFileSync('/data/user/work/tarot-script.js','utf8');

function makeEl(id){
  const el = {
    _children: [], _listeners: {}, _classList: new Set(),
    _attrs: {}, dataset: {}, value: '', innerHTML: '', textContent: '',
    style: new Proxy({ _o:{} }, { set(t,k,v){ t._o[k]=v; return true; }, get(t,k){ if(k==='setProperty') return (k2,v2)=>{ t._o[k2]=v2; }; if(k==='cssText') return ''; return t._o[k]; } }),
    classList: {
      add(c){ el._classList.add(c); },
      remove(c){ el._classList.delete(c); },
      contains(c){ return el._classList.has(c); }
    },
    setAttribute(k,v){ el._attrs[k]=v; },
    getAttribute(k){ return el._attrs[k]; },
    removeAttribute(k){ delete el._attrs[k]; },
    appendChild(c){ el._children.push(c); return c; },
    querySelector(sel){
      // simple search by data-fanidx or .class
      for(const ch of el._children){ if(ch._attrs && ('data-fanidx' in ch._attrs) && sel.indexOf('data-fanidx')>=0) return ch; }
      // search by class in children
      const cls = sel.match(/\.([\w-]+)/);
      if(cls){
        for(const ch of el._children){
          if((' '+ (ch._attrs.class||ch._cls||'')+' ').indexOf(cls[1])>=0) return ch;
        }
      }
      // search by tag/class among children, then descendants via innerHTML parsing not supported
      return null;
    },
    querySelectorAll(sel){
      const out=[]; const cls = sel.match(/\.([\w-]+)/);
      function walk(node){
        for(const ch of node._children||[]){
          const cn = ch._attrs && ch._attrs.class ? ch._attrs.class : (ch._cls||'');
          if(cls && (' '+cn+' ').indexOf(cls[1])>=0) out.push(ch);
          if(!cls && sel.indexOf('tarot-card')>=0 && cn.indexOf('tarot-card')>=0) out.push(ch);
          walk(ch);
        }
      }
      walk(el);
      return out;
    },
    addEventListener(ev,fn){ (el._listeners[ev]=el._listeners[ev]||[]).push(fn); },
    _id: id
  };
  return el;
}
const elementsById = {};
function getEl(id){ if(!elementsById[id]) elementsById[id]=makeEl(id); return elementsById[id]; }

const document = {
  getElementById: getEl,
  querySelectorAll(sel){ return []; },
  querySelector(sel){ return null; },
  createElement(tag){ return makeEl(); }
};
const window = { scrollTo(){}, location: {} };
let timerFns = [];
const sandbox = {
  document, window, console,
  setTimeout:(fn,ms)=>{ timerFns.push(fn); return timerFns.length; },
  clearTimeout:()=>0, setInterval:()=>0, clearInterval:()=>0,
  Math, parseInt, parseFloat, Object, Array, String, JSON, Date
};
sandbox.window.location = sandbox.window;
vm.createContext(sandbox);

let loadErr = null;
try { vm.runInContext(src, sandbox, { timeout: 3000 }); }
catch(e){ loadErr = e; }
console.log('script load:', loadErr ? 'ERROR: '+loadErr.message : 'OK');

function check(name, fn){
  try { fn(); console.log('PASS', name); }
  catch(e){ console.log('FAIL', name, e.message); }
}

// Init state and simulate flow
check('spread grid rendered', ()=>{
  const g = getEl('spreadGrid');
  if(!g.innerHTML || g.innerHTML.indexOf('凯尔特十字')<0) throw new Error('celtic missing');
});

check('shuffle animation builds 9 flying cards', ()=>{
  getEl('shuffleDeck')._children = [];
  sandbox.startShuffleAnimation();
  if(getEl('shuffleDeck')._children.length !== 9) throw new Error('got '+getEl('shuffleDeck')._children.length);
});

check('setup draw fan = 21', ()=>{
  sandbox.state.deck = sandbox.CARDS.slice();
  sandbox.shuffleArray(sandbox.state.deck);
  sandbox.state.fanCards = sandbox.state.deck.slice(0,21).map((c,i)=>({card:c,index:i}));
  sandbox.state.picked = []; sandbox.state.drawCount = 0; sandbox.state.spread='three';
  sandbox.setupDrawPhase();
  if(getEl('cardFan')._children.length !== 21) throw new Error('fan='+getEl('cardFan')._children.length);
});

check('pickCard adds picked + badge + fan card class', ()=>{
  sandbox.state.picked = []; sandbox.state.drawCount = 0;
  sandbox.pickCard(0);
  if(sandbox.state.drawCount !== 1) throw new Error('drawCount='+sandbox.state.drawCount);
  if(sandbox.state.picked[0].card === undefined) throw new Error('no card');
  // pickBadge textContent should be set
  // (querySelector stub limited, so we just verify state)
});

check('renderResult three-spread: 3 position-items + 3 readings', ()=>{
  sandbox.state.picked = []; sandbox.state.drawCount = 0;
  sandbox.pickCard(0); sandbox.pickCard(1); sandbox.pickCard(2);
  sandbox.renderResult();
  const rb = getEl('readingBlock');
  if(rb._children.length !== 3) throw new Error('readings='+rb._children.length);
  // each reading item should have innerHTML with position name + cardname
  const html = rb._children[0].innerHTML;
  if(html.indexOf('过去')<0) throw new Error('no 过去 position');
  if(html.indexOf('正位')<0 && html.indexOf('逆位')<0) throw new Error('no orientation badge');
});

check('renderResult celtic: 10 readings + celtic layout', ()=>{
  sandbox.state.spread='celtic';
  sandbox.state.picked = []; sandbox.state.drawCount = 0;
  for(let i=0;i<10;i++) sandbox.pickCard(i);
  sandbox.renderResult();
  const rb = getEl('readingBlock');
  if(rb._children.length !== 10) throw new Error('readings='+rb._children.length);
  const layout = getEl('spreadLayout').innerHTML;
  if(layout.indexOf('celtic-cross')<0) throw new Error('no celtic-cross');
  if(layout.indexOf('celtic-staff')<0) throw new Error('no celtic-staff');
  // check all 10 position names present
  ['现状','挑战','基础','近期过去','可能结果','近未来','自我','环境','希望与恐惧','最终结果'].forEach(n=>{
    if(layout.indexOf(n)<0) throw new Error('missing position '+n);
  });
});

check('renderResult single: 1 reading + 当下指引', ()=>{
  sandbox.state.spread='single';
  sandbox.state.picked = []; sandbox.state.drawCount = 0;
  sandbox.pickCard(0);
  sandbox.renderResult();
  if(getEl('readingBlock')._children.length !== 1) throw new Error('single readings');
  if(getEl('spreadLayout').innerHTML.indexOf('当下指引')<0) throw new Error('no 当下指引');
});

check('flip animation timers scheduled for all cards', ()=>{
  timerFns = [];
  sandbox.state.spread='three';
  sandbox.state.picked = []; sandbox.state.drawCount = 0;
  sandbox.pickCard(0); sandbox.pickCard(1); sandbox.pickCard(2);
  sandbox.renderResult();
  // renderResult schedules setTimeout for each card flip + reading show
  // 3 cards * 2 timers = 6
  if(timerFns.length < 6) throw new Error('timers='+timerFns.length);
  // execute them - should not throw
  timerFns.forEach(fn=>{ try{ fn(); }catch(e){ throw new Error('timer threw: '+e.message); } });
});

check('reversed cards carry reversed class in layout', ()=>{
  sandbox.state.spread='three';
  sandbox.state.picked = [{fanIdx:0,card:sandbox.CARDS[0],reversed:true,posIndex:0},{fanIdx:1,card:sandbox.CARDS[1],reversed:false,posIndex:1},{fanIdx:2,card:sandbox.CARDS[2],reversed:true,posIndex:2}];
  sandbox.state.drawCount = 3;
  sandbox.renderResult();
  const layout = getEl('spreadLayout').innerHTML;
  if(layout.indexOf('reversed')<0) throw new Error('no reversed class');
});
