var
	assert = require('assert'),
	dummy  = require('./fixtures/dummy'),
	name   = 'model.dummy';

pwf = require('pwf.js');

describe('instance methods', function() {

	before(require('./utils/create_env'));

	it('static', function() {
		pwf.reg_class(name, dummy);

		assert.notEqual(pwf.get_class(name), null);
	});


	it('constructor', function() {
		var model, obj;

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

		assert.notEqual(pwf.get_class(name).find_existing(1), null);
	});


	it('value getter', function() {
		var obj = pwf.create(name, {
			'id':666,
			'name':'test',
			'email':'test@foo.bar',
			'int':1
		});

		assert.equal(obj.get('id'), 666);
		assert.equal(obj.get('name'), 'test');
		assert.equal(obj.get('email'), 'test@foo.bar');
		assert.equal(obj.get('int'), 1);
		assert.equal(obj.get('float'), null);
		assert.equal(obj.get('list'), null);
		assert.equal(obj.get('foo'), null);
	});


	it('value setter', function() {
		var obj = pwf.create(name);

		obj.set('id', 666);
		obj.set('name', 'test');
		obj.set('email', 'test@foo.bar');
		obj.set('int', 1);
		obj.set('float', 1.5);
		obj.set('list', ['a', 'b', 'c']);
		obj.set('foo', 'string');

		assert.equal(obj.get('id'), 666);
		assert.equal(obj.get('name'), 'test');
		assert.equal(obj.get('email'), 'test@foo.bar');
		assert.equal(obj.get('int'), 1);
		assert.equal(obj.get('float'), 1.5);
		assert.equal(obj.get('list').join(','), ['a', 'b', 'c'].join(','));
		assert.equal(obj.get('foo'), 'string');

		assert.throws(function() {
			obj.update(name, 'a');
		});

		assert.throws(function() {
			obj.update(name, 1);
		});

		assert.throws(function() {
			obj.update(name, null);
		});
	});
});
