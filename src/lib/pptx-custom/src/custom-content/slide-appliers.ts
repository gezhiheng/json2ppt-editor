import type {
  BackendContentData,
  BackendContentsData,
  BackendCoverData,
  BackendTransitionData,
  TemplateJsonSlide
} from '../types'
import { setElementText } from './html'

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
  if (partNumber) setElementText(partNumber, `${sectionIndex}`.padStart(2, '0'))
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
