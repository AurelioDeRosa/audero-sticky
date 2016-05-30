/**
 * The class representing an object to manage the style of an element
 *
 * @class
 */
export
 default class Style {
   /**
    * Resets the style of the properties specifies
    *
    * @param {CSSStyleDeclaration} style The object whose properties values are reset
    * @param {string[]} properties The properties to reset
    */
   static resetStyleProperties(style, properties) {
      properties.forEach(property => {
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
   static copyStyleProperties(style, blueprintStyle, properties = Object.keys(blueprintStyle)) {
      properties.forEach(property => {
         style[property] = blueprintStyle[property];
      });
   }
}
