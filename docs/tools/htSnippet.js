window.addEventListener("load", handleLoad);

function handleLoad() {
  const snippets = document.querySelectorAll('[x-ht-snippet]')
  for(const el of snippets) {
    const pre = document.createElement('pre')
    const html = el.innerHTML.toString()
    const lines = html.split('\n')
    const nonWhitespaceRE = /\S/
    let processedHTML = ''
    let minIndent = Infinity
    for(const line of lines) {
      const indent = line.search(/\S/)
      if(indent >= 0) {
        minIndent = Math.min(minIndent, line.search(nonWhitespaceRE))
      }
    }
    if(minIndent < Infinity) {
      for(const [index, line] of lines.entries()) {
        if(index > 0 && index < lines.length - 1 || line.search(nonWhitespaceRE) >= 0) {
          processedHTML += `${line.slice(minIndent)}\n`
        }
      }
    }
    pre.innerText = processedHTML
    el.appendChild(pre)
  }
}
