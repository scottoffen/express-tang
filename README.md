express-[tang](https://translate.google.com/#th/en/%E0%B8%97%E0%B8%B2%E0%B8%87)
===============================================================================

*Convention-based automatic Express application route discovery and mounting*

```
$ npm install express-tang --save
```

In an ideal world, the majority of feature addition or changes to a Node/Express application should not require a developer to modify the application start up or configuration scripts. This will greatly increase the maintainability of your application. This module will facilitate that ideal by automatically discovering the JavaScript files containing your routes and mounting them for you.

## Usage ##

This example includes using `body-parser`, `cookie-parser` and `express-static`, just to give you an idea of where in your application you want to use this module.

```javascript
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var tang = require('express-tang');

var app  = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(global.app.paths.public));

tang.register(app);
```

## Conventions ##

`express-tang` doesn't care where your JavaScript route files are located in your project. Instead, it relies on a simple naming convention for those files.

Instead of this:

```javascript
app.use('/user', '../routes/user.js');
```

You would name the file either `user.route.js`, and then point `express-tang` to the root folder your application files are in.

### A Forgiving Convention ###

To make the convention easy to use, `express-tang` will, by default, find all text files ending in `.route.js` OR `.routes.js`, so it's okay if you accidentally use the plural - or if you do it on purpose because that feels more appropriate.

### Dashes to camelCase ###

Any dashes (-) found in the file name will be replace with camel casing. So, if your file is named `user-accounts.routes.js`, `express-tang` will mount that file using the path `/userAccounts`.

### Dots to Forward Slashes ###

Any dots (.) found in the file name will be replace with a forward slash. So, if your file is named `api.users.routes.js`, `express-tang` will mount that file using the path `/api/users`.

### Indexing ###

if you want to mount directly on the root, just name your file `index.routes.js`. `express-tang` will mount that file using the path `/`.

### Examples ###

Example File Structure

```
├── app
│   └── routes
│	    ├── index.routes.js
│	    ├── api.user-accounts.routes.js
│       └── api.users.routes.js
└── node_mdoules
```

Using:

```javascript
tang.register(app);
```

Would be equivalent to:

```javascript
app.use('/', './routes/index.routes.js');
app.use('/api/userAccounts', './routes/api.user-accounts.routes.js');
app.use('/api/users', './routes/api.users.routes.js');
```

The more route files you have, the bigger the benefit you get from using `express-tang`.

## Configuration ##

You can override the default values used by `express-tang` to maximize your mileage and satisfaction by either setting the properties directly, or by chaining the methods in the fluent interface.

| Property      | Fluent Interface          | Default Value       | Valid Values                                            |
|---------------|---------------------------|---------------------|---------------------------------------------------------|
| FileNameMask  | `setFileNameMask(RegExp)` | `/\.routes?\.js$/i` | Any valid Regular Express object.                       |
| RoutesRootDir | `setRoutesDir(Path)`      | application root    | Any valid path that the application has read access to. |
| SearchType    | `setSearchType(enum)`     | `breadthFirst`      | `breadthFirst`, `depthFirst`                            |

### File Name Mask ###

What, you don't like my file name convention? Make your own! This property is the regular expression used to match files that should be included as routes. 

```javascript
tang.FileNameMask = /\.feature.route\.js$/i;
tang.setFileNameMax(/\.feature.route\.js$/i);
```

Just keep in mind that the file name mask you use will be removed from the file name before converting it to a path.

### Routes Root Directory ###

By default, `express-tang` will use `require.main.filename` to determine where to start searching for matching files. You can provide a path if this default doesn't meet your needs.

```javascript
tang.RoutesRootDir = 'path/to/app/routes';
tang.setRoutesDir('path/to/app/routes');
```

### Search Type ###

Since the routes will be added in the order they are found, you might want to control how `express-tang` searches for them. By default, it will use a breadth-first approach, which means the files found first will be added first. You can change it to a depth first search if that better suits you.

```javascript
tang.SearchType = 'depthFirst';
tang.setSearchType('depthFirst');
```

### The Benefits of the Fluent Interface ###

Aside for the ability to chain methods:

```javascript
tang.setSearchType('depthFirst').setRoutesDir('../app/features').register(app);
```

Another benefit of using the fluent interface setters is that the input provided gets validated *before* the `.register()` method is called.

```javascript
tang.setSearchType('sistersBeforeMisters');             // will throw an exception
tang.setRoutesDir('../invalid/or/inaccessible/folder'); // will throw an exception
tang.setFileNameMask("Not a regular expression");       // will throw an exception
tang.register(app);
```

## Notes ##

Your application file structure is intentionally traversed synchronously, because you don't want the application to continue starting up until all the routes have been added. While this *might* cause your application to take longer to start up, it's a one-time hit, and the benefit is in preventing someone from clobbering your express configuration.