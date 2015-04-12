var
	assert = require('assert'),
	dummy  = require('./fixtures/dummy');

pwf = require('pwf.js');

describe('model', function() {
	var name = 'model.dummy';

	before(require('./utils/create_env'));

	it('tests if model object can be created', function() {
		var model;

		pwf.reg_class(name, dummy);

		model = pwf.get_class(name);

		assert.equal(model.has_attr('id'), true);

		assert.doesNotThrow(function() {
			obj = pwf.create(name, {
				'id':1,
				'name':'test-name',
				'email':'email@google.com',
				'int':'50'
			});
		}, 'Very primitive creation of dummy. Should be without problem');
	});


	it('tests if model object getting', function() {
		var obj;

		assert.notEqual(pwf.get_class(name), null);
		assert.notEqual(pwf.get_class(name).find_existing(1), null);
	});
});
