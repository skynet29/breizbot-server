$$.configReady(function () {
	console.log('App started')

	var ctrl = $$.viewController('body', {
		template: {gulp_inject: './app.html'},
		data: {
			showDetails: false
		},
		events: {
			onBack: function() {
				ctrl.setData({showDetails: false})
			},
			onUserSelected: function(user) {
				console.log('userSelected', user)
				ctrl.scope.userDetailsCtrl.setUser(user)
				ctrl.setData({showDetails: true, user})
			}
	
		}	
	})


})