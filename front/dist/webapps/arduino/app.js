$$.configReady(function(config) {
	$$.startApp('MainControl')
})
$$.registerControlEx('MainControl', {
	deps: ['WebSocketService'],

	init: function(elt, options, client) {

		var ctrl = $$.viewController(elt, {
			template: "<div class=\"scrollPanel\">\n    <table class=\"w3-table-all w3-centered\">\n        <thead>\n            <tr class=\"w3-green\">\n                <th>Alias</th>\n                <th>Type</th>\n                <th>Properties</th>\n                <th>Actions</th>\n            </tr>\n        </thead>\n        <tbody bn-each=\"dev of devices\" bn-event=\"click.action: onAction\">\n  			<tr bn-data=\"item: dev\">\n				<td bn-text=\"dev.alias\"></td>\n				<td bn-text=\"dev.type\"></td>\n				<td bn-each=\"prop of dev.properties\">\n					<div>\n						<span bn-text=\"prop.label\"></span>:\n						<span bn-text=\"prop.value\"></span>\n					</div>\n				</td>\n				<td bn-each=\"a of dev.actions\">\n					<button class=\"action w3-btn w3-blue w3-margin-right\" bn-data=\"action: a.cmd\" bn-text=\"a.label\"></button>\n				</td>\n			</tr>      	\n\n        </tbody>\n    </table>\n</div>",
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkJC5jb25maWdSZWFkeShmdW5jdGlvbihjb25maWcpIHtcblx0JCQuc3RhcnRBcHAoJ01haW5Db250cm9sJylcbn0pIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ01haW5Db250cm9sJywge1xuXHRkZXBzOiBbJ1dlYlNvY2tldFNlcnZpY2UnXSxcblxuXHRpbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGNsaWVudCkge1xuXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcblx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcInNjcm9sbFBhbmVsXFxcIj5cXG4gICAgPHRhYmxlIGNsYXNzPVxcXCJ3My10YWJsZS1hbGwgdzMtY2VudGVyZWRcXFwiPlxcbiAgICAgICAgPHRoZWFkPlxcbiAgICAgICAgICAgIDx0ciBjbGFzcz1cXFwidzMtZ3JlZW5cXFwiPlxcbiAgICAgICAgICAgICAgICA8dGg+QWxpYXM8L3RoPlxcbiAgICAgICAgICAgICAgICA8dGg+VHlwZTwvdGg+XFxuICAgICAgICAgICAgICAgIDx0aD5Qcm9wZXJ0aWVzPC90aD5cXG4gICAgICAgICAgICAgICAgPHRoPkFjdGlvbnM8L3RoPlxcbiAgICAgICAgICAgIDwvdHI+XFxuICAgICAgICA8L3RoZWFkPlxcbiAgICAgICAgPHRib2R5IGJuLWVhY2g9XFxcImRldiBvZiBkZXZpY2VzXFxcIiBibi1ldmVudD1cXFwiY2xpY2suYWN0aW9uOiBvbkFjdGlvblxcXCI+XFxuICBcdFx0XHQ8dHIgYm4tZGF0YT1cXFwiaXRlbTogZGV2XFxcIj5cXG5cdFx0XHRcdDx0ZCBibi10ZXh0PVxcXCJkZXYuYWxpYXNcXFwiPjwvdGQ+XFxuXHRcdFx0XHQ8dGQgYm4tdGV4dD1cXFwiZGV2LnR5cGVcXFwiPjwvdGQ+XFxuXHRcdFx0XHQ8dGQgYm4tZWFjaD1cXFwicHJvcCBvZiBkZXYucHJvcGVydGllc1xcXCI+XFxuXHRcdFx0XHRcdDxkaXY+XFxuXHRcdFx0XHRcdFx0PHNwYW4gYm4tdGV4dD1cXFwicHJvcC5sYWJlbFxcXCI+PC9zcGFuPjpcXG5cdFx0XHRcdFx0XHQ8c3BhbiBibi10ZXh0PVxcXCJwcm9wLnZhbHVlXFxcIj48L3NwYW4+XFxuXHRcdFx0XHRcdDwvZGl2Plxcblx0XHRcdFx0PC90ZD5cXG5cdFx0XHRcdDx0ZCBibi1lYWNoPVxcXCJhIG9mIGRldi5hY3Rpb25zXFxcIj5cXG5cdFx0XHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiYWN0aW9uIHczLWJ0biB3My1ibHVlIHczLW1hcmdpbi1yaWdodFxcXCIgYm4tZGF0YT1cXFwiYWN0aW9uOiBhLmNtZFxcXCIgYm4tdGV4dD1cXFwiYS5sYWJlbFxcXCI+PC9idXR0b24+XFxuXHRcdFx0XHQ8L3RkPlxcblx0XHRcdDwvdHI+ICAgICAgXHRcXG5cXG4gICAgICAgIDwvdGJvZHk+XFxuICAgIDwvdGFibGU+XFxuPC9kaXY+XCIsXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdGRldmljZXM6IFtdXG5cdFx0XHR9LFxuXHRcdFx0ZXZlbnRzOiB7XG5cdFx0XHRcdG9uQWN0aW9uOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR2YXIgYWN0aW9uID0gJCh0aGlzKS5kYXRhKCdhY3Rpb24nKVxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdhY3Rpb24nLCBhY3Rpb24pXG5cdFx0XHRcdFx0dmFyIHtkZXZpY2VJZCwgdHlwZX0gPSAkKHRoaXMpLmNsb3Nlc3QoJ3RyJykuZGF0YSgnaXRlbScpXG5cdFx0XHRcdFx0Y29uc3QgYWN0aW9uc0Rlc2MgPSB0eXBlc0Rlc2NbdHlwZV0uYWN0aW9uc1xuXHRcdFx0XHRcdGNvbnN0IHthcmdzLCBsYWJlbH0gPSBhY3Rpb25zRGVzY1thY3Rpb25dXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnYXJncycsIGFyZ3MpXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdkZXZpY2VJZCcsIGRldmljZUlkKVxuXHRcdFx0XHRcdGlmIChhcmdzICE9IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0JCQuc2hvd0Zvcm0oe1xuXHRcdFx0XHRcdFx0XHRmaWVsZHM6IGFyZ3MsXG5cdFx0XHRcdFx0XHRcdHRpdGxlOiBsYWJlbFxuXHRcdFx0XHRcdFx0fSwgZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdkYXRhJywgZGF0YSlcblx0XHRcdFx0XHRcdFx0Y2xpZW50LmVtaXQoJ2FyZHVpbm8uYWN0aW9uLicgKyBkZXZpY2VJZCwge2FjdGlvbiwgYXJnczogZGF0YX0pXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGNsaWVudC5lbWl0KCdhcmR1aW5vLmFjdGlvbi4nICsgZGV2aWNlSWQsIHthY3Rpb259KVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSlcblxuXHRcdGxldCB0eXBlc0Rlc2MgPSB7fVxuXG5cdFx0Y2xpZW50LnJlZ2lzdGVyKCdhcmR1aW5vLnR5cGVzJywgdHJ1ZSwgZnVuY3Rpb24obXNnKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnbXNnJywgbXNnKVxuXHRcdFx0dHlwZXNEZXNjID0gbXNnLmRhdGFcblx0XHR9KVxuXG5cdFx0Y2xpZW50LnJlZ2lzdGVyKCdhcmR1aW5vLnN0YXR1cycsIHRydWUsIGZ1bmN0aW9uKG1zZykge1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnbXNnJywgbXNnKVxuXG5cdFx0XHRtc2cuZGF0YS5mb3JFYWNoKChkZXZpY2UpID0+IHtcblx0XHRcdFx0Y29uc3QgdHlwZURlc2MgPSB0eXBlc0Rlc2NbZGV2aWNlLnR5cGVdXG5cblx0XHRcdFx0Ly9jb25zb2xlLmxvZygndHlwZURlc2MnLCB0eXBlRGVzYylcblx0XHRcdFx0Y29uc3Qge3Byb3BlcnRpZXN9ID0gZGV2aWNlXG5cblx0XHRcdFx0Y29uc3QgcHJvcHMgPSBbXVxuXG5cdFx0XHRcdGZvcihsZXQgcHJvcE5hbWUgaW4gcHJvcGVydGllcykge1xuXHRcdFx0XHRcdGNvbnN0IHZhbHVlID0gcHJvcGVydGllc1twcm9wTmFtZV1cblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCd2YWx1ZScsIHZhbHVlKVxuXG5cblxuXHRcdFx0XHRcdGNvbnN0IGxhYmVsID0gdHlwZURlc2MucHJvcGVydGllc1twcm9wTmFtZV0ubGFiZWxcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdsYWJlbCcsIGxhYmVsKVxuXG5cdFx0XHRcdFx0cHJvcHMucHVzaCh7dmFsdWUsIGxhYmVsLCBwcm9wTmFtZX0pXG5cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGRldmljZS5wcm9wZXJ0aWVzID0gcHJvcHNcblxuXHRcdFx0XHRjb25zdCBhY3Rpb25zID0gW11cblx0XHRcdFx0Y29uc3QgYWN0aW9uc0Rlc2MgPSB0eXBlRGVzYy5hY3Rpb25zXG5cdFx0XHRcdGZvcihsZXQgY21kIGluIGFjdGlvbnNEZXNjKSB7XG5cdFx0XHRcdFx0Y29uc3Qge2xhYmVsfSA9IGFjdGlvbnNEZXNjW2NtZF1cblx0XHRcdFx0XHRhY3Rpb25zLnB1c2goe2xhYmVsLCBjbWR9KVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZGV2aWNlLmFjdGlvbnMgPSBhY3Rpb25zXG5cdFx0XHR9KVxuXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdkYXRhJywgbXNnLmRhdGEpXG5cdFx0XHRjdHJsLnNldERhdGEoe2RldmljZXM6IG1zZy5kYXRhfSlcblx0XHR9KVx0XHRcblx0fVxuXG5cbn0pIl19
