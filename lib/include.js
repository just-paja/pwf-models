if (!pwf.get_status('module', 'config')) {
	require('pwf-config');
}

if (!pwf.get_status('module', 'comm')) {
	require('pwf-comm');
}

if (!pwf.get_status('module', 'moment')) {
	require('pwf-moment-compat');
}

module.exports = {
	"model":require('./model'),
	"list":require('./list')
};
