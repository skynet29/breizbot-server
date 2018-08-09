$$.configReady(function() {

	$$.startApp('MainControl')
}) 
$$.registerControlEx('MainControl', {
	deps: ['WebSocketService'], 

	init: function(elt, options, client) {

		var curAction = 0

	 	const gamepadMap = {
	 		axes: {
	 			'0': {
	 				left: {max: -0.6},
	 				right: {min: 0.6}
	 			},
	 			'1': {
	 				back: {min: 0.5},
	 				front: {max: -0.5}
	 			}
	 		},
	 		buttons: {
	 			'4': 'clockwise',
	 			'3': 'counterClockwise',
	 			'5': 'up',
	 			'6': 'down',
	 			'1': 'land',
	 			'0': 'photo'
	 		}

	 	}

	 	const actionMasks = {
	 		'left': 1,
	 		'right': 2,
	 		'back': 4,
	 		'front': 8,
	 		'clockwise': 16,
	 		'counterClockwise': 32,
	 		'up': 64,
	 		'down': 128,
	 		'land': 256


	 	}



		const ctrl = $$.viewController(elt, {
			template: "<div>\n	<div class=\"panel1\">\n		\n		<div bn-control=\"ToolbarControl\" bn-event=\"click.cmd: onCmd\">\n			<button class=\"cmd\" data-cmd=\"takeoff\">Take Off</button>\n			<button class=\"cmd\" data-cmd=\"land\" bn-show=\"!gamepadDetected\">Land</button>		\n			<button class=\"cmd\" data-cmd=\"disableEmergency\">Recover</button>\n		</div>\n\n\n\n		<div>\n			<div>\n				Battery: <span bn-text=\"battery\"></span>%\n			</div>\n				\n			<div>\n				Control State: <span bn-text=\"controlState\"></span>\n			</div>\n				\n			<div>\n				Fly State: <span bn-text=\"flyState\"></span>\n			</div>			\n			<div>\n				Action: <span bn-text=\"curAction\"></span>\n			</div>	\n			<div>\n				Wait Landing: <span bn-text=\"waitLanding\"></span>\n			</div>	\n		</div>\n\n		<div bn-each=\"v of axes\" bn-show=\"gamepadDetected\">\n			<div>\n				Axe : <span bn-text=\"v\"></span>\n			</div>\n				\n		</div>\n	</div>\n\n		<div bn-control=\"ToolbarControl\" bn-event=\"mousedown.cmd: onSpeedCmd, mouseup.cmd: onStop\" bn-show=\"!gamepadDetected\">\n			<button class=\"cmd\" data-cmd=\"front\">Front</button>\n			<button class=\"cmd\" data-cmd=\"back\">Back</button>\n			<button class=\"cmd\" data-cmd=\"left\">Left</button>\n			<button class=\"cmd\" data-cmd=\"right\">Right</button>\n			<button class=\"cmd\" data-cmd=\"up\">Up</button>\n			<button class=\"cmd\" data-cmd=\"down\">Down</button>\n			<button class=\"cmd\" data-cmd=\"clockwise\">Clockwise</button>\n			<button class=\"cmd\" data-cmd=\"counterClockwise\">Counter Clockwise</button>\n			\n		</div>\n\n	<div class=\"panel2\">\n			\n			<div bn-control=\"FlightPanelControl\" bn-data=\"roll: roll, pitch: pitch, altitude: altitude\"></div>	\n\n			<img bn-attr=\"src: imgUrl\">\n			<div bn-bind=\"dronestream\"></div>\n	\n			\n			\n	</div>\n\n</div>",
			data: {
				roll: 0,
				pitch: 0,
				altitude: 0,
				battery: 0,
				controlState: 'Unknown',
				flyState: 'Unknown',
				axes: [],
				gamepadDetected: false,
				curAction,
				imgUrl: '',
				waitLanding: false
			},
			events: {
				onCmd: function() {
					//client.emit('parrotCmd', {cmd: 'takeOff'})
					const cmd = $(this).data('cmd')
					console.log('cmd', cmd)
					client.emit('parrotCmd', {cmd})
				},
				onSpeedCmd: function() {
					//client.emit('parrotCmd', {cmd: 'takeOff'})
					const cmd = $(this).data('cmd')
					console.log('cmd', cmd)
					setAction(actionMasks[cmd])

				},
				onStop: function() {
					setAction(0)
				}
				
			}
		})

		var videoStream = new NodecopterStream(
			ctrl.scope.dronestream.get(0),
			{port: 3001}
			)

		var waitLanding = false


		function setAction(action) {
			console.log('setAction', action)
			curAction = action



			var cmds = {}
			for(var k in actionMasks) {
				if (action & actionMasks[k]) {
					cmds[k] = 0.3
				}
			}
			console.log('cmds', cmds)
			ctrl.setData({curAction: Object.keys(cmds).toString()})

			if (ctrl.model.waitLanding) {
				return
			}

			if (action == 0) {
				client.emit('parrotCmd', {cmd: 'stop'})
			}

			else if (cmds.land) {
				client.emit('parrotCmd', {cmd: 'land'})
				ctrl.setData({waitLanding: true})
			}
			else if (Object.keys(cmds).length > 0) {
				client.emit('parrotCmd', {cmd: 'move', move: cmds})
			}


			
		}



		client.register('parrotNavData', false, function(msg) {
			//console.log('parrotNavData', msg.data)
			const data = msg.data

			if (data.demo) {
				//console.log('demo', data.demo)
				const demo = data.demo
				ctrl.setData({
					altitude: demo.altitudeMeters,
					battery: demo.batteryPercentage,
					roll: -demo.rotation.roll,
					pitch: demo.rotation.pitch,
					controlState: demo.controlState,
					flyState: demo.flyState

				})
				if (ctrl.model.waitLanding) {
					if (ctrl.model.controlState == 'CTRL_LANDED') {
		
						ctrl.setData({waitLanding: false})
					}
				}		


			}
		})




		function checkGamePadStatus() {
			//console.log('checkGamePadStatus')
			var gamepad = navigator.getGamepads()[0]
			if (gamepad) {
				//console.log('gamepad', gamepad)
				var action = 0
					
				const buttons = gamepad.buttons
				for(var i = 0; i < buttons.length; i++) {
					var val = buttons[i].pressed
					if (val === true) {
						var entry = gamepadMap.buttons[i]
						if (typeof entry == 'string') {
							action |= actionMasks[entry]
						}					
					}

				}

				const axes = gamepad.axes
				ctrl.setData({
					axes: fixAxes(axes)
				})
				for(var i = 0; i < axes.length; i++) {
					var val = axes[i]
					var entry = gamepadMap.axes[i]
					if (entry) {
						for(var k in entry) {
							var desc = entry[k]
							if (typeof desc.min == "number") {
								if (val > desc.min) {
									action |= actionMasks[k]
								}
							}
							if (typeof desc.max == "number") {
								if (val < desc.max) {
									action |= actionMasks[k]
								}
							}
						}
					}
				}				
				
				
				if (action != curAction) {
					setAction(action)			
				}

				requestAnimationFrame(checkGamePadStatus)			
			}

			
		}

		function fixAxes(axes) {
			return axes.map((v) => v.toFixed(2))
		}

		window.addEventListener("gamepadconnected", function(e) {
			console.log("Contrôleur n°%d connecté : %s. %d boutons, %d axes.",
	  			e.gamepad.index, e.gamepad.id,
	  			e.gamepad.buttons.length, e.gamepad.axes.length);


			const axes = e.gamepad.axes
			ctrl.setData({gamepadDetected: true, axes: fixAxes(axes)})	
		

			requestAnimationFrame(checkGamePadStatus)

		});
		window.addEventListener("gamepaddisconnected", function(e) {
			console.log('gamepaddisconnected')
			ctrl.setData({gamepadDetected: false})	
		});

	}

}) 
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkJC5jb25maWdSZWFkeShmdW5jdGlvbigpIHtcblxuXHQkJC5zdGFydEFwcCgnTWFpbkNvbnRyb2wnKVxufSkgIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ01haW5Db250cm9sJywge1xuXHRkZXBzOiBbJ1dlYlNvY2tldFNlcnZpY2UnXSwgXG5cblx0aW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBjbGllbnQpIHtcblxuXHRcdHZhciBjdXJBY3Rpb24gPSAwXG5cblx0IFx0Y29uc3QgZ2FtZXBhZE1hcCA9IHtcblx0IFx0XHRheGVzOiB7XG5cdCBcdFx0XHQnMCc6IHtcblx0IFx0XHRcdFx0bGVmdDoge21heDogLTAuNn0sXG5cdCBcdFx0XHRcdHJpZ2h0OiB7bWluOiAwLjZ9XG5cdCBcdFx0XHR9LFxuXHQgXHRcdFx0JzEnOiB7XG5cdCBcdFx0XHRcdGJhY2s6IHttaW46IDAuNX0sXG5cdCBcdFx0XHRcdGZyb250OiB7bWF4OiAtMC41fVxuXHQgXHRcdFx0fVxuXHQgXHRcdH0sXG5cdCBcdFx0YnV0dG9uczoge1xuXHQgXHRcdFx0JzQnOiAnY2xvY2t3aXNlJyxcblx0IFx0XHRcdCczJzogJ2NvdW50ZXJDbG9ja3dpc2UnLFxuXHQgXHRcdFx0JzUnOiAndXAnLFxuXHQgXHRcdFx0JzYnOiAnZG93bicsXG5cdCBcdFx0XHQnMSc6ICdsYW5kJyxcblx0IFx0XHRcdCcwJzogJ3Bob3RvJ1xuXHQgXHRcdH1cblxuXHQgXHR9XG5cblx0IFx0Y29uc3QgYWN0aW9uTWFza3MgPSB7XG5cdCBcdFx0J2xlZnQnOiAxLFxuXHQgXHRcdCdyaWdodCc6IDIsXG5cdCBcdFx0J2JhY2snOiA0LFxuXHQgXHRcdCdmcm9udCc6IDgsXG5cdCBcdFx0J2Nsb2Nrd2lzZSc6IDE2LFxuXHQgXHRcdCdjb3VudGVyQ2xvY2t3aXNlJzogMzIsXG5cdCBcdFx0J3VwJzogNjQsXG5cdCBcdFx0J2Rvd24nOiAxMjgsXG5cdCBcdFx0J2xhbmQnOiAyNTZcblxuXG5cdCBcdH1cblxuXG5cblx0XHRjb25zdCBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2Plxcblx0PGRpdiBjbGFzcz1cXFwicGFuZWwxXFxcIj5cXG5cdFx0XFxuXHRcdDxkaXYgYm4tY29udHJvbD1cXFwiVG9vbGJhckNvbnRyb2xcXFwiIGJuLWV2ZW50PVxcXCJjbGljay5jbWQ6IG9uQ21kXFxcIj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJ0YWtlb2ZmXFxcIj5UYWtlIE9mZjwvYnV0dG9uPlxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImxhbmRcXFwiIGJuLXNob3c9XFxcIiFnYW1lcGFkRGV0ZWN0ZWRcXFwiPkxhbmQ8L2J1dHRvbj5cdFx0XFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwiZGlzYWJsZUVtZXJnZW5jeVxcXCI+UmVjb3ZlcjwvYnV0dG9uPlxcblx0XHQ8L2Rpdj5cXG5cXG5cXG5cXG5cdFx0PGRpdj5cXG5cdFx0XHQ8ZGl2Plxcblx0XHRcdFx0QmF0dGVyeTogPHNwYW4gYm4tdGV4dD1cXFwiYmF0dGVyeVxcXCI+PC9zcGFuPiVcXG5cdFx0XHQ8L2Rpdj5cXG5cdFx0XHRcdFxcblx0XHRcdDxkaXY+XFxuXHRcdFx0XHRDb250cm9sIFN0YXRlOiA8c3BhbiBibi10ZXh0PVxcXCJjb250cm9sU3RhdGVcXFwiPjwvc3Bhbj5cXG5cdFx0XHQ8L2Rpdj5cXG5cdFx0XHRcdFxcblx0XHRcdDxkaXY+XFxuXHRcdFx0XHRGbHkgU3RhdGU6IDxzcGFuIGJuLXRleHQ9XFxcImZseVN0YXRlXFxcIj48L3NwYW4+XFxuXHRcdFx0PC9kaXY+XHRcdFx0XFxuXHRcdFx0PGRpdj5cXG5cdFx0XHRcdEFjdGlvbjogPHNwYW4gYm4tdGV4dD1cXFwiY3VyQWN0aW9uXFxcIj48L3NwYW4+XFxuXHRcdFx0PC9kaXY+XHRcXG5cdFx0XHQ8ZGl2Plxcblx0XHRcdFx0V2FpdCBMYW5kaW5nOiA8c3BhbiBibi10ZXh0PVxcXCJ3YWl0TGFuZGluZ1xcXCI+PC9zcGFuPlxcblx0XHRcdDwvZGl2Plx0XFxuXHRcdDwvZGl2Plxcblxcblx0XHQ8ZGl2IGJuLWVhY2g9XFxcInYgb2YgYXhlc1xcXCIgYm4tc2hvdz1cXFwiZ2FtZXBhZERldGVjdGVkXFxcIj5cXG5cdFx0XHQ8ZGl2Plxcblx0XHRcdFx0QXhlIDogPHNwYW4gYm4tdGV4dD1cXFwidlxcXCI+PC9zcGFuPlxcblx0XHRcdDwvZGl2Plxcblx0XHRcdFx0XFxuXHRcdDwvZGl2Plxcblx0PC9kaXY+XFxuXFxuXHRcdDxkaXYgYm4tY29udHJvbD1cXFwiVG9vbGJhckNvbnRyb2xcXFwiIGJuLWV2ZW50PVxcXCJtb3VzZWRvd24uY21kOiBvblNwZWVkQ21kLCBtb3VzZXVwLmNtZDogb25TdG9wXFxcIiBibi1zaG93PVxcXCIhZ2FtZXBhZERldGVjdGVkXFxcIj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJmcm9udFxcXCI+RnJvbnQ8L2J1dHRvbj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJiYWNrXFxcIj5CYWNrPC9idXR0b24+XFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiY21kXFxcIiBkYXRhLWNtZD1cXFwibGVmdFxcXCI+TGVmdDwvYnV0dG9uPlxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcInJpZ2h0XFxcIj5SaWdodDwvYnV0dG9uPlxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcInVwXFxcIj5VcDwvYnV0dG9uPlxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImRvd25cXFwiPkRvd248L2J1dHRvbj5cXG5cdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJjbWRcXFwiIGRhdGEtY21kPVxcXCJjbG9ja3dpc2VcXFwiPkNsb2Nrd2lzZTwvYnV0dG9uPlxcblx0XHRcdDxidXR0b24gY2xhc3M9XFxcImNtZFxcXCIgZGF0YS1jbWQ9XFxcImNvdW50ZXJDbG9ja3dpc2VcXFwiPkNvdW50ZXIgQ2xvY2t3aXNlPC9idXR0b24+XFxuXHRcdFx0XFxuXHRcdDwvZGl2Plxcblxcblx0PGRpdiBjbGFzcz1cXFwicGFuZWwyXFxcIj5cXG5cdFx0XHRcXG5cdFx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIkZsaWdodFBhbmVsQ29udHJvbFxcXCIgYm4tZGF0YT1cXFwicm9sbDogcm9sbCwgcGl0Y2g6IHBpdGNoLCBhbHRpdHVkZTogYWx0aXR1ZGVcXFwiPjwvZGl2Plx0XFxuXFxuXHRcdFx0PGltZyBibi1hdHRyPVxcXCJzcmM6IGltZ1VybFxcXCI+XFxuXHRcdFx0PGRpdiBibi1iaW5kPVxcXCJkcm9uZXN0cmVhbVxcXCI+PC9kaXY+XFxuXHRcXG5cdFx0XHRcXG5cdFx0XHRcXG5cdDwvZGl2PlxcblxcbjwvZGl2PlwiLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRyb2xsOiAwLFxuXHRcdFx0XHRwaXRjaDogMCxcblx0XHRcdFx0YWx0aXR1ZGU6IDAsXG5cdFx0XHRcdGJhdHRlcnk6IDAsXG5cdFx0XHRcdGNvbnRyb2xTdGF0ZTogJ1Vua25vd24nLFxuXHRcdFx0XHRmbHlTdGF0ZTogJ1Vua25vd24nLFxuXHRcdFx0XHRheGVzOiBbXSxcblx0XHRcdFx0Z2FtZXBhZERldGVjdGVkOiBmYWxzZSxcblx0XHRcdFx0Y3VyQWN0aW9uLFxuXHRcdFx0XHRpbWdVcmw6ICcnLFxuXHRcdFx0XHR3YWl0TGFuZGluZzogZmFsc2Vcblx0XHRcdH0sXG5cdFx0XHRldmVudHM6IHtcblx0XHRcdFx0b25DbWQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdC8vY2xpZW50LmVtaXQoJ3BhcnJvdENtZCcsIHtjbWQ6ICd0YWtlT2ZmJ30pXG5cdFx0XHRcdFx0Y29uc3QgY21kID0gJCh0aGlzKS5kYXRhKCdjbWQnKVxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdjbWQnLCBjbWQpXG5cdFx0XHRcdFx0Y2xpZW50LmVtaXQoJ3BhcnJvdENtZCcsIHtjbWR9KVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvblNwZWVkQ21kOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQvL2NsaWVudC5lbWl0KCdwYXJyb3RDbWQnLCB7Y21kOiAndGFrZU9mZid9KVxuXHRcdFx0XHRcdGNvbnN0IGNtZCA9ICQodGhpcykuZGF0YSgnY21kJylcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnY21kJywgY21kKVxuXHRcdFx0XHRcdHNldEFjdGlvbihhY3Rpb25NYXNrc1tjbWRdKVxuXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uU3RvcDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0c2V0QWN0aW9uKDApXG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHR9XG5cdFx0fSlcblxuXHRcdHZhciB2aWRlb1N0cmVhbSA9IG5ldyBOb2RlY29wdGVyU3RyZWFtKFxuXHRcdFx0Y3RybC5zY29wZS5kcm9uZXN0cmVhbS5nZXQoMCksXG5cdFx0XHR7cG9ydDogMzAwMX1cblx0XHRcdClcblxuXHRcdHZhciB3YWl0TGFuZGluZyA9IGZhbHNlXG5cblxuXHRcdGZ1bmN0aW9uIHNldEFjdGlvbihhY3Rpb24pIHtcblx0XHRcdGNvbnNvbGUubG9nKCdzZXRBY3Rpb24nLCBhY3Rpb24pXG5cdFx0XHRjdXJBY3Rpb24gPSBhY3Rpb25cblxuXG5cblx0XHRcdHZhciBjbWRzID0ge31cblx0XHRcdGZvcih2YXIgayBpbiBhY3Rpb25NYXNrcykge1xuXHRcdFx0XHRpZiAoYWN0aW9uICYgYWN0aW9uTWFza3Nba10pIHtcblx0XHRcdFx0XHRjbWRzW2tdID0gMC4zXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGNvbnNvbGUubG9nKCdjbWRzJywgY21kcylcblx0XHRcdGN0cmwuc2V0RGF0YSh7Y3VyQWN0aW9uOiBPYmplY3Qua2V5cyhjbWRzKS50b1N0cmluZygpfSlcblxuXHRcdFx0aWYgKGN0cmwubW9kZWwud2FpdExhbmRpbmcpIHtcblx0XHRcdFx0cmV0dXJuXG5cdFx0XHR9XG5cblx0XHRcdGlmIChhY3Rpb24gPT0gMCkge1xuXHRcdFx0XHRjbGllbnQuZW1pdCgncGFycm90Q21kJywge2NtZDogJ3N0b3AnfSlcblx0XHRcdH1cblxuXHRcdFx0ZWxzZSBpZiAoY21kcy5sYW5kKSB7XG5cdFx0XHRcdGNsaWVudC5lbWl0KCdwYXJyb3RDbWQnLCB7Y21kOiAnbGFuZCd9KVxuXHRcdFx0XHRjdHJsLnNldERhdGEoe3dhaXRMYW5kaW5nOiB0cnVlfSlcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKE9iamVjdC5rZXlzKGNtZHMpLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0Y2xpZW50LmVtaXQoJ3BhcnJvdENtZCcsIHtjbWQ6ICdtb3ZlJywgbW92ZTogY21kc30pXG5cdFx0XHR9XG5cblxuXHRcdFx0XG5cdFx0fVxuXG5cblxuXHRcdGNsaWVudC5yZWdpc3RlcigncGFycm90TmF2RGF0YScsIGZhbHNlLCBmdW5jdGlvbihtc2cpIHtcblx0XHRcdC8vY29uc29sZS5sb2coJ3BhcnJvdE5hdkRhdGEnLCBtc2cuZGF0YSlcblx0XHRcdGNvbnN0IGRhdGEgPSBtc2cuZGF0YVxuXG5cdFx0XHRpZiAoZGF0YS5kZW1vKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2RlbW8nLCBkYXRhLmRlbW8pXG5cdFx0XHRcdGNvbnN0IGRlbW8gPSBkYXRhLmRlbW9cblx0XHRcdFx0Y3RybC5zZXREYXRhKHtcblx0XHRcdFx0XHRhbHRpdHVkZTogZGVtby5hbHRpdHVkZU1ldGVycyxcblx0XHRcdFx0XHRiYXR0ZXJ5OiBkZW1vLmJhdHRlcnlQZXJjZW50YWdlLFxuXHRcdFx0XHRcdHJvbGw6IC1kZW1vLnJvdGF0aW9uLnJvbGwsXG5cdFx0XHRcdFx0cGl0Y2g6IGRlbW8ucm90YXRpb24ucGl0Y2gsXG5cdFx0XHRcdFx0Y29udHJvbFN0YXRlOiBkZW1vLmNvbnRyb2xTdGF0ZSxcblx0XHRcdFx0XHRmbHlTdGF0ZTogZGVtby5mbHlTdGF0ZVxuXG5cdFx0XHRcdH0pXG5cdFx0XHRcdGlmIChjdHJsLm1vZGVsLndhaXRMYW5kaW5nKSB7XG5cdFx0XHRcdFx0aWYgKGN0cmwubW9kZWwuY29udHJvbFN0YXRlID09ICdDVFJMX0xBTkRFRCcpIHtcblx0XHRcblx0XHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7d2FpdExhbmRpbmc6IGZhbHNlfSlcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cdFx0XG5cblxuXHRcdFx0fVxuXHRcdH0pXG5cblxuXG5cblx0XHRmdW5jdGlvbiBjaGVja0dhbWVQYWRTdGF0dXMoKSB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKCdjaGVja0dhbWVQYWRTdGF0dXMnKVxuXHRcdFx0dmFyIGdhbWVwYWQgPSBuYXZpZ2F0b3IuZ2V0R2FtZXBhZHMoKVswXVxuXHRcdFx0aWYgKGdhbWVwYWQpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZ2FtZXBhZCcsIGdhbWVwYWQpXG5cdFx0XHRcdHZhciBhY3Rpb24gPSAwXG5cdFx0XHRcdFx0XG5cdFx0XHRcdGNvbnN0IGJ1dHRvbnMgPSBnYW1lcGFkLmJ1dHRvbnNcblx0XHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IGJ1dHRvbnMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHR2YXIgdmFsID0gYnV0dG9uc1tpXS5wcmVzc2VkXG5cdFx0XHRcdFx0aWYgKHZhbCA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRcdFx0dmFyIGVudHJ5ID0gZ2FtZXBhZE1hcC5idXR0b25zW2ldXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIGVudHJ5ID09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdFx0XHRcdGFjdGlvbiB8PSBhY3Rpb25NYXNrc1tlbnRyeV1cblx0XHRcdFx0XHRcdH1cdFx0XHRcdFx0XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBheGVzID0gZ2FtZXBhZC5heGVzXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7XG5cdFx0XHRcdFx0YXhlczogZml4QXhlcyhheGVzKVxuXHRcdFx0XHR9KVxuXHRcdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgYXhlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdHZhciB2YWwgPSBheGVzW2ldXG5cdFx0XHRcdFx0dmFyIGVudHJ5ID0gZ2FtZXBhZE1hcC5heGVzW2ldXG5cdFx0XHRcdFx0aWYgKGVudHJ5KSB7XG5cdFx0XHRcdFx0XHRmb3IodmFyIGsgaW4gZW50cnkpIHtcblx0XHRcdFx0XHRcdFx0dmFyIGRlc2MgPSBlbnRyeVtrXVxuXHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIGRlc2MubWluID09IFwibnVtYmVyXCIpIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAodmFsID4gZGVzYy5taW4pIHtcblx0XHRcdFx0XHRcdFx0XHRcdGFjdGlvbiB8PSBhY3Rpb25NYXNrc1trXVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIGRlc2MubWF4ID09IFwibnVtYmVyXCIpIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAodmFsIDwgZGVzYy5tYXgpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGFjdGlvbiB8PSBhY3Rpb25NYXNrc1trXVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVx0XHRcdFx0XG5cdFx0XHRcdFxuXHRcdFx0XHRcblx0XHRcdFx0aWYgKGFjdGlvbiAhPSBjdXJBY3Rpb24pIHtcblx0XHRcdFx0XHRzZXRBY3Rpb24oYWN0aW9uKVx0XHRcdFxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNoZWNrR2FtZVBhZFN0YXR1cylcdFx0XHRcblx0XHRcdH1cblxuXHRcdFx0XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZml4QXhlcyhheGVzKSB7XG5cdFx0XHRyZXR1cm4gYXhlcy5tYXAoKHYpID0+IHYudG9GaXhlZCgyKSlcblx0XHR9XG5cblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImdhbWVwYWRjb25uZWN0ZWRcIiwgZnVuY3Rpb24oZSkge1xuXHRcdFx0Y29uc29sZS5sb2coXCJDb250csO0bGV1ciBuwrAlZCBjb25uZWN0w6kgOiAlcy4gJWQgYm91dG9ucywgJWQgYXhlcy5cIixcblx0ICBcdFx0XHRlLmdhbWVwYWQuaW5kZXgsIGUuZ2FtZXBhZC5pZCxcblx0ICBcdFx0XHRlLmdhbWVwYWQuYnV0dG9ucy5sZW5ndGgsIGUuZ2FtZXBhZC5heGVzLmxlbmd0aCk7XG5cblxuXHRcdFx0Y29uc3QgYXhlcyA9IGUuZ2FtZXBhZC5heGVzXG5cdFx0XHRjdHJsLnNldERhdGEoe2dhbWVwYWREZXRlY3RlZDogdHJ1ZSwgYXhlczogZml4QXhlcyhheGVzKX0pXHRcblx0XHRcblxuXHRcdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNoZWNrR2FtZVBhZFN0YXR1cylcblxuXHRcdH0pO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiZ2FtZXBhZGRpc2Nvbm5lY3RlZFwiLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnZ2FtZXBhZGRpc2Nvbm5lY3RlZCcpXG5cdFx0XHRjdHJsLnNldERhdGEoe2dhbWVwYWREZXRlY3RlZDogZmFsc2V9KVx0XG5cdFx0fSk7XG5cblx0fVxuXG59KSAiXX0=
