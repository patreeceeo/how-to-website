window.addEventListener("load", handleLoad);

let currentSlideIndex = 0;
/** @type Array<HTMLElement> */
let slideRootElements = [];

function handleLoad() {
  currentSlideIndex = getCurrentSlideIndexFromLocation();
  slideRootElements = findSlideRootElements();
  addEventListeners();
  update();
}

function getCurrentSlideIndexFromLocation() {
  const params = new URLSearchParams(location.search);
  return params.has("slide")
    ? parseInt(/** @type string */ (params.get("slide")))
    : 0;
}
/** @param index {number} */
function setCurrentSlideIndex(index) {
  if (index !== currentSlideIndex) {
    currentSlideIndex = index;
    const params = new URLSearchParams(location.search);
    params.set("slide", index.toString());
    location.search = params.toString();
  }
}

function findSlideRootElements() {
  return toArray(document.querySelectorAll("[x-side-show-slide]"));
}

/** @type {{[key: string]: () => void}} */
const keyMap = {
  ArrowLeft: prevSlide,
  ArrowUp: prevSlide,
  ArrowRight: nextSlide,
  ArrowDown: nextSlide
}

function addEventListeners() {
  document
    .querySelector("[x-side-show-next]")
    ?.addEventListener("click", nextSlide);
  document
    .querySelector("[x-side-show-prev]")
    ?.addEventListener("click", prevSlide);

  document.body.addEventListener("keydown", (e) => {
    const handler = keyMap[e.code]
    if(handler) {
      handler()
    }
  })
}

function nextSlide() {
  setCurrentSlideIndex(
    Math.min(currentSlideIndex + 1, slideRootElements.length - 1)
  );
}
function prevSlide() {
  setCurrentSlideIndex(Math.max(currentSlideIndex - 1, 0));
}

function update() {
  for (const [index, element] of slideRootElements.entries()) {
    Object.assign(
      element.style,
      index === currentSlideIndex
        ? { display: "block", visibility: "visible" }
        : { display: "none", visibility: "hidden" }
    );
  }
}

/** @param arrayLike {Iterable<any>}
 */
function toArray(arrayLike) {
  return Array.prototype.slice.apply(arrayLike);
}
