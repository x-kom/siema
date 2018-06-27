// Type definitions for x-kom/siema
// Original project: https://github.com/pawelgrzybek/siema
// Original definitions by: Irmantas Zenkus <https://github.com/Irmiz>
//                          Pavel Puchkov <https://github.com/0x6368656174>
//                          Sam Nau <https://github.com/samnau>

export default class Siema {
  currentSlide: number;

  constructor(options?: SiemaOptions);

  next(howManySlides?: number, callback?: () => void): void;
  prev(howManySlides?: number, callback?: () => void): void;
  goTo(index: number, callback?: () => void): void;
  remove(index: number, callback?: () => void): void;
  insert(item: Node, index: number, callback?: () => void): void;
  replace(item: Node, index: number, callback?: () => void): void;
  prepend(item: Node, callback?: () => void): void;
  append(item: Node, callback?: () => void): void;
  destroy(restoreMarkup?: boolean, callback?: () => void): void;
}

export interface PageInterface {
  [key: number]: number;
}

export type SliderMode = 'left' | 'right' | 'center' | 'centerFit';

export interface SiemaOptions {
  selector?: string | Node;
  duration?: number;
  easing?: string;
  perPage?: number | PageInterface;
  mode?: SliderMode;
  startIndex?: number;
  draggable?: boolean;
  multipleDrag?: boolean;
  threshold?: number;
  preventClickOnDrag?: boolean;
  loop?: boolean;
  overflowHidden?: boolean;
  onInit?(): void;
  onChange?(): void;
}
