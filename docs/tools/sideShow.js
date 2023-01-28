window.addEventListener("load", handleLoad);

let currentSlideIndex = 0;
let currentFrameIndex = 0;
/** @type Array<HTMLElement> */
let chapterRootElements = [];
/** @type Array<HTMLElement> */
let slideRootElements = [];
/** @type Array<Array<HTMLElement>> */
let slideFrames = [];
let editingContent = false;

function handleLoad() {
  currentSlideIndex = getCurrentSlideIndexFromLocation();
  currentFrameIndex = getCurrentFrameIndexFromLocation();
  chapterRootElements = findChapterRootElements();
  slideRootElements = findSlideRootElements();
  slideFrames = findSlideFrames(slideRootElements);
  for(const el of slideRootElements) {
    originalDisplay.set(el, el.style.display)
  }
  for(const frame of slideFrames) {
    for(const el of frame) {
      originalDisplay.set(el, el.style.display)
    }
  }
  addEventListeners();
  update();
  createTOC();
  splash();
}

function splash() {
  const el = document.querySelector("[x-side-show-splash]")
  if(el) {
    el.style.opacity = 0;
    setTimeout(() => {
      el.remove()
    }, 1000)
  }
}

function createTOC() {
  const container = document.querySelector("[x-side-show-toc]")
  const data = {
    chapters: [],
    slides: []
  }
  if(container) {
    for(const [index, el] of chapterRootElements.entries()) {
      data.chapters[index] = {
        title: el.getAttribute("title"),
        slides: []
      }
    }
    for(const [index, el] of slideRootElements.entries()) {
      const header = el.querySelector('h1, h2, h3, h4, h5')
      const chapterIndex = chapterRootElements.indexOf(el.parentElement)

      data.slides[index] = {
        href: getSlideURL(index),
        title: `${header.innerText}`,
        chapter: chapterIndex
      }

      if(chapterIndex >= 0) {
        data.chapters[chapterIndex].slides.push(index)
      }
    }

    const dl = document.createElement('dl')
    container.appendChild(dl)
    for(const chapter of data.chapters) {
      const dt = document.createElement('dt')
      const dd = document.createElement('dd')
      const ol = document.createElement('ol')

      dl.appendChild(dt)
      dl.appendChild(dd)

      dt.innerText = chapter.title
      dd.appendChild(ol)

      for(const slideIndex of chapter.slides) {
        const slide = data.slides[slideIndex]
        const a = document.createElement('a');
        const li = document.createElement('li')
        a.href = slide.href
        a.innerText = slide.title
        a.addEventListener("click", handleClick)
        li.appendChild(a)
        ol.appendChild(li)

        function handleClick(e) {
          e.preventDefault()
          setCurrentSlideIndex(slideIndex)
          return false
        }
      }
    }
  }
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
    const url = new URL(location)
    const params = new URLSearchParams(location.search);
    params.set("slide", index.toString());
    params.set("frame", "0");
    url.search = params.toString()
    window.history.pushState({}, "", url)
    update()
    window.scroll(0,0)
  }
}
/** @param index {number} */
function setCurrentFrameIndex(index) {
  if (index !== currentFrameIndex) {
    currentFrameIndex = index;
    const url = new URL(location)
    const params = new URLSearchParams(location.search);
    params.set("frame", index.toString());
    url.search = params.toString()
    window.history.pushState({}, "", url)
    update()
  }
}

/** @param index {number} */
function getSlideURL(index) {
  const url = new URL(location)
  const params = new URLSearchParams(location.search);
  params.set("slide", index.toString());
  params.set("frame", "0");
  url.search = params
  return url
}

/** @param selector {string}
  * @param parent { Document | HTMLElement }
  * */
function querySelectorAll(selector, parent = document) {
  return /** @type {Array<HTMLElement>} */(toArray(parent.querySelectorAll(selector)))
}

function findChapterRootElements() {
  return querySelectorAll("side-show-chapter")
}
function findSlideRootElements() {
  return querySelectorAll("[x-side-show-slide]")
}

/** @param rootElements {Array<HTMLElement>}
  * @returns Array<Array<HTMLElement>>
  * */
function findSlideFrames(rootElements) {
  const result = []
  for(const [index, el] of rootElements.entries()) {
    result[index] = querySelectorAll("[x-side-show-frame]", el)
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
    if(handler && !editingContent) {
      handler()
    }
  })

  const originalUrl = new URL(location.toString())

  window.addEventListener("popstate", (e) => {
    const currentUrl = new URL(location.toString())
    if(currentUrl.origin === originalUrl.origin) {
      e.preventDefault()
      currentSlideIndex = getCurrentSlideIndexFromLocation();
      update()
      window.screenY = 0
    }
  })

  document.addEventListener("focusin", (e) => {
    if(/** @type HTMLElement */(e.target).isContentEditable) {
      editingContent = true
    }
  })
  document.addEventListener("focusout", (e) => {
    if(/** @type HTMLElement */(e.target).isContentEditable) {
      editingContent = false
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

/** @type Map<HTMLElement, string> */
const originalDisplay = new Map()

/**
  * @param el {HTMLElement}
  * @param visible {boolean} */
function setElementVisibility(el, visible) {
  Object.assign(
    el.style,
    visible
    ? { display: originalDisplay.get(el), visibility: "visible" }
    : { display: "none", visibility: "hidden" }
  )
}

function update() {
  for (const [slideIndex, slideElement] of slideRootElements.entries()) {
    setElementVisibility(slideElement, slideIndex === currentSlideIndex)
    for (const [frameIndex, frameElement] of getSlideFrames(slideIndex).entries()) {
      setElementVisibility(frameElement, frameIndex < currentFrameIndex)
    }
  }

  const elDisplayChapterTitle = document.querySelector('[x-side-show-display-chapter-title]')
  if(elDisplayChapterTitle) {
    elDisplayChapterTitle.innerText = slideRootElements[currentSlideIndex].parentElement.getAttribute('title')
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

