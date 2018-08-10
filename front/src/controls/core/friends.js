$$.registerControlEx('FriendsPanelControl', {

	deps: ['WebSocketService'],
	
	init: function(elt, options, client) {

		var ctrl = $$.viewController(elt, {
			template: {gulp_inject: './friends.html'},
			data: {
				friends: []
			},
			events: {
				onItemClicked: function() {
					var data = $(this).closest('.item').data('info')
					console.log('onItemClicked', data)
					elt.trigger('friendSelected', data)
				}
			}
		})

		client.register('masterFriends', true, onFriends)

		function onFriends(msg) {
			console.log('onFriends', msg.data)
			ctrl.setData({friends: msg.data})
		}

		this.getFriends = function() {
			return ctrl.model.friends
		}
	}
});
