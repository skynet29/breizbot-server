$$.registerControlEx('MainControl', {
	deps: ['WebSocketService', 'HttpService', 'UserService'],
	
	init: function(elt, options, client, http, usrSrv) {

		var userName = usrSrv.getName()
		console.log('userName', userName)

		client.register('masterMessage', false, function(msg) {
			var data = msg.data
			var tabCtrl = ctrl.scope.tabCtrl

			console.log('masterMessage', data)

			var panel = tabCtrl.getTabPanelByTitle(data.from)
			if (panel.length == 0) {
				var idx = tabCtrl.addTab(data.from, {
					removable: true,
					template: `<p class="w3-right-align">${data.text}</p>`
				})

				if (tabCtrl.getTabCount() == 1) {
					tabCtrl.setActive(idx)
				}

				
			}
			else {
				addMessage(panel, data.text)
			}

			console.log('panel', panel)
		})

		function addMessage(panel, text, isOwner) {
			console.log('addMessage', text, isOwner)
			if (isOwner === true) {
				panel.append(`<p>${text}</p>`)
			}
			else {
				panel.append(`<p class="w3-right-align">${text}</p>`)
			} 
				
		}

		var ctrl = $$.viewController(elt, {
			template: {gulp_inject: './main.html'},

			events: {
				onFriendSelected: function(ev, data) {
					console.log('onFriendSelected', data)
					if (!data.isConnected) {
						$$.showAlert(`User '${data.name}' is not connected`)
						return
					}

					var tabCtrl = ctrl.scope.tabCtrl

					var idx = tabCtrl.getTabIndexByTitle(data.name)
					console.log('idx', idx)

					if (idx < 0) {
						idx = tabCtrl.addTab(data.name, {removable: true})
					}

					
					tabCtrl.setActive(idx)
				},
				onInvit: function(ev) {
					ev.preventDefault()
					var data = $(this).getFormData()
					console.log('onInvit', data)

					
					var myFriends = ctrl.scope.friendsCtrl.getFriends()
					console.log('friends', myFriends)
					var friend = myFriends.find((item) => {
						return item.name == data.userName
					})

					console.log('friend', friend)

					if (friend != undefined) {
						$(this).resetForm()
						$$.showAlert(`User '${data.userName}' is already your friend !`)
						return
					}

					http.post('/api/notif/' + data.userName, {
						type: 'invit',
						message: `User <strong>${userName}</strong> want to be your friend`,
						from: userName
					}).catch((e) => {
						//console.log('Error', e)
						$$.showAlert(e.responseText)
					})
				},

				onSend: function(ev) {
					ev.preventDefault()

					var tabCtrl = ctrl.scope.tabCtrl

					var tabIdx = tabCtrl.getActive()
					console.log('tabIdx', tabIdx)

					var dest = tabCtrl.getTitleByIndex(tabIdx)
					console.log('dest', dest)
					if (dest == undefined) {
						$$.showAlert('Please select a user first')
						return

					}



					var data = $(this).getFormData()
					console.log('data', data)

					$(this).resetForm()
			
					var panel = tabCtrl.getTabPanelByTitle(dest)
					addMessage(panel, data.message, true)

					http.post('/api/tchat/send/' + dest, {
						text: data.message
					}).catch((e) => {
						//console.log('Error', e)
						$$.showAlert(e.responseText)
					})

				}
			}
		})
	}
});
