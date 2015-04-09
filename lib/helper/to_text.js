(function()
{
	"use strict";

	var
		mod_name = 'model.helper.to_text',
		mod = {
			'parents':['container'],

			'public':{
				'to_text':function()
				{
					var
						item = this.get('item'),
						text = '';

					if (item.has_attr('name')) {
						var
							name = item.get('name'),
							id   = item.get('id');

						if (!name) {
							name = item.meta.cname;
						}

						if (id) {
							id = '#' + id;
						} else {
							id = 'new';
						}

						text = name + ' ('+ id + ')';
					} else {
						text = item.to_ident();
					}

					return text;
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
