(function(root, factory) {
   'use strict';

   if (typeof define === 'function' && define.amd) {
      define(factory);
   } else if (typeof module === 'object' && module.exports) {
      module.exports = factory();
   } else {
      root.Sticky = factory();
   }
}(this, function() {
   'use strict';

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
   var defaults = {
      selector: '.sticky',
      activeClass: 'sticky--active'
   };

   /**
    * The properties needed by the placeholder element to have the
    * occupy the same space as the element when in its original position
    *
    * @type {string[]}
    */
   var properties = [
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
   var namespace = 'auderoSticky';

   /**
    * Gets the value of the required property for a given element.
    * If <code>property</code> is not provided, an object containing all
    * the data set is returned.
    *
    * @param {HTMLElement} element The element whose value is returned
    * @param {string} [property] The name of the property whose value is returned
    *
    * @returns {*}
    */
   function getData(element, property) {
      return element[namespace] && property ? element[namespace][property] : element[namespace];
   }

   /**
    * Sets the value of the required property for a given element.
    * If <code>property</code> is an object, all its key-value pairs are set.
    *
    * @param {HTMLElement} element The element whose value is set
    * @param {(string|Object)} property The name of the property whose value is set.
    * If an object is provided, all of its key-value pairs are set.
    * @param {*} [value] The value to set
    */
   function setData(element, property, value) {
      if (!element[namespace]) {
         element[namespace] = {};
      }

      if (typeof property === 'string') {
         element[namespace][property] = value;

         return;
      }

      for(var key in property) {
         if (!property.hasOwnProperty(key)) {
            continue;
         }

         element[namespace][key] = property[key];
      }
   }

   /**
    * Removes all the data from a given element
    *
    * @param {HTMLElement} element The element whose data are removed
    */
   function removeData(element) {
      delete element[namespace];
   }

   /**
    * Triggers an event on an element
    *
    * @param {HTMLElement} element The element on which the event is triggered
    * @param {string} event The name of the event to trigger
    * @param {Object} [eventProperties] A hash of property-value pairs  to customize the event
    */
   function triggerEvent(element, event, eventProperties) {
      var customEvent = document.createEvent('Event');

      customEvent.initEvent(event, true, true);

      for(var property in eventProperties) {
         if (eventProperties.hasOwnProperty(property)) {
            customEvent[property] = eventProperties[property];
         }
      }

      element.dispatchEvent(customEvent);
   }

   /**
    * Merge the settings provided with the default values.
    * The method does not modify the object provided.
    *
    * @param {Object} [settings={}] The settings to merge
    *
    * @returns {Object}
    */
   function mergeSettings(settings) {
      var mergedObject = {};

      settings = settings || {};

      for(var property in defaults) {
         if (!defaults.hasOwnProperty(property)) {
            continue;
         }

         mergedObject[property] = settings[property] || defaults[property];
      }

      return mergedObject;
   }

   /**
    * Adds a class name to an element
    *
    * @param {HTMLElement} element The element on which the class name is added
    * @param {string} className The class name to add
    */
   function addClass(element, className) {
      var regex = new RegExp('\\b' + className + '\\b');

      if (!regex.test(element.className)) {
         element.className += ' ' + className;
      }
   }

   /**
    * Removes a class name from an element
    *
    * @param {HTMLElement} element The element on which the class name is removed
    * @param {string} className The class name to remove
    */
   function removeClass(element, className) {
      var regex = new RegExp('\\b' + className + '\\b');

      element.className = element.className.replace(regex, '').trim();
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
      var elementStyle, stickyMargins;

      addClass(sticky.element, sticky.settings.activeClass);
      elementStyle = window.getComputedStyle(sticky.element);
      stickyMargins = {
         marginBottom: elementStyle.marginBottom,
         marginTop: elementStyle.marginTop
      };
      removeClass(sticky.element, sticky.settings.activeClass);

      return stickyMargins;
   }

   /**
    * Resets the style of the properties specifies
    *
    * @param {CSSStyleDeclaration} style The object whose properties values are reset
    * @param {string[]} properties The properties to reset
    */
   function resetStyleProperties(style, properties) {
      properties.forEach(function(property) {
         style[property] = '';
      });
   }

   /**
    * Copies the properties' values of a CSSStyleDeclaration object into another.
    * If an array of properties is specified, only those properties' values are copied
    *
    * @param {CSSStyleDeclaration} style The object in which to copy the values
    * @param {CSSStyleDeclaration} blueprintStyle The object whose values are copied
    * @param {string[]} [properties] The properties to copy
    */
   function copyStyleProperties(style, blueprintStyle, properties) {
      if (!properties) {
         properties = Object.keys(blueprintStyle);
      }

      properties.forEach(function(property) {
         style[property] = blueprintStyle[property];
      });
   }

   /**
    * Calculates the z-index value of an element based
    * on its position in the DOM, among other elements selected
    * by the CSS selector provided
    *
    * @param {HTMLElement} element The element whose z-index value must be calculated
    * @param {string} selector The CSS selector to use
    *
    * @return {number}
    */
   function getZIndex(element, selector) {
      var stickyElements = [].slice.call(document.querySelectorAll(selector));

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
      var object = {};

      for(var property in propertiesHash) {
         object[property] = propertiesHash[property] + 'px';
      }

      return object;
   }

   /**
    * Cleans up allocated resources and effects
    *
    * @param {Sticky} sticky An instance of a Sticky object
    */
   function cleanUp(sticky) {
      var data = getData(sticky.element);

      resetStyleProperties(
         sticky.element.style,
         properties.concat([
            'marginTop',
            'marginBottom'
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
      var boundaries = {};
      var elementStyle = window.getComputedStyle(element);
      var parentStyle = element.parentNode.getBoundingClientRect();

      // If the value of the "top" property is defined, in which case it has
      // a value different from "auto", the element will stick on the top.
      if (elementStyle.top !== 'auto') {
         boundaries.start = element.getBoundingClientRect().top - parseFloat(elementStyle.top);
         boundaries.end = parentStyle.bottom - ~~parseFloat(stickyMargins.marginBottom);
      } else {
         boundaries.start = element.getBoundingClientRect().bottom + parseFloat(elementStyle.bottom);
         boundaries.end = parentStyle.top + ~~parseFloat(stickyMargins.marginTop);
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
      var startPosition = sticky.element.getBoundingClientRect();
      var placeholder = getData(sticky.element, 'placeholder');

      copyStyleProperties(
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
      copyStyleProperties(
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
      var stickyMargins = getStickyMargins(sticky);
      var boundaries = calculateBoundaries(sticky.element, stickyMargins);
      var elementStyle = window.getComputedStyle(sticky.element);
      var data = getData(sticky.element);
      var distanceFromSide = elementStyle.top !== 'auto' ?
         parseFloat(elementStyle.top) :
         parseFloat(elementStyle.bottom);

      function startSticky() {
         updatePlaceholderStyle(sticky);
         setData(sticky.element, 'position', sticky.element.style.position);
         copyStyleProperties(
            sticky.element.style,
            {
               position: 'fixed'
            }
         );
         copyStyleProperties(sticky.element.style, data.placeholder.style, properties);
         sticky.element.parentNode.insertBefore(data.placeholder, sticky.element);
         triggerEvent(sticky.element, 'stickystart');
         addClass(sticky.element, sticky.settings.activeClass);
      }

      function endSticky() {
         cleanUp(sticky);
         triggerEvent(sticky.element, 'stickyend');
         removeClass(sticky.element, sticky.settings.activeClass);
      }

      function stickToTop() {
         var isAdded = data.placeholder.parentNode;

         // The boundaries are calculated based on the element itself if it's not sticking;
         // otherwise the placeholder is used.
         boundaries = isAdded ?
            calculateBoundaries(data.placeholder, stickyMargins) :
            calculateBoundaries(sticky.element, stickyMargins);

         // Same as value || 0
         var height = ~~parseFloat(window.getComputedStyle(sticky.element).height);
         var gap = boundaries.end - height - window.pageYOffset;
         var isInRange = window.pageYOffset >= boundaries.start && window.pageYOffset <= boundaries.end;

         if (isInRange) {
            if (!isAdded) {
               startSticky();
            }

            sticky.element.style.top = gap - distanceFromSide >= 0 ? '' : gap + 'px';
         } else if (isAdded) {
            endSticky();
         }
      }

      function stickToBottom() {
         var isAdded = data.placeholder.parentNode;

         // The boundaries are calculated based on the element itself if it's not sticking;
         // otherwise the placeholder is used.
         boundaries = isAdded ?
            calculateBoundaries(data.placeholder, stickyMargins) :
            calculateBoundaries(sticky.element, stickyMargins);

         // Same as value || 0
         var height = ~~parseFloat(window.getComputedStyle(sticky.element).height);
         var windowBottom = window.pageYOffset + window.innerHeight;
         var gap = boundaries.end + height - windowBottom;
         var isInRange = windowBottom <= boundaries.start && windowBottom >= boundaries.end;

         if (isInRange) {
            if (!isAdded) {
               startSticky();
            }

            sticky.element.style.bottom = gap + distanceFromSide <= 0 ? '' : -gap + 'px';
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
      return function() {
         sticky.destroy();
         sticky.init();
         getData(sticky.element, 'handlers').scroll();
      };
   }

   /**
    * Binds the events for the sticky object provided
    *
    * @param {Sticky} sticky An instance of a Sticky object
    */
   function bindEvents(sticky) {
      var handlers = getData(sticky.element, 'handlers');

      window.addEventListener('load', handlers.scroll);
      window.addEventListener('scroll', handlers.scroll);
      window.addEventListener('resize', handlers.resize);
   }

   /**
    * Unbinds the events for the sticky object provided
    *
    * @param {Sticky} sticky An instance of a Sticky object
    */
   function unbindEvents(sticky) {
      var handlers = getData(sticky.element, 'handlers');

      window.removeEventListener('load', handlers.scroll);
      window.removeEventListener('scroll', handlers.scroll);
      window.removeEventListener('resize', handlers.resize);
   }

   /**
    * Creates a new Sticky object
    *
    * @param {HTMLElement} element The element to render as sticky
    * @param {SettingsHash} [options] An object of options to customize the library
    *
    * @constructor
    */
   function Sticky(element, options) {
      this.element = element;
      this.settings = mergeSettings(options);
   }

   /**
    * Tests if the <code>sticky</code> value for the <code>position</code>
    * property is supported
    *
    * @return {boolean}
    */
   Sticky.isFeatureSupported = function() {
      var prefixes = [
        'ms',
        'webkit'
      ];
      var testStyle = 'position:sticky;';
      var element = document.createElement('div');

      prefixes.forEach(function(prefix) {
         testStyle += 'position:-' + prefix + '-sticky;';
      });
      element.style.cssText = testStyle;

      return !!element.style.position;
   };

   /**
    * Autoinitializes all the elements of the page matched by the selector provided
    * in the options or the default one if no selector is provided
    *
    * @param {SettingsHash} [options] An object of options to customize the library
    */
   Sticky.autoInit = function(options) {
      var selector = options && options.selector ? options.selector : defaults.selector;

      [].forEach.call(
         document.querySelectorAll(selector),
         function(element) {
            var sticky = new Sticky(element, options);

            sticky.init();
         }
      );
   };

   /**
    * Initializes the library
    */
   Sticky.prototype.init = function() {
      if (getData(this.element)) {
         throw new Error('This element has already been initialized');
      }

      var placeholder = document.createElement(this.element.nodeName);

      setData(this.element, 'placeholder', placeholder);
      setData(
         this.element,
         'handlers',
         {
            scroll: onScroll(this),
            resize: onResize(this)
         }
      );

      copyStyleProperties(
         placeholder.style,
         {
            visibility: 'hidden',
            zIndex: getZIndex(this.element, this.settings.selector)
         }
      );

      updatePlaceholderStyle(this);
      bindEvents(this);
   };

   /**
    * Removes the effects of the library and clean up all the resources
    */
   Sticky.prototype.destroy = function() {
      cleanUp(this);
      unbindEvents(this);
      removeData(this.element);
   };

   return Sticky;
}));