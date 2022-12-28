// TODO rename to moveTool
// TODO add all block elements by default?
// TODO move this to its own repo?
// TODO add removeElement API method
// TODO are there better names than "addElement" and "removeElement"? "unlock" and "lock" ?
// TODO add method to list current movable elements
// TODO add lock{Position|Rotation|Scale}OfElement
// TODO use API methods instead of unit classes
// TODO add method to get active element
// TODO use addElement method instead of x-grabby-hand attribute
// TODO use $0 instead with addElement
// TODO put styles into dynamically load CSS file
// TODO arrow keys to adjust?
// TODO rotation, scale, skew
// TODO change z-index
// TODO snapping, guides and grids
// TODO show warning message if used in http[s] location
// TODO are IIFEs necessary?
(() => {
  const positionTypes = ["absolute", "relative", "fixed"]
  const consoleStyleInfo = "font-size: 1rem; background-color: skyblue; padding: 0.5rem; border-radius: 0.5rem"
  const consoleStyleWarning = "font-size: 1rem;"

  /** @type {HTMLElement | null} */
  let _activeEl = null;
  /** @type {HTMLElement | null} */
  let _mostRecentActiveEl = null;
  let _activeElInitOffsetX = 0;
  let _activeElInitOffsetY = 0;

  window.addEventListener("load", handleLoad);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);

  // TODO remove/ignore when generating HTML from DOM
  const em = document.createElement("div")
  em.id = "grabby-hand-em"
  em.style.width = "1em"
  em.style.visibility = "hidden"
  em.setAttribute('x-exclude-from-exported-html', "true")
  document.body.append(em)

  // TODO remove/ignore when generating HTML from DOM
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
  .grabby-hand-use-em [x-grabby-hand],
  [x-grabby-hand].grabby-hand-use-em {
    left: var(--grabby-hand-emw);
    top: var(--grabby-hand-emh);
  }
  `)

  function handleLoad() {
    const els = document.querySelectorAll("[x-grabby-hand]");
    console.info("%cGrabby hand: Hello! Grab any of the below elements to move it.%o", consoleStyleInfo, els)

    for (const el of els) {
      if(el instanceof HTMLElement) {
        addElement(el)
      }
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
    if(e.target !== null) {
      /** @type {HTMLElement} */
      const el = /** @type {any} */(e.target)
      setActiveElement(el)
      setInitialOffset(e.clientX, e.clientY)
    }
  }

  function handleMouseUp() {
    clearActiveElement()
  }

  /** @param el {HTMLElement}
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
    style.setAttribute('x-exclude-from-exported-html', "true");

    const head = document.querySelector(`head`);
    /** @type HTMLElement */(head).append(style);
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
  /** @param px {number}
    * @return string
    */
  function pxToEm(px) {
    const refEl = document.getElementById("grabby-hand-em")
    const {width: em} = /** @type HTMLElement */(refEl).getBoundingClientRect()
    return `${px / em}em`
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


  /** @param el {HTMLElement}
    */
  function addElement(el) {
    el.addEventListener("mousedown", handleMouseDown);
    if(!positionTypes.some(hasPositionType.bind(null, el))) {
      console.warn("%o%cGrabby hand: You're using me incorrectly with the above element! It does not have one of the following position types: %o", el, consoleStyleWarning, positionTypes)
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
    * @template T
    * @typedef {{px: T, v: T, em: T}} UnitRecord<T>
    */


  /** @type {UnitRecord<(x: number) => string>}
    */
  const _xFunctionByUnit = {
    px: (x) => `${x}px`,
    v: (x) => pxToVw(x),
    em: (x) => pxToEm(x)
  }
  /** @type {UnitRecord<(y: number) => string>}
    */
  const _yFunctionByUnit = {
    px: (y) => `${y}px`,
    v: (y) => pxToVh(y),
    em: (y) => pxToEm(y)
  }

  /** @type {keyof UnitRecord<any>} */
  let _activeUnits = "em"

  /**
    * @param x {number}
    * @param y {number}
    */
  function setPositionInPx(x, y) {
    if (_activeEl !== null) {
      const style = _activeEl.style
      style.setProperty('left', _xFunctionByUnit[_activeUnits](x))
      style.setProperty('top', _yFunctionByUnit[_activeUnits](y))
    }
  }

  /**
    * @param el {HTMLElement}
    */
  function setActiveElement(el) {
    _activeEl = el;
    _activeEl.setAttribute('draggable', "false")
    document.body.classList.add('grabby-hand-grabbing');
    _mostRecentActiveEl = _activeEl
  }

  /** @param x {number}
    * @param y {number}
    */
  function setInitialOffset(x, y) {
    const { x: elX, y: elY } = getAbsoluteRect(/** @type {HTMLElement} */(_activeEl));
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
    * @param el {HTMLElement}
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
      return ""
    }
  }
  function copyStyle() {
    copy(getStyle())
  }

  /** @param units {keyof UnitRecord<any>} */
  function setActiveUnits(units) {
    _activeUnits = units
  }

  /** @type any */(window).grabbyHand = {
    getStyle,
    copyStyle,
    setActiveElement,
    clearActiveElement,
    setPositionInPx,
    setActiveUnits,
  }
})();
