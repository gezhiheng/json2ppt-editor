import type {
  BackendContentData,
  BackendContentsData,
  BackendCoverData,
  BackendTransitionData,
  TemplateJsonSlide
} from '../types'
import { setElementText, updateHtmlContent } from './html'

function setShapeTextByType (
  slide: TemplateJsonSlide,
  textType: string,
  text: string
): boolean {
  const shape = slide.elements.find((element) => {
    if (element.type !== 'shape') return false
    const maybeShape = element as unknown as {
      text?: { type?: string; content?: string }
    }
    return maybeShape.text?.type === textType
  })

  if (!shape) return false

  const shapeWithText = shape as unknown as {
    text?: { type?: string; content?: string }
  }
  if (!shapeWithText.text || typeof shapeWithText.text.content !== 'string') {
    return false
  }

  shapeWithText.text.content = updateHtmlContent(shapeWithText.text.content, text)
  return true
}

export const applyCoverData = (slide: TemplateJsonSlide, data: BackendCoverData) => {
  const title = slide.elements.find(
    element => element.type === 'text' && element.textType === 'title'
  )
  const content = slide.elements.find(
    element => element.type === 'text' && element.textType === 'content'
  )
  if (title) setElementText(title, data.title)
  if (content) setElementText(content, data.text)
}

export const applyContentsData = (
  slide: TemplateJsonSlide,
  data: BackendContentsData
) => {
  const items = slide.elements.filter(
    element => element.type === 'text' && element.textType === 'item'
  )
  items.forEach((element, index) => {
    const text = data.items[index]
    if (text) setElementText(element, text)
  })
}

export const applyTransitionData = (
  slide: TemplateJsonSlide,
  data: BackendTransitionData,
  sectionIndex: number
) => {
  const title = slide.elements.find(
    element => element.type === 'text' && element.textType === 'title'
  )
  const content = slide.elements.find(
    element => element.type === 'text' && element.textType === 'content'
  )
  const partNumber = slide.elements.find(
    element => element.type === 'text' && element.textType === 'partNumber'
  )
  if (title) setElementText(title, data.title)
  if (content) setElementText(content, data.text)
  const formattedSectionIndex = `${sectionIndex}`.padStart(2, '0')
  if (partNumber) {
    setElementText(partNumber, formattedSectionIndex)
  } else {
    setShapeTextByType(slide, 'partNumber', formattedSectionIndex)
  }
}

export const applyContentData = (slide: TemplateJsonSlide, data: BackendContentData) => {
  const title = slide.elements.find(
    element => element.type === 'text' && element.textType === 'title'
  )
  if (title) setElementText(title, data.title)

  const itemTitles = slide.elements.filter(
    element => element.type === 'text' && element.textType === 'itemTitle'
  )
  const items = slide.elements.filter(
    element => element.type === 'text' && element.textType === 'item'
  )

  data.items.forEach((item, index) => {
    const titleEl = itemTitles[index]
    const textEl = items[index]
    if (titleEl) setElementText(titleEl, item.title)
    if (textEl) setElementText(textEl, item.text)
  })
}
