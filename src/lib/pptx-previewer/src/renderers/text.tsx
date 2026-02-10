import { type CSSProperties } from 'react';
import type { SlideElement } from '../types';

export function renderText(element: SlideElement) {
  const paragraphStyle =
    element.paragraphSpace !== undefined
      ? ({ ['--paragraphSpace' as string]: `${element.paragraphSpace}px` } as CSSProperties)
      : undefined;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: 10,
        lineHeight: element.lineHeight ?? 1.5,
        letterSpacing: `${element.wordSpace ?? 0}px`,
        wordBreak: 'break-word',
        fontFamily: element.defaultFontName || 'sans-serif',
        color: element.defaultColor,
        writingMode: element.vertical ? 'vertical-rl' : undefined,
        ...paragraphStyle
      }}
      dangerouslySetInnerHTML={{ __html: element.content || '' }}
    />
  );
}
