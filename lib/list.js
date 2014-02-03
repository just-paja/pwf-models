/**
 * Dynamic data model abstraction. Handles predefined data formats and data
 * types. Also caches data on client-side for simpler updates and lower memory
 * consumption.
 */
(function()
{
	var
		mod_name = 'list',
		mod_inst = true,
		mod = function()
		{
			var
				self = function(arg_opts)
				{
					var
						loaded = false,
						loading = false,
						opts = {
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
						dataray = {
							"page":0,
							"per_page":0,
							"total":0,
							"data":{}
						};


					this.get = function(name)
					{
						return opts[name];
					};


					this.update = function(arg_opts)
					{
						opts = pwf.jquery.extend(opts, arg_opts);
						return this;
					};


					this.page = function(page, next)
					{
						var page = Math.max(Math.min(page, this.get_page_count()), 1);
						opts.page = page;
						return this.load(next);
					};


					this.step = function(step, next)
					{
						return this.page(opts.page + step, next);
					};


					this.get_page_count = function()
					{
						return Math.max(Math.ceil(dataray.total/opts.per_page), 0);
					};


					this.get_params = function()
					{
						var
							filters = this.get('filters'),
							sort = this.get('sort');

						if (typeof filters != 'string') {
							filters = JSON.stringify(filters);
						}

						if (typeof sort != 'string') {
							sort = JSON.stringify(sort);
						}

						return {
							"sort":sort,
							"filters":filters,
							"page":this.get('page'),
							"per_page":this.get('per_page'),
						};
					};


					this.load = function(next)
					{
						opts.loaded = false;

						pwf.comm.get(opts.url, this.get_params(), function(obj, next) {
							return {
								'success':function(response) {
										if (typeof response.success !== 'undefined' && !response.success) {
											if (typeof obj.get('on_error') == 'function') {
												obj.get('on_error')(obj, response, 'failed-to-load-list');
											} else throw new Error('Failed to load list and no error handler was given.');
										} else {
											obj.use(response);
										}

										if (typeof next == 'function') {
											next(obj);
										}
									},
								'error':function(response, message) {
									if (typeof obj.get('on_error') == 'function') {
										obj.get('on_error')(obj, response, message);
									} else throw new Error('Failed to load list and no error handler was given.');
								}
							};
						}(this, next));

						return this;
					};


					this.sort = function(attr, mode, next)
					{
						var mode = typeof mode == 'undefined' ? 'asc':mode;

						opts.sort = attr;
						opts.sort_mode = mode;

						this.load(next);
					};


					this.use = function(response)
					{
						var objects = [];
						dataray = response;

						if (typeof response.data == 'object') {
							for (var i = 0; i < response.data.length; i++) {
								objects.push(pwf.model.create(opts.model, response.data[i]));
							}
						}

						dataray.data = objects;

						if (typeof opts.on_load == 'function') {
							opts.on_load(this);
						}
					};


					this.list = function()
					{
						return dataray;
					};


					this.update(arg_opts);
				};


			this.create = function(opts)
			{
				return new self(opts);
			};


			this.is_ready = function()
			{
				return pwf.mi(['jquery', 'comm']);
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
