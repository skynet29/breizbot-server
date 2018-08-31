$$.registerControlEx('MainControl', {
	deps: ['WebSocketService'],

	init: function(elt, options, client) {

		var ctrl = $$.viewController(elt, {
			template: {gulp_inject: './main.html'},
			data: {
				devices: []
			},
			events: {
				onAction: function() {
					var action = $(this).data('action')
					//console.log('action', action)
					var deviceId = $(this).closest('tr').data('item').deviceId
					//console.log('deviceId', deviceId)
					client.emit('tplink.action.' + deviceId, {action})
				}
			}
		})
		client.register('tplink.status', true, (msg) => {
			//console.log('msg', msg)
			var devices = msg.data || []

			console.log('devices', devices)
			ctrl.setData({devices})
		})
	}
})