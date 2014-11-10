var
	assert = require('assert'),
	dummy  = require('./fixtures/dummy');

pwf = require('pwf.js');

describe('model', function() {
	var name = 'model.dummy';

	before(require('./utils/create_env'));

	it('tests if model object can be created', function() {
		var model;

		pwf.rc(name, dummy);

		model = pwf.get_class(name);

		assert.equal(model.has_attr('id'), true);

		assert.doesNotThrow(function() {
			obj = pwf.create(name, {
				'id':1,
				'name':'test-name',
				'email':'email',
				'int':'50'
			});
		}, 'Very primitive creation of dummy. Should be without problem');
	});


	it('tests if model object getting', function() {
		var obj;

		assert.notEqual(pwf.get_class(name), null);
		assert.notEqual(pwf.get_class(name).find_existing(1), null);
	});


	it('tests if attribute validation', function() {
		var obj = pwf.get_class(name).find_existing(1);

		assert.strictEqual(obj.get('name'), 'test-name');
		assert.strictEqual(obj.get('email'), 'email');
		assert.strictEqual(obj.get('int'), 50);

		assert.throws(function() { obj.set('int', 'asdf'); });

		assert.doesNotThrow(function() { obj.set('int', '50'); });
		assert.doesNotThrow(function() { obj.set('int', '+50'); });
		assert.doesNotThrow(function() { obj.set('int', '-50'); });

		assert.doesNotThrow(function() { obj.set('float', '-50.505'); });
		assert.strictEqual(obj.get('float'), -50.505);

		assert.doesNotThrow(function() { obj.set('list', ['b']); });
		assert.deepEqual(obj.get('list'), ['b']);
	});
});
