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
			'uses':['comm'],

			'storage':{
				'loaded':false,
				'loading':false,
				'dataray':null,

				'opts':{
					"model":null,
					"filters":[],
					"join":[],
					"page":0,
					"per_page":20,
					"sort":null,
					"sort_mode":null,
					'reverse':false,
					"url":null,
					"extra":null,
					"on_load":null,
					"on_error":null
				},
			},

			'init':function() {
				this.reset();
			},

			'proto':{
				'def':{
					"page":0,
					"per_page":0,
					"total":0,
					"data":{}
				},


				'use':function(p, response)
				{
					var objects = [];

					p.storage.dataray = response;

					if (typeof response.data == 'object' && this.get('model') !== null) {
						for (var i = 0; i < response.data.length; i++) {
							objects.push(pwf.create(this.get('model'), response.data[i]));
						}

						if (this.get('reverse')) {
							objects = objects.reverse();
						}

						p.storage.dataray.data = objects;
					}

					p('loaded');
				},


				'loaded':function(p)
				{
					this.respond('on_load');
				},


				'failed':function(p, message)
				{
					this.respond('on_error', [message]);
				},


				'load_list_data':function(p, next)
				{
					p.storage.loaded = false;
					p.storage.loading = true;

					pwf.wait_for('class', this.get('model'), function() {
						pwf.comm.get(p.object.get('url'), p.object.get_params(), function(err, response) {
							if (err) {
								p('failed', err);
							} else {
								p('use', response);
							}

							p.object.respond(next, [err, response]);
						});
					});

					return this;
				},


				'get_filter_data':function()
				{
					return this.get('filters');
				},


				'reset_url':function(p)
				{
					if (this.get('url') === null && this.get('model')) {
						this.set('url', pwf.config.get('models.url.browse').replace('{model}', this.get('model')));
					}
				}
			},


			'public':{
				'page':function(p, page, next)
				{
					return this.set('page', Math.max(Math.min(page, this.get_page_count()), 0)).load(next);
				},


				'step':function(p, step, next)
				{
					return this.page(this.get('page') + step, next);
				},


				'get_total':function(p)
				{
					return p.storage.dataray.total;
				},


				'get_page_count':function(p)
				{
					return Math.max(Math.ceil(this.get_total()/this.get('per_page')), 0);
				},


				'get_params':function(p)
				{
					var
						filters = p('get_filter_data'),
						sort = this.get('sort'),
						join = this.get('join'),
						params = {
							"page":this.get('page'),
							"per_page":this.get('per_page')
						};

					if (typeof sort != 'undefined' && sort !== null) {
						params.sort = sort;

						if (typeof params.sort != 'string') {
							params.sort = JSON.stringify(params.sort);
						}
					}

					if (typeof filters != 'undefined' && filters !== null) {
						params.filters = filters;

						if (typeof params.filters != 'string') {
							params.filters = JSON.stringify(params.filters);
						}
					}

					if (join !== null) {
						params.join = join;

						if (typeof params.join != 'string') {
							params.join = JSON.stringify(params.join);
						}
					}

					return params;
				},


				'load':function(p, next)
				{
					return p('load_list_data', next);
				},


				'sort':function(p, attr, mode, next)
				{
					var mode = typeof mode == 'undefined' ? 'asc':mode;

					this.set('sort', attr);
					this.set('sort_mode', mode);

					return this.load(next);
				},


				'reset':function(p)
				{
					p.storage.dataray = pwf.merge(p('def'));
					p.storage.loaded  = false;
					p.storage.loading = false;

					p('reset_url');
					return this;
				},


				'is_loaded':function()
				{
					return loaded;
				},


				'is_loading':function()
				{
					return loaded;
				},


				'get_data':function(p)
				{
					return p.storage.dataray;
				}
			}
		};

	/// Register, because we have existing pwf
	if (typeof pwf == 'object') {
		pwf.reg_class(mod_name, mod);
	}

	/// Export module because we may be inside nodejs.
	if (typeof module == 'object') {
		module.exports = mod;
	}
})();
