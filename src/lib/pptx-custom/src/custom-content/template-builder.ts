import type { CustomSlide, TemplateJson, TemplateJsonSlide } from '../types'
import {
  applyContentData,
  applyContentsData,
  applyCoverData,
  applyTransitionData
} from './slide-appliers'

const cloneSlide = (slide: TemplateJsonSlide): TemplateJsonSlide =>
  JSON.parse(JSON.stringify(slide)) as TemplateJsonSlide

export const applyCustomContentToTemplate = (
  template: TemplateJson,
  CustomSlides: CustomSlide[]
): TemplateJson => {
  const grouped = template.slides.reduce<Record<string, TemplateJsonSlide[]>>(
    (acc, slide) => {
      const key = slide.type || 'default'
      if (!acc[key]) acc[key] = []
      acc[key].push(slide)
      return acc
    },
    {}
  )

  const usage = new Map<string, number>()
  const getTextTypeCount = (slide: TemplateJsonSlide, textType: string) =>
    slide.elements.filter(
      element => element.type === 'text' && element.textType === textType
    ).length

  const getContentCapacity = (slide: TemplateJsonSlide) => {
    const titleSlots = getTextTypeCount(slide, 'itemTitle')
    const itemSlots = getTextTypeCount(slide, 'item')
    return Math.min(titleSlots, itemSlots)
  }

  const pickFromPool = (key: string, pool: TemplateJsonSlide[]) => {
    const index = usage.get(key) ?? 0
    usage.set(key, index + 1)
    return cloneSlide(pool[index % pool.length])
  }

  const pickSlide = (type: string, desiredCount?: number) => {
    const pool = grouped[type] || grouped.default || template.slides
    if (desiredCount == null || pool.length === 1) {
      return pickFromPool(type, pool)
    }

    const scored = pool.map(slide => {
      const capacity =
        type === 'content'
          ? getContentCapacity(slide)
          : getTextTypeCount(slide, 'item')
      return { slide, capacity }
    })
    const eligible = scored.filter(item => item.capacity >= desiredCount)
    if (eligible.length > 0) {
      const minCapacity = Math.min(...eligible.map(item => item.capacity))
      const best = eligible
        .filter(item => item.capacity === minCapacity)
        .map(item => item.slide)
      return pickFromPool(`${type}:${desiredCount}`, best)
    }
    const maxCapacity = Math.max(...scored.map(item => item.capacity))
    const fallback = scored
      .filter(item => item.capacity === maxCapacity)
      .map(item => item.slide)
    return pickFromPool(`${type}:${desiredCount}`, fallback)
  }

  let transitionIndex = 0
  const slides = CustomSlides.map(item => {
    const desiredCount =
      item.type === 'contents'
        ? item.data.items.length
        : item.type === 'content'
        ? item.data.items.length
        : undefined
    const slide = pickSlide(item.type, desiredCount)
    if (item.type === 'cover') {
      applyCoverData(slide, item.data)
    } else if (item.type === 'contents') {
      applyContentsData(slide, item.data)
    } else if (item.type === 'transition') {
      transitionIndex += 1
      applyTransitionData(slide, item.data, transitionIndex)
    } else if (item.type === 'content') {
      applyContentData(slide, item.data)
    }
    return slide
  })

  return {
    ...template,
    slides
  }
}
