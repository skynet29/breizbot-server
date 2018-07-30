(function() {


	$$.registerControlEx('UserDetailsControl', {

		deps: ['HttpService'],
		iface: 'setUser(userName);getUser();hide()',

		init: function(elt, options, http) {

			var ctrl = $$.viewController(elt, {
				template: {gulp_inject: './user-details.html'},
				data: {
					user: '',
					pwd: '',
					apps: [],
					visible: false
				},	
				events: {
					onApply: function(ev) {
						console.log('Apply', getInfos())
						http.put(`/api/users/${user}`, getInfos()).then(() => {
							$(this).notify('Config saved successfully', {position: 'right top', className: 'success'})
						})					
					}
				}
			})


			var user
			var _apps = []



			http.get('/api/apps').then(function(apps) {
				_apps = apps

			})

			this.setUser = function(id) {
				console.log('[UserDetailsControl] setUser', id)
				user = id
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
				var ret = {
					pwd: infos.pwd,
					allowedApps: allowedApps
				}

				if (infos.masterActivated) {
					ret.master = {
						host: infos.masterHost,
						port: infos.masterPort
					}
				}

				return ret
			}

			function getUserDetails(user) {
				http.get(`/api/users/${user}`).then(function(userDetails) {

					console.log('userDetails', userDetails)

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

					var data = {
						user: user,
						pwd: userDetails.pwd,
						visible: true,
						apps: apps,
						masterActivated: false
					}

					var master = userDetails.master

					if (typeof master == 'object') {
						data.masterActivated = true
						data.masterPort = master.port
						data.masterHost = master.host
					}
								
					ctrl.setData(data)

				})			
			}

			this.getUser = function() {
				return user
			},
			this.hide = function() {
				ctrl.setData({visible: false})
			}
		}

	})

})();
