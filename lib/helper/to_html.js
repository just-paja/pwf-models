(function()
{
	"use strict";

	var
		mod_name = 'model.helper.to_html',
		mod = {
			'parents':['model.helper.to_text', 'jq.struct'],

			'proto':{
				'create_struct':function()
				{
					this.get_el().html(this.to_text());
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
