'using strict;'

var fs = require('fs');
var path = require('path');
var chai = require('chai');
var expect = chai.expect;
chai.should();

var tang = require('./index.js');

describe("express-tang", function ()
{
	var routeCount = 0;
	var rootdir = path.join(__dirname, "tmp");
	var fnmask = /\.miss.js$/i

	before(function ()
	{
		createFolderIfNotExists(rootdir);
		createFileIfNotExists(path.join(rootdir, 'bf01.route.js'));
		createFileIfNotExists(path.join(rootdir, 'x.api.slashes.routes.js'));
		createFileIfNotExists(path.join(rootdir, 'x.api.user-accounts.routes.js'));
		createFileIfNotExists(path.join(rootdir, "index.routes.js"));
		createFileIfNotExists(path.join(rootdir, 'rm01.miss.js'));

		createFolderIfNotExists(path.join(rootdir, "df01"));
		createFileIfNotExists(path.join(rootdir, "df01", 'df01.route.js'));

		routeCount = 5;
	});

	after(function ()
	{
		deleteFolderRecursive(rootdir);
	});

	beforeEach(function ()
	{
		tang.reset();
	});

	describe("FileNameMask", function ()
	{
		var defaultFileNameMask = /\.routes?\.js$/i;

		it ("should have the appropriate default value", function ()
		{
			expect(tang.FileNameMask.toString()).to.equal(defaultFileNameMask.toString());
		});

		it("should change when setFileNameMask is called", function ()
		{
			tang.setFileNameMask(fnmask);
			expect(tang.FileNameMask.toString()).to.equal(fnmask.toString());
		});

		it("should throw an exception when setFileNameMask is called without a valid regular expression", function ()
		{
			var invalid_value = "nope";
			var errmsg = "Not a valid regular expression (" + invalid_value + ")";
			var erfunc = function () { tang.setFileNameMask(invalid_value) };
			expect(erfunc).to.throw(errmsg);
		});
	});

	describe("register", function ()
	{
		var app;

		beforeEach(function ()
		{
			app = new TestHarness();
		});

		it("should throw an exception if no app was provided", function ()
		{
			var errmsg  = "express-route-finder: Missing required parameter: app (express application)";
			var erfunc = function () { tang.register(); };
			expect(erfunc).to.throw(errmsg);
		});

		it("should throw an exeption if SearchType is invalid", function ()
		{
			var invalid_value = "bubba";
			var errmsg  = "express-route-finder invalid search type (" + invalid_value + "), use RouteFinder.SearchType enum";
			var erfunc = function () { tang.SearchType = invalid_value; tang.setRoutesDir(rootdir).register(app); };
			expect(erfunc).to.throw(errmsg);
		});

		it("should search for routes using breadth first", function()
		{
			tang.setRoutesDir(rootdir).register(app);
			expect(app.routes.length).to.equal(routeCount);
			expect(app.routes[0].route).to.equal("/bf01");
		});

		it("should search for routes using depth first", function()
		{
			tang.setSearchType("depthFirst").setRoutesDir(rootdir).register(app);
			expect(app.routes.length).to.equal(routeCount);
			expect(app.routes[0].route).to.equal("/df01");
		});

		it("should only add files that match the file name mask", function()
		{
			tang.setFileNameMask(/\.miss\.js$/i).setRoutesDir(rootdir).register(app);
			expect(app.routes.length).to.equal(1);
			expect(app.routes[0].route).to.equal("/rm01");
		});

		it("should search only in the directory specified", function()
		{
			tang.setRoutesDir(path.join(rootdir, "df01")).register(app);
			expect(app.routes.length).to.equal(1);
			expect(app.routes[0].route).to.equal("/df01");
		});

		it("should change dots to slashes", function ()
		{
			tang.setRoutesDir(rootdir).register(app);
			expect(app.routes[2].route).to.equal("/x/api/slashes");
		});

		it("should change dashes to camelCase", function ()
		{
			tang.setRoutesDir(rootdir).register(app);
			expect(app.routes[3].route).to.equal("/x/api/userAccounts");
		});

		it("should strip index off the file name for the route", function ()
		{
			tang.setRoutesDir(rootdir).register(app);
			expect(app.routes.length).to.equal(routeCount);
			expect(app.routes[1].route).to.equal("/");
		});
	});

	describe("RoutesDir", function ()
	{
		it("defaults to the application root directory", function ()
		{
			expect(tang.RoutesDir).to.equal(path.dirname(require.main.filename));
		});

		it("should change when setRoutesDir is called with a valid, accessible directory", function ()
		{
			tang.setRoutesDir(rootdir);
			expect(tang.RoutesDir).to.equal(rootdir);
		});

		it("should throw an exception when setRoutesDir is called without a valid, accessible directory", function ()
		{
			var invalid_path = path.join(__dirname, "x");
			var errmsg  = "ENOENT: no such file or directory, access '" + invalid_path + "'";
			var erfunc = function () { tang.setRoutesDir(invalid_path); };
			expect(erfunc).to.throw(errmsg);
		});
	});

	describe("SearchType", function ()
	{
		var bfirst = "breadthFirst";
		var dfirst = "depthFirst";

		it("should default to breadth first search", function ()
		{
			expect(tang.SearchType).to.equal(bfirst);
		});

		it("should change when setSearchType is called using a valid string", function ()
		{
			tang.setSearchType(dfirst);
			expect(tang.SearchType).to.equal(dfirst);
		});

		it("should throw an error when setSearchType is called using an invalid value", function ()
		{
			var invalid_value = "bubba";
			var errmsg  = "express-route-finder invalid search type (" + invalid_value + "), use RouteFinder.SearchType enum";
			var erfunc = function () { tang.setSearchType(invalid_value); };
			expect(erfunc).to.throw(errmsg);
		});
	});
});


function TestHarness ()
{
	this.routes = [];
};

TestHarness.prototype.use = function (route, jspath)
{
	this.routes.push({ route: route, path: jspath });
};

function createFolderIfNotExists (dir)
{
	if (!fs.existsSync(dir))
	{
		fs.mkdirSync(dir);
	}
}

function createFileIfNotExists (file)
{
	if (!fs.existsSync(file))
	{
		fs.closeSync(fs.openSync(file, 'w'));
	}
}

function deleteFolderRecursive (dir)
{
	if (fs.existsSync(dir))
	{
		fs.readdirSync(dir).forEach(function (item)
		{
			var itempath = path.join(dir, item);

			if (fs.lstatSync(itempath).isDirectory())
			{
				deleteFolderRecursive(itempath);
			}
			else
			{
				fs.unlinkSync(itempath);
			}
		});

		fs.rmdirSync(dir);
	}
}