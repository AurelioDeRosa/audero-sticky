/**
 * The class representing an object to store data
 *
 * @class
 */
export
 default class Store {

   /**
    * Creates a new Store object
    *
    * @param {string} namespace The namespace to use to store the data
    */
   constructor(namespace) {
      this.namespace = namespace;
   }

   /**
    * Gets the value of the required property for a given object.
    * If <code>property</code> is not provided, an object containing all
    * the data set is returned.
    *
    * @param {Object} object The object whose value is returned
    * @param {string} [property] The name of the property whose value is returned
    *
    * @return {*}
    */
   getData(object, property) {
      return object[this.namespace] && property ?
         object[this.namespace][property] :
         object[this.namespace];
   }

   /**
    * Sets the value of the required property for a given object.
    * If <code>property</code> is an object, all its key-value pairs are set.
    *
    * @param {Object} object The object whose value is set
    * @param {*} [value] The value to set
    *
    * @return Store
    */
   setData(object, value) {
      if (!object[this.namespace]) {
         object[this.namespace] = {};
      }

      object[this.namespace] = value;

      return this;
   }

   /**
    * Removes all the data from a given object
    *
    * @param {Object} object The object whose data are removed
    *
    * @return Store
    */
   removeData(object) {
      delete object[this.namespace];

      return this;
   }
}