'using strict;'

var chai = require('chai');
var expect = chai.expect;
chai.should();

var RouteFinder = require('./index.js');


describe("express-tang", function ()
{
	var app, tang;

	before(function ()
	{
		// create the directory structure
	});

	after(function ()
	{
		// remove the directory structure
	});

	beforeEach(function ()
	{
		tang = new RouteFinder();
		app = new TestHarness();
	});

	it('should throw an exception if no app was provided', function ()
	{
		expect(function () { tang.register(); }).to.throw("express-route-finder: Missing required parameter: app (express application)");
	});

	it('should throw an exception if no root directory was provided', function ()
	{
		expect(function () { tang.register(app); }).to.throw("express-route-finder: RoutesRootDir is not defined");
	});

	it.skip('should default to breadth first', function ()
	{
		expect(false).to.be.true;
	});

	it.skip('should only find files that match the filename mask', function ()
	{
		expect(false).to.be.true;
	});

	it.skip('should add routes in the correct order for breadth first', function ()
	{
		expect(false).to.be.true;
	});

	it.skip('should add routes in the correct order for depth first search', function ()
	{
		expect(false).to.be.true;
	});

	it.skip('should only find routes in the folder specified', function ()
	{
		expect(false).to.be.true;
	});
});





function TestHarness ()
{
	this.routes = [];
};

TestHarness.prototype.add = function (route, jspath)
{
	this.routes.push({ route: route, path: jspath });
};