
$$.registerControlEx('UsersControl', {
	deps: ['NotifService', 'UsersService'],
	events: 'userSelected,userDeleted',
	init: function(elt, options, notifSrv, usersSrv) {

		var events = new EventEmitter2()

		var ctrl = $$.viewController(elt, {
			template: {gulp_inject: './users.html'},
			data: {users: []},
			events: {

				onAddUser: function(ev) {
					//console.log('onAddUser')
					ev.preventDefault()
					var data = $(this).getFormData()
					$(this).get(0).reset()
					//console.log('submit', data)
					usersSrv.add(data)
					.then(loadUsers)
					.catch((e) => {
						//console.log('Error', e)
						$$.showAlert(e.responseText)
					})
				},
				onDeleteUser: function(ev) {
					//console.log('onDeleteUser')
					var user = $(this).closest('li').data('user')
					//console.log('user', user)
					$$.showConfirm('Are your sure ?', 'Information', function() {
						usersSrv.remove(user).then(function() {
							loadUsers()
							events.emit('userDeleted', user)
						})				
					})				
				},
				onUserClicked: function(ev) {
					//console.log('onUserClicked')
					ev.preventDefault()
					ctrl.scope.ul.find('li').removeClass('w3-blue')
					var $li = $(this).closest('li')
					//$li.addClass('w3-blue')
					var user = $li.data('user')
					//console.log('user', user)
					events.emit('userSelected', user)				
				},
				onNotifClicked: function(ev) {
					var user = $(this).closest('li').data('user')
					console.log('onNotifClicked', user)
					$$.showPrompt('Message', 'SendNotification', (message) => {
						console.log('message', message)
						var data = {
							type: 'message',
							message
						}

						notifSrv.send(user, data).then((resp) => {
							console.log('resp', resp)
						})
					})
				}
			}
		})			


		function loadUsers() {
			usersSrv.list().then(function(users) {
				console.log('loadUsers', users)
				ctrl.setData({users: users})
			})			
		}

		loadUsers()

		this.on = events.on.bind(events)


	}

});


