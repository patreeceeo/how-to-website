
function exportHtml() {
  /** @type Document */
  const documentCopy = document.cloneNode(true)
  const excludedElements = documentCopy.querySelectorAll('[x-exclude-from-exported-html]')
  for(const el of excludedElements) {
    el.parentNode.removeChild(el)
  }
  return `<!DOCTYPE html>\n<html lang="en">\n  ${documentCopy.documentElement.innerHTML}</html>`
}

window.fileTool = {
  exportHtml
}
