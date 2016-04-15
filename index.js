var debug = require('debug')('express-route-finder');
var path = require('path');
var fs   = require('fs');

var defaults =
{
	FileNameMask  : /\.routes?\.js$/i,
	RoutesRootDir : path.dirname(require.main.filename),
	SearchType    : "breadthFirst"
};

function RouteFinder ()
{
	this.FileNameMask  = defaults.FileNameMask;
	this.RoutesRootDir = defaults.RoutesRootDir;
	this.SearchType    = defaults.SearchType;
}

RouteFinder.SearchType =
{
	breadthFirst : "breadthFirst",
	depthFirst : "depthFirst"
};

RouteFinder.prototype.register = function (app)
{
	if (!app || typeof app.add === 'undefined') throw "express-route-finder: Missing required parameter: app (express application)";

	this.setRoutesDir(this.RoutesRootDir);
	this.setFileNameMask(this.FileNameMask);
	this.setSearchType(this.SearchType);

	var routes = (this.SearchType === RouteFinder.SearchType.breadthFirst)
		? breadthFirstSearch.call(this)
		: depthFirstSearch.call(this);

	// should I sort them alphabetically by route before adding them?

	routes.forEach(function (item)
	{
		debug("adding route: " + item.route);
		app.add(item.route, item.path);
	});
};

RouteFinder.prototype.setRoutesDir = function (rootdir)
{
	fs.accessSync(rootdir, fs.R_OK);
	debug("setting root search directory to " + rootdir);
	this.RoutesRootDir = rootdir;
	return this;
};

RouteFinder.prototype.setFileNameMask = function (filenamemask)
{
	if (filenamemask.constructor !== RegExp) throw "Not a valid regular expression (" + filenamemask + ")";
	debug("setting file name mask to " + filenamemask);
	this.FileNameMask = filenamemask;
	return this;
};

RouteFinder.prototype.setSearchType = function (searchtype)
{
	if (!RouteFinder.SearchType.hasOwnProperty(searchtype)) throw "express-route-finder invalid search type (" + searchtype + "), use RouteFinder.SearchType enum";
	debug("setting search type to " + searchtype);
	this.SearchType = searchtype;
	return this;
};

RouteFinder.prototype.reset = function ()
{
	this.FileNameMask  = defaults.FileNameMask;
	this.RoutesRootDir = defaults.RoutesRootDir;
	this.SearchType    = defaults.SearchType;
}

function breadthFirstSearch ()
{
	var mask      = this.FileNameMask;
	var locations = [this.RoutesRootDir];
	var results   = [];

	function searchFolder (folder)
	{
		fs.readdirSync(folder).forEach(function (item)
		{
			var itemPath = path.join(folder, item);
			var stats = fs.statSync(itemPath);

			if (stats.isDirectory())
			{
				locations.push(itemPath);
			}
			else if ((stats.isFile()) && (mask.test(item)))
			{
				results.push(makeRoute(mask, item, itemPath));
			}
		});
	};

	while (locations.length > 0)
	{
		searchFolder(locations.shift());
	}

	return results;
}

function depthFirstSearch ()
{
	var mask = this.FileNameMask;

	function searchFolder (folder)
	{
		var results  = [];
		var fresults = [];

		fs.readdirSync(folder).forEach(function (item)
		{
			var itemPath = path.join(folder, item);
			var stats = fs.statSync(itemPath);

			if (stats.isDirectory())
			{
				var dresults = searchFolder(itemPath);
				results.push.apply(results, dresults);
			}
			else if ((stats.isFile()) && (mask.test(item)))
			{
				fresults.push(makeRoute(mask, item, itemPath));
			}
		});

		results.push.apply(results, fresults);

		return results;
	};

	return searchFolder(this.RoutesRootDir);
}

function makeRoute (mask, filename, filepath)
{
	var route = filename.replace(mask, '').replace(/^index\.?/, '');

	// change dots to slashes
	if (route.indexOf('.') > 0)	route = route.replace(/\./g, '/');

	// change dashes to camelCase
	route = route.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });

	return { route : '/' + route, path : filepath };
}

module.exports = new RouteFinder();