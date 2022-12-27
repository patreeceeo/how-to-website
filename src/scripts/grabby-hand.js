// TODO finish adding support for `em` unit
// TODO move this to its own repo?
// TODO add removeElement API method
// TODO are there better names than "addElement" and "removeElement"?
// TODO use API methods instead of unit classes
// TODO add method to get active element
// TODO use addElement method instead of x-grabby-hand attribute
// TODO use $0 instead with addElement
// TODO put styles into dynamically load CSS file
// TODO arrow keys to adjust?
// TODO rotation, scale, skew
// TODO change z-index
// TODO snapping, guides and grids
(() => {
  const positionTypes = ["absolute", "relative", "fixed"]
  const units = ["px", "v"]
  const unitClasses = units.map((u) => `grabby-hand-use-${u}`)
  const consoleStyleInfo = "font-size: 1rem; background-color: skyblue; padding: 0.5rem; border-radius: 0.5rem"
  const consoleStyleWarning = "font-size: 1rem;"

  /** @type {Element | null} */
  let _activeEl = null;
  /** @type {Element | null} */
  let _mostRecentActiveEl = null;
  let _activeElInitOffsetX = 0;
  let _activeElInitOffsetY = 0;

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
  .grabby-hand-use-px [x-grabby-hand],
  [x-grabby-hand].grabby-hand-use-px {
    left: var(--grabby-hand-pxw);
    top: var(--grabby-hand-pxh);
  }
  .grabby-hand-use-v [x-grabby-hand],
  [x-grabby-hand].grabby-hand-use-v {
    left: var(--grabby-hand-vw);
    top: var(--grabby-hand-vh);
  }
  `)

  function handleLoad() {
    const els = document.querySelectorAll("[x-grabby-hand]");
    console.info("%cGrabby hand: Hello! Grab any of the below elements to move it.%o", consoleStyleInfo, els)

    for (const el of els) {
      addElement(el)
    }
  }

  /** @param e {MouseEvent}
    */
  function handleMouseMove(e) {
    setPositionRelativeToInitialOffset(e.clientX, e.clientY)
  }

  /** @param e {MouseEvent}
    */
  function handleMouseDown(e) {
    setActiveElement(e.target)
    setInitialOffset(e.clientX, e.clientY)
  }

  function handleMouseUp() {
    clearActiveElement()
  }

  /** @param el {Element}
    * @typedef {{x: number, y: number}} Coords
    * @return {Coords}
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


  /** @param el {Element}
    */
  function addElement(el) {
    el.addEventListener("mousedown", handleMouseDown);
    if(!positionTypes.some(hasPositionType.bind(null, el))) {
      console.warn("%o%cGrabby hand: You're using me incorrectly with the above element! It does not have one of the following position types: %o", el, consoleStyleWarning, positionTypes)
    }
    if(!unitClasses.some(hasClass.bind(null, el))) {
      console.warn("%o%cGrabby hand: You're using me incorrectly with the above element! It should use one of the following classes: %o", el, consoleStyleWarning, unitClasses)
    }
  }

  /**
    * @param x {number}
    * @param y {number}
    */
  function setPositionRelativeToInitialOffset(x, y) {
    if (_activeEl !== null) {
      const pxw = x - _activeElInitOffsetX
      const pxh = y - _activeElInitOffsetY
      setPositionInPx(pxw, pxh)
    }
  }
  /**
    * @param x {number}
    * @param y {number}
    */
  function setPositionInPx(x, y) {
    if (_activeEl !== null) {
      _activeEl.style.setProperty('--grabby-hand-pxw', `${x}px`)
      _activeEl.style.setProperty('--grabby-hand-pxh', `${y}px`)
      _activeEl.style.setProperty('--grabby-hand-vw', pxToVw(x))
      _activeEl.style.setProperty('--grabby-hand-vh', pxToVh(y))
    }
  }

  /**
    * @param el {Element}
    */
  function setActiveElement(el) {
    _activeEl = el;
    _activeEl.setAttribute('draggable', false)
    document.body.classList.add('grabby-hand-grabbing');
    _mostRecentActiveEl = _activeEl
  }

  function setInitialOffset(x, y) {
    const { x: elX, y: elY } = getAbsoluteRect(_activeEl);
    _activeElInitOffsetX = x - elX;
    _activeElInitOffsetY = y - elY;
  }

  function clearActiveElement() {
    document.body.classList.remove('grabby-hand-grabbing');
    if(_activeEl !== null) {
      _activeEl.removeAttribute('draggable')
      _activeEl = null;
    }
  }

  /**
    * @param el {Element}
    * @param prop {string}
    * @return string
    */
  function getStyleValue(el, prop) {
    return el.style.getPropertyValue(prop)
  }

  function getStyle() {
    if(_mostRecentActiveEl !== null) {
      const el = _mostRecentActiveEl
      /* TODO use constants for these property names? */
      const pxw = getStyleValue(el, '--grabby-hand-pxw')
      const pxh = getStyleValue(el, '--grabby-hand-pxh')
      const vw = getStyleValue(el, '--grabby-hand-vw')
      const vh = getStyleValue(el, '--grabby-hand-vh')
      return `left: ${pxw}; left: ${vw}; top: ${pxh}; top: ${vh};`
    } else {
      console.warn("%cGrabby hand: You need to grab an element first.", consoleStyleWarning)
    }
  }
  function copyStyle() {
    copy(getStyle())
  }

  window.grabbyHand = {
    getStyle,
    copyStyle,
    setActiveElement,
    clearActiveElement,
    setPositionInPx,
  }
})();
