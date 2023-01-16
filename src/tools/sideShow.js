window.addEventListener("load", handleLoad);

let currentSlideIndex = 0
/** @type Array<HTMLElement> */
let slideRootElements = []

function handleLoad() {
  slideRootElements = findSlideRootElements()
  addEventListeners()
  update()
}

function findSlideRootElements() {
  return toArray(document.querySelectorAll("[x-side-show-slide]"))
}

function addEventListeners() {
  document.querySelector("[x-side-show-next]")?.addEventListener("click", nextSlide)
  document.querySelector("[x-side-show-prev]")?.addEventListener("click", prevSlide)
}

function nextSlide() {
  currentSlideIndex = Math.min(currentSlideIndex + 1, slideRootElements.length - 1)
  update()
}
function prevSlide() {
  currentSlideIndex = Math.max(currentSlideIndex - 1, 0)
  update()
}

function update() {
  for(const [index, element] of slideRootElements.entries()) {
    Object.assign(element.style, index === currentSlideIndex ? {display: "block", visibility: "visible"}: {display: "none", "visibility": "hidden" })
  }
}

/** @param arrayLike {Iterable<any>}
  */
function toArray(arrayLike) {
  return Array.prototype.slice.apply(arrayLike)
}
