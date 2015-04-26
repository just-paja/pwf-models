var
	assert = require('assert'),
	dummy  = require('./fixtures/dummy');


describe('validations', function() {
	var name = 'model.dummy.validations';

	before(require('./utils/create_env'));

	before(function(next) {
		pwf.reg_class(name, dummy);
		pwf.wait_for('class', name, next);
	});

	it('string', function() {
		var obj = pwf.get_class(name).find_existing(1);

		assert.strictEqual(obj.get('name'), 'test-name');

		obj.set('name', null);
		assert.strictEqual(obj.get('name'), null);

		obj.set('name', 123);
		assert.strictEqual(obj.get('name'), '123');

		obj.set('name', -123);
		assert.strictEqual(obj.get('name'), '-123');

		obj.set('name', .5);
		assert.strictEqual(obj.get('name'), '0.5');

		obj.set('name', -123.5);
		assert.strictEqual(obj.get('name'), '-123.5');

		obj.set('name', []);
		assert.strictEqual(obj.get('name'), '');

		obj.set('name', ['a', 'b']);
		assert.strictEqual(obj.get('name'), 'a,b');

		obj.set('name', {});
		assert.strictEqual(obj.get('name'), '[object Object]');

	});

	it('email', function() {
		var
			obj = pwf.get_class(name).find_existing(1),

			valid = [
				"email@example.com",
				"firstname.lastname@example.com",
				"email@subdomain.example.com",
				"firstname+lastname@example.com",
				"email@123.123.123.123",
				"email@[123.123.123.123]",
				"“email”@example.com",
				"1234567890@example.com",
				"email@example-one.com",
				"_______@example.com",
				"email@example.name",
				"email@example.museum",
				"email@example.co.jp",
				"firstname-lastname@example.com",
				"あいうえお@example.com",
				"email@example.web",
			],

			invalid = [
				// Valid addresses, but suspicious.
				"much.“more\ unusual”@example.com",
				"very.unusual.“@”.unusual.com@example.com",
				"very.“(),:;<>[]”.VERY.“very@\\ \"very”.unusual@strange.example.com",

				// Invalid
				"plainaddress",
				"#@%^%#$@#$@#.com",
				"@example.com",
				"Joe Smith <email@example.com>",
				"email.example.com",
				"email@example@example.com",
				".email@example.com",
				"email.@example.com",
				"email..email@example.com",
				"email@example.com (Joe Smith)",
				"email@example",
				"email@-example.com",
				//~ "email@111.222.333.44444",
				"email@example..com",
				"Abc..123@example.com",
				"“(),:;<>[\]@example.com",
				"just\"not\"right@example.com",
				"this\ is\"really\"not\allowed@example.com"
			];

		for (var i = 0; i < valid.length; i++) {
			assert.doesNotThrow(function() {
				obj.set('email', valid[i]);
			});

			assert.equal(obj.get('email'), valid[i]);
		}

		obj.set('email', null);

		for (var i = 0; i < invalid.length; i++) {
			assert.throws(function() {
				obj.set('email', invalid[i]);
				v(invalid[i]);
			});

			assert.equal(obj.get('email'), null);
		}
	});


	it('int', function() {
		var obj = pwf.get_class(name).find_existing(1);

		assert.strictEqual(obj.get('int'), 50);
		obj.set('int', null);

		assert.throws(function() { obj.set('int', []); });
		assert.strictEqual(obj.get('int'), null);
		assert.throws(function() { obj.set('int', {}); });
		assert.strictEqual(obj.get('int'), null);
		assert.throws(function() { obj.set('int', 'asdf'); });
		assert.strictEqual(obj.get('int'), null);

		obj.set('int', '50');
		assert.strictEqual(obj.get('int'), 50);

		obj.set('int', '+50');
		assert.strictEqual(obj.get('int'), 50);

		obj.set('int', '-50');
		assert.strictEqual(obj.get('int'), -50);

		obj.set('int', .5);
		assert.strictEqual(obj.get('int'), 0);

		obj.set('int', -2.5);
		assert.strictEqual(obj.get('int'), -2);
	});


	it('float', function() {
		var obj = pwf.get_class(name).find_existing(1);

		obj.set('float', '-5');
		assert.strictEqual(obj.get('float'), -5);

		obj.set('float', '5');
		assert.strictEqual(obj.get('float'), 5);

		obj.set('float', '.5');
		assert.strictEqual(obj.get('float'), .5);

		obj.set('float', '-50.505');
		assert.strictEqual(obj.get('float'), -50.505);

		assert.doesNotThrow(function() { obj.set('list', ['b']); });
		assert.deepEqual(obj.get('list'), ['b']);
	});
});
