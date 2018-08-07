$$.registerControlEx('FriendsPanelControl', {

	deps: ['WebSocketService'],
	
	init: function(elt, options, client) {

		var ctrl = $$.viewController(elt, {
			template: {gulp_inject: './friends.html'},
			data: {
				friends: []
			}
		})

		client.register('masterFriends', true, onFriends)

		function onFriends(msg) {
			console.log('onFriends', msg.data)
			ctrl.setData({friends: msg.data})
		}
	}
});
