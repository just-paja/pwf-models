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
						attrs  = [],
						cname  = arg_cname,
						model  = this,
						load_callbacks = {};


					this.get_all = function(filters, next)
					{
						if (typeof next == 'function') {
							var
								url  = this.get_url(),
								opts = {
									'model':cname,
									'url':url
								};

							pwf.create('list', opts).load(function(model, next) {
								return function(err, data, list) {
									next(err, data, list);
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


					this.add_attrs = function(list)
					{
						if (typeof list == 'object' && typeof list.length == 'number') {
							for (var i = 0; i < list.length; i++) {
								this.add_attr(list[i]);
							}
						} else {
							if (typeof list != 'undefined') {
								throw new Error('You must pass model attributes as array of objects.');
							}
						}

						return this;
					};


					this.add_attr = function(attr)
					{
						if (typeof attr == 'object' && attr !== null) {
							if (typeof attr.name != 'string') {
								throw new Error('You must pass name as a string to attributes.');
							}

							if (typeof attr.type != 'string') {
								throw new Error('You must pass type as a string to attributes.');
							}

							if (!pwf.model.is_valid_attr_type(attr.type)) {
								throw new Error('Invalid attribute type: "' + attr.type + '".');
							}

							attrs.push(attr);
						}

						return this;
					};


					this.add_id = function()
					{
						// Add ID attribute
						if (typeof arg_model.internal === 'undefined' || !arg_model.internal) {
							if (!this.has_attr('id')) {
								this.add_attr({"name":'id', "type":'int'});
							}
						}

						return this;
					};


					this.add_proto = function(methods)
					{
						for (var callback in methods) {
							model_instance.prototype[callback] = methods[callback];
						}

						return this;
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
							if (typeof model_instance.prototype[name] == 'function') {
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
						var url = pwf.config.get('models.url_browse');

						if (typeof url != 'string') {
							throw new Error('Please define models.url_browse as string');
						}

						return url.replace('{model}', cname);
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

							this.add_callback(hash, next);

							if (!this.is_loading(id)) {
								var opts = {
									'model':cname,
									'filters':{'id':id},
									'per_page':1,
									'url':url
								};

								pwf.create('list', opts).load(function(model, hash) {
									return function(err, response, list) {
										model.fire_callbacks(err, hash, typeof response.data[0] === 'undefined' ? null:response.data[0]);
									};
								}(this, hash));
							}
						} else {
							next(null, this.find_existing(id));
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


					this.fire_callbacks = function(err, hash, obj)
					{
						var next;

						while (next = load_callbacks[hash].shift()) {
							next(err, obj);
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
							var val = null;

							if (typeof values[name] != 'undefined') {
								var def = this.model().get_attr_def(name);
								val = values[name];

								if (this.has_attr(name)) {
									if (def.type == 'model') {
										if (typeof val == 'number') {
											var existing = pwf.model.find_existing(def.model, val);

											if (existing !== null) {
												val = existing;
											}
										}
									} else if (def.type == 'collection') {
										if (typeof val == 'object' && val !== null && typeof val.length == 'number') {
											for (var i = 0; i < val.length; i++) {
												var existing = pwf.model.find_existing(def.model, val[i]);

												if (existing !== null) {
													val[i] = existing;
												}
											}
										} else {
											val = [];
										}
									}
								}
							}

							return val;
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
							var
								def  = this.model().get_attrs(),
								data = {};

							for (var i = 0; i < def.length; i++) {
								data[def[i].name] = this.get(def[i].name);
							}

							return data;
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
						var text;

						if (this.model().has_attr('name')) {
							text = this.get('name') + ' (#'+ this.get('id') + ')';
						} else {
							text = this.cname() + '#' + (this.get('id') === null ? 'new':this.get('id'));
						}

						return text;
					};


					model_instance.prototype.to_html = function()
					{
						return pwf.jquery.span('object').html(this.to_text());
					};


					model_instance.prototype.to_ident = function()
					{
						return this.cname() + '#' + (this.get('id') === null ? 'new':this.get('id'));
					};


					this
						.add_attrs(arg_model.attrs)
						.add_proto(arg_model.proto)
						.add_id();
				},

				validations =
				{
					'boolean':function(def, val)
					{
						return {'status':true, 'value':!!val};
					},

					'string':function(def, val)
					{
						var
							ok = typeof val == 'string',
							msg = null;

						if (typeof val != 'string') {
							try {
								val = val + '';
							} catch (e) {
								msg = e;
								ok = false;
							}
						}

						return {'status':ok, 'value':val, 'msg':msg};
					},

					'time':function(def, val)
					{
						var status = this.string(def, val);

						if (status.ok) {
							status.ok = !val.match(/^[0-9]{2}:[0-9]{2}$/);

							if (status.ok) {
								var
									split = val.split(':'),
									hours = parseInt(val[0]),
									mins  = parseInt(val[1]);

								status.ok = hours >= 0 && hours <= 23 && mins >= 0 && mins <= 59;
							}
						}

						if (!status.ok) {
							status.msg = 'model-time-invalid';
						}

						return status;
					},

					'email':function(def, val)
					{
						var status = this.string(def, val);

						if (status.ok) {
							status.ok = !!val.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

							if (!status.ok) {
								msg = 'model-invalid-email';
							}
						}

						return status;
					},

					'url':function(def, val)
					{
						var status = this.string(def, val);

						if (status.ok) {
							var
								scheme = '[a-z][a-z0-9+\.-]*',
								username = '([^:\\\@\\\/]+(:[^:\\\@\\\/]+)?\\\@)?',
								dns_segment = '([a-z][a-z0-9-]*?[a-z0-9])',
								domain = '(' + dns_segment + '\\\.)*' + dns_segment,

								ipv4_segment = '([0|1][0-9]{0,2}|2([0-4][0-9]|5[0-5]))',
								ipv4 = '(' + ipv4_segment + '\\\.' + ipv4_segment + '\\\.' + ipv4_segment + '\\\.' + ipv4_segment + ')',

								ipv6_block = '([a-f0-9]{0,4})',
								ipv6_raw = '(' + ipv6_block + ':){2,8}',
								ipv6_ipv4_sub = '(::ffff:' + ipv4 + ')',
								ipv6 = '(' + ipv6_raw + '|' + ipv6_ipv4_sub + ')',

								host = '(' + domain + '|' + ipv4 + '|' + ipv6 + ')',
								port = '(:[\\\d]{1,5})?',
								path = '([^?;\\\#]*)?',
								query = '(\\\?[^\\\#;]*)?',
								anchor = '(\\\#.*)?',
								re_str = '^' + scheme + ':\\\/\\\/' + username + host + port + '(\\\/' + path + query + anchor + '|)$',
								url_test = new RegExp(re_str, 'i');

							sattus.ok = !!val.match(url_test);

							if (!sattus.ok) {
								status.msg = 'model-invalid-url';
							}
						}

						return status;
					},

					'int':function(def, val)
					{
						var
							ok  = true;
							msg = null;

						val = parseInt(val);

						if (isNaN(val)) {
							val = null;
							ok = false;
							msg = 'Cannot be parsed into integer.';
						}

						return {'status':ok, 'value':val, 'msg':msg};
					},

					'int_set':function(def, val)
					{
						var status = this.object(def, val);

						if (typeof val.length == 'number') {
							for (var i = 0; i < val.length; i++) {
								var vs = this.int(def, val[i]);

								if (vs.ok) {
									val[i] = vs.val;
								} else {
									status.ok = false;
									status.msg = 'Int set value ' + i + ' must be integer';
									break;
								}
							}
						} else {
							status.ok = false;
							status.msg = 'Int set must be array';
						}

						return status;
					},

					'float':function(def, val)
					{
						var
							ok  = true;
							msg = null;

						val = parseFloat(val);

						if (isNaN(val)) {
							val = null;
							ok = false;
							msg = 'Cannot be parsed into float number.';
						}

						return {'status':ok, 'value':val, 'msg':msg};
					},

					'list':function(def, val)
					{
						if (typeof val == 'object') {
							if (typeof val.length == 'undefined') {
								val = [val];
							}
						} else {
							val = [val];
						}

						return {'status':true, 'value':val};
					},

					'datetime':function(def, val)
					{
						var
							ok = true,
							msg = null;

						if (typeof val == 'object') {
							if (typeof val.format == 'undefined') {
								ok = false;
								msg = 'Value passed to attr ' + def.name + ' of instance of model ' + def.cname + ' must be instance of Moment.';
							}
						} else {
							val = pwf.model.datetime_from_sys(val);

							if (def.type == 'date') {
								val.hour(0).minute(0).seconds(0);
							}
						}

						return {'status':ok, 'value':val, 'msg':msg};
					},

					'model':function(def, val)
					{
						var
							ok = true,
							msg = null;

						if (typeof val == 'object') {
							if (typeof val.cname == 'function') {
								if (val.cname() != def.model) {
									ok = false;
									msg = 'Value passed to attr ' + def.name + ' of instance of model ' + def.cname + ' must be instance of model ' + def.model + ', plain object or int.';
									val = null;
								}
							} else {
								if (val.length == 'number') {
									ok = false;
									msg = 'Cannot pass list of objects to 1:n relationship "' + def.cname + '#' + def.name + '"';
									val = null;
								} else {
									// Guess that user passed object with attributes and create object
									val = pwf.model.create(def.model, val);
								}
							}
						} else if (typeof val == 'number' || typeof val == 'string') {
							// Passed only ID. Lookup cached objects, otherwise stay.
							var tmp = pwf.model.find_existing(def.model, parseInt(val));

							if (tmp !== null) {
								val = tmp;
							}
						} else {
							ok  = false;
							msg = 'Value passed to attr ' + def.name + ' of instance of model ' + def.cname + ' must be instance of model ' + def.model + ', plain object or int.';
						}

						return {'status':ok, 'value':val, 'msg':msg};
					},

					'collection':function(def, val)
					{
						var
							ok = true,
							msg = 'Collection attr ' + def.name + ' of model ' + def.cname + ' accepts only array of instances of model ' + def.model;

						if (typeof val == 'object') {
							if (val === null) {
								val = [];
							} else {
								if (typeof val.length == 'number') {
									for (var i = 0; i < val.length; i++) {
										if (typeof val[i] == 'object') {
											if (val[i] !== null) {
												if (typeof val[i].cname == 'function') {
													msg = null;
												} else {
													val[i] = pwf.model.create(def.model, val[i]);
													msg = null;
												}
											} else {
												val = [];
												ok = false;
												break;
											}
										} else if (typeof val[i] == 'number') {
											msg = null;
										} else {
											val = [];
											ok = false;
											break;
										}
									}
								} else {
									if (typeof val.cname == 'function') {
										msg = null;

										if (val.cname() == def.model) {
											val = [val];
										} else {
											val = [pwf.model.create(def.model, val)];
										}
									} else {
										ok = false;
									}
								}
							}
						} else {
							ok = false;
						}

						return {'status':ok, 'value':val, 'msg':msg};
					},

					'point':function(def, val)
					{
						var status = this.object(def, val);

						if (status.ok) {
							if (typeof val.lat != 'undefined') {
								var lat = this.float({}, val.lat);

								if (!lat.ok) {
									status.ok = false;
									status.msg = 'model-point-invalid-lat';
								}
							}

							if (status.ok) {
								if (typeof val.lng != 'undefined') {
									var lng = this.float({}, val.lng);

									if (!lng.ok) {
										status.ok = false;
										status.msg = 'model-point-invalid-lng';
									}
								}
							}
						}

						return status;
					},

					'object':function(def, val)
					{
						var
							ok = true,
							val = val,
							msg = null;

						if (typeof val != 'object') {
							ok = false;
							msg = 'model-point-must-be-object';
						}

						return {'status':ok, 'value':val, 'msg':msg};
					}
				};


			validations.password = validations.string;
			validations.text     = validations.string;
			validations.html     = validations.string;
			validations.date     = validations.datetime;
			validations.file     = validations.object;
			validations.image    = validations.object;


			this.is_ready = function()
			{
				return pwf.mi(['jquery', 'list']);
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
				if (typeof models[name] == 'undefined') {
					models[name] = new model(name, model_def);
					pwf.queue.fire('model-registered.' + name, models[name]);
				} else throw new Error('Cannot overwrite model ' + name + '.');
				return this;
			};


			this.get = function(model)
			{
				return models[model];
			};


			this.list = function()
			{
				return Object.keys(models);
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
					var validation = validations[def.type](def, val);

					if (validation.status) {
						val = validation.value;
					} else {
						throw new Error(typeof validation.msg == 'string' ? validation.msg:'Cannot use "' + val + '" as a value for ' + def.cname + '#' + def.name + '. Failed to validate.');
					}
				}

				return val;
			};


			this.get_attr_types = function()
			{
				return Object.keys(validations);
			};


			this.is_valid_attr_type = function(type)
			{
				return type in validations;
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
					} else if (def.type == 'collection') {
						if (typeof val == 'object' && val !== null) {
							var
								renew = [],
								list = pwf.jquery('<ul/>');

							for (var i = 0; i < val.length; i++) {
								var existing = pwf.model.find_existing(def.model, val[i]);

								if (existing !== null) {
									renew.push(existing);
								} else {
									renew.push(val[i]);
								}
							}

							obj.set(def.name, renew);

							for (var i = 0; i < renew.length; i++) {
								var li = pwf.jquery('<li/>');

								li.html(renew[i].to_html());
								list.append(li);
							}

							return list;
						}
					} else if (def.type == 'method') {
						val = obj[def.name]();
					} else if (def.type == 'html') {
						val = pwf.jquery('<div/>').html(val).text();
					} else {
						val = this.attr_to_text(def, obj);

						if (def.type == 'datetime') {
							if (typeof val == 'string') {
								val = val.replace(/\s+/g, '&nbsp;');
							}
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
