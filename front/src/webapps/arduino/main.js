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
					console.log('action', action)
					var {deviceId, type} = $(this).closest('tr').data('item')
					const actionsDesc = typesDesc[type].actions
					const {args, label} = actionsDesc[action]
					//console.log('args', args)					
					console.log('deviceId', deviceId)
					if (args != undefined) {
						$$.showForm({
							fields: args,
							title: label
						}, function(data) {
							//console.log('data', data)
							client.emit('arduino.action.' + deviceId, {action, args: data})
						})
					}
					else {
						client.emit('arduino.action.' + deviceId, {action})
					}

				}
			}
		})

		let typesDesc = {}

		client.register('arduino.types', true, function(msg) {
			console.log('msg', msg)
			typesDesc = msg.data
		})

		client.register('arduino.status', true, function(msg) {
			//console.log('msg', msg)

			msg.data.forEach((device) => {
				const typeDesc = typesDesc[device.type]

				//console.log('typeDesc', typeDesc)
				const {properties} = device

				const props = []

				for(let propName in properties) {
					const value = properties[propName]
					//console.log('value', value)



					const label = typeDesc.properties[propName].label
					//console.log('label', label)

					props.push({value, label, propName})

				}

				device.properties = props

				const actions = []
				const actionsDesc = typeDesc.actions
				for(let cmd in actionsDesc) {
					const {label} = actionsDesc[cmd]
					actions.push({label, cmd})
				}

				device.actions = actions
			})

			//console.log('data', msg.data)
			ctrl.setData({devices: msg.data})
		})		
	}


})