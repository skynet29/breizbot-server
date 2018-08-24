(function() {


	$$.registerControlEx('MasterAgentsControl', {
		deps: ['WebSocketService'], 

		
	lib: 'sys',
init: function(elt, options, client) {

			let hosts = {}

			var ctrl = $$.viewController(elt, {
				template: "<div class=\"scrollPanel\">\n    <table class=\"w3-table-all w3-small\">\n        <thead>\n            <tr class=\"w3-green\">\n                <th>Agent Name</th>\n                <th>Host Name</th>\n                <th>State</th>\n                <th>Pid</th>\n                <th>Action</th>\n            </tr>\n        </thead>\n        <tbody bn-each=\"a of agents\" bn-event=\"click.actionStart: onActionStart, click.actionStop: onActionStop, click.actionStopForce: onActionStopForce\">\n  			<tr>\n				<td bn-text=\"a.agent\"></td>\n				<td bn-text=\"a.host\"></td>\n				<td bn-text=\"a.state\"></td>\n				<td bn-text=\"a.pid\"></td>\n				<td bn-data=\"agent: a.agent\">\n					<button class=\"actionStart w3-btn w3-blue\" bn-show=\"a.start\">Start</button>\n					<button class=\"actionStop w3-btn w3-blue\"  bn-show=\"!a.start\">Stop</button>\n					<button class=\"actionStopForce w3-btn w3-red\" bn-show=\"!a.start\">Kill</button>\n				</td>\n			</tr>      	\n\n        </tbody>\n    </table>\n</div>",
				data: {agents: []},
				events: {
					onActionStart: function() {
						var agent = $(this).closest('td').data('agent')
						console.log('actionStart', agent)
						client.emit('launcherStartAgent', agent)				
					},
					onActionStop: function() {
						var agent = $(this).closest('td').data('agent')
						console.log('actionStop', agent)
						client.emit('launcherStopAgent', agent)				
					},
					onActionStopForce: function() {
						var agent = $(this).closest('td').data('agent')
						console.log('actionStopForce', agent)
						client.emit('launcherStopAgent', {agent: agent, force: true})				
					}
				}		
			})

			ctrl.elt.addClass('bn-flex-col')
			dispTable()

			
			function dispTable() {
				var data = []

				for(var hostName in hosts) {
					var agents = hosts[hostName]
					for(var agent in agents) {
						var info = agents[agent]
						data.push({
							pid: info.pid,
							agent: agent,
							state: info.state,
							start: info.pid == 0,
							host: hostName						
						})
					}

				}

				ctrl.setData({agents: data})
			}

			function onLauncherStatus(msg) {
				var hostName = msg.topic.split('.')[1]
				//console.log('host', hostName)
				hosts[hostName] = msg.data
				dispTable()
			}

			client.register('launcherStatus.*', true, onLauncherStatus)

			client.onClose = function() {
				ctrl.setData({agents: []})
			}

			this.dispose = function() {
				client.unregister('launcherStatus.*', onLauncherStatus)
				//client.offEvent('disconnected', onDisconnected)
			}
			
		}


	})

})();

(function() {


	$$.registerControlEx('MasterClientsControl', {

		deps: ['WebSocketService'], 

		
	lib: 'sys',
init: function(elt, options, client) {

			var ctrl = $$.viewController(elt, {
				template: "<div class=\"scrollPanel\">\n    <table class=\"w3-table-all w3-small\">\n        <thead>\n            <tr class=\"w3-green\">\n                <th>Name</th>\n                <th>Registered Topics</th>\n                <th>Registered Services</th>\n            </tr>\n        </thead>\n        <tbody bn-each=\"c of clients\">\n			<tr>\n				<td bn-text=\"c.name\"></td>\n				<td bn-html=\"c.topics\"></td>\n                <td bn-html=\"c.services\"></td>\n			</tr>        	\n        </tbody>\n    </table>\n</div>",
				data: {
					clients: []
				}
			})

			function onMasterClients(msg) {
				const data = msg.data
				let agents = Object.keys(data).sort()

				var clients = agents.map(function(agent) {

					return {
						topics: data[agent].registeredTopics.join('<br>'),
						services: data[agent].registeredServices.join('<br>'),
						name: agent
					}

				})	
				ctrl.setData({clients: clients})		
			}

			client.register('masterClients', true, onMasterClients)


			client.onClose = function() {
				ctrl.setData({clients: []})
			}

			this.dispose = function() {
				client.unregister('masterClients', onMasterClients)
			}
		}

	})



})();

(function() {



	$$.registerControlEx('MasterHistControl', {

		deps: ['WebSocketService'],

		
	lib: 'sys',
init: function(elt, options, client) {

			var model = {
				tableConfig: {
					columns: {
						'topic': 'Topic',
						'src': 'Source',
						'lastModif': 'Last Modified'
					},
					actions: {
						'detail': 'fa fa-info'
					}
				},
				nbMsg: 0
			}



			var ctrl = $$.viewController(elt, {
				template: "<div class=\"bn-flex-col bn-flex-1\">\n	<div class=\"bn-flex-row bn-space-between\">\n		<div class=\"bn-container filters\" bn-event=\"input.filter: onFilterChange\">\n			<input type=\"text\" placeholder=\"Filter topic\" data-filter=\"topic\" class=\"filter\">\n			<input type=\"text\" placeholder=\"Filter source\" data-filter=\"src\" class=\"filter\">					\n		</div>\n		<div>Messages Number:<span bn-text=\"nbMsg\"></span></div>\n	</div>\n\n\n	<div bn-control=\"FilteredTableControl\" bn-options=\"tableConfig\" class=\"bn-flex-1 bn-no-overflow\" bn-iface=\"iface\" bn-event=\"itemAction: onItemAction\">	\n</div>\n",
				data: model, 
				events: 
				{
					onItemAction: function(action, id) {
						console.log('onItemAction', action, id)
						var item = ctrl.scope.iface.getItem(id)
						var html = `<pre>${JSON.stringify(item.data, null, 4)}</pre>`
						$$.showAlert(html, 'Detail')
					},

					onFilterChange: function(ev) {
						console.log('onFilterChange')
						var filter = $(this).data('filter')
						filters[filter] = $(this).val()
						ctrl.scope.iface.setFilters(filters)
						updateTopicNumber()
					}
				}
			})

			let filters = {}

			var tbody = ctrl.elt.find('tbody')

			function updateTopicNumber() {
				var nbMsg = tbody.find('tr').length
				ctrl.setData({nbMsg: nbMsg})
			}


			function onMessage(msg) {
				//console.log('onMessage')
				ctrl.scope.iface.addItem(msg.topic, getItemData(msg))
				updateTopicNumber()			
			}

			client.register('**', true, onMessage)

			client.onClose = function() {
				ctrl.scope.iface.removeAllItems()
			}


			
			function getItemData(msg) {


				return {
					topic: msg.topic,
					src: msg.src,
					lastModif: new Date(msg.time).toLocaleString(),
					data: msg.data			
				}
			}

			this.dispose = function() {
				client.unregister('**', onMessage)
			}
		}



	})

})();






(function() {


	$$.registerControlEx('UserDetailsControl', {

		deps: ['AppService', 'UsersService'],
		iface: 'setUser(userName);getUser()',

		
	lib: 'sys',
init: function(elt, options, appSrv, usersSrv) {

			var ctrl = $$.viewController(elt, {
				template: "<div class=\"main\">\n\n	<div bn-control=\"TabControl\" style=\"height: 100%; display: flex; flex-direction: column;\" bn-iface=\"tabCtrl\">\n		<div title=\"Info\" style=\"flex: 1\" >\n			<form bn-bind=\"info\">\n				<table class=\"info w3-table w3-border\">\n\n\n					<tr>\n						<td>Password</td>\n						<td><input class=\"pwd w3-input w3-border\" type=\"text\" name=\"pwd\"></td>\n					</tr>\n\n					<tr>\n						<td>Name</td>\n						<td><input class=\"pwd w3-input w3-border\" type=\"text\" name=\"name\"></td>\n					</tr>\n\n					<tr>\n						<td>Email</td>\n						<td><input class=\"pwd w3-input w3-border\" type=\"email\" name=\"email\"></td>\n					</tr>\n																				\n\n				</table>	\n			</form>\n		</div>\n				\n		<div title=\"webapps\" style=\"flex: 1; overflow: auto;\">\n			<table class=\"apps w3-table-all\">\n				<thead>\n					<tr class=\"w3-green\">\n						<th>App Name</th>\n						<th>Allowed</th>\n						<th>Configuration</th>			\n					</tr>\n\n				</thead>\n				<tbody bn-each=\"app of apps\" bn-bind=\"tbody\">\n					<tr>\n						<td bn-text=\"app.appName\" name=\"name\" bn-val=\"app.appName\"></td>\n						<td><input name=\"enabled\" type=\"checkbox\" bn-prop=\"checked: app.allowed\"></td>\n						<td><select name=\"config\"  class=\"w3-border bn-fill\" bn-list=\"app.configs\" bn-val=\"app.selConfig\"></select></td>\n					</tr>				\n				</tbody>\n			</table>\n		</div>\n	</div>\n	<p><button class=\"apply w3-btn w3-blue\" bn-event=\"click: onApply\">Apply changes</button></p>\n</div>",
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


$$.registerControlEx('UsersControl', {
	deps: ['NotifService', 'UsersService'],
	events: 'userSelected,userDeleted',
	
	lib: 'sys',
init: function(elt, options, notifSrv, usersSrv) {

		var events = new EventEmitter2()

		var ctrl = $$.viewController(elt, {
			template: "<div class=\"bn-flex-col bn-flex-1\">\n\n	<h1>Add User</h1>\n	<div>\n		<form bn-event=\"submit: onAddUser\">\n			<input type=\"text\" placeholder=\"username\" name=\"userName\" required autocomplete=\"off\" class=\"w3-input w3-border\">\n			<button type=\"submit\" class=\"w3-btn w3-blue w3-bar-item w3-right\">Add</button>			\n\n		</form>\n	</div>		\n	<h1>Registered Users</h1>\n	<div class=\"scrollPanel\">\n		<ul class=\"w3-ul w3-border w3-white\" bn-each=\"user of users\" bn-event=\"click.delete: onDeleteUser, click.user: onUserClicked, click.notif: onNotifClicked\" bn-bind=\"ul\">\n			<li class=\"w3-bar\" bn-data=\"user: user\">\n				<span class=\"w3-button w3-right delete\" title=\"Delete\"><i class=\"fa fa-trash\"></i></span>\n				<span class=\"w3-button w3-right notif\" title=\"Send Notification\"><i class=\"fa fa-bell\"></i></span>\n				<div class=\"w3-bar-item\">\n					<a href=\"#\" bn-text=\"user\" class=\"user\"></a>\n				</div>\n			</li>\n		</ul>\n	</div>\n\n\n</div>\n\n		",
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



//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hc3Rlci1hZ2VudHMuanMiLCJtYXN0ZXItY2xpZW50cy5qcyIsIm1hc3Rlci1oaXN0LmpzIiwidXNlci1kZXRhaWxzLmpzIiwidXNlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InN5cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcblxuXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdNYXN0ZXJBZ2VudHNDb250cm9sJywge1xuXHRcdGRlcHM6IFsnV2ViU29ja2V0U2VydmljZSddLCBcblxuXHRcdFxuXHRsaWI6ICdzeXMnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBjbGllbnQpIHtcblxuXHRcdFx0bGV0IGhvc3RzID0ge31cblxuXHRcdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcblx0XHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwic2Nyb2xsUGFuZWxcXFwiPlxcbiAgICA8dGFibGUgY2xhc3M9XFxcInczLXRhYmxlLWFsbCB3My1zbWFsbFxcXCI+XFxuICAgICAgICA8dGhlYWQ+XFxuICAgICAgICAgICAgPHRyIGNsYXNzPVxcXCJ3My1ncmVlblxcXCI+XFxuICAgICAgICAgICAgICAgIDx0aD5BZ2VudCBOYW1lPC90aD5cXG4gICAgICAgICAgICAgICAgPHRoPkhvc3QgTmFtZTwvdGg+XFxuICAgICAgICAgICAgICAgIDx0aD5TdGF0ZTwvdGg+XFxuICAgICAgICAgICAgICAgIDx0aD5QaWQ8L3RoPlxcbiAgICAgICAgICAgICAgICA8dGg+QWN0aW9uPC90aD5cXG4gICAgICAgICAgICA8L3RyPlxcbiAgICAgICAgPC90aGVhZD5cXG4gICAgICAgIDx0Ym9keSBibi1lYWNoPVxcXCJhIG9mIGFnZW50c1xcXCIgYm4tZXZlbnQ9XFxcImNsaWNrLmFjdGlvblN0YXJ0OiBvbkFjdGlvblN0YXJ0LCBjbGljay5hY3Rpb25TdG9wOiBvbkFjdGlvblN0b3AsIGNsaWNrLmFjdGlvblN0b3BGb3JjZTogb25BY3Rpb25TdG9wRm9yY2VcXFwiPlxcbiAgXHRcdFx0PHRyPlxcblx0XHRcdFx0PHRkIGJuLXRleHQ9XFxcImEuYWdlbnRcXFwiPjwvdGQ+XFxuXHRcdFx0XHQ8dGQgYm4tdGV4dD1cXFwiYS5ob3N0XFxcIj48L3RkPlxcblx0XHRcdFx0PHRkIGJuLXRleHQ9XFxcImEuc3RhdGVcXFwiPjwvdGQ+XFxuXHRcdFx0XHQ8dGQgYm4tdGV4dD1cXFwiYS5waWRcXFwiPjwvdGQ+XFxuXHRcdFx0XHQ8dGQgYm4tZGF0YT1cXFwiYWdlbnQ6IGEuYWdlbnRcXFwiPlxcblx0XHRcdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJhY3Rpb25TdGFydCB3My1idG4gdzMtYmx1ZVxcXCIgYm4tc2hvdz1cXFwiYS5zdGFydFxcXCI+U3RhcnQ8L2J1dHRvbj5cXG5cdFx0XHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiYWN0aW9uU3RvcCB3My1idG4gdzMtYmx1ZVxcXCIgIGJuLXNob3c9XFxcIiFhLnN0YXJ0XFxcIj5TdG9wPC9idXR0b24+XFxuXHRcdFx0XHRcdDxidXR0b24gY2xhc3M9XFxcImFjdGlvblN0b3BGb3JjZSB3My1idG4gdzMtcmVkXFxcIiBibi1zaG93PVxcXCIhYS5zdGFydFxcXCI+S2lsbDwvYnV0dG9uPlxcblx0XHRcdFx0PC90ZD5cXG5cdFx0XHQ8L3RyPiAgICAgIFx0XFxuXFxuICAgICAgICA8L3Rib2R5PlxcbiAgICA8L3RhYmxlPlxcbjwvZGl2PlwiLFxuXHRcdFx0XHRkYXRhOiB7YWdlbnRzOiBbXX0sXG5cdFx0XHRcdGV2ZW50czoge1xuXHRcdFx0XHRcdG9uQWN0aW9uU3RhcnQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0dmFyIGFnZW50ID0gJCh0aGlzKS5jbG9zZXN0KCd0ZCcpLmRhdGEoJ2FnZW50Jylcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdhY3Rpb25TdGFydCcsIGFnZW50KVxuXHRcdFx0XHRcdFx0Y2xpZW50LmVtaXQoJ2xhdW5jaGVyU3RhcnRBZ2VudCcsIGFnZW50KVx0XHRcdFx0XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRvbkFjdGlvblN0b3A6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0dmFyIGFnZW50ID0gJCh0aGlzKS5jbG9zZXN0KCd0ZCcpLmRhdGEoJ2FnZW50Jylcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdhY3Rpb25TdG9wJywgYWdlbnQpXG5cdFx0XHRcdFx0XHRjbGllbnQuZW1pdCgnbGF1bmNoZXJTdG9wQWdlbnQnLCBhZ2VudClcdFx0XHRcdFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0b25BY3Rpb25TdG9wRm9yY2U6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0dmFyIGFnZW50ID0gJCh0aGlzKS5jbG9zZXN0KCd0ZCcpLmRhdGEoJ2FnZW50Jylcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdhY3Rpb25TdG9wRm9yY2UnLCBhZ2VudClcblx0XHRcdFx0XHRcdGNsaWVudC5lbWl0KCdsYXVuY2hlclN0b3BBZ2VudCcsIHthZ2VudDogYWdlbnQsIGZvcmNlOiB0cnVlfSlcdFx0XHRcdFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVx0XHRcblx0XHRcdH0pXG5cblx0XHRcdGN0cmwuZWx0LmFkZENsYXNzKCdibi1mbGV4LWNvbCcpXG5cdFx0XHRkaXNwVGFibGUoKVxuXG5cdFx0XHRcblx0XHRcdGZ1bmN0aW9uIGRpc3BUYWJsZSgpIHtcblx0XHRcdFx0dmFyIGRhdGEgPSBbXVxuXG5cdFx0XHRcdGZvcih2YXIgaG9zdE5hbWUgaW4gaG9zdHMpIHtcblx0XHRcdFx0XHR2YXIgYWdlbnRzID0gaG9zdHNbaG9zdE5hbWVdXG5cdFx0XHRcdFx0Zm9yKHZhciBhZ2VudCBpbiBhZ2VudHMpIHtcblx0XHRcdFx0XHRcdHZhciBpbmZvID0gYWdlbnRzW2FnZW50XVxuXHRcdFx0XHRcdFx0ZGF0YS5wdXNoKHtcblx0XHRcdFx0XHRcdFx0cGlkOiBpbmZvLnBpZCxcblx0XHRcdFx0XHRcdFx0YWdlbnQ6IGFnZW50LFxuXHRcdFx0XHRcdFx0XHRzdGF0ZTogaW5mby5zdGF0ZSxcblx0XHRcdFx0XHRcdFx0c3RhcnQ6IGluZm8ucGlkID09IDAsXG5cdFx0XHRcdFx0XHRcdGhvc3Q6IGhvc3ROYW1lXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y3RybC5zZXREYXRhKHthZ2VudHM6IGRhdGF9KVxuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBvbkxhdW5jaGVyU3RhdHVzKG1zZykge1xuXHRcdFx0XHR2YXIgaG9zdE5hbWUgPSBtc2cudG9waWMuc3BsaXQoJy4nKVsxXVxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdob3N0JywgaG9zdE5hbWUpXG5cdFx0XHRcdGhvc3RzW2hvc3ROYW1lXSA9IG1zZy5kYXRhXG5cdFx0XHRcdGRpc3BUYWJsZSgpXG5cdFx0XHR9XG5cblx0XHRcdGNsaWVudC5yZWdpc3RlcignbGF1bmNoZXJTdGF0dXMuKicsIHRydWUsIG9uTGF1bmNoZXJTdGF0dXMpXG5cblx0XHRcdGNsaWVudC5vbkNsb3NlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7YWdlbnRzOiBbXX0pXG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuZGlzcG9zZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRjbGllbnQudW5yZWdpc3RlcignbGF1bmNoZXJTdGF0dXMuKicsIG9uTGF1bmNoZXJTdGF0dXMpXG5cdFx0XHRcdC8vY2xpZW50Lm9mZkV2ZW50KCdkaXNjb25uZWN0ZWQnLCBvbkRpc2Nvbm5lY3RlZClcblx0XHRcdH1cblx0XHRcdFxuXHRcdH1cblxuXG5cdH0pXG5cbn0pKCk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cblxuXHQkJC5yZWdpc3RlckNvbnRyb2xFeCgnTWFzdGVyQ2xpZW50c0NvbnRyb2wnLCB7XG5cblx0XHRkZXBzOiBbJ1dlYlNvY2tldFNlcnZpY2UnXSwgXG5cblx0XHRcblx0bGliOiAnc3lzJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgY2xpZW50KSB7XG5cblx0XHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XG5cdFx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcInNjcm9sbFBhbmVsXFxcIj5cXG4gICAgPHRhYmxlIGNsYXNzPVxcXCJ3My10YWJsZS1hbGwgdzMtc21hbGxcXFwiPlxcbiAgICAgICAgPHRoZWFkPlxcbiAgICAgICAgICAgIDx0ciBjbGFzcz1cXFwidzMtZ3JlZW5cXFwiPlxcbiAgICAgICAgICAgICAgICA8dGg+TmFtZTwvdGg+XFxuICAgICAgICAgICAgICAgIDx0aD5SZWdpc3RlcmVkIFRvcGljczwvdGg+XFxuICAgICAgICAgICAgICAgIDx0aD5SZWdpc3RlcmVkIFNlcnZpY2VzPC90aD5cXG4gICAgICAgICAgICA8L3RyPlxcbiAgICAgICAgPC90aGVhZD5cXG4gICAgICAgIDx0Ym9keSBibi1lYWNoPVxcXCJjIG9mIGNsaWVudHNcXFwiPlxcblx0XHRcdDx0cj5cXG5cdFx0XHRcdDx0ZCBibi10ZXh0PVxcXCJjLm5hbWVcXFwiPjwvdGQ+XFxuXHRcdFx0XHQ8dGQgYm4taHRtbD1cXFwiYy50b3BpY3NcXFwiPjwvdGQ+XFxuICAgICAgICAgICAgICAgIDx0ZCBibi1odG1sPVxcXCJjLnNlcnZpY2VzXFxcIj48L3RkPlxcblx0XHRcdDwvdHI+ICAgICAgICBcdFxcbiAgICAgICAgPC90Ym9keT5cXG4gICAgPC90YWJsZT5cXG48L2Rpdj5cIixcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdGNsaWVudHM6IFtdXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cblx0XHRcdGZ1bmN0aW9uIG9uTWFzdGVyQ2xpZW50cyhtc2cpIHtcblx0XHRcdFx0Y29uc3QgZGF0YSA9IG1zZy5kYXRhXG5cdFx0XHRcdGxldCBhZ2VudHMgPSBPYmplY3Qua2V5cyhkYXRhKS5zb3J0KClcblxuXHRcdFx0XHR2YXIgY2xpZW50cyA9IGFnZW50cy5tYXAoZnVuY3Rpb24oYWdlbnQpIHtcblxuXHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHR0b3BpY3M6IGRhdGFbYWdlbnRdLnJlZ2lzdGVyZWRUb3BpY3Muam9pbignPGJyPicpLFxuXHRcdFx0XHRcdFx0c2VydmljZXM6IGRhdGFbYWdlbnRdLnJlZ2lzdGVyZWRTZXJ2aWNlcy5qb2luKCc8YnI+JyksXG5cdFx0XHRcdFx0XHRuYW1lOiBhZ2VudFxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9KVx0XG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7Y2xpZW50czogY2xpZW50c30pXHRcdFxuXHRcdFx0fVxuXG5cdFx0XHRjbGllbnQucmVnaXN0ZXIoJ21hc3RlckNsaWVudHMnLCB0cnVlLCBvbk1hc3RlckNsaWVudHMpXG5cblxuXHRcdFx0Y2xpZW50Lm9uQ2xvc2UgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtjbGllbnRzOiBbXX0pXG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuZGlzcG9zZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRjbGllbnQudW5yZWdpc3RlcignbWFzdGVyQ2xpZW50cycsIG9uTWFzdGVyQ2xpZW50cylcblx0XHRcdH1cblx0XHR9XG5cblx0fSlcblxuXG5cbn0pKCk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cblxuXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdNYXN0ZXJIaXN0Q29udHJvbCcsIHtcblxuXHRcdGRlcHM6IFsnV2ViU29ja2V0U2VydmljZSddLFxuXG5cdFx0XG5cdGxpYjogJ3N5cycsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGNsaWVudCkge1xuXG5cdFx0XHR2YXIgbW9kZWwgPSB7XG5cdFx0XHRcdHRhYmxlQ29uZmlnOiB7XG5cdFx0XHRcdFx0Y29sdW1uczoge1xuXHRcdFx0XHRcdFx0J3RvcGljJzogJ1RvcGljJyxcblx0XHRcdFx0XHRcdCdzcmMnOiAnU291cmNlJyxcblx0XHRcdFx0XHRcdCdsYXN0TW9kaWYnOiAnTGFzdCBNb2RpZmllZCdcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGFjdGlvbnM6IHtcblx0XHRcdFx0XHRcdCdkZXRhaWwnOiAnZmEgZmEtaW5mbydcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdG5iTXNnOiAwXG5cdFx0XHR9XG5cblxuXG5cdFx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LWNvbCBibi1mbGV4LTFcXFwiPlxcblx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC1yb3cgYm4tc3BhY2UtYmV0d2VlblxcXCI+XFxuXHRcdDxkaXYgY2xhc3M9XFxcImJuLWNvbnRhaW5lciBmaWx0ZXJzXFxcIiBibi1ldmVudD1cXFwiaW5wdXQuZmlsdGVyOiBvbkZpbHRlckNoYW5nZVxcXCI+XFxuXHRcdFx0PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIHBsYWNlaG9sZGVyPVxcXCJGaWx0ZXIgdG9waWNcXFwiIGRhdGEtZmlsdGVyPVxcXCJ0b3BpY1xcXCIgY2xhc3M9XFxcImZpbHRlclxcXCI+XFxuXHRcdFx0PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIHBsYWNlaG9sZGVyPVxcXCJGaWx0ZXIgc291cmNlXFxcIiBkYXRhLWZpbHRlcj1cXFwic3JjXFxcIiBjbGFzcz1cXFwiZmlsdGVyXFxcIj5cdFx0XHRcdFx0XFxuXHRcdDwvZGl2Plxcblx0XHQ8ZGl2Pk1lc3NhZ2VzIE51bWJlcjo8c3BhbiBibi10ZXh0PVxcXCJuYk1zZ1xcXCI+PC9zcGFuPjwvZGl2Plxcblx0PC9kaXY+XFxuXFxuXFxuXHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIkZpbHRlcmVkVGFibGVDb250cm9sXFxcIiBibi1vcHRpb25zPVxcXCJ0YWJsZUNvbmZpZ1xcXCIgY2xhc3M9XFxcImJuLWZsZXgtMSBibi1uby1vdmVyZmxvd1xcXCIgYm4taWZhY2U9XFxcImlmYWNlXFxcIiBibi1ldmVudD1cXFwiaXRlbUFjdGlvbjogb25JdGVtQWN0aW9uXFxcIj5cdFxcbjwvZGl2PlxcblwiLFxuXHRcdFx0XHRkYXRhOiBtb2RlbCwgXG5cdFx0XHRcdGV2ZW50czogXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRvbkl0ZW1BY3Rpb246IGZ1bmN0aW9uKGFjdGlvbiwgaWQpIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdvbkl0ZW1BY3Rpb24nLCBhY3Rpb24sIGlkKVxuXHRcdFx0XHRcdFx0dmFyIGl0ZW0gPSBjdHJsLnNjb3BlLmlmYWNlLmdldEl0ZW0oaWQpXG5cdFx0XHRcdFx0XHR2YXIgaHRtbCA9IGA8cHJlPiR7SlNPTi5zdHJpbmdpZnkoaXRlbS5kYXRhLCBudWxsLCA0KX08L3ByZT5gXG5cdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQoaHRtbCwgJ0RldGFpbCcpXG5cdFx0XHRcdFx0fSxcblxuXHRcdFx0XHRcdG9uRmlsdGVyQ2hhbmdlOiBmdW5jdGlvbihldikge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ29uRmlsdGVyQ2hhbmdlJylcblx0XHRcdFx0XHRcdHZhciBmaWx0ZXIgPSAkKHRoaXMpLmRhdGEoJ2ZpbHRlcicpXG5cdFx0XHRcdFx0XHRmaWx0ZXJzW2ZpbHRlcl0gPSAkKHRoaXMpLnZhbCgpXG5cdFx0XHRcdFx0XHRjdHJsLnNjb3BlLmlmYWNlLnNldEZpbHRlcnMoZmlsdGVycylcblx0XHRcdFx0XHRcdHVwZGF0ZVRvcGljTnVtYmVyKClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cblx0XHRcdGxldCBmaWx0ZXJzID0ge31cblxuXHRcdFx0dmFyIHRib2R5ID0gY3RybC5lbHQuZmluZCgndGJvZHknKVxuXG5cdFx0XHRmdW5jdGlvbiB1cGRhdGVUb3BpY051bWJlcigpIHtcblx0XHRcdFx0dmFyIG5iTXNnID0gdGJvZHkuZmluZCgndHInKS5sZW5ndGhcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtuYk1zZzogbmJNc2d9KVxuXHRcdFx0fVxuXG5cblx0XHRcdGZ1bmN0aW9uIG9uTWVzc2FnZShtc2cpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25NZXNzYWdlJylcblx0XHRcdFx0Y3RybC5zY29wZS5pZmFjZS5hZGRJdGVtKG1zZy50b3BpYywgZ2V0SXRlbURhdGEobXNnKSlcblx0XHRcdFx0dXBkYXRlVG9waWNOdW1iZXIoKVx0XHRcdFxuXHRcdFx0fVxuXG5cdFx0XHRjbGllbnQucmVnaXN0ZXIoJyoqJywgdHJ1ZSwgb25NZXNzYWdlKVxuXG5cdFx0XHRjbGllbnQub25DbG9zZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRjdHJsLnNjb3BlLmlmYWNlLnJlbW92ZUFsbEl0ZW1zKClcblx0XHRcdH1cblxuXG5cdFx0XHRcblx0XHRcdGZ1bmN0aW9uIGdldEl0ZW1EYXRhKG1zZykge1xuXG5cblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHR0b3BpYzogbXNnLnRvcGljLFxuXHRcdFx0XHRcdHNyYzogbXNnLnNyYyxcblx0XHRcdFx0XHRsYXN0TW9kaWY6IG5ldyBEYXRlKG1zZy50aW1lKS50b0xvY2FsZVN0cmluZygpLFxuXHRcdFx0XHRcdGRhdGE6IG1zZy5kYXRhXHRcdFx0XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dGhpcy5kaXNwb3NlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNsaWVudC51bnJlZ2lzdGVyKCcqKicsIG9uTWVzc2FnZSlcblx0XHRcdH1cblx0XHR9XG5cblxuXG5cdH0pXG5cbn0pKCk7XG5cblxuXG5cblxuIiwiKGZ1bmN0aW9uKCkge1xuXG5cblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ1VzZXJEZXRhaWxzQ29udHJvbCcsIHtcblxuXHRcdGRlcHM6IFsnQXBwU2VydmljZScsICdVc2Vyc1NlcnZpY2UnXSxcblx0XHRpZmFjZTogJ3NldFVzZXIodXNlck5hbWUpO2dldFVzZXIoKScsXG5cblx0XHRcblx0bGliOiAnc3lzJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgYXBwU3J2LCB1c2Vyc1Nydikge1xuXG5cdFx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJtYWluXFxcIj5cXG5cXG5cdDxkaXYgYm4tY29udHJvbD1cXFwiVGFiQ29udHJvbFxcXCIgc3R5bGU9XFxcImhlaWdodDogMTAwJTsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcXFwiIGJuLWlmYWNlPVxcXCJ0YWJDdHJsXFxcIj5cXG5cdFx0PGRpdiB0aXRsZT1cXFwiSW5mb1xcXCIgc3R5bGU9XFxcImZsZXg6IDFcXFwiID5cXG5cdFx0XHQ8Zm9ybSBibi1iaW5kPVxcXCJpbmZvXFxcIj5cXG5cdFx0XHRcdDx0YWJsZSBjbGFzcz1cXFwiaW5mbyB3My10YWJsZSB3My1ib3JkZXJcXFwiPlxcblxcblxcblx0XHRcdFx0XHQ8dHI+XFxuXHRcdFx0XHRcdFx0PHRkPlBhc3N3b3JkPC90ZD5cXG5cdFx0XHRcdFx0XHQ8dGQ+PGlucHV0IGNsYXNzPVxcXCJwd2QgdzMtaW5wdXQgdzMtYm9yZGVyXFxcIiB0eXBlPVxcXCJ0ZXh0XFxcIiBuYW1lPVxcXCJwd2RcXFwiPjwvdGQ+XFxuXHRcdFx0XHRcdDwvdHI+XFxuXFxuXHRcdFx0XHRcdDx0cj5cXG5cdFx0XHRcdFx0XHQ8dGQ+TmFtZTwvdGQ+XFxuXHRcdFx0XHRcdFx0PHRkPjxpbnB1dCBjbGFzcz1cXFwicHdkIHczLWlucHV0IHczLWJvcmRlclxcXCIgdHlwZT1cXFwidGV4dFxcXCIgbmFtZT1cXFwibmFtZVxcXCI+PC90ZD5cXG5cdFx0XHRcdFx0PC90cj5cXG5cXG5cdFx0XHRcdFx0PHRyPlxcblx0XHRcdFx0XHRcdDx0ZD5FbWFpbDwvdGQ+XFxuXHRcdFx0XHRcdFx0PHRkPjxpbnB1dCBjbGFzcz1cXFwicHdkIHczLWlucHV0IHczLWJvcmRlclxcXCIgdHlwZT1cXFwiZW1haWxcXFwiIG5hbWU9XFxcImVtYWlsXFxcIj48L3RkPlxcblx0XHRcdFx0XHQ8L3RyPlxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcXG5cXG5cdFx0XHRcdDwvdGFibGU+XHRcXG5cdFx0XHQ8L2Zvcm0+XFxuXHRcdDwvZGl2Plxcblx0XHRcdFx0XFxuXHRcdDxkaXYgdGl0bGU9XFxcIndlYmFwcHNcXFwiIHN0eWxlPVxcXCJmbGV4OiAxOyBvdmVyZmxvdzogYXV0bztcXFwiPlxcblx0XHRcdDx0YWJsZSBjbGFzcz1cXFwiYXBwcyB3My10YWJsZS1hbGxcXFwiPlxcblx0XHRcdFx0PHRoZWFkPlxcblx0XHRcdFx0XHQ8dHIgY2xhc3M9XFxcInczLWdyZWVuXFxcIj5cXG5cdFx0XHRcdFx0XHQ8dGg+QXBwIE5hbWU8L3RoPlxcblx0XHRcdFx0XHRcdDx0aD5BbGxvd2VkPC90aD5cXG5cdFx0XHRcdFx0XHQ8dGg+Q29uZmlndXJhdGlvbjwvdGg+XHRcdFx0XFxuXHRcdFx0XHRcdDwvdHI+XFxuXFxuXHRcdFx0XHQ8L3RoZWFkPlxcblx0XHRcdFx0PHRib2R5IGJuLWVhY2g9XFxcImFwcCBvZiBhcHBzXFxcIiBibi1iaW5kPVxcXCJ0Ym9keVxcXCI+XFxuXHRcdFx0XHRcdDx0cj5cXG5cdFx0XHRcdFx0XHQ8dGQgYm4tdGV4dD1cXFwiYXBwLmFwcE5hbWVcXFwiIG5hbWU9XFxcIm5hbWVcXFwiIGJuLXZhbD1cXFwiYXBwLmFwcE5hbWVcXFwiPjwvdGQ+XFxuXHRcdFx0XHRcdFx0PHRkPjxpbnB1dCBuYW1lPVxcXCJlbmFibGVkXFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCIgYm4tcHJvcD1cXFwiY2hlY2tlZDogYXBwLmFsbG93ZWRcXFwiPjwvdGQ+XFxuXHRcdFx0XHRcdFx0PHRkPjxzZWxlY3QgbmFtZT1cXFwiY29uZmlnXFxcIiAgY2xhc3M9XFxcInczLWJvcmRlciBibi1maWxsXFxcIiBibi1saXN0PVxcXCJhcHAuY29uZmlnc1xcXCIgYm4tdmFsPVxcXCJhcHAuc2VsQ29uZmlnXFxcIj48L3NlbGVjdD48L3RkPlxcblx0XHRcdFx0XHQ8L3RyPlx0XHRcdFx0XFxuXHRcdFx0XHQ8L3Rib2R5Plxcblx0XHRcdDwvdGFibGU+XFxuXHRcdDwvZGl2Plxcblx0PC9kaXY+XFxuXHQ8cD48YnV0dG9uIGNsYXNzPVxcXCJhcHBseSB3My1idG4gdzMtYmx1ZVxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvbkFwcGx5XFxcIj5BcHBseSBjaGFuZ2VzPC9idXR0b24+PC9wPlxcbjwvZGl2PlwiLFxuXHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0YXBwczogW11cblx0XHRcdFx0fSxcdFxuXHRcdFx0XHRldmVudHM6IHtcblx0XHRcdFx0XHRvbkFwcGx5OiBmdW5jdGlvbihldikge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ0FwcGx5JywgZ2V0SW5mb3MoKSlcblx0XHRcdFx0XHRcdHVzZXJzU3J2LnVwZGF0ZSh1c2VyLCBnZXRJbmZvcygpKS50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRcdFx0JCh0aGlzKS5ub3RpZnkoJ0NvbmZpZyBzYXZlZCBzdWNjZXNzZnVsbHknLCB7cG9zaXRpb246ICdyaWdodCB0b3AnLCBjbGFzc05hbWU6ICdzdWNjZXNzJ30pXG5cdFx0XHRcdFx0XHR9KVx0XHRcdFx0XHRcblx0XHRcdFx0XHR9XG5cblxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXG5cblx0XHRcdHZhciB1c2VyXG5cdFx0XHR2YXIgX2FwcHMgPSBbXVxuXG5cblxuXHRcdFx0YXBwU3J2Lmxpc3QoKS50aGVuKGZ1bmN0aW9uKGFwcHMpIHtcblx0XHRcdFx0X2FwcHMgPSBhcHBzXG5cblx0XHRcdH0pXG5cblx0XHRcdHRoaXMuc2V0VXNlciA9IGZ1bmN0aW9uKGlkKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbVXNlckRldGFpbHNDb250cm9sXSBzZXRVc2VyJywgaWQpXG5cdFx0XHRcdHVzZXIgPSBpZFxuXHRcdFx0XHRjdHJsLnNjb3BlLnRhYkN0cmwuc2V0QWN0aXZlKDApXG5cdFx0XHRcdGdldFVzZXJEZXRhaWxzKGlkKVxuXHRcdFx0XHQvL21haW5FbHQuc2hvdygpXHRcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gZ2V0SW5mb3MoKSB7XG5cdFx0XHRcdHZhciBpbmZvcyA9IGN0cmwuc2NvcGUuaW5mby5nZXRGb3JtRGF0YSgpXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdpbmZvcycsIGluZm9zKVxuXG5cdFx0XHRcdHZhciBhbGxvd2VkQXBwcyA9IHt9XG5cdFx0XHRcdGN0cmwuc2NvcGUudGJvZHkuZmluZCgndHInKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHZhciBhcHBJbmZvcyA9ICQodGhpcykuZ2V0Rm9ybURhdGEoKVxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ2FwcEluZm9zJywgYXBwSW5mb3MpXG5cdFx0XHRcdFx0aWYgKGFwcEluZm9zLmVuYWJsZWQpIHtcblx0XHRcdFx0XHRcdGFsbG93ZWRBcHBzW2FwcEluZm9zLm5hbWVdID0gKGFwcEluZm9zLmNvbmZpZyA9PSAnbm9uZScpID8gdHJ1ZSA6IGFwcEluZm9zLmNvbmZpZ1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdFx0aW5mb3MuYWxsb3dlZEFwcHMgPSBhbGxvd2VkQXBwc1xuXG5cblx0XHRcdFx0cmV0dXJuIGluZm9zXG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIGdldFVzZXJEZXRhaWxzKHVzZXIpIHtcblx0XHRcdFx0dXNlcnNTcnYuZ2V0KHVzZXIpLnRoZW4oZnVuY3Rpb24odXNlckRldGFpbHMpIHtcblxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCd1c2VyRGV0YWlscycsIHVzZXJEZXRhaWxzKVxuXG5cdFx0XHRcdFx0Y3RybC5zY29wZS5pbmZvLnNldEZvcm1EYXRhKHVzZXJEZXRhaWxzKVxuXG5cdFx0XHRcdFx0dmFyIGFsbG93ZWRBcHBzID0gdXNlckRldGFpbHMuYWxsb3dlZEFwcHNcblxuXHRcdFx0XHRcdHZhciBhcHBzID0gJCQub2JqMkFycmF5KF9hcHBzKS5tYXAoZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0XHRcdFx0dmFyIGFwcE5hbWUgPSBpdGVtLmtleVxuXG5cdFx0XHRcdFx0XHR2YXIgY29uZmlnID0gYWxsb3dlZEFwcHNbYXBwTmFtZV1cblxuXHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0YXBwTmFtZTogYXBwTmFtZSxcblx0XHRcdFx0XHRcdFx0YWxsb3dlZDogKGNvbmZpZyAhPSB1bmRlZmluZWQpLFxuXHRcdFx0XHRcdFx0XHRzZWxDb25maWc6ICh0eXBlb2YgY29uZmlnID09ICdzdHJpbmcnKSA/IGNvbmZpZyA6ICdub25lJyxcblx0XHRcdFx0XHRcdFx0Y29uZmlnczogWydub25lJ10uY29uY2F0KGl0ZW0udmFsdWUpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSlcdFxuXG5cdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHthcHBzfSlcblxuXHRcdFx0XHR9KVx0XHRcdFxuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmdldFVzZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIHVzZXJcblx0XHRcdH1cblxuXHRcdH1cblxuXHR9KVxuXG59KSgpO1xuIiwiXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnVXNlcnNDb250cm9sJywge1xuXHRkZXBzOiBbJ05vdGlmU2VydmljZScsICdVc2Vyc1NlcnZpY2UnXSxcblx0ZXZlbnRzOiAndXNlclNlbGVjdGVkLHVzZXJEZWxldGVkJyxcblx0XG5cdGxpYjogJ3N5cycsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIG5vdGlmU3J2LCB1c2Vyc1Nydikge1xuXG5cdFx0dmFyIGV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIyKClcblxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LWNvbCBibi1mbGV4LTFcXFwiPlxcblxcblx0PGgxPkFkZCBVc2VyPC9oMT5cXG5cdDxkaXY+XFxuXHRcdDxmb3JtIGJuLWV2ZW50PVxcXCJzdWJtaXQ6IG9uQWRkVXNlclxcXCI+XFxuXHRcdFx0PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIHBsYWNlaG9sZGVyPVxcXCJ1c2VybmFtZVxcXCIgbmFtZT1cXFwidXNlck5hbWVcXFwiIHJlcXVpcmVkIGF1dG9jb21wbGV0ZT1cXFwib2ZmXFxcIiBjbGFzcz1cXFwidzMtaW5wdXQgdzMtYm9yZGVyXFxcIj5cXG5cdFx0XHQ8YnV0dG9uIHR5cGU9XFxcInN1Ym1pdFxcXCIgY2xhc3M9XFxcInczLWJ0biB3My1ibHVlIHczLWJhci1pdGVtIHczLXJpZ2h0XFxcIj5BZGQ8L2J1dHRvbj5cdFx0XHRcXG5cXG5cdFx0PC9mb3JtPlxcblx0PC9kaXY+XHRcdFxcblx0PGgxPlJlZ2lzdGVyZWQgVXNlcnM8L2gxPlxcblx0PGRpdiBjbGFzcz1cXFwic2Nyb2xsUGFuZWxcXFwiPlxcblx0XHQ8dWwgY2xhc3M9XFxcInczLXVsIHczLWJvcmRlciB3My13aGl0ZVxcXCIgYm4tZWFjaD1cXFwidXNlciBvZiB1c2Vyc1xcXCIgYm4tZXZlbnQ9XFxcImNsaWNrLmRlbGV0ZTogb25EZWxldGVVc2VyLCBjbGljay51c2VyOiBvblVzZXJDbGlja2VkLCBjbGljay5ub3RpZjogb25Ob3RpZkNsaWNrZWRcXFwiIGJuLWJpbmQ9XFxcInVsXFxcIj5cXG5cdFx0XHQ8bGkgY2xhc3M9XFxcInczLWJhclxcXCIgYm4tZGF0YT1cXFwidXNlcjogdXNlclxcXCI+XFxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cXFwidzMtYnV0dG9uIHczLXJpZ2h0IGRlbGV0ZVxcXCIgdGl0bGU9XFxcIkRlbGV0ZVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLXRyYXNoXFxcIj48L2k+PC9zcGFuPlxcblx0XHRcdFx0PHNwYW4gY2xhc3M9XFxcInczLWJ1dHRvbiB3My1yaWdodCBub3RpZlxcXCIgdGl0bGU9XFxcIlNlbmQgTm90aWZpY2F0aW9uXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtYmVsbFxcXCI+PC9pPjwvc3Bhbj5cXG5cdFx0XHRcdDxkaXYgY2xhc3M9XFxcInczLWJhci1pdGVtXFxcIj5cXG5cdFx0XHRcdFx0PGEgaHJlZj1cXFwiI1xcXCIgYm4tdGV4dD1cXFwidXNlclxcXCIgY2xhc3M9XFxcInVzZXJcXFwiPjwvYT5cXG5cdFx0XHRcdDwvZGl2Plxcblx0XHRcdDwvbGk+XFxuXHRcdDwvdWw+XFxuXHQ8L2Rpdj5cXG5cXG5cXG48L2Rpdj5cXG5cXG5cdFx0XCIsXG5cdFx0XHRkYXRhOiB7dXNlcnM6IFtdfSxcblx0XHRcdGV2ZW50czoge1xuXG5cdFx0XHRcdG9uQWRkVXNlcjogZnVuY3Rpb24oZXYpIHtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkFkZFVzZXInKVxuXHRcdFx0XHRcdGV2LnByZXZlbnREZWZhdWx0KClcblx0XHRcdFx0XHR2YXIgZGF0YSA9ICQodGhpcykuZ2V0Rm9ybURhdGEoKVxuXHRcdFx0XHRcdCQodGhpcykuZ2V0KDApLnJlc2V0KClcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdzdWJtaXQnLCBkYXRhKVxuXHRcdFx0XHRcdHVzZXJzU3J2LmFkZChkYXRhKVxuXHRcdFx0XHRcdC50aGVuKGxvYWRVc2Vycylcblx0XHRcdFx0XHQuY2F0Y2goKGUpID0+IHtcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ0Vycm9yJywgZSlcblx0XHRcdFx0XHRcdCQkLnNob3dBbGVydChlLnJlc3BvbnNlVGV4dClcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbkRlbGV0ZVVzZXI6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25EZWxldGVVc2VyJylcblx0XHRcdFx0XHR2YXIgdXNlciA9ICQodGhpcykuY2xvc2VzdCgnbGknKS5kYXRhKCd1c2VyJylcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCd1c2VyJywgdXNlcilcblx0XHRcdFx0XHQkJC5zaG93Q29uZmlybSgnQXJlIHlvdXIgc3VyZSA/JywgJ0luZm9ybWF0aW9uJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHR1c2Vyc1Nydi5yZW1vdmUodXNlcikudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0bG9hZFVzZXJzKClcblx0XHRcdFx0XHRcdFx0ZXZlbnRzLmVtaXQoJ3VzZXJEZWxldGVkJywgdXNlcilcblx0XHRcdFx0XHRcdH0pXHRcdFx0XHRcblx0XHRcdFx0XHR9KVx0XHRcdFx0XG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uVXNlckNsaWNrZWQ6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25Vc2VyQ2xpY2tlZCcpXG5cdFx0XHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHRcdGN0cmwuc2NvcGUudWwuZmluZCgnbGknKS5yZW1vdmVDbGFzcygndzMtYmx1ZScpXG5cdFx0XHRcdFx0dmFyICRsaSA9ICQodGhpcykuY2xvc2VzdCgnbGknKVxuXHRcdFx0XHRcdC8vJGxpLmFkZENsYXNzKCd3My1ibHVlJylcblx0XHRcdFx0XHR2YXIgdXNlciA9ICRsaS5kYXRhKCd1c2VyJylcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCd1c2VyJywgdXNlcilcblx0XHRcdFx0XHRldmVudHMuZW1pdCgndXNlclNlbGVjdGVkJywgdXNlcilcdFx0XHRcdFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRvbk5vdGlmQ2xpY2tlZDogZnVuY3Rpb24oZXYpIHtcblx0XHRcdFx0XHR2YXIgdXNlciA9ICQodGhpcykuY2xvc2VzdCgnbGknKS5kYXRhKCd1c2VyJylcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnb25Ob3RpZkNsaWNrZWQnLCB1c2VyKVxuXHRcdFx0XHRcdCQkLnNob3dQcm9tcHQoJ01lc3NhZ2UnLCAnU2VuZE5vdGlmaWNhdGlvbicsIChtZXNzYWdlKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnbWVzc2FnZScsIG1lc3NhZ2UpXG5cdFx0XHRcdFx0XHR2YXIgZGF0YSA9IHtcblx0XHRcdFx0XHRcdFx0dHlwZTogJ21lc3NhZ2UnLFxuXHRcdFx0XHRcdFx0XHRtZXNzYWdlXG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdG5vdGlmU3J2LnNlbmQodXNlciwgZGF0YSkudGhlbigocmVzcCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KVx0XHRcdFxuXG5cblx0XHRmdW5jdGlvbiBsb2FkVXNlcnMoKSB7XG5cdFx0XHR1c2Vyc1Nydi5saXN0KCkudGhlbihmdW5jdGlvbih1c2Vycykge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnbG9hZFVzZXJzJywgdXNlcnMpXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7dXNlcnM6IHVzZXJzfSlcblx0XHRcdH0pXHRcdFx0XG5cdFx0fVxuXG5cdFx0bG9hZFVzZXJzKClcblxuXHRcdHRoaXMub24gPSBldmVudHMub24uYmluZChldmVudHMpXG5cblxuXHR9XG5cbn0pO1xuXG5cbiJdfQ==
