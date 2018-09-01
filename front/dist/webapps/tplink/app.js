$$.configReady(function(config) {
	$$.startApp('MainControl')
})
$$.registerControlEx('MainControl', {
	deps: ['WebSocketService'],

	init: function(elt, options, client) {

		var ctrl = $$.viewController(elt, {
			template: "\n\n<div class=\"scrollPanel\">\n    <table class=\"w3-table-all w3-centered\">\n        <thead>\n            <tr class=\"w3-green\">\n                <th>Alias</th>\n                <th>Type</th>\n                <th>State</th>\n                <th>Actions</th>\n            </tr>\n        </thead>\n        <tbody bn-each=\"dev of devices\" bn-event=\"click.action: onAction\">\n  			<tr bn-data=\"item: dev\">\n				<td bn-text=\"dev.alias\"></td>\n				<td bn-text=\"dev.type\"></td>\n				<td bn-text=\"dev.state\"></td>\n				<td bn-each=\"a of dev.actions\">\n					<button class=\"action w3-btn w3-blue w3-margin-right\" bn-data=\"action: a.cmd\" bn-text=\"a.label\"></button>\n				</td>\n			</tr>      	\n\n        </tbody>\n    </table>\n</div>\n\n",
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkJC5jb25maWdSZWFkeShmdW5jdGlvbihjb25maWcpIHtcblx0JCQuc3RhcnRBcHAoJ01haW5Db250cm9sJylcbn0pIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ01haW5Db250cm9sJywge1xuXHRkZXBzOiBbJ1dlYlNvY2tldFNlcnZpY2UnXSxcblxuXHRpbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGNsaWVudCkge1xuXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcblx0XHRcdHRlbXBsYXRlOiBcIlxcblxcbjxkaXYgY2xhc3M9XFxcInNjcm9sbFBhbmVsXFxcIj5cXG4gICAgPHRhYmxlIGNsYXNzPVxcXCJ3My10YWJsZS1hbGwgdzMtY2VudGVyZWRcXFwiPlxcbiAgICAgICAgPHRoZWFkPlxcbiAgICAgICAgICAgIDx0ciBjbGFzcz1cXFwidzMtZ3JlZW5cXFwiPlxcbiAgICAgICAgICAgICAgICA8dGg+QWxpYXM8L3RoPlxcbiAgICAgICAgICAgICAgICA8dGg+VHlwZTwvdGg+XFxuICAgICAgICAgICAgICAgIDx0aD5TdGF0ZTwvdGg+XFxuICAgICAgICAgICAgICAgIDx0aD5BY3Rpb25zPC90aD5cXG4gICAgICAgICAgICA8L3RyPlxcbiAgICAgICAgPC90aGVhZD5cXG4gICAgICAgIDx0Ym9keSBibi1lYWNoPVxcXCJkZXYgb2YgZGV2aWNlc1xcXCIgYm4tZXZlbnQ9XFxcImNsaWNrLmFjdGlvbjogb25BY3Rpb25cXFwiPlxcbiAgXHRcdFx0PHRyIGJuLWRhdGE9XFxcIml0ZW06IGRldlxcXCI+XFxuXHRcdFx0XHQ8dGQgYm4tdGV4dD1cXFwiZGV2LmFsaWFzXFxcIj48L3RkPlxcblx0XHRcdFx0PHRkIGJuLXRleHQ9XFxcImRldi50eXBlXFxcIj48L3RkPlxcblx0XHRcdFx0PHRkIGJuLXRleHQ9XFxcImRldi5zdGF0ZVxcXCI+PC90ZD5cXG5cdFx0XHRcdDx0ZCBibi1lYWNoPVxcXCJhIG9mIGRldi5hY3Rpb25zXFxcIj5cXG5cdFx0XHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiYWN0aW9uIHczLWJ0biB3My1ibHVlIHczLW1hcmdpbi1yaWdodFxcXCIgYm4tZGF0YT1cXFwiYWN0aW9uOiBhLmNtZFxcXCIgYm4tdGV4dD1cXFwiYS5sYWJlbFxcXCI+PC9idXR0b24+XFxuXHRcdFx0XHQ8L3RkPlxcblx0XHRcdDwvdHI+ICAgICAgXHRcXG5cXG4gICAgICAgIDwvdGJvZHk+XFxuICAgIDwvdGFibGU+XFxuPC9kaXY+XFxuXFxuXCIsXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdGRldmljZXM6IFtdXG5cdFx0XHR9LFxuXHRcdFx0ZXZlbnRzOiB7XG5cdFx0XHRcdG9uQWN0aW9uOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR2YXIgYWN0aW9uID0gJCh0aGlzKS5kYXRhKCdhY3Rpb24nKVxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ2FjdGlvbicsIGFjdGlvbilcblx0XHRcdFx0XHR2YXIgZGV2aWNlSWQgPSAkKHRoaXMpLmNsb3Nlc3QoJ3RyJykuZGF0YSgnaXRlbScpLmRldmljZUlkXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZGV2aWNlSWQnLCBkZXZpY2VJZClcblx0XHRcdFx0XHRjbGllbnQuZW1pdCgndHBsaW5rLmFjdGlvbi4nICsgZGV2aWNlSWQsIHthY3Rpb259KVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSlcblx0XHRjbGllbnQucmVnaXN0ZXIoJ3RwbGluay5zdGF0dXMnLCB0cnVlLCAobXNnKSA9PiB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKCdtc2cnLCBtc2cpXG5cdFx0XHR2YXIgZGV2aWNlcyA9IG1zZy5kYXRhIHx8IFtdXG5cblx0XHRcdGNvbnNvbGUubG9nKCdkZXZpY2VzJywgZGV2aWNlcylcblx0XHRcdGN0cmwuc2V0RGF0YSh7ZGV2aWNlc30pXG5cdFx0fSlcblx0fVxufSkiXX0=
