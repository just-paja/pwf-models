var assert = require('assert');

describe('sanity', function() {
	before(function(done) { pwf.wi(['model', 'list'], done); });

	it('tests if model register method works well', function() {
		pwf.model.register('dummy-test', {});
		assert.equal(pwf.model.get('dummy-test2'), null);
		assert.notEqual(pwf.model.get('dummy-test'), null, 'Dummy model should be registered now.');

		assert.throws(function() { pwf.model.register('dummy-test', {}); }, 'Should warn about overwriting dummy.');
		assert.throws(function() { pwf.model.register('dummy-attrs-invalid', {"attrs":{}}); }, 'Should warn about invalid attributes def.');
		assert.throws(function() { pwf.model.register('dummy-attrs-invalid', {"attrs":[{}]}); }, 'Should warn about missing attribute name.');
		assert.throws(function() { pwf.model.register('dummy-attrs-invalid', {"attrs":[{'name':'name'}]}); }, 'Should warn about missing attribute type.');
		assert.throws(function() { pwf.model.register('dummy-attrs-invalid', {"attrs":[{'name':'name', 'type':'invalid'}]}); }, 'Should warn about invalid attribute type.');

		var types = pwf.model.get_attr_types();

		for (var i = 0; i < types.length; i++) {
			assert.doesNotThrow(function() { pwf.model.register('dummy-attrs-' + types[i], {"attrs":[{'name':'name', 'type':types[i]}]}); });
		}
	});
});
