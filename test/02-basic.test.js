var
	assert = require('assert'),
	dummy  = require('./fixtures/dummy');

pwf = require('pwf.js');

describe('model', function() {
	before(function(done) { pwf.wi(['model', 'list'], done); });

	it('tests if model object can be created', function() {
		pwf.model.register('dummy', dummy);

		assert.doesNotThrow(function() {
			pwf.model.create('dummy', {
				'id':1,
				'name':'test-name',
				'email':'email',
				'int':'50'
			});
		}, 'Very primitive creation of dummy. Should be without problem');
	});


	it('tests if model object getting', function() {
		var obj;

		assert.notEqual(pwf.model.get('dummy'), null, 'Dummy model should be registered! Tests are not running in serial.');

		obj = pwf.model.find_existing('dummy', 1);
		assert.notEqual(obj, null, 'First dummy object should already exist from previous test.');
	});


	it('tests if attribute validation', function() {
		var obj = pwf.model.find_existing('dummy', 1);

		assert.strictEqual(obj.get('name'), 'test-name');
		assert.strictEqual(obj.get('email'), 'email');
		assert.strictEqual(obj.get('int'), 50);

		assert.throws(function() { obj.set('int', 'asdf'); });

		assert.doesNotThrow(function() { obj.set('int', '50'); });
		assert.doesNotThrow(function() { obj.set('int', '+50'); });
		assert.doesNotThrow(function() { obj.set('int', '-50'); });

		assert.doesNotThrow(function() { obj.set('float', '-50.505'); });
		assert.strictEqual(obj.get('float'), -50.505);

		assert.doesNotThrow(function() { obj.set('list', 'b'); });
		assert.deepEqual(obj.get('list'), ['b']);
	});



});
