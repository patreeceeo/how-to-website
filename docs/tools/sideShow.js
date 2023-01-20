window.addEventListener("load", handleLoad);

let currentSlideIndex = 0;
let currentFrameIndex = 0;
/** @type Array<HTMLElement> */
let slideRootElements = [];
/** @type Array<Array<HTMLElement>> */
let slideFrames = [];

function handleLoad() {
  currentSlideIndex = getCurrentSlideIndexFromLocation();
  currentFrameIndex = getCurrentFrameIndexFromLocation();
  slideRootElements = findSlideRootElements();
  slideFrames = findSlideFrames(slideRootElements);
  addEventListeners();
  update();
}

function getCurrentSlideIndexFromLocation() {
  const params = new URLSearchParams(location.search);
  return params.has("slide")
    ? parseInt(/** @type string */ (params.get("slide")))
    : 0;
}
function getCurrentFrameIndexFromLocation() {
  const params = new URLSearchParams(location.search);
  return params.has("frame")
    ? parseInt(/** @type string */ (params.get("frame")))
    : 0;
}
/** @param index {number} */
function setCurrentSlideIndex(index) {
  if (index !== currentSlideIndex) {
    currentSlideIndex = index;
    currentFrameIndex = 0;
    const params = new URLSearchParams(location.search);
    params.set("slide", index.toString());
    params.set("frame", "0");
    location.search = params.toString();
  }
}
/** @param index {number} */
function setCurrentFrameIndex(index) {
  if (index !== currentFrameIndex) {
    currentFrameIndex = index;
    const params = new URLSearchParams(location.search);
    params.set("frame", index.toString());
    location.search = params.toString();
  }
}

function findSlideRootElements() {
  return /** @type {Array<HTMLElement>} */(toArray(document.querySelectorAll("[x-side-show-slide]")))
}

/** @param rootElements {Array<HTMLElement>}
  * @returns Array<Array<HTMLElement>>
  * */
function findSlideFrames(rootElements) {
  const result = []
  for(const [index, el] of rootElements.entries()) {
    result[index] = /** @type {Array<HTMLElement>} */(toArray(el.querySelectorAll("[x-side-show-frame]")))
  }
  return result
}

/** @type {{[key: string]: () => void}} */
const keyMap = {
  ArrowLeft: prevFrameOrSlide,
  ArrowUp: prevFrameOrSlide,
  ArrowRight: nextFrameOrSlide,
  ArrowDown: nextFrameOrSlide
}

function addEventListeners() {
  document
    .querySelector("[x-side-show-next]")
    ?.addEventListener("click", (e) => {
      e.preventDefault()
      nextFrameOrSlide()
    });
  document
    .querySelector("[x-side-show-prev]")
    ?.addEventListener("click", (e) => {
      e.preventDefault()
      prevFrameOrSlide()
    });

  document.body.addEventListener("keydown", (e) => {
    const handler = keyMap[e.code]
    if(handler) {
      handler()
    }
  })

  const originalUrl = new URL(location.toString())

  window.addEventListener("locationchange", (e) => {
    const currentUrl = new URL(location.toString())
    if(currentUrl.origin === originalUrl.origin) {
      e.preventDefault()
      currentSlideIndex = getCurrentSlideIndexFromLocation();
      update()
    }
  })
}

/** @param slideIndex {number} */
function countSlideFrames(slideIndex) {
  return /** @type Array<HTMLElement> */(slideFrames[slideIndex]).length + 1
}
/** @param slideIndex {number} */
function getSlideFrames(slideIndex) {
  return /** @type Array<HTMLElement> */(slideFrames[slideIndex])
}

function nextFrameOrSlide() {
  if(currentFrameIndex < countSlideFrames(currentSlideIndex) - 1) {
    setCurrentFrameIndex(
      Math.min(currentFrameIndex + 1, countSlideFrames(currentSlideIndex) - 1)
    );
  } else {
    setCurrentSlideIndex(
      Math.min(currentSlideIndex + 1, slideRootElements.length - 1)
    );
  }
}
function prevFrameOrSlide() {
  if(currentFrameIndex > 0) {
    setCurrentFrameIndex(Math.max(currentFrameIndex - 1, 0));
  } else {
    setCurrentSlideIndex(Math.max(currentSlideIndex - 1, 0));
  }
}

function update() {
  for (const [slideIndex, slideElement] of slideRootElements.entries()) {
    Object.assign(
      slideElement.style,
      slideIndex === currentSlideIndex
        ? { display: "block", visibility: "visible" }
        : { display: "none", visibility: "hidden" }
    );
    for (const [frameIndex, frameElement] of getSlideFrames(slideIndex).entries()) {
      Object.assign(
        frameElement.style,
        frameIndex < currentFrameIndex
        ? { display: "block", visibility: "visible" }
        : { display: "none", visibility: "hidden" }
      );
    }
  }
}

/**
  * @template T
  * @param arrayLike {Iterable<T>}
  * @returns {Array<T>}
 */
function toArray(arrayLike) {
  return Array.prototype.slice.apply(arrayLike);
}

