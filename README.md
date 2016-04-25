express-[tang](https://translate.google.com/#th/en/%E0%B8%97%E0%B8%B2%E0%B8%87)
===============================================================================

*Convention-based automatic Express application route discovery and mounting*

```
$ npm install express-tang --save
```

express-tang automatically discovers JavaScript files containing your routes and mounts them to your Express application.

## Usage ##

```javascript
// instead of using multiple use statements
app.use('/', './routes/index.js');
app.use('/api/books', './routes/books.js');
app.use('/api/users', './routes/users.js');

// You can just do this
tang.register(app);
```

**BUT you must follow the convention for this to work!**

## Conventions ##

You can leave your routes where you see fit in your application directory, because `express-tang` doesn't care. Instead, it relies on a few simple naming conventions that you need to follow for the files that contain your routes.

### Default Conventions ###

- Any text file ending in `.route.js` or `.routes.js` will be considered a route
- Any dashes (-) found in the file name will be replaced with camel casing
- Any dots (.) found in the file name will be replace with a forward slash
- Files prefixed with `index` will be mounted at `/`

### Examples ###

Given the following file structure

```
└── someFolder
    ├── index.routes.js
    ├── api.books-in-library.routes.js
    └── api.users.routes.js
```

Using:

```javascript
tang.register(app);
```

Would be equivalent to:

```javascript
app.use('/', 'someFolder/index.routes.js');
app.use('/api/booksInLibrary', 'someFolder/api.books-in-library.routes.js');
app.use('/api/users', 'someFolder/api.users.routes.js');
```

The more route files you have, the bigger the benefit you get from using `express-tang`.

## Configuration ##

To maximize your mileage and satisfaction, the default values used by `express-tang` can be overridden by either setting the properties directly, or via the setter methods.

| Property     | Setter Method             | Default Value       |
|--------------|---------------------------|---------------------|
| FileNameMask | `setFileNameMask(RegExp)` | `/\.routes?\.js$/i` |
| RoutesDir    | `setRoutesDir(Path)`      | application root    |
| SearchType   | `setSearchType(string)`   | `breadthFirst`      |

### File Name Mask ###

*Regular Expression Object*

What, you don't like my file name convention? Make your own! This property is the regular expression used to match files that should be included as routes. Just remember that the file name mask you use will be removed from the file name before converting it to a path.

```javascript
tang.FileNameMask = /\.feature.route\.js$/i;
tang.setFileNameMax(/\.feature.route\.js$/i);
```

### Routes Root Directory ###

*Any valid folder accessible to the application*

By default, `express-tang` will use `require.main.filename` to determine where to start searching for matching files. You can provide a path if this default doesn't meet your needs.

```javascript
tang.RoutesDir = 'path/to/app/routes';
tang.setRoutesDir('path/to/app/routes');
```

### Search Type ###

*Must be either `breadthFirst` or `depthFirst`.*

Since the routes will be added in the order they are found, you might want to control how `express-tang` searches for them. By default, it will use a [breadth-first](https://en.wikipedia.org/wiki/Breadth-first_search) approach, which means the files found higher in the tree structure will be added first - even if they are in different branches. You can change it to a [depth-first](https://en.wikipedia.org/wiki/Depth-first_search) search if that better suits your needs.

```javascript
tang.SearchType = 'depthFirst';
tang.setSearchType('depthFirst');
```

### Chainable Methods ###

All methods are chainable.

```javascript
tang.setSearchType('depthFirst').setRoutesDir('../app/features').register(app);
```

### Exceptions ###

Exceptions will be thrown if the values provided are invalid.

```javascript
tang.setSearchType('widthFirst');                       // will throw an exception
tang.setRoutesDir('../invalid/or/inaccessible/folder'); // will throw an exception
tang.setFileNameMask("Not a regular expression");       // will throw an exception
```

Think you can get around this by setting the properties directly? Think again!

```javascript
tang.SearchType = 'widthFirst';
tang.RoutesDir = '../invalid/or/inaccessible/folder';
tang.FileNameMask = "Not a regular expression";
tang.register(app); // will throw an exception
```

An exception will also be thrown if a valid express application is not provided.
```javascript
tang.register(); // will throw an exception
```

## Notes ##

Your application file structure is intentionally traversed **synchronously**, because you don't want the application to continue starting up until all the routes have been added. This *might* cause your application to take longer to start up, but not by a noticeable amount of time.
