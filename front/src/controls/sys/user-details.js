(function() {


	$$.registerControlEx('UserDetailsControl', {

		deps: ['AppService', 'UsersService'],
		iface: 'setUser(userName);getUser()',

		init: function(elt, options, appSrv, usersSrv) {

			var ctrl = $$.viewController(elt, {
				template: {gulp_inject: './user-details.html'},
				data: {
					apps: []
				},	
				events: {
					onApply: function(ev) {
						console.log('Apply', getInfos())
						usersSrv.update(user, getInfos()).then(() => {
							$(this).notify('Config saved successfully', {position: 'right top', className: 'success'})
						})					
					}


				}
			})


			var user
			var _apps = []



			appSrv.list().then(function(apps) {
				_apps = apps

			})

			this.setUser = function(id) {
				console.log('[UserDetailsControl] setUser', id)
				user = id
				ctrl.scope.tabCtrl.setActive(0)
				getUserDetails(id)
				//mainElt.show()	
			}

			function getInfos() {
				var infos = ctrl.scope.info.getFormData()
				console.log('infos', infos)

				var allowedApps = {}
				ctrl.scope.tbody.find('tr').each(function() {
					var appInfos = $(this).getFormData()
					//console.log('appInfos', appInfos)
					if (appInfos.enabled) {
						allowedApps[appInfos.name] = (appInfos.config == 'none') ? true : appInfos.config
					}
				})
				infos.allowedApps = allowedApps


				return infos
			}

			function getUserDetails(user) {
				usersSrv.get(user).then(function(userDetails) {

					console.log('userDetails', userDetails)

					ctrl.scope.info.setFormData(userDetails)

					var allowedApps = userDetails.allowedApps

					var apps = $$.obj2Array(_apps).map(function(item) {
						var appName = item.key

						var config = allowedApps[appName]

						return {
							appName: appName,
							allowed: (config != undefined),
							selConfig: (typeof config == 'string') ? config : 'none',
							configs: ['none'].concat(item.value)
						}
					})	

								
					ctrl.setData({apps})

				})			
			}

			this.getUser = function() {
				return user
			}

		}

	})

})();
