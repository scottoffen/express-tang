var debug = require('debug')('express-route-finder');
var path = require('path');
var fs   = require('fs');

module.exports = RouteFinder;

function RouteFinder ()
{
	this.FileNameMask  = /\.routes?\.js$/i;
	this.RoutesRootDir = null;
	this.SearchType = RouteFinder.SearchType.breadthFirst;
}

RouteFinder.SearchType =
{
	breadthFirst : "breadthFirst",
	depthFirst : "depthFirst"
};

RouteFinder.prototype.register = function (app)
{
	if (!app) throw "express-route-finder: Missing required parameter: app (express application)";
	if (this.RoutesRootDir === null) throw "express-route-finder: RoutesRootDir is not defined";
	if (!RouteFinder.SearchType.hasOwnProperty(this.SearchType)) this.SearchType = RouteFinder.SearchType.breadthFirst;

	var routes = (this.SearchType === RouteFinder.SearchType.breadthFirst)
		? breadthFirstSearch().bind(this)
		: depthFirstSearch().bind(this);

	routes.forEach(function (item)
	{
		debug("adding route: " + item.route);
		app.add(item.route, item.path);
	});
};

RouteFinder.prototype.setRootDir = function (rootdir)
{
	fs.access(rootdir, fs.R_OK);
	debug("setting root search directory to " + rootdir);
	this.RoutesRootDir = rootdir;
	return this;
};

RouteFinder.prototype.setFileNameMask = function (filenamemask)
{
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

function breadthFirstSearch ()
{
	var mask      = this.FileNameMask;
	var locations = [this.RoutesRootDir];
	var results   = [];
	var currentFolder;

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
				results.push(makeRoute(item, itemPath));
			}
		});
	};

	while (locations.length > 0)
	{
		currentFolder = locations.shift();
		searchFolder(currentFolder);
	}

	return results;
}

function depthFirstSearch ()
{
	var mask = this.FileNameMask;

	function searchFolder (folder)
	{
		var results = [];

		fs.readdirSync(folder).forEach(function (item)
		{
			var itemPath = path.join(folder, item);
			var stats = fs.statSync(itemPath);

			if (stats.isDirectory())
			{
				results.push(searchFolder(itemPath));
			}
			else if ((stats.isFile()) && (mask.test(item)))
			{
				results.push(makeRoute(item, itemPath));
			}
		});
	};

	return searchFolder(this.RoutesRootDir);
}

function makeRoute (filename, filepath)
{
	var route = filename.replace(/^index\./, '').replace(/\.?routes?\.js$/i, '');

	// change dots to slashes
	if (route.indexOf('.') > 0)	route = route.replace(/\./g, '/');

	// change dashes to camelCase
	route = route.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });

	return { route : '/' + route, path : filepath };
}