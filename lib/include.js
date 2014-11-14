if (!pwf.get_module_status('config')) {
	require('pwf-config');
}

if (!pwf.get_module_status('comm')) {
	require('pwf-comm');
}

if (!pwf.get_module_status('moment')) {
	require('pwf-moment-compat');
}

module.exports = {
	"model":require('./model'),
	"list":require('./list')
};
