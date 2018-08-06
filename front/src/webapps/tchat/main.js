$$.registerControlEx('MainControl', {
	deps: ['WebSocketService'],
	template: {gulp_inject: './main.html'},
	init: function(elt, options, client) {

		client.register('masterFriends', true, onFriends)

		function onFriends(msg) {
			console.log('onFriends', msg.data)
		}
	}
});
