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
  insert(item: HTMLElement, index: number, callback?: () => void): void;
  prepend(item: HTMLElement, callback?: () => void): void;
  append(item: HTMLElement, callback?: () => void): void;
  destroy(restoreMarkup?: boolean, callback?: () => void): void;
}

export interface PageInterface {
  [key: number]: number;
}

export interface SiemaOptions {
  selector?: string | HTMLElement;
  duration?: number;
  easing?: string;
  perPage?: number | PageInterface;
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
