import 'classlist-polyfill';
import EventEmitter from './helpers/event-emitter';
import Store from './helpers/store';
import Style from './helpers/style';

/**
 * @typedef SettingsHash
 * @type {Object}
 * @property {string} [selector='.sticky'] The selector used to identify the
 * elements processed by this library
 * @property {string} [activeClass='sticky-active'] The class name added when an
 * element starts sticking
 */

/**
 * The default values for settings available
 *
 * @type {SettingsHash}
 */
const defaults = {
   selector: '.sticky',
   activeClass: 'sticky--active'
};

/**
 * The settings to use when adding the event handler for the scroll event
 *
 * @type {Object}
 */
const scrollOptions = {
   passive: true
};

/**
 * The properties needed by the placeholder element to have the
 * occupy the same space as the element when in its original position
 *
 * @type {string[]}
 */
const properties = [
   'width',
   'height',
   'left',
   'marginLeft',
   'marginRight',
   'zIndex'
];

/**
 * The namespace used to store data related to the library
 * on the elements of a page
 *
 * @type {string}
 */
const namespace = 'auderosticky';

/**
 * The store used to manage the data stored
 *
 * @type {store}
 */
const store = new Store(namespace);

/**
 * Tests if passive event listeners are supported
 *
 * @return {boolean}
 */
function isPassiveEventListenerSupported() {
   let isSupported = false;

   try {
      const options = Object.defineProperty({}, 'passive', {
         get() {
            isSupported = true;
         }
      });

      window.addEventListener('', null, options);
   } catch(ex) {}

   return isSupported;
}

/**
 * Calculates the top and bottom margins of the element that has to stick
 * at the moment it'll stick
 *
 * @param {Sticky} sticky An instance of a Sticky object
 *
 * @returns {Object}
 */
function getStickyMargins(sticky) {
   // Knowing the top and bottom margins at the time the element
   // will stick is important because the specifications require
   // to consider these values when calculating the boundaries
   // in which the element sticks.
   let elementStyle, stickyMargins;

   sticky.element.classList.add(sticky.settings.activeClass);
   elementStyle = window.getComputedStyle(sticky.element);
   stickyMargins = {
      marginBottom: elementStyle.marginBottom,
      marginTop: elementStyle.marginTop
   };
   sticky.element.classList.remove(sticky.settings.activeClass);

   return stickyMargins;
}

/**
 * Returns the z-index value of the element if one is defined;
 * <code>undefined</code> otherwise
 *
 * @param {HTMLElement} element The element whose z-index value must be calculated
 *
 * @return {number|undefined}
 */
function getComputedZIndex(element) {
   const position = element.style.position;

   // Set the position to relative to address a bug in WebKit browsers (issue #15562)
   // https://bugs.webkit.org/show_bug.cgi?id=15562
   element.style.position = 'relative';

   const zIndex = Number(window.getComputedStyle(element).zIndex);

   element.style.position = position;

   return !isNaN(zIndex) ? zIndex : undefined;
}

/**
 * Returns the z-index value of the element if one is defined.
 * Otherwise, it calculates the z-index value of an element based
 * on its position in the DOM, among other elements selected
 * by the CSS selector provided
 *
 * @param {HTMLElement} element The element whose z-index value must be calculated
 * @param {string} selector The CSS selector to use
 *
 * @return {number}
 */
function getZIndex(element, selector) {
   const zIndex = getComputedZIndex(element);

   if (zIndex !== undefined) {
      return zIndex;
   }

   const stickyElements = [].slice.call(document.querySelectorAll(selector));

   return stickyElements.indexOf(element) + 1;
}

/**
 * Turns the unitless values of the object provided in pixels
 *
 * @param {Object} propertiesHash The object whose values will be converted
 *
 * @return {Object}
 */
function convertNumbersToPixels(propertiesHash) {
   const object = {};

   for(const property in propertiesHash) {
      object[property] = `${propertiesHash[property]}px`;
   }

   return object;
}

/**
 * Cleans up allocated resources and effects
 *
 * @param {Sticky} sticky An instance of a Sticky object
 */
function cleanUp(sticky) {
   const data = store.getData(sticky.element);

   Style.resetStyleProperties(
      sticky.element.style,
      properties.concat([
         'marginTop',
         'marginBottom',
         'top',
         'bottom'
      ])
   );
   sticky.element.style.position = data.position;

   if (data.placeholder && data.placeholder.parentNode) {
      data.placeholder.parentNode.removeChild(data.placeholder);
   }
}

/**
 * Calculates the boundaries of the sticky element, that is at what
 * positions it has to start and end to stick.
 *
 * @param {HTMLElement} element The element based on which the boundaries are calculated
 * @param {Object} stickyMargins An object containing additional margins to consider
 * in the calculation
 *
 * @return {Object}
 */
function calculateBoundaries(element, stickyMargins) {
   const boundaries = {
      start: 0,
      end: 0
   };
   const elementStyle = window.getComputedStyle(element);
   const parentStyle = element.parentNode.getBoundingClientRect();

   // If the value of the "top" property is defined, in which case it has
   // a value different from "auto", the element will stick on the top.
   if (elementStyle.top !== 'auto') {
      boundaries.start = element.getBoundingClientRect().top - parseFloat(elementStyle.top);
      boundaries.end = parentStyle.bottom - (parseFloat(stickyMargins.marginBottom) || 0);
   } else {
      boundaries.start = element.getBoundingClientRect().bottom + parseFloat(elementStyle.bottom);
      boundaries.end = parentStyle.top + (parseFloat(stickyMargins.marginTop) || 0);
   }

   // Normalize the start and the limit position of the element.
   // This is needed when on the load of a page the position
   // isn't set at the top of the page.
   boundaries.start += window.pageYOffset;
   boundaries.end += window.pageYOffset;

   return boundaries;
}

/**
 * Updates the style of the placeholder element based on the current
 * values of the sticky element
 *
 * @param {Sticky} sticky An instance of a Sticky object
 */
function updatePlaceholderStyle(sticky) {
   const startPosition = sticky.element.getBoundingClientRect();
   const placeholder = store.getData(sticky.element, 'placeholder');

   Style.copyStyleProperties(
      placeholder.style,
      window.getComputedStyle(sticky.element),
      [
         'top',
         'bottom',
         'marginTop',
         'marginBottom',
         'marginLeft',
         'marginRight'
      ]
   );
   Style.copyStyleProperties(
      placeholder.style,
      convertNumbersToPixels(startPosition),
      [
         'width',
         'height',
         'left'
      ]
   );
}

/**
 * Returns the function to use as the event handler for
 * the <code>scroll</code> event
 *
 * @param {Sticky} sticky An instance of a Sticky object
 *
 * @return {Function}
 */
function onScroll(sticky) {
   const stickyMargins = getStickyMargins(sticky);
   const elementStyle = window.getComputedStyle(sticky.element);
   const distanceFromSide = elementStyle.top !== 'auto' ?
      parseFloat(elementStyle.top) :
      parseFloat(elementStyle.bottom);

   function startSticky() {
      const data = store.getData(sticky.element);

      updatePlaceholderStyle(sticky);
      data.position = sticky.element.style.position;
      store.setData(sticky.element, data);
      Style.copyStyleProperties(
         sticky.element.style,
         {
            position: 'fixed'
         }
      );
      Style.copyStyleProperties(sticky.element.style, data.placeholder.style, properties);
      sticky.element.parentNode.insertBefore(data.placeholder, sticky.element);
      EventEmitter.fireEvent('stickystart', sticky.element);
      sticky.element.classList.add(sticky.settings.activeClass);
   }

   function endSticky() {
      cleanUp(sticky);
      EventEmitter.fireEvent('stickyend', sticky.element);
      sticky.element.classList.remove(sticky.settings.activeClass);
   }

   function getBoundaries(isSticking) {
      const placeholder = store.getData(sticky.element).placeholder;

      // The boundaries are calculated based on the element
      // itself if it's not sticking;
      // otherwise the placeholder is used.
      return isSticking ?
         calculateBoundaries(placeholder, stickyMargins) :
         calculateBoundaries(sticky.element, stickyMargins);
   }

   function stickToTop() {
      const isAdded = !!store
         .getData(sticky.element)
         .placeholder
         .parentNode;
      const boundaries = getBoundaries(isAdded);
      const height = parseFloat(window.getComputedStyle(sticky.element).height) || 0;
      const gap = boundaries.end - height - window.pageYOffset;
      const isInRange = window.pageYOffset >= boundaries.start && window.pageYOffset <= boundaries.end;

      if (isInRange) {
         if (!isAdded) {
            startSticky();
         }

         sticky.element.style.top = gap - distanceFromSide >= 0 ? '' : `${gap}px`;
      } else if (isAdded) {
         endSticky();
      }
   }

   function stickToBottom() {
      const isAdded = !!store
         .getData(sticky.element)
         .placeholder
         .parentNode;
      const boundaries = getBoundaries(isAdded);
      const height = parseFloat(window.getComputedStyle(sticky.element).height) || 0;
      const windowBottom = window.pageYOffset + window.innerHeight;
      const gap = boundaries.end + height - windowBottom;
      const isInRange = windowBottom <= boundaries.start && windowBottom >= boundaries.end;

      if (isInRange) {
         if (!isAdded) {
            startSticky();
         }

         sticky.element.style.bottom = gap + distanceFromSide <= 0 ? '' : `${-gap}px`;
      } else if (isAdded) {
         endSticky();
      }
   }

   return elementStyle.top !== 'auto' ? stickToTop : stickToBottom;
}

/**
 * Returns the function to use as the event handler for
 * the <code>resize</code> event
 *
 * @param {Sticky} sticky An instance of a Sticky object
 *
 * @return {Function}
 */
function onResize(sticky) {
   return () => {
      sticky.destroy();
      sticky.init();
      store.getData(sticky.element, 'handlers').scroll();
   };
}

/**
 * Binds the events for the sticky object provided
 *
 * @param {Sticky} sticky An instance of a Sticky object
 */
function bindEvents(sticky) {
   const handlers = store.getData(sticky.element, 'handlers');

   window.addEventListener('load', handlers.scroll);
   window.addEventListener('scroll', handlers.scroll, isPassiveEventListenerSupported() ? scrollOptions : false);
   window.addEventListener('resize', handlers.resize);
}

/**
 * Unbinds the events for the sticky object provided
 *
 * @param {Sticky} sticky An instance of a Sticky object
 */
function unbindEvents(sticky) {
   const handlers = store.getData(sticky.element, 'handlers');

   window.removeEventListener('load', handlers.scroll);
   window.removeEventListener('scroll', handlers.scroll, isPassiveEventListenerSupported() ? scrollOptions : false);
   window.removeEventListener('resize', handlers.resize);
}

export
 default class Sticky {
   /**
    * Creates a new Sticky object
    *
    * @param {HTMLElement} element The element to render as sticky
    * @param {SettingsHash} [options={}] An object of options to customize the library
    *
    * @constructor
    */
   constructor(element, options = {}) {
      this.element = element;
      this.settings = Object.assign({}, defaults, options);
   }

   /**
    * Tests if the <code>sticky</code> value for the <code>position</code>
    * property is supported
    *
    * @return {boolean}
    */
   static isFeatureSupported() {
      const prefixes = [
         'ms',
         'webkit'
      ];
      let testStyle = 'position:sticky;';
      const element = document.createElement('div');

      prefixes.forEach(prefix => {
         testStyle += `position:-${prefix}-sticky;`;
      });
      element.style.cssText = testStyle;

      return !!element.style.position;
   }

   /**
    * Autoinitializes all the elements of the page matched by the selector provided
    * in the options or the default one if no selector is provided
    *
    * @param {SettingsHash} [options] An object of options to customize the library
    */
   static autoInit(options = {}) {
      options = Object.assign({}, defaults, options);

      [].forEach.call(
         document.querySelectorAll(options.selector),
         element => {
            const sticky = new Sticky(element, options);

            sticky.init();
         }
      );
   }

   /**
    * Initializes the library
    */
   init() {
      if (store.getData(this.element)) {
         throw new Error('This element has already been initialized');
      }

      const placeholder = document.createElement(this.element.nodeName);

      store.setData(this.element, {
         placeholder: placeholder,
         handlers: {
            scroll: onScroll(this),
            resize: onResize(this)
         },
         position: this.element.style.position
      });

      Style.copyStyleProperties(
         placeholder.style,
         {
            visibility: 'hidden',
            zIndex: getZIndex(this.element, this.settings.selector)
         }
      );

      updatePlaceholderStyle(this);
      bindEvents(this);

      // Execute the scroll handler to position the element if it
      // should stick when the page is loaded
      store.getData(this.element, 'handlers').scroll();
   }

   /**
    * Removes the effects of the library and clean up all the resources
    */
   destroy() {
      cleanUp(this);
      unbindEvents(this);
      store.removeData(this.element);
   }
}