import type { SlideElement } from '../types';

export const getShadowFilter = (shadow?: SlideElement['shadow']) => {
  if (!shadow) return undefined;
  const h = shadow.h ?? 0;
  const v = shadow.v ?? 0;
  const blur = shadow.blur ?? 0;
  const color = shadow.color ?? '#000';
  return `drop-shadow(${h}px ${v}px ${blur}px ${color})`;
};

export const getFlipTransform = (flipH?: boolean, flipV?: boolean) => {
  const transforms = [flipH ? 'scaleX(-1)' : '', flipV ? 'scaleY(-1)' : '']
    .filter(Boolean)
    .join(' ');
  return transforms || undefined;
};
