import { MIN_LINE_SIZE } from '../constants';
import type { SlideElement } from '../types';

export function getElementSize(element: SlideElement): { width: number; height: number } {
  if (element.type === 'line' && element.start && element.end) {
    return {
      width: Math.max(Math.abs(element.end[0] - element.start[0]), MIN_LINE_SIZE),
      height: Math.max(Math.abs(element.end[1] - element.start[1]), MIN_LINE_SIZE)
    };
  }

  return {
    width: element.width ?? 0,
    height: element.height ?? 0
  };
}
