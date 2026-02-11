import type { TemplateJsonElement } from '../types'

export const updateHtmlContent = (html: string, text: string) => {
  if (typeof DOMParser === 'undefined') {
    return `<p>${text}</p>`
  }
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const spans = Array.from(doc.querySelectorAll('span'))
  if (spans.length > 0) {
    spans.forEach((span, index) => {
      span.textContent = index === 0 ? text : ''
    })
  } else {
    const paragraph = doc.querySelector('p')
    if (paragraph) {
      paragraph.textContent = text
    } else {
      doc.body.textContent = text
    }
  }
  return doc.body.innerHTML
}

export const setElementText = (element: TemplateJsonElement, text: string) => {
  if (element.type !== 'text') return
  element.content = updateHtmlContent(element.content, text)
}
