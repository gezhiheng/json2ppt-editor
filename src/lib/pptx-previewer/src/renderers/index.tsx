import type { SlideElement } from '../types';
import { renderImage } from './image';
import { renderLine } from './line';
import { renderShape } from './shape';
import { renderTable } from './table';
import { renderText } from './text';

export function renderElement(element: SlideElement, markerId: string) {
  if (element.type === 'shape') return renderShape(element, `shape-${markerId}`);
  if (element.type === 'line') return renderLine(element, markerId);
  if (element.type === 'text') return renderText(element);
  if (element.type === 'image') return renderImage(element);
  if (element.type === 'table') return renderTable(element);
  return null;
}
