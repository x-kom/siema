/**
 * Hi :-) This is a class representing a Siema.
 */
export default class Siema {
  /**
   * Create a Siema.
   * @param {Object} options - Optional settings object.
   */
  constructor(options) {
    // Merge defaults with user's settings
    this.config = Siema.mergeSettings(options);

    // Resolve selector's type
    this.selector = typeof this.config.selector === 'string' ? document.querySelector(this.config.selector) : this.config.selector;

    // Early throw if selector doesn't exists
    if (this.selector === null) {
      throw new Error('Something wrong with your selector 😭');
    }

    // update perPage number dependable of user value

    // Create global references
    this.selectorWidth = this.selector.offsetWidth;
    this.innerElements = [].slice.call(this.selector.children);
    this.resolveSlidesNumber();
    this.currentSlide = Math.max(0, Math.min(this.config.startIndex, this.getLastPossibleSlideIndex()));
    this.resolveSliderOffset();
    this.transformProperty = Siema.webkitOrNot();

    // Bind all event handlers for referencability
    ['resizeHandler', 'touchstartHandler', 'touchendHandler', 'touchmoveHandler', 'mousedownHandler', 'mouseupHandler', 'mouseleaveHandler', 'mousemoveHandler', 'clickHandler'].forEach(method => {
      this[method] = this[method].bind(this);
    });

    // Build markup and apply required styling to elements
    this.init();
  }


  /**
   * Overrides default settings with custom ones.
   * @param {Object} options - Optional settings object.
   * @returns {Object} - Custom Siema settings.
   */
  static mergeSettings(options) {
    const settings = {
      selector: '.siema',
      duration: 200,
      easing: 'ease-out',
      perPage: 1,
      slideWidth: 0,
      // possible modes: left, right, center, centerFit
      mode: 'left',
      freeDrag: false,
      startIndex: 0,
      draggable: true,
      preventClickOnDrag: true,
      multipleDrag: true,
      threshold: 20,
      loop: false,
      overflowHidden: true,
      onInit: () => { },
      onChange: () => { },
    };

    const userSttings = options;
    for (const attrname in userSttings) {
      if (typeof userSttings[attrname] != 'undefined') {
        settings[attrname] = userSttings[attrname];
      }
    }

    return settings;
  }


  /**
   * Determine if browser supports unprefixed transform property.
   * Google Chrome since version 26 supports prefix-less transform
   * @returns {string} - Transform property supported by client.
   */
  static webkitOrNot() {
    const style = document.documentElement.style;
    if (typeof style.transform === 'string') {
      return 'transform';
    }
    return 'WebkitTransform';
  }

  /**
   * Attaches listeners to required events.
   */
  attachEvents() {
    // Resize element on window resize
    window.addEventListener('resize', this.resizeHandler);

    // If element is draggable / swipable, add event handlers
    if (this.config.draggable) {
      // Keep track pointer hold and dragging distance
      this.pointerDown = false;
      this.drag = {
        startX: 0,
        endX: 0,
        startY: 0,
        letItGo: null,
        preventClick: false,
      };

      // Touch events
      this.selector.addEventListener('touchstart', this.touchstartHandler);
      this.selector.addEventListener('touchend', this.touchendHandler);
      this.selector.addEventListener('touchmove', this.touchmoveHandler);

      // Mouse events
      this.selector.addEventListener('mousedown', this.mousedownHandler);
      this.selector.addEventListener('mouseup', this.mouseupHandler);
      this.selector.addEventListener('mouseleave', this.mouseleaveHandler);
      this.selector.addEventListener('mousemove', this.mousemoveHandler);

      // Click
      this.selector.addEventListener('click', this.clickHandler, this.config.preventClickOnDrag);
    }
  }


  /**
   * Detaches listeners from required events.
   */
  detachEvents() {
    window.removeEventListener('resize', this.resizeHandler);
    this.selector.style.cursor = 'auto';
    this.selector.removeEventListener('touchstart', this.touchstartHandler);
    this.selector.removeEventListener('touchend', this.touchendHandler);
    this.selector.removeEventListener('touchmove', this.touchmoveHandler);
    this.selector.removeEventListener('mousedown', this.mousedownHandler);
    this.selector.removeEventListener('mouseup', this.mouseupHandler);
    this.selector.removeEventListener('mouseleave', this.mouseleaveHandler);
    this.selector.removeEventListener('mousemove', this.mousemoveHandler);
    this.selector.removeEventListener('click', this.clickHandler);
  }


  /**
   * Builds the markup and attaches listeners to required events.
   */
  init() {
    this.attachEvents();

    // hide everything out of selector's boundaries
    if (this.config.overflowHidden) {
      this.selector.style.overflow = 'hidden';
    }

    // Create frame and apply styling
    this.sliderFrame = document.createElement('div');
    this.sliderFrame.style.width = `${(this.selectorWidth / this.perPage) * this.innerElements.length}px`;
    this.sliderFrame.style.webkitTransition = `all ${this.config.duration}ms ${this.config.easing}`;
    this.sliderFrame.style.transition = `all ${this.config.duration}ms ${this.config.easing}`;

    if (this.config.draggable) {
      this.selector.style.cursor = '-webkit-grab';
    }

    // Create a document fragment to put slides into it
    const docFragment = document.createDocumentFragment();

    // Loop through the slides, add styling and add them to document fragment
    for (let i = 0; i < this.innerElements.length; i++) {
      const elementContainer = document.createElement('div');
      elementContainer.style.cssFloat = 'left';
      elementContainer.style.float = 'left';
      elementContainer.style.width = `${100 / this.innerElements.length}%`;
      elementContainer.appendChild(this.innerElements[i]);
      docFragment.appendChild(elementContainer);
    }

    // Add fragment to the frame
    this.sliderFrame.appendChild(docFragment);

    // Clear selector (just in case something is there) and insert a frame
    this.selector.innerHTML = '';
    this.selector.appendChild(this.sliderFrame);

    // Go to currently active slide after initial build
    this.slideToCurrent();
    this.config.onInit.call(this);
  }

  getSlideWidth() {
    return this.config.slideWidth || this.innerElements[0].children[0].offsetWidth;
  }

  /**
   * Determinates slides number accordingly to clients viewport.
   */
  resolveSlidesNumber() {
    if (typeof this.config.perPage === 'number') {
      if (!this.config.perPage) {
        this.perPage = this.selector.offsetWidth / this.getSlideWidth();
      }
      else {
        this.perPage = this.config.perPage;
      }
    }
    else if (typeof this.config.perPage === 'object') {
      this.perPage = 1;
      for (const viewport in this.config.perPage) {
        if (window.innerWidth >= viewport) {
          this.perPage = this.config.perPage[viewport];
        }
      }
    }
  }

  getLastPossibleSlideIndex() {
    return this.config.perPage ? this.innerElements.length - this.perPage : (this.innerElements.length - 1);
  }

  /**
   * Calculates current slider offset accordingly to selected mode and currentSlide
   */
  resolveSliderOffset() {
    if (this.config.mode === 'center') {
      this.sliderOffset = (this.perPage - 1) / 2;
    }
    else if (this.config.mode === 'centerFit') {
      const centerModeOffset = (this.perPage - 1) / 2;
      if (this.currentSlide - centerModeOffset < 0) {
        this.sliderOffset = this.currentSlide;
      }
      else if (this.innerElements.length - this.currentSlide - 1 - centerModeOffset < 0) {
        this.sliderOffset = this.perPage - (this.innerElements.length - this.currentSlide - 1) - 1;
      }
      else {
        this.sliderOffset = (this.perPage - 1) / 2;
      }
    }
    else if (this.config.mode === 'left') {
      this.sliderOffset = 0;
    }
    else if (this.config.mode === 'right') {
      this.sliderOffset = this.perPage - 1;
    }
    else {
      this.sliderOffset = 0;
    }
  }

  /**
   * Go to previous slide.
   * @param {number} [howManySlides=1] - How many items to slide backward.
   * @param {function} callback - Optional callback function.
   */
  prev(howManySlides = 1, callback) {
    if (this.innerElements.length <= this.perPage) {
      return;
    }
    const beforeChange = this.currentSlide;
    if (this.currentSlide === 0 && this.config.loop) {
      this.currentSlide = this.getLastPossibleSlideIndex();
    }
    else {
      this.currentSlide = Math.max(this.currentSlide - howManySlides, 0);
    }
    if (beforeChange !== this.currentSlide) {
      this.resolveSliderOffset();
      this.slideToCurrent();
      this.config.onChange.call(this);
      if (callback) {
        callback.call(this);
      }
    }
  }


  /**
   * Go to next slide.
   * @param {number} [howManySlides=1] - How many items to slide forward.
   * @param {function} callback - Optional callback function.
   */
  next(howManySlides = 1, callback) {
    if (this.innerElements.length <= this.perPage) {
      return;
    }
    const beforeChange = this.currentSlide;
    if (this.currentSlide === this.getLastPossibleSlideIndex() && this.config.loop) {
      this.currentSlide = 0;
    }
    else {
      this.currentSlide = Math.min(this.currentSlide + howManySlides, this.getLastPossibleSlideIndex());
    }
    if (beforeChange !== this.currentSlide) {
      this.resolveSliderOffset();
      this.slideToCurrent();
      this.config.onChange.call(this);
      if (callback) {
        callback.call(this);
      }
    }
  }


  /**
   * Go to slide with particular index
   * @param {number} index - Item index to slide to.
   * @param {function} callback - Optional callback function.
   */
  goTo(index, callback) {
    if (this.innerElements.length <= this.perPage) {
      return;
    }
    const beforeChange = this.currentSlide;
    this.currentSlide = Math.min(Math.max(index, 0), this.getLastPossibleSlideIndex());
    if (beforeChange !== this.currentSlide) {
      this.resolveSliderOffset();
      this.slideToCurrent();
      this.config.onChange.call(this);
      if (callback) {
        callback.call(this);
      }
    }
  }

  getCurrentOffset() {
    return (this.currentSlide - this.sliderOffset) * (this.selectorWidth / this.perPage);
  }

  /**
   * Moves sliders frame to position of currently active slide
   */
  slideToCurrent() {
    this.sliderFrame.style[this.transformProperty] = `translate3d(${-this.getCurrentOffset()}px, 0, 0)`;
  }

  updateSliderOffsetAfterDrag(movement) {
    this.sliderOffset += movement / this.getSlideWidth();
    if (this.currentSlide - this.sliderOffset < 0) {
      this.sliderOffset = this.currentSlide;
    }
    else if (this.currentSlide - this.sliderOffset > this.innerElements.length - this.perPage) {
      this.sliderOffset = this.currentSlide - (this.innerElements.length - this.perPage);
    }
  }

  /**
   * Recalculate drag /swipe event and reposition the frame of a slider
   */
  updateAfterDrag() {
    const movement = this.drag.endX - this.drag.startX;

    if (this.config.freeDrag) {
      this.updateSliderOffsetAfterDrag(movement);
      this.slideToCurrent();
      return;
    }

    const movementDistance = Math.abs(movement);
    const howManySliderToSlide = this.config.multipleDrag ? Math.ceil(movementDistance / (this.selectorWidth / this.perPage)) : 1;

    if (movement > 0 && movementDistance > this.config.threshold && this.innerElements.length > this.perPage) {
      this.prev(howManySliderToSlide);
    }
    else if (movement < 0 && movementDistance > this.config.threshold && this.innerElements.length > this.perPage) {
      this.next(howManySliderToSlide);
    }
    this.resolveSliderOffset();
    this.slideToCurrent();
  }


  /**
   * When window resizes, resize slider components as well
   */
  resizeHandler() {
    // update perPage number dependable of user value
    this.resolveSlidesNumber();

    // update sliderFrame width
    this.selectorWidth = this.selector.offsetWidth;
    this.sliderFrame.style.width = `${(this.selectorWidth / this.perPage) * this.innerElements.length}px`;

    // recalculate currentSlide
    // prevent hiding items when browser width increases
    if (this.config.perPage && this.currentSlide + this.perPage > this.innerElements.length) {
      this.currentSlide = this.innerElements.length <= this.perPage ? 0 : this.getLastPossibleSlideIndex();
    }

    this.resolveSliderOffset();
    this.slideToCurrent();
  }


  /**
   * Clear drag after touchend and mouseup event
   */
  clearDrag() {
    this.drag = {
      startX: 0,
      endX: 0,
      startY: 0,
      letItGo: null,
      preventClick: this.drag.preventClick
    };
  }


  /**
   * touchstart event handler
   */
  touchstartHandler(e) {
    // Prevent dragging / swiping on inputs, selects and textareas
    const ignoreSiema = ['TEXTAREA', 'OPTION', 'INPUT', 'SELECT'].indexOf(e.target.nodeName) !== -1;
    if (ignoreSiema) {
      return;
    }

    e.stopPropagation();
    this.pointerDown = true;
    this.drag.startX = e.touches[0].pageX;
    this.drag.startY = e.touches[0].pageY;
  }


  /**
   * touchend event handler
   */
  touchendHandler(e) {
    e.stopPropagation();
    this.pointerDown = false;
    this.sliderFrame.style.webkitTransition = `all ${this.config.duration}ms ${this.config.easing}`;
    this.sliderFrame.style.transition = `all ${this.config.duration}ms ${this.config.easing}`;
    if (this.drag.endX) {
      this.updateAfterDrag();
    }
    this.clearDrag();
  }


  /**
   * touchmove event handler
   */
  touchmoveHandler(e) {
    e.stopPropagation();

    if (this.drag.letItGo === null) {
      this.drag.letItGo = Math.abs(this.drag.startY - e.touches[0].pageY) < Math.abs(this.drag.startX - e.touches[0].pageX);
    }

    if (this.pointerDown && this.drag.letItGo) {
      e.preventDefault();
      this.drag.endX = e.touches[0].pageX;
      this.sliderFrame.style.webkitTransition = `all 0ms ${this.config.easing}`;
      this.sliderFrame.style.transition = `all 0ms ${this.config.easing}`;
      this.sliderFrame.style[this.transformProperty] = `translate3d(${(this.getCurrentOffset() + (this.drag.startX - this.drag.endX)) * -1}px, 0, 0)`;
    }
  }


  /**
   * mousedown event handler
   */
  mousedownHandler(e) {
    // Prevent dragging / swiping on inputs, selects and textareas
    const ignoreSiema = ['TEXTAREA', 'OPTION', 'INPUT', 'SELECT'].indexOf(e.target.nodeName) !== -1;
    if (ignoreSiema) {
      return;
    }

    if (typeof e.target.tabIndex !== 'number' || e.target.tabIndex < 0) {
      // main purpose is to prevent drag event on elements inside siema which completely breaks the slides dragging behaviour in firefox
      // exception is when element has a tabIndex set, in which case event shouldn't be cancelled because target element won't receive focus event
      e.preventDefault();
    }
    e.stopPropagation();
    this.pointerDown = true;
    this.drag.startX = e.pageX;
  }


  /**
   * mouseup event handler
   */
  mouseupHandler(e) {
    e.stopPropagation();
    this.pointerDown = false;
    this.selector.style.cursor = '-webkit-grab';
    this.sliderFrame.style.webkitTransition = `all ${this.config.duration}ms ${this.config.easing}`;
    this.sliderFrame.style.transition = `all ${this.config.duration}ms ${this.config.easing}`;
    if (this.drag.endX) {
      this.updateAfterDrag();
    }
    this.clearDrag();
  }


  /**
   * mousemove event handler
   */
  mousemoveHandler(e) {
    if (this.pointerDown) {
      e.preventDefault();
      this.drag.endX = e.pageX;

      const dragDistance = Math.abs(this.drag.startX - this.drag.endX);
      if (dragDistance > 2 && this.config.preventClickOnDrag) {
        this.drag.preventClick = true;
      }

      this.selector.style.cursor = '-webkit-grabbing';
      this.sliderFrame.style.webkitTransition = `all 0ms ${this.config.easing}`;
      this.sliderFrame.style.transition = `all 0ms ${this.config.easing}`;
      this.sliderFrame.style[this.transformProperty] = `translate3d(${(this.getCurrentOffset() + (this.drag.startX - this.drag.endX)) * -1}px, 0, 0)`;
    }
  }


  /**
   * mouseleave event handler
   */
  mouseleaveHandler(e) {
    if (this.pointerDown) {
      this.pointerDown = false;
      this.selector.style.cursor = '-webkit-grab';
      this.drag.endX = e.pageX;
      this.drag.preventClick = false;
      this.sliderFrame.style.webkitTransition = `all ${this.config.duration}ms ${this.config.easing}`;
      this.sliderFrame.style.transition = `all ${this.config.duration}ms ${this.config.easing}`;
      this.updateAfterDrag();
      this.clearDrag();
    }
  }


  /**
   * click event handler
   */
  clickHandler(e) {
    // if the dragged element is a link
    // prevent browsers from folowing the link
    if (this.drag.preventClick) {
      e.stopPropagation();
      e.preventDefault();
    }
    this.drag.preventClick = false;
  }


  /**
   * Update after removing, prepending or appending items.
   */
  updateFrame() {
    // Create frame and apply styling
    this.sliderFrame = document.createElement('div');
    this.sliderFrame.style.width = `${(this.selectorWidth / this.perPage) * this.innerElements.length}px`;
    this.sliderFrame.style.webkitTransition = `all ${this.config.duration}ms ${this.config.easing}`;
    this.sliderFrame.style.transition = `all ${this.config.duration}ms ${this.config.easing}`;

    if (this.config.draggable) {
      this.selector.style.cursor = '-webkit-grab';
    }

    // Create a document fragment to put slides into it
    const docFragment = document.createDocumentFragment();

    // Loop through the slides, add styling and add them to document fragment
    for (let i = 0; i < this.innerElements.length; i++) {
      const elementContainer = document.createElement('div');
      elementContainer.style.cssFloat = 'left';
      elementContainer.style.float = 'left';
      elementContainer.style.width = `${100 / this.innerElements.length}%`;
      elementContainer.appendChild(this.innerElements[i]);
      docFragment.appendChild(elementContainer);
    }

    // Add fragment to the frame
    this.sliderFrame.appendChild(docFragment);

    // Clear selector (just in case something is there) and insert a frame
    this.selector.innerHTML = '';
    this.selector.appendChild(this.sliderFrame);

    // Go to currently active slide after initial build
    this.resolveSliderOffset();
    this.slideToCurrent();
  }


  /**
   * Remove item from carousel.
   * @param {number} index - Item index to remove.
   * @param {function} callback - Optional callback to call after remove.
   */
  remove(index, callback) {
    if (index < 0 || index >= this.innerElements.length) {
      throw new Error('Item to remove doesn\'t exist 😭');
    }

    // Shift sliderFrame back by one item when:
    // 1. Item with lower index than currenSlide is removed.
    // 2. Last item is removed.
    const lowerIndex = index < this.currentSlide;
    const lastItem = this.currentSlide + this.perPage - 1 === index;

    if (lowerIndex || lastItem) {
      this.currentSlide--;
    }

    this.innerElements.splice(index, 1);

    this.updateFrame();
    if (callback) {
      callback.call(this);
    }
  }


  /**
   * Insert item to carousel at particular index.
   * @param {HTMLElement} item - Item to insert.
   * @param {number} index - Index of new item insertion.
   * @param {function} callback - Optional callback to call after insert.
   */
  insert(item, index, callback) {
    if (index < 0 || index > this.innerElements.length + 1) {
      throw new Error('Unable to insert it at this index 😭');
    }
    if (this.innerElements.indexOf(item) !== -1) {
      throw new Error('The same item in a carousel? Really? Nope 😭');
    }

    // Avoid shifting content
    const shouldItShift = index <= this.currentSlide > 0 && this.innerElements.length;
    this.currentSlide = shouldItShift ? this.currentSlide + 1 : this.currentSlide;

    this.innerElements.splice(index, 0, item);

    this.updateFrame();
    if (callback) {
      callback.call(this);
    }
  }

  /**
   * Replace carousel item at particular index with new item.
   * @param {HTMLElement} item - Replacement item.
   * @param {number} index - Index of item to be replaced.
   * @param {function} callback - Optional callback to call after replacement.
   */
  replace(item, index, callback) {
    if (index < 0 || index > this.innerElements.length + 1) {
      throw new Error('Unable to replace it at this index 😭');
    }
    if (this.innerElements.indexOf(item) !== -1) {
      throw new Error('The same item in a carousel? Really? Nope 😭');
    }

    this.innerElements.splice(index, 1, item);

    this.updateFrame();
    if (callback) {
      callback.call(this);
    }
  }

  /**
   * Prepend item to carousel.
   * @param {HTMLElement} item - Item to prepend.
   * @param {function} callback - Optional callback to call after prepend.
   */
  prepend(item, callback) {
    this.insert(item, 0);
    if (callback) {
      callback.call(this);
    }
  }


  /**
   * Append item to carousel.
   * @param {HTMLElement} item - Item to append.
   * @param {function} callback - Optional callback to call after append.
   */
  append(item, callback) {
    this.insert(item, this.innerElements.length + 1);
    if (callback) {
      callback.call(this);
    }
  }


  /**
   * Removes listeners and optionally restores to initial markup
   * @param {boolean} restoreMarkup - Determinants about restoring an initial markup.
   * @param {function} callback - Optional callback function.
   */
  destroy(restoreMarkup = false, callback) {
    this.detachEvents();

    if (restoreMarkup) {
      const slides = document.createDocumentFragment();
      for (let i = 0; i < this.innerElements.length; i++) {
        slides.appendChild(this.innerElements[i]);
      }
      this.selector.innerHTML = '';
      this.selector.appendChild(slides);
      this.selector.removeAttribute('style');
    }

    if (callback) {
      callback.call(this);
    }
  }
}
