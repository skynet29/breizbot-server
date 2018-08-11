$$.registerControlEx('MainControl', {
	deps: ['WebSocketService'],

	init: function(elt, options, client) {

		var ctrl = $$.viewController(elt, {
			template: {gulp_inject: './main.html'},
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