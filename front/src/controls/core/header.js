
$$.registerControlEx('HeaderControl', {
	deps: ['WebSocketService', 'InvitService', 'NotifService'],
	options: {
		title: 'Hello World',
		userName: 'unknown',
		isHomePage: false
	},
	init: function(elt, options, client, invitSrv, notifSrv) {

		var dlgCtrl = $$.dialogController('Notifications', {
			template: {gulp_inject: './headerNotif.html'},
			data: {notifs: []},
			options: {
				width: 'auto'
			},
			events: {
				onDelete: function() {
					var notif = $(this).closest('li').data('notif')
					//console.log('onDelete', notif)
					notifSrv.delete(notif.id)
				},
				onAccept: function() {
					var notif = $(this).closest('li').data('notif')
					console.log('onAccept', notif)

					invitSrv.accept(notif.from)

					notifSrv.delete(notif.id)

				},
				onDeny: function() {
					var notif = $(this).closest('li').data('notif')
					console.log('onDeny', notif)

					notifSrv.delete(notif.id)

				}
			}
		})

		var ctrl = $$.viewController(elt, {
			template: {gulp_inject: "./header.html"},
			data: {
				connected: false,
				titleState: "WebSocket disconnected",
				title: options.title,
				userName: options.userName,
				isHomePage: options.isHomePage,
				nbNotif: 0,
				
				isNotifVisible: function() {
					return this.nbNotif > 0
				}				
			},
			events: {
				onGoHome: function() {
					location.href = '/'
				},

				onDisconnect: function() {
					sessionStorage.clear()
					location.href = '/disconnect'
				},

				onNotification: function() {
					console.log('onNotification')
					if (ctrl.model.nbNotif == 0) {
						$$.showAlert('no notifications', 'Notifications')
					}
					else {
						dlgCtrl.show()
					}
				}
			}
		})


		client.events.on('connect', function() {
			console.log('[HeaderControl] client connected')
			ctrl.setData({connected: true, titleState: "WebSocket connected"})

		})

		client.events.on('disconnect', function() {
			console.log('[HeaderControl] client disconnected')
			ctrl.setData({connected: false, titleState: "WebSocket disconnected"})

		})

		client.register('masterNotifications', true, onNotifications)

		function onNotifications(msg) {
			console.log('onNotifications', msg.data)
			ctrl.setData({nbNotif: msg.data.length})
			dlgCtrl.setData({
				notifs: msg.data.map((item) => {
					item.isInvit = (item.type == 'invit')
					return item
				})
			})
			if (msg.data.length == 0) {
				dlgCtrl.hide()
			}
		}


	}

});


