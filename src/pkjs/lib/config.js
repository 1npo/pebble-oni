var FIPS = require('./fips');

var states = Object.keys(FIPS).sort();

module.exports = [
	{ type: 'heading', defaultValue: 'Weather' },
	{
		type: 'section',
		items: [
			{ type: 'input', messageKey: 'City', label: 'City',
			  attributes: { placeholder: 'Denver' } },
			{ type: 'select', messageKey: 'State', label: 'State',
			  defaultValue: 'CO',
			  options: states.map(function (s) { return { label: s, value: s }; }) },
			{ type: 'radiogroup', messageKey: 'Units', label: 'Units',
			  defaultValue: 'us',
			  options: [
				{ label: 'Imperial (°F, mph)', value: 'us' },
				{ label: 'Metric (°C, km/h)', value: 'si' }
			  ] }
		]
	},
	{ type: 'submit', defaultValue: 'Save' }
];
