# Audero Sticky

[Audero Sticky](https://github.com/AurelioDeRosa/audero-sticky) is a polyfill for the CSS `position: sticky` with no 
dependencies and support for multiple module systems.

## Features at a glance

- **Compatible with modern browsers**: Internet Explorer 9+, Chrome, Opera, Firefox, Safari, iOS, Android, and more
- **Lightweight**: ~1.5Kb minified and gzipped
- **No dependencies**: It's built in raw JavaScript and has no dependencies
- **Support for top and bottom sticky elements**: The library can be used to stick elements on the top and the bottom
- **Support multiple module systems**: It can be used with Browserify, RequireJS, and in the browser

## Demo

You can see the library in action by taking a look at the following demos:

* [Top sticky element](http://htmlpreview.github.io/?https://github.com/AurelioDeRosa/audero-sticky/blob/master/demo/top-sticky-element.html)
* [Bottom sticky element](http://htmlpreview.github.io/?https://github.com/AurelioDeRosa/audero-sticky/blob/master/demo/bottom-sticky-element.html)
* [Multiple top sticky elements](http://htmlpreview.github.io/?https://github.com/AurelioDeRosa/audero-sticky/blob/master/demo/top-multiple-sticky-elements.html)
* [Multiple bottom sticky elements](http://htmlpreview.github.io/?https://github.com/AurelioDeRosa/audero-sticky/blob/master/demo/bottom-multiple-sticky-elements.html)

## Compatibility

Audero Sticky has been tested on the following browsers: Internet Explorer 9+, Chrome, Opera, Firefox, and Safari.

The library follows the [UMD (Universal Module Definition)](https://github.com/umdjs/umd) pattern to work
seamlessly with module systems such as AMD and CommonJS, and the browser.

## Installation

You can install Audero Sticky by using [npm](https://www.npmjs.com):

```
npm install audero-sticky
```

Alternatively, you can install it via [Bower](http://bower.io):

```
bower install audero-sticky
```

The last options you have to download the library are to clone the repository and copy the file contained in the 
`dist` folder into your project and to manually download the file.

## Usage

First of all, you have to ensure that your CSS is using the `border-box` model. This can be set as follows:

```css
*
{
   box-sizing: border-box;
}
```

Add a class to your CSS, for example `sticky`, to specify the position your element(s) should have when in sticky 
mode. The library supports any `top` and `bottom` value. While not mandatory for the library, I strongly suggest to
add the `position: sticky` declaration too. This will allow you to use the library only in browsers that don't 
support this feature.

An example is the following:
 
```css
.sticky
{
   position: sticky;
   top: 0;
}
```

Once done, you have to include the JavaScript file. How to include it in your project, depends on what tools 
you are using. If you downloaded the library with Bower, you can include it as shown below:
                                    
```html
   <script src="bower_components/audero-sticky/dist/audero-sticky.min.js"></script>
</body>
```

If you have downloaded the library via npm, read the following sections to know how to include it.

### Browserify

```js
var Sticky = require('audero-sticky');
// Call Sticky methods
```

### RequireJS

```js
require(['audero-sticky'], function(Sticky) {
	// Call Sticky methods
});
```

### No module system

```html
   <script src="node_modules/audero-sticky/dist/audero-sticky.min.js"></script>
   <script>
      // Call Sticky methods exposed via a global object called Sticky
   </script>
</body>
```

## Methods

Sticky.js provides the methods described in the following sections.

### `Sticky.isFeatureSupported()`

Tests if the `sticky` value for the `position` property is supported.

### `Sticky.autoInit([options])`

Autoinitializes all the elements of the page having class `sticky` if no options are provided. Otherwise, it 
initializes the elements matching the selector provided in the [options](#Options) passed.

### `Sticky(element[, options])`

Creates a new Sticky object. `element` is the element to render as sticky. `options` is an object of [options](#Options)
to customize the library. To use a class name different from `sticky`, the `options` parameter must be specified.

### `Sticky.prototype.init()`

Initializes the library.

### `Sticky.prototype.destroy()`

Removes the effects of the library and clean up all the resources

## Options

Audero Sticky has the following options:

* `selector` (`string`. Default: `'.sticky'`): The selector used to identify the elements processed by this library

## Examples

To see the library in action, add the `sticky` class (it can be changed) to an element:

```html
<h1 class="sticky">Audero Sticky</h1>
```

Now, create a new `Sticky` object by passing the element to the constructor. Once done, initialize it by calling the
`init()` method:

```js
var stickyHeader = new Sticky(document.querySelector('.sticky'));
stickyHeader.init();
```

You can (and should) avoid to use the library for those browsers that support `position: sticky`. To do that, wrap the 
previous snippet with a conditional statement that uses the `isFeatureSupported()` method as shown below:

```js
if (!Sticky.isFeatureSupported()) {
   var stickyHeader = new Sticky(document.querySelector('.sticky'));
   stickyHeader.init();
}
```

If you want to use a different class name, for example `fixedsticky`, you have to update the previous snippet as 
follows:

```js
if (!Sticky.isFeatureSupported()) {
   var stickyHeader = new Sticky(
      document.querySelector('.fixedsticky'),
      {
         selector: '.fixedsticky'
      }
   );
   stickyHeader.init();
}
```

Note how in this case I've also specified the second argument of the constructor.

Sometimes you might have multiple sticky elements in a web page or you simply don't want to further use the `Sticky`
object created. In these cases you can let the library do all the work for you:

```js
if (!Sticky.isFeatureSupported()) {
   Sticky.autoInit();
}
```

This will initialize all the elements having class `sticky`. If you want to use a different class name, you have to 
provide an object that specifies the selector to use:

```js
if (!Sticky.isFeatureSupported()) {
   Sticky.autoInit({
      selector: '.fixedsticky'
   });
}
```

## License

[Audero Sticky](https://github.com/AurelioDeRosa/audero-sticky) is dual licensed under
[MIT](http://www.opensource.org/licenses/MIT) and [GPL-3.0](http://opensource.org/licenses/GPL-3.0).

## Author

[Aurelio De Rosa](http://www.audero.it) ([@AurelioDeRosa](https://twitter.com/AurelioDeRosa))