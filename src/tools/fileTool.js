
function exportHtml() {
  /** @type Document */
  const documentCopy = document.cloneNode(true)
  const excludedElements = documentCopy.querySelectorAll('[x-exclude-from-exported-html]')
  for(const el of excludedElements) {
    el.parentNode.removeChild(el)
  }
  // This is complicated because the current version of Chromium doesn't perfectly preserve whitespace when retreiving HTML strings from the DOM
  const bodyAttributes = documentCopy.body.attributes
  let bodyAttributeStrings = []
  for(const attr of bodyAttributes) {
    bodyAttributeStrings.push(`${attr.name}="${attr.value}"`)
  }
  return `<!DOCTYPE html>\n<html lang="en">\n  ${documentCopy.head.outerHTML.trim()}\n  <body ${bodyAttributeStrings.join(' ')}>\n    ${documentCopy.body.innerHTML.trim()}\n  </body>\n</html>`
}

window.fileTool = {
  exportHtml
}
