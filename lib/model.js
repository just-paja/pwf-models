/**
 * Dynamic data model abstraction. Handles predefined data formats and data
 * types. Also caches data on client-side for simpler updates and lower memory
 * consumption.
 */
(function()
{
	var
		mod_name = 'model',
		mod = {
			'uses':['config', 'moment'],

			'storage':{
				'values':{},
				'opts':{}
			},


			'static':{
				'attrs':[],

				'has_id':true,
				'instances':{},


				'attr_to_text':function(def, obj)
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
							val = pwf.locales.trans_msg('no-value');
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
								var format = def.text_format;

								if (typeof format == 'undefined') {
									pwf.config.get('locales.format.date', 'YYYY-MM-DD');
								}

								val = val.format(format);
							} else if (def.type == 'datetime') {
								var format = def.text_format;

								if (typeof format == 'undefined') {
									pwf.config.get('locales.format.datetime', 'YYYY-MM-DD HH:mm:ss');
								}

								val = val.format(format);
							} else if (def.type == 'object') {
								val = pwf.locales.trans('runtime-object');
							} else if (def.type == 'model') {
								if (typeof val.to_text ==  'function') {
									val = val.to_text();
								} else {
									val = def.model + '#' + val;
								}
							}
						}
					}

					return val;
				},


				'cmp':function(a, b)
				{
					if (a instanceof Object && typeof a.get == 'function') {
						a = a.get('id');
					}

					if (b instanceof Object && typeof b.get == 'function') {
						b = b.get('id');
					}

					return a == b;
				},


				'config':function()
				{
					this.create_id();
				},


				'create_id':function()
				{
					// Add ID attribute
					if (this.has_id && !this.has_attr('id')) {
						this.attrs.unshift({"name":'id', "type":'int'});
					}

					return this;
				},


				'datetime_from_sys':function(date_str)
				{
					var
						str = date_str + '+00:00',
						tmp = pwf.moment(str, 'YYYY-MM-DD\THH:mm:ss.SSS\ZZ').zone(pwf.moment().zone() + pwf.config.get('locales.tz'));

					return pwf.moment(tmp.format('YYYY-MM-DD HH:mm:ss'));
				},


				'destroy':function(id)
				{
					var existing = this.find_existing(id);

					if (existing !== null) {
						delete this.instances[id];
						existing.destroy();
					}

					return existing;
				},


				'find_existing':function(id)
				{
					return typeof this.static.instances[id] == 'undefined' ? null:this.static.instances[id];
				},


				'get_all_existing':function()
				{
					var list = [];

					for (var id in this.instances) {
						list.push(this.instances[id]);
					}

					return list;
				},


				'get_attr':function(name)
				{
					var
						attrs = this.static.attrs,
						attr;

					for (var i = 0, len = attrs.length; i < len; i++) {
						if (attrs[i].name == name) {
							attr = attrs[i];
							attr.cname = this.name;

							return attr;
						}
					}

					return null;
				},


				'get_attr_opt':function(attr, val)
				{
					var opts = this.get_attr_opts(attr);

					for (var i = 0, len = opts.length; i < len; i++) {
						if (this.cmp(opts[i], val) || opts[i].value == val) {
							return opts[i];
						}
					}

					return null;
				},


				'get_attr_opts':function(attr)
				{
					return this.get_attr(attr).options;
				},


				'get_attrs':function()
				{
					return this.attrs;
				},


				'get_url':function()
				{
					var url = pwf.config.get('models.url.browse');

					if (typeof url != 'string') {
						throw new Error('model:get_url:undefined:models.url_browse:(string)');
					}

					return url.replace('{model}', this.name);
				},


				'has_attr':function(name)
				{
					return this.get_attr(name) !== null;
				},


				'validations':
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
						var status = this.validations.string.apply(this, [def, val]);

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
						var status = this.validations.string.apply(this, [def, val]);

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
						var status = this.validations.string.apply(this, [def, val]);

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
						var status = this.validations.array.apply(this, [def, val]);

						if (status.status) {
							for (var i = 0, len = val.length; i < len; i++) {
								var vs = this.validations.int.apply(this, [def, val[i]]);

								if (vs.status) {
									val[i] = vs.value;
								} else {
									status.status = false;
									status.msg = 'Int set value ' + i + ' must be integer';
									break;
								}
							}
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
						return this.validations.array.apply(this, [def, val]);
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
							val = this.datetime_from_sys(val);

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
							if (typeof val.meta == 'object') {
								if (val.meta.cname != def.model) {
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
									val = pwf.create(def.model, val);
								}
							}
						} else if (typeof val == 'number' || typeof val == 'string') {
							// Passed only ID. Lookup cached objects, otherwise stay.
							if (pwf.has_class(def.model)) {
								var tmp = pwf.get_class(def.model).find_existing(parseInt(val));

								if (tmp !== null) {
									val = tmp;
								}
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
													val[i] = pwf.create(def.model, val[i]);
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

										if (val.meta instanceof Object && val.meta.cname == def.model) {
											val = [val];
										} else {
											val = [pwf.create(def.model, val)];
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

						if (!(val instanceof Object)) {
							ok = false;
							msg = 'must-be-object';
						}

						return {'status':ok, 'value':val, 'msg':msg};
					},

					'array':function(def, val)
					{
						var
							ok = true,
							val = val,
							msg = null;

						if (!(val instanceof Array)) {
							ok = false;
							msg = 'must-be-array';
						}

						return {'status':ok, 'value':val, 'msg':msg};
					},

					'password':'string',
					'text':'string',
					'html':'string',
					'date':'datetime',
					'file':'object',
					'image':'object',
					'sound':'object',
				},


				'validate_attr_value':function(def, val, fn)
				{
					if (typeof val !== 'undefined' && val !== null) {
						if (typeof fn == 'undefined') {
							fn = this.validations[def.type];
						}

						if (typeof fn == 'function') {
							var res = fn.apply(this, [def, val]);

							if (res.status) {
								val = res.value;
							} else {
								v(def, val);
								throw new Error(typeof res.msg == 'string' ? res.msg:'model:bad-value:' + this.name + ':' + def.name + ':(' + def.type + '):' + val);
							}
						} else if (typeof fn == 'string') {
							return this.validate_attr_value(def, val, this.static.validations[fn]);
						} else {
							throw new Error('model:' + this.name + ':' +  def.name + ':cannot-validate');
						}
					}

					return val;
				},


				'validate_value':function(name, val)
				{
					return this.validate_attr_value(this.get_attr(name), val);
				},


				'find':function(id, next, force)
				{
					var force = typeof force == 'undefined' ? false:!!force;

					if (typeof id != 'string' && typeof id != 'number') {
						throw new Error('model-find:id-must-be-string-or-number:' + id);
					}

					if (typeof this.instances[id] == 'undefined' || force) {
						var
							url = this.get_url(),
							opts = {
								'model':this.name,
								'filters':{'id':id},
								'per_page':1,
								'url':url
							};

						pwf.create('model.list', opts).load(function(err, res, list) {
							var has_response =
								res instanceof Object
								&& res.data instanceof Array
								&& typeof res.data[0] != 'undefined';

							next(err, has_response ? res.data[0]:null);
						});
					} else {
						next(null, this.find_existing(id));
					}
				},
			},


			'init':function(p, opts) {
				var id;

				this.reset_values();

				if (typeof opts == 'object') {
					this.update(opts);
				}

				id = this.get('id');

				if (id && typeof this.meta.static.instances[id] == 'undefined') {
					this.meta.static.instances[id] = this;
				}
			},


			'proto':{
				'get_attr_model':function(p, name, val)
				{
					var
						att = this.get_attr(name),
						val = typeof val == 'undefined' ? p.storage.values[name]:val;

					if (typeof val == 'number') {
						var
							model = pwf.get_class(att.model),
							existing = model.find_existing(val);

						if (existing !== null) {
							val = existing;
							p.storage.values[name] = val;
						}
					}

					return val;
				},


				'get_attr_collection':function(p, name)
				{
					var
						att = this.get_attr(name),
						val = p.storage.values[name];

					if (val instanceof Array) {
						for (var i = 0; i < val.length; i++) {
							val[i] = p('get_attr_model', name, val[i]);
						}
					} else {
						val = [];
					}

					return val;
				}
			},


			'public':{
				'update':function(p, data)
				{
					var keys = Object.keys(data);

					for (var i = 0, len = keys.length; i < len; i++) {
						this.set(keys[i], data[keys[i]]);
					}

					return this;
				},


				'has_attr':function(p, name)
				{
					return this.meta.static.has_attr(name);
				},


				'get_attr':function(p, name)
				{
					return this.meta.static.get_attr(name);
				},


				'get':function(p, name)
				{
					var
						val = null,
						src = p.storage.values,
						def = this.get_attr(name);

					if (!def) {
						src = p.storage.opts;
					}

					if (typeof src[name] == 'undefined') {
						if (def && typeof def.def != 'undefined') {
							val = def.def;
						}
					} else {
						val = src[name];

						if (def) {
							if (def.type == 'model') {
								return p('get_attr_model', name);
							} else if (def.type == 'collection') {
								return p('get_attr_collection', name);
							}
						}
					}

					return val;
				},


				'set':function(p, name, val)
				{
					if (this.has_attr(name)) {
						p.storage.values[name] = this.meta.static.validate_value(name, val);
					} else {
						p.storage.opts[name] = val;
					}

					return this;
				},


				'get_data':function(p)
				{
					var
						attrs = this.meta.static.get_attrs(),
						data  = {};

					for (var i = 0, len = attrs.length; i < len; i++) {
						var name = attrs[i].name;

						data[name] = this.get(name);
					}

					return data;
				},


				'reset_values':function(p)
				{
					var
						src = p.storage.values,
						attrs = this.meta.static.attrs;

					for (var i = 0, len = attrs.length; i < len; i++) {
						var att = attrs[i];

						if (typeof src[att.name] == 'undefined') {
							if (typeof att.def == 'undefined') {
								src[att.name] = null;
							} else if (typeof att.def == 'function') {
								src[att.name] = att.def.call(this);
							} else {
								src[att.name] = att.def;
							}
						}
					}

					return this;
				},


				'to_text':function()
				{
					var text;

					if (this.has_attr('name')) {
						text = this.get('name') + ' (#'+ this.get('id') + ')';
					} else {
						text = this.to_ident();
					}

					return text;
				},


				'to_ident':function()
				{
					return this.meta.cname + '#' + (this.get('id') === null ? 'new':this.get('id'));
				},


				'get_seoname':function()
				{
					var name = this.get('name').replace(/[\.\-\(\)]/g, '');

					if (pwf.status('accents')) {
						name = pwf.accents.seoname(name);
					}

					name = name.replace(/\s+/g, ' ').replace(/\s/g, '-').toLowerCase();

					return name + (this.get('id') ? '-' + this.get('id'):'');
				}
			}
		};


	/// Register, because we have existing pwf
	if (typeof pwf == 'object') {
		pwf.rc(mod_name, mod);
	}

	/// Export module because we may be inside nodejs.
	if (typeof process != 'undefined') {
		module.exports = mod;
	}
})();
