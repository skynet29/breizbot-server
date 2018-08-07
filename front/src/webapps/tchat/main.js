$$.registerControlEx('MainControl', {
	deps: ['WebSocketService'],
	
	init: function(elt, options, client) {

		var ctrl = $$.viewController(elt, {
			template: {gulp_inject: './main.html'},
		})
	}
});
