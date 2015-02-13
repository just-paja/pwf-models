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
						text = item.get('name') + ' (#'+ item.get('id') + ')';
					} else {
						text = item.to_ident();
					}

					return text;
				},


				'to_html':function()
				{
					return this.to_text();
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
