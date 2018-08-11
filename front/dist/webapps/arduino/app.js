$$.configReady(function(config) {
	$$.startApp('MainControl')
})
$$.registerControlEx('MainControl', {
	deps: ['WebSocketService'],

	init: function(elt, options, client) {

		var ctrl = $$.viewController(elt, {
			template: "<div>\n	<h1>Arduino</h1>\n\n	<button class=\"w3-button w3-blue\" bn-event=\"click: onOn\">ON</button>\n	<button class=\"w3-button w3-blue\" bn-event=\"click: onOff\">OFF</button>\n\n</div>",
			events: {
				onOn: function() {
					client.emit('ledOn')
				},
				onOff: function() {
					client.emit('ledOff')
				}
			}
		})
	}
})
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uKGNvbmZpZykge1xuXHQkJC5zdGFydEFwcCgnTWFpbkNvbnRyb2wnKVxufSkiLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnTWFpbkNvbnRyb2wnLCB7XG5cdGRlcHM6IFsnV2ViU29ja2V0U2VydmljZSddLFxuXG5cdGluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgY2xpZW50KSB7XG5cblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdj5cXG5cdDxoMT5BcmR1aW5vPC9oMT5cXG5cXG5cdDxidXR0b24gY2xhc3M9XFxcInczLWJ1dHRvbiB3My1ibHVlXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uT25cXFwiPk9OPC9idXR0b24+XFxuXHQ8YnV0dG9uIGNsYXNzPVxcXCJ3My1idXR0b24gdzMtYmx1ZVxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvbk9mZlxcXCI+T0ZGPC9idXR0b24+XFxuXFxuPC9kaXY+XCIsXG5cdFx0XHRldmVudHM6IHtcblx0XHRcdFx0b25PbjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0Y2xpZW50LmVtaXQoJ2xlZE9uJylcblx0XHRcdFx0fSxcblx0XHRcdFx0b25PZmY6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGNsaWVudC5lbWl0KCdsZWRPZmYnKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSlcblx0fVxufSkiXX0=
