/**
 * Dynamic data model abstraction. Handles predefined data formats and data
 * types. Also caches data on client-side for simpler updates and lower memory
 * consumption.
 */
(function()
{
	var
		mod_name = 'model',
		mod_inst = true,
		mod = function()
		{
			var
				models = {},
				model = function(arg_cname, arg_model)
				{
					var
						instances = {},
						caller = typeof arg_model.proto == 'object' ? arg_model.proto:{},
						attrs  = arg_model.attrs,
						cname  = arg_cname,
						opts   = pwf.jquery.extend({
							'sort':'updatedAt DESC'
						}, typeof arg_model.opts == 'object' ? arg_model.opts:{}),
						model  = this,
						load_callbacks = {};

					if (typeof model.internal === 'undefined' || !model.internal) {
						attrs.push({"name":'id', "type":'int'});
					}

					attrs.push({"name":'author', 'type':'model', 'model':'user'});
					attrs.push({"name":'last_editor', 'type':'model', 'model':'user'});
					attrs.push({"name":'createdAt', 'type':'datetime'});
					attrs.push({"name":'updatedAt', 'type':'datetime'});


					this.get_opt = function(name)
					{
						return opts[name];
					};


					this.get_all = function(filters, next)
					{
						if (typeof next == 'function') {
							var url = this.get_url();

							pwf.list.create({
								'model':cname,
								'url':url
							}).load(function(model, next) {
								return function(list) {
									next(list.list(), list);
								};
							}(this, next));
						} else throw new Error('You must pass next callback to get_call');
					};


					this.get_all_existing = function()
					{
						var list = [];

						for (var id in instances) {
							list.push(instances[id]);
						}

						return list;
					};


					this.has_attr = function(name)
					{
						return this.get_attr_def(name) !== null;
					};


					this.get_attrs = function()
					{
						return pwf.jquery.extend([], attrs);
					};


					this.get_attr_def = function(name)
					{
						var attr = null;

						for (var i = 0; i < attrs.length; i++) {
							if (attrs[i].name == name) {
								attr = attrs[i];
								break;
							}
						}

						if (attr === null) {
							if (typeof caller[name] == 'function') {
								attr = {
									'type':'method',
									'name':name
								};
							}
						}

						if (attr !== null) {
							attr.cname = cname;
						}

						return attr;
					};


					this.validate_attr_value = function(name, val)
					{
						return pwf.model.validate_attr(this.get_attr_def(name), val);
					};


					this.get_url = function()
					{
						return '/' + cname + '/browse';
					};


					this.get_object_url = function(id)
					{
						return this.get_url() + '/' + id;
					};


					this.create = function(arg_data)
					{
						var
							existing = null,
							is_new = typeof arg_data == 'undefined' || typeof arg_data.id == 'undefined',
							arg_data = typeof arg_data == 'undefined' ? {}:arg_data;

						if (is_new) {
							if (this.has_attr('company')) {
								var companies = pwf.auth.get_user_companies();

								if (companies.length == 1) {
									arg_data.company = companies[0];
								}
							}
						}

						!is_new && (existing = this.find_existing(arg_data.id));

						if (existing !== null) {
							existing.update(arg_data);
						} else {
							existing = new model_instance(arg_data);

							if (typeof arg_data.id != 'undefined') {
								instances[existing.get('id')] = existing;
							}
						}

						return existing;
					};


					this.destroy = function(id)
					{
						var existing = this.find_existing(id);

						if (existing !== null) {
							delete instances[id];
							existing.destroy();
						}

						return existing;
					};


					this.find = function(id, next)
					{
						if (typeof instances[id] == 'undefined') {
							var
								url = this.get_url(),
								hash = this.get_object_url(id);

							if (!this.is_loading(id)) {
								this.add_callback(hash, next);

								pwf.list.create({
									'model':cname,
									'filters':{'id':id},
									'per_page':1,
									'page':1,
									'url':url
								}).load(function(model, hash) {
									return function(list) {
										var obj = list.list().data[0];
										model.fire_callbacks(hash, typeof obj === 'undefined' ? null:obj);
									};
								}(this, hash));
							} else {
								this.add_callback(hash, next);
							}
						} else {
							next(this.find_existing(id));
						}
					};


					this.is_loading = function(id)
					{
						return typeof load_callbacks[this.get_object_url(id)] != 'undefined';
					};


					this.add_callback = function(hash, next)
					{
						if (typeof load_callbacks[hash] == 'undefined') {
							load_callbacks[hash] = [];
						}

						load_callbacks[hash].push(next);
						return this;
					};


					this.fire_callbacks = function(hash, obj)
					{
						var next;

						while (next = load_callbacks[hash].shift()) {
							next(obj);
						}

						delete load_callbacks[hash];
						return this;
					};


					this.find_existing = function(id)
					{
						return typeof instances[id] == 'undefined' ? null:instances[id];
					};


					var model_instance = function(arg_data)
					{
						var
							values = {};


						for (var i = 0; i < attrs.length; i++) {
							if (typeof attrs[i].def == 'undefined') {
								values[attrs[i].name] = null;
							} else {
								values[attrs[i].name] = attrs[i].def;
							}
						}


						this.update = function(arg_data)
						{
							for (var attr in arg_data) {
								this.set(attr, arg_data[attr]);
							}

							return this;
						};


						this.has_attr = function(name)
						{
							return this.model().has_attr(name);
						};


						this.get = function(name)
						{
							return values[name];
						};


						this.set = function(name, value)
						{
							if (this.model().has_attr(name)) {
								values[name] = model.validate_attr_value(name, value);
							} else {
								values[name] = value;
							}

							return this;
						};


						this.announce = function()
						{
							v('Announcement: Instance #' + this.get('id') + ' of model ' + cname + ' has been updated!');
						};


						this.cname = function()
						{
							return cname;
						};


						this.model = function()
						{
							return model;
						};


						this.get_data = function()
						{
							return values;
						};


						this.get_el_cname = function()
						{
							return '.model-' + this.cname() + '-instance-' + this.get('id');
						};


						this.destroy = function()
						{
							return this;
						};


						this.attr_to_html = function(name)
						{
							return pwf.model.attr_to_html(this.model().get_attr_def(name), this);
						};


						this.attr_to_text = function(name)
						{
							return pwf.model.attr_to_text(this.model().get_attr_def(name), this);
						};


						this.update(arg_data);
					};


					model_instance.prototype.to_text = function()
					{
						return this.cname() + '#' + (this.get('id') === null ? 'new':this.get('id'));
					};


					model_instance.prototype.to_html = function()
					{
						return pwf.jquery.span('object').html(this.to_text());
					};


					model_instance.prototype.to_ident = function()
					{
						return this.cname() + '#' + (this.get('id') === null ? 'new':this.get('id'));
					};


					for (var callback in caller) {
						model_instance.prototype[callback] = caller[callback];
					}
				};


			this.is_ready = function()
			{
				return pwf.mi(['jquery', 'comm', 'queue']);
			};


			this.init = function()
			{
				pwf.comm.on('message', function(message) {
					if (typeof message.feed != 'undefined' && message.feed == 'model') {
						if (typeof message.batch != 'undefined' && message.batch) {
							for (var i = 0; i < message.data.length; i++) {
								this.update(message.data[i].model, message.data[i].id, message.data[i]);
							}
						} else {
							this.update(message.model, message.instance_id, message.data);
						}
					}
				});

				return true;
			};


			this.update = function(model, id, data)
			{
				var instance = this.find_existing(model, id) || this.create(model, data);

				if (instance !== null) {
					instance
						.update(data)
						.announce();
				}

				return instance;
			};


			this.get_all = function()
			{
				var list = [];

				for (var name in list) {
					list.push(name);
				}

				return list;
			};


			this.register = function(name, model_def)
			{
				models[name] = new model(name, model_def);
				return this;
			};


			this.get = function(model)
			{
				return models[model];
			};


			this.create = function(model, arg_data)
			{
				if (typeof this.get(model) != 'undefined') {
					return this.get(model).create(arg_data);
				} else throw new Error('Cannot create new instance of model ' + model + '. Model does not exist.');
			};


			this.destroy = function(model, id)
			{
				if (typeof this.get(model) != 'undefined') {
					return this.get(model).destroy(id);
				} else throw new Error('Cannot destroy instance of model ' + model + '. Model does not exist.');
			};


			/** Find existing instance of model. Looks up on server if it does not exist.
			 */
			this.find = function(model, id, next)
			{
				if (typeof this.get(model) != 'undefined') {
					return this.get(model).find(id, next);
				} else throw new Error('Cannot look for instance of model ' + model + '. Model does not exist.');
			};


			/** Find existing instance of model
			 */
			this.find_existing = function(model, id)
			{
				if (typeof this.get(model) != 'undefined') {
					return this.get(model).find_existing(id);
				} else throw new Error('Cannot look for instance of model ' + model + '. Model does not exist.');
			};


			this.get_all = function(model, filters, next)
			{
				if (typeof this.get(model) != 'undefined') {
					return this.get(model).get_all(filters, next);
				} else throw new Error('Cannot look for instances of model ' + model + '. Model does not exist.');
			};


			this.get_all_existing = function(model)
			{
				if (typeof this.get(model) != 'undefined') {
					return this.get(model).get_all_existing();
				} else throw new Error('Cannot look for instances of model ' + model + '. Model does not exist.');
			};


			/** Find existing instance of model
			 */
			this.get_attrs = function(model)
			{
				if (typeof this.get(model) != 'undefined') {
					return this.get(model).get_attrs();
				} else throw new Error('Cannot look for attrs of model ' + model + '. Model does not exist.');
			};


			this.get_attr_def = function(model, attr)
			{
				if (typeof this.get(model) != 'undefined') {
					return this.get(model).get_attr_def(attr);
				} else throw new Error('Cannot look for attribute of model ' + model + '. Model does not exist.');
			};


			this.datetime_from_sys = function(date_str)
			{
				var
					str = date_str + '+00:00',
					tmp = pwf.moment(str, 'YYYY-MM-DD\THH:mm:ss.SSS\ZZ').zone(pwf.moment().zone() + sys.locales.tz);

				return pwf.moment(tmp.format('YYYY-MM-DD HH:mm:ss'));
			};


			this.validate_attr = function(def, val)
			{
				if (typeof val !== 'undefined' && val !== null) {
					if (def.type == 'string') {
						if (typeof val != 'string') {
							val = val + '';
						}
					} else if (def.type == 'boolean') {
						val = !!val;
					} else if (def.type == 'int') {
						val = parseInt(val);
					} else if (def.type == 'array') {
						if (typeof val == 'object') {
							if (typeof val.length == 'undefined') {
								val = [val];
							}
						} else {
							val = [val];
						}
					} else if (def.type == 'date' || def.type == 'datetime') {
						if (typeof val == 'object') {
							if (typeof val.format == 'undefined') {
								throw new Error('Value passed to attr ' + def.name + ' of instance of model ' + def.cname + ' must be instance of Moment.');
							}
						} else {
							val = this.datetime_from_sys(val);

							if (def.type == 'date') {
								val.hour(0).minute(0).seconds(0);
							}
						}
					} else if (def.type == 'model') {
						if (typeof val == 'object') {
							if (typeof val.cname == 'function') {
								if (val.cname() != def.model) {
									throw new Error('Value passed to attr ' + def.name + ' of instance of model ' + def.cname + ' must be instance of model ' + def.model + ', plain object or int.');
								}
							} else {
								if (typeof val.length == 'undefined') {
									val = pwf.model.create(def.model, val);
								} else {
									if (val.length > 0) {
										val = pwf.model.create(def.model, val[0]);
									} else {
										val = null;
									}
								}
							}
						} else if (typeof val == 'number' || typeof val == 'string') {
							var tmp = pwf.model.find_existing(def.model, parseInt(val));

							if (tmp !== null) {
								val = tmp;
							}
						} else throw new Error('Value passed to attr ' + def.name + ' of instance of model ' + def.cname + ' must be instance of model ' + def.model + ', plain object or int.');
					}
				}

				return val;
			};


			this.attr_to_html = function(def, obj)
			{
				var cont, val;

				if (typeof def.to_html == 'function') {
					cont = def.to_html(def, obj);
				} else {
					var val = obj.get(def.name);
					cont = pwf.jquery.span('attr-val attr-type-' + def.type + ' attr-name-' + def.name);

					if (def.type == 'model' && typeof val != 'undefined' && val !== null) {
						if (typeof val == 'object' && typeof val.cname == 'function') {
							val = typeof val.to_html == 'function' ? val.to_html():this.attr_to_text(def, obj);
						} else {
							var existing = pwf.model.find_existing(def.model, val);

							if (existing !== null) {
								obj.set(def.name, existing);
								return this.attr_to_html(def, obj);
							} else {
								val = pwf.jquery.span('inline-loader').html(pwf.jquery.span('hidden').html(this.attr_to_text(def, obj)));

								this.find(def.model, obj.get(def.name), function(def, parent, target) {
									return function(obj) {
										var c = pwf.model.attr_to_html(def, parent).insertAfter(target);
										target.remove();
									};
								}(def, obj, cont));
							}
						}
					} else {
						val = this.attr_to_text(def, obj);

						if (def.type == 'datetime') {
							val = val.replace(/\s+/g, '&nbsp;');
						}
					}

					cont.html(val);
				}

				return cont;
			};


			this.attr_to_text = function(def, obj)
			{
				var val = null;

				if (def.type == 'method') {
					val = obj[def.name]();
				} else {
					val = obj.get(def.name);
				}

				if (typeof def.to_text == 'function') {
					val = def.to_text(val);
				} else {
					if (typeof val == 'undefined' || val === null) {
						val = pwf.locales.trans('no-value');
					} else {
						if (def.type == 'string') {
							val = val + '';
						} else if (def.type == 'boolean') {
							val = pwf.locales.trans(val ? 'yes':'no');
						} else if (def.type == 'int') {
							val = val + '';
						} else if (def.type == 'array') {
							val = val.join(', ');
						} else if (def.type == 'date') {
							val = val.format(typeof def.text_format == 'undefined' ? 'D.M.YYYY':def.text_format);
						} else if (def.type == 'datetime') {
							val = val.format(typeof def.text_format == 'undefined' ? 'YYYY-MM-DD HH:mm:ss':def.text_format);
						} else if (def.type == 'object') {
							val = pwf.locales.trans('runtime-object');
						} else if (def.type == 'model') {
							if (typeof val.to_text == 'function') {
								val = val.to_text();
							} else {
								if (typeof val.cname == 'function') {
									val = val.cname() + '#' + val.get('id');
								} else {
									val = def.model + '#' + val;
								}
							}
						}
					}
				}

				return val;
			};
		};


	/// Register, because we have existing pwf
	if (typeof pwf == 'object') {
		pwf.register(mod_name, mod, mod_inst);
	}

	/// Export module because we may be inside nodejs.
	if (typeof process != 'undefined') {
		module.exports = mod;
	}
})();
