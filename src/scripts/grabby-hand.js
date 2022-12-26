
const positionTypes = ["absolute", "relative", "fixed"]
const units = ["px", "v"]
const unitClasses = units.map((u) => `grabby-hand-use-${u}`)

/** @type {Element | null} */
let _activeEl = null;
let _activeElOffsetX = 0;
let _activeElOffsetY = 0;

window.addEventListener("load", handleLoad);
window.addEventListener("mousemove", handleMouseMove);
window.addEventListener("mouseup", handleMouseUp);


createInlineStyleSheet(`
[x-grabby-hand] {
  cursor: grab;
  user-select: none;
}
.grabby-hand-grabbing {
  cursor: grabbing;
}
.grabby-hand-grabbing [x-grabby-hand] {
  cursor: grabbing;
}
:root {
  --grabby-hand-vw: 0vw;
  --grabby-hand-vh: 0vh;
  --grabby-hand-pxw: 0px;
  --grabby-hand-pxh: 0px;
}
.grabby-hand-use-px {
  left: var(--grabby-hand-pxw);
  top: var(--grabby-hand-pxh);
}
.grabby-hand-use-v {
  left: var(--grabby-hand-vw);
  top: var(--grabby-hand-vh);
}
`)

function handleLoad() {
  const els = document.querySelectorAll("[x-grabby-hand]");

  for (const el of els) {
    el.addEventListener("mousedown", handleMouseDown);
    if(!positionTypes.some(hasPositionType.bind(null, el))) {
      console.warn("%o%cGrabby hand: You're using me incorrectly with the above element! It does not have one of the following position types: %o", el, "font-size: 16px;", positionTypes)
    }
    if(!unitClasses.some(hasClass.bind(null, el))) {
      console.warn("%o%cGrabby hand: You're using me incorrectly with the above element! It should use one of the following classes: %o", el, "font-size: 16px;", unitClasses)
    }
  }
}

/** @param e {MouseEvent}
  */
function handleMouseMove(e) {
  if (_activeEl !== null) {
    const pxw = e.clientX - _activeElOffsetX
    const pxh = e.clientY - _activeElOffsetY
    _activeEl.style.setProperty('--grabby-hand-pxw', `${pxw}px`)
    _activeEl.style.setProperty('--grabby-hand-pxh', `${pxh}px`)
    _activeEl.style.setProperty('--grabby-hand-vw', pxToVw(pxw))
    _activeEl.style.setProperty('--grabby-hand-vh', pxToVh(pxh))
  }
}

/** @param e {MouseEvent}
  */
function handleMouseDown(e) {
  _activeEl = e.target;
  const { x, y } = getAbsoluteRect(_activeEl);
  _activeElOffsetX = e.clientX - x;
  _activeElOffsetY = e.clientY - y;
  _activeEl.setAttribute('draggable', false)
  document.body.classList.add('grabby-hand-grabbing');
}

function handleMouseUp() {
  document.body.classList.remove('grabby-hand-grabbing');
  _activeEl.removeAttribute('draggable')
  _activeEl = null;
}

/** @param el {Element}
  * @typedef {{x: number, y: number}} Coords
  * @return Coords
  */
function getAbsoluteRect(el) {
  const { x, y } = el.getBoundingClientRect();
  return { x: x + window.scrollX, y: y + window.scrollY };
}

/** @param css {string}
  */
function createInlineStyleSheet(css) {
  const style = document.createElement(`style`);

  style.innerText = css;

  document.querySelector(`head`).append(style);
};

/** @param px {number}
  * @return string
  */
function pxToVw(px) {
  return `${px / window.innerWidth * 100}vw`
}
/** @param px {number}
  * @return string
  */
function pxToVh(px) {
  return `${px / window.innerHeight * 100}vh`
}

/** @param el {Element}
  * @param type {string}
  * @return boolean
  */
function hasPositionType(el, type) {
  return getComputedStyle(el).position === type;
}
/** @param el {Element}
  * @param clazz {string}
  * @returns boolean
  */
function hasClass(el, clazz) {
  return el.classList.contains(clazz)
}
