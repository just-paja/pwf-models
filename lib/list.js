/**
 * Dynamic data model abstraction. Handles predefined data formats and data
 * types. Also caches data on client-side for simpler updates and lower memory
 * consumption.
 */
(function()
{
	var
		mod_name = 'model.list',
		mod = {
			'parents':['caller'],
			'storage':{
				'loaded':false,
				'loading':false,
				'dataray':null,

				'opts':{
					"model":null,
					"filters":[],
					"page":0,
					"per_page":20,
					"sort":null,
					"sort_mode":null,
					"url":null,
					"extra":null,
					"on_load":null,
					"on_error":null
				},
			},

			'proto':{
				'def':{
					"page":0,
					"per_page":0,
					"total":0,
					"data":{}
				},

				'use':function(proto, response) {
					var objects = [];

					proto.storage.dataray = response;

					if (typeof response.data == 'object' && this.get('model') !== null) {
						for (var i = 0; i < response.data.length; i++) {
							objects.push(pwf.model.create(this.get('model'), response.data[i]));
						}

						proto.storage.dataray.data = objects;
					}

					proto('loaded');
				},

				'loaded':function(proto) {
					this.respond('on_load');
				},

				'failed':function(proto, message) {
					this.respond('on_error', [message]);
				},

				'get_filter_data':function() {
					return this.get('filters');
				},
			},


			'public':{
				'page':function(page, next) {
					return this.set('page', Math.max(Math.min(page, this.get_page_count()), 1)).load(next);
				},

				'step':function(step, next) {
					return this.page(this.get('page') + step, next);
				},

				'get_total':function(proto) {
					return proto.storage.dataray.total;
				},

				'get_page_count':function(proto) {
					return Math.max(Math.ceil(this.get_total()/this.get('per_page')), 0);
				},

				'get_params':function(proto) {
					var
						filters = proto('get_filter_data'),
						sort = this.get('sort'),
						params = {
							"page":this.get('page'),
							"per_page":this.get('per_page')
						};

					if (typeof filters != 'string' && filters !== null) {
						filters = JSON.stringify(filters);
					}

					if (typeof sort != 'string' && sort !== null) {
						sort = JSON.stringify(sort);
					}

					if (typeof sort != 'undefined' && sort !== null) {
						params.sort = sort;
					}

					if (typeof filters != 'undefined' && filters !== null) {
						params.filters = filters;
					}

					return params;
				},

				'load':function(proto, next) {
					proto.storage.loaded = false;
					proto.storage.loading = true;

					pwf.comm.get(this.get('url'), this.get_params(), function(obj, proto, next) {
						return function(err, response) {
							if (err) {
								proto('failed', err);
							} else {
								proto('use', response);
							}

							obj.respond(next, [err, response]);
						};
					}(this, proto, next));

					return this;
				},

				'sort':function(proto, attr, mode, next) {
					var mode = typeof mode == 'undefined' ? 'asc':mode;

					this.set('sort', attr);
					this.set('sort_mode', mode);

					return this.load(next);
				},

				'reset':function(proto) {
					proto.storage.dataray = Object.deepExtend(proto('def'));
					proto.storage.loaded  = false;
					proto.storage.loading = false;

					return this;
				},

				'is_loaded':function() {
					return loaded;
				},

				'is_loading':function() {
					return loaded;
				},

				'get_data':function(proto) {
					return proto.storage.dataray;
				}
			}
		};

	/// Register, because we have existing pwf
	if (typeof pwf == 'object') {
		pwf.rc(mod_name, mod);
	}

	/// Export module because we may be inside nodejs.
	if (typeof module == 'object') {
		module.exports = mod;
	}
})();
