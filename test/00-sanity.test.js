var assert = require('assert');
pwf = require('pwf.js');
$ = require('../node_modules/pwf-jquery-compat/node_modules/jquery');
require('pwf-jquery-compat');
require('../node_modules/pwf-comm/node_modules/pwf-config');
require('../node_modules/pwf-comm/node_modules/pwf-storage');
require('../node_modules/pwf-comm/node_modules/pwf-queue');
require('pwf-comm');


describe('sanity', function() {
	it('tests only sanity of js code', function() {
		assert.doesNotThrow(function() {
			mod = require('../lib/model');
		}, 'An error was thrown during mod inclusion of model lib.');

		assert.doesNotThrow(function() {
			mod = require('../lib/list');
		}, 'An error was thrown during mod inclusion of list lib.');
	});
});
