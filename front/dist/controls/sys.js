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

		deps: ['HttpService'],
		iface: 'setUser(userName);getUser()',

		
	lib: 'sys',
init: function(elt, options, http) {

			var ctrl = $$.viewController(elt, {
				template: "<div class=\"main\">\n\n	<div bn-control=\"TabControl\" style=\"height: 100%; display: flex; flex-direction: column;\" bn-iface=\"tabCtrl\">\n		<div title=\"Info\" style=\"flex: 1\" >\n			<form bn-bind=\"info\">\n				<table class=\"info w3-table w3-border\">\n\n\n					<tr>\n						<td>Password</td>\n						<td><input class=\"pwd w3-input w3-border\" type=\"text\" name=\"pwd\"></td>\n					</tr>\n\n					<tr>\n						<td>Name</td>\n						<td><input class=\"pwd w3-input w3-border\" type=\"text\" name=\"name\"></td>\n					</tr>\n\n					<tr>\n						<td>Email</td>\n						<td><input class=\"pwd w3-input w3-border\" type=\"email\" name=\"email\"></td>\n					</tr>\n																				\n\n				</table>	\n			</form>\n		</div>\n				\n		<div title=\"webapps\" style=\"flex: 1; overflow: auto;\">\n			<table class=\"apps w3-table-all\">\n				<thead>\n					<tr class=\"w3-green\">\n						<th>App Name</th>\n						<th>Allowed</th>\n						<th>Configuration</th>			\n					</tr>\n\n				</thead>\n				<tbody bn-each=\"app of apps\" bn-bind=\"tbody\">\n					<tr>\n						<td bn-text=\"app.appName\" name=\"name\" bn-val=\"app.appName\"></td>\n						<td><input name=\"enabled\" type=\"checkbox\" bn-prop=\"checked: app.allowed\"></td>\n						<td><select name=\"config\"  class=\"w3-border bn-fill\" bn-list=\"app.configs\" bn-val=\"app.selConfig\"></select></td>\n					</tr>				\n				</tbody>\n			</table>\n		</div>\n	</div>\n	<p><button class=\"apply w3-btn w3-blue\" bn-event=\"click: onApply\">Apply changes</button></p>\n</div>",
				data: {
					apps: []
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



			http.get('/api/app').then(function(apps) {
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
				http.get(`/api/users/${user}`).then(function(userDetails) {

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
	deps: ['HttpService'],
	events: 'userSelected,userDeleted',
	
	lib: 'sys',
init: function(elt, options, http) {

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
					http.post('/api/users', data).then(loadUsers)
				},
				onDeleteUser: function(ev) {
					//console.log('onDeleteUser')
					var user = $(this).closest('li').data('user')
					//console.log('user', user)
					$$.showConfirm('Are your sure ?', 'Information', function() {
						http.delete(`/api/users/${user}`).then(function() {
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

						http.post('/api/notif/' + user, data).then((resp) => {
							console.log('resp', resp)
						})
					})
				}
			}
		})			


		function loadUsers() {
			http.get('/api/users').then(function(users) {
				console.log('loadUsers', users)
				ctrl.setData({users: users})
			})			
		}

		loadUsers()

		this.on = events.on.bind(events)


	}

});



//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hc3Rlci1hZ2VudHMuanMiLCJtYXN0ZXItY2xpZW50cy5qcyIsIm1hc3Rlci1oaXN0LmpzIiwidXNlci1kZXRhaWxzLmpzIiwidXNlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoic3lzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1xuXG5cblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ01hc3RlckFnZW50c0NvbnRyb2wnLCB7XG5cdFx0ZGVwczogWydXZWJTb2NrZXRTZXJ2aWNlJ10sIFxuXG5cdFx0XG5cdGxpYjogJ3N5cycsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGNsaWVudCkge1xuXG5cdFx0XHRsZXQgaG9zdHMgPSB7fVxuXG5cdFx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJzY3JvbGxQYW5lbFxcXCI+XFxuICAgIDx0YWJsZSBjbGFzcz1cXFwidzMtdGFibGUtYWxsIHczLXNtYWxsXFxcIj5cXG4gICAgICAgIDx0aGVhZD5cXG4gICAgICAgICAgICA8dHIgY2xhc3M9XFxcInczLWdyZWVuXFxcIj5cXG4gICAgICAgICAgICAgICAgPHRoPkFnZW50IE5hbWU8L3RoPlxcbiAgICAgICAgICAgICAgICA8dGg+SG9zdCBOYW1lPC90aD5cXG4gICAgICAgICAgICAgICAgPHRoPlN0YXRlPC90aD5cXG4gICAgICAgICAgICAgICAgPHRoPlBpZDwvdGg+XFxuICAgICAgICAgICAgICAgIDx0aD5BY3Rpb248L3RoPlxcbiAgICAgICAgICAgIDwvdHI+XFxuICAgICAgICA8L3RoZWFkPlxcbiAgICAgICAgPHRib2R5IGJuLWVhY2g9XFxcImEgb2YgYWdlbnRzXFxcIiBibi1ldmVudD1cXFwiY2xpY2suYWN0aW9uU3RhcnQ6IG9uQWN0aW9uU3RhcnQsIGNsaWNrLmFjdGlvblN0b3A6IG9uQWN0aW9uU3RvcCwgY2xpY2suYWN0aW9uU3RvcEZvcmNlOiBvbkFjdGlvblN0b3BGb3JjZVxcXCI+XFxuICBcdFx0XHQ8dHI+XFxuXHRcdFx0XHQ8dGQgYm4tdGV4dD1cXFwiYS5hZ2VudFxcXCI+PC90ZD5cXG5cdFx0XHRcdDx0ZCBibi10ZXh0PVxcXCJhLmhvc3RcXFwiPjwvdGQ+XFxuXHRcdFx0XHQ8dGQgYm4tdGV4dD1cXFwiYS5zdGF0ZVxcXCI+PC90ZD5cXG5cdFx0XHRcdDx0ZCBibi10ZXh0PVxcXCJhLnBpZFxcXCI+PC90ZD5cXG5cdFx0XHRcdDx0ZCBibi1kYXRhPVxcXCJhZ2VudDogYS5hZ2VudFxcXCI+XFxuXHRcdFx0XHRcdDxidXR0b24gY2xhc3M9XFxcImFjdGlvblN0YXJ0IHczLWJ0biB3My1ibHVlXFxcIiBibi1zaG93PVxcXCJhLnN0YXJ0XFxcIj5TdGFydDwvYnV0dG9uPlxcblx0XHRcdFx0XHQ8YnV0dG9uIGNsYXNzPVxcXCJhY3Rpb25TdG9wIHczLWJ0biB3My1ibHVlXFxcIiAgYm4tc2hvdz1cXFwiIWEuc3RhcnRcXFwiPlN0b3A8L2J1dHRvbj5cXG5cdFx0XHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwiYWN0aW9uU3RvcEZvcmNlIHczLWJ0biB3My1yZWRcXFwiIGJuLXNob3c9XFxcIiFhLnN0YXJ0XFxcIj5LaWxsPC9idXR0b24+XFxuXHRcdFx0XHQ8L3RkPlxcblx0XHRcdDwvdHI+ICAgICAgXHRcXG5cXG4gICAgICAgIDwvdGJvZHk+XFxuICAgIDwvdGFibGU+XFxuPC9kaXY+XCIsXG5cdFx0XHRcdGRhdGE6IHthZ2VudHM6IFtdfSxcblx0XHRcdFx0ZXZlbnRzOiB7XG5cdFx0XHRcdFx0b25BY3Rpb25TdGFydDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHR2YXIgYWdlbnQgPSAkKHRoaXMpLmNsb3Nlc3QoJ3RkJykuZGF0YSgnYWdlbnQnKVxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ2FjdGlvblN0YXJ0JywgYWdlbnQpXG5cdFx0XHRcdFx0XHRjbGllbnQuZW1pdCgnbGF1bmNoZXJTdGFydEFnZW50JywgYWdlbnQpXHRcdFx0XHRcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG9uQWN0aW9uU3RvcDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHR2YXIgYWdlbnQgPSAkKHRoaXMpLmNsb3Nlc3QoJ3RkJykuZGF0YSgnYWdlbnQnKVxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ2FjdGlvblN0b3AnLCBhZ2VudClcblx0XHRcdFx0XHRcdGNsaWVudC5lbWl0KCdsYXVuY2hlclN0b3BBZ2VudCcsIGFnZW50KVx0XHRcdFx0XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRvbkFjdGlvblN0b3BGb3JjZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHR2YXIgYWdlbnQgPSAkKHRoaXMpLmNsb3Nlc3QoJ3RkJykuZGF0YSgnYWdlbnQnKVxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ2FjdGlvblN0b3BGb3JjZScsIGFnZW50KVxuXHRcdFx0XHRcdFx0Y2xpZW50LmVtaXQoJ2xhdW5jaGVyU3RvcEFnZW50Jywge2FnZW50OiBhZ2VudCwgZm9yY2U6IHRydWV9KVx0XHRcdFx0XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XHRcdFxuXHRcdFx0fSlcblxuXHRcdFx0Y3RybC5lbHQuYWRkQ2xhc3MoJ2JuLWZsZXgtY29sJylcblx0XHRcdGRpc3BUYWJsZSgpXG5cblx0XHRcdFxuXHRcdFx0ZnVuY3Rpb24gZGlzcFRhYmxlKCkge1xuXHRcdFx0XHR2YXIgZGF0YSA9IFtdXG5cblx0XHRcdFx0Zm9yKHZhciBob3N0TmFtZSBpbiBob3N0cykge1xuXHRcdFx0XHRcdHZhciBhZ2VudHMgPSBob3N0c1tob3N0TmFtZV1cblx0XHRcdFx0XHRmb3IodmFyIGFnZW50IGluIGFnZW50cykge1xuXHRcdFx0XHRcdFx0dmFyIGluZm8gPSBhZ2VudHNbYWdlbnRdXG5cdFx0XHRcdFx0XHRkYXRhLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRwaWQ6IGluZm8ucGlkLFxuXHRcdFx0XHRcdFx0XHRhZ2VudDogYWdlbnQsXG5cdFx0XHRcdFx0XHRcdHN0YXRlOiBpbmZvLnN0YXRlLFxuXHRcdFx0XHRcdFx0XHRzdGFydDogaW5mby5waWQgPT0gMCxcblx0XHRcdFx0XHRcdFx0aG9zdDogaG9zdE5hbWVcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjdHJsLnNldERhdGEoe2FnZW50czogZGF0YX0pXG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIG9uTGF1bmNoZXJTdGF0dXMobXNnKSB7XG5cdFx0XHRcdHZhciBob3N0TmFtZSA9IG1zZy50b3BpYy5zcGxpdCgnLicpWzFdXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2hvc3QnLCBob3N0TmFtZSlcblx0XHRcdFx0aG9zdHNbaG9zdE5hbWVdID0gbXNnLmRhdGFcblx0XHRcdFx0ZGlzcFRhYmxlKClcblx0XHRcdH1cblxuXHRcdFx0Y2xpZW50LnJlZ2lzdGVyKCdsYXVuY2hlclN0YXR1cy4qJywgdHJ1ZSwgb25MYXVuY2hlclN0YXR1cylcblxuXHRcdFx0Y2xpZW50Lm9uQ2xvc2UgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y3RybC5zZXREYXRhKHthZ2VudHM6IFtdfSlcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5kaXNwb3NlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNsaWVudC51bnJlZ2lzdGVyKCdsYXVuY2hlclN0YXR1cy4qJywgb25MYXVuY2hlclN0YXR1cylcblx0XHRcdFx0Ly9jbGllbnQub2ZmRXZlbnQoJ2Rpc2Nvbm5lY3RlZCcsIG9uRGlzY29ubmVjdGVkKVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0fVxuXG5cblx0fSlcblxufSkoKTtcbiIsIihmdW5jdGlvbigpIHtcblxuXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdNYXN0ZXJDbGllbnRzQ29udHJvbCcsIHtcblxuXHRcdGRlcHM6IFsnV2ViU29ja2V0U2VydmljZSddLCBcblxuXHRcdFxuXHRsaWI6ICdzeXMnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBjbGllbnQpIHtcblxuXHRcdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcblx0XHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwic2Nyb2xsUGFuZWxcXFwiPlxcbiAgICA8dGFibGUgY2xhc3M9XFxcInczLXRhYmxlLWFsbCB3My1zbWFsbFxcXCI+XFxuICAgICAgICA8dGhlYWQ+XFxuICAgICAgICAgICAgPHRyIGNsYXNzPVxcXCJ3My1ncmVlblxcXCI+XFxuICAgICAgICAgICAgICAgIDx0aD5OYW1lPC90aD5cXG4gICAgICAgICAgICAgICAgPHRoPlJlZ2lzdGVyZWQgVG9waWNzPC90aD5cXG4gICAgICAgICAgICAgICAgPHRoPlJlZ2lzdGVyZWQgU2VydmljZXM8L3RoPlxcbiAgICAgICAgICAgIDwvdHI+XFxuICAgICAgICA8L3RoZWFkPlxcbiAgICAgICAgPHRib2R5IGJuLWVhY2g9XFxcImMgb2YgY2xpZW50c1xcXCI+XFxuXHRcdFx0PHRyPlxcblx0XHRcdFx0PHRkIGJuLXRleHQ9XFxcImMubmFtZVxcXCI+PC90ZD5cXG5cdFx0XHRcdDx0ZCBibi1odG1sPVxcXCJjLnRvcGljc1xcXCI+PC90ZD5cXG4gICAgICAgICAgICAgICAgPHRkIGJuLWh0bWw9XFxcImMuc2VydmljZXNcXFwiPjwvdGQ+XFxuXHRcdFx0PC90cj4gICAgICAgIFx0XFxuICAgICAgICA8L3Rib2R5PlxcbiAgICA8L3RhYmxlPlxcbjwvZGl2PlwiLFxuXHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0Y2xpZW50czogW11cblx0XHRcdFx0fVxuXHRcdFx0fSlcblxuXHRcdFx0ZnVuY3Rpb24gb25NYXN0ZXJDbGllbnRzKG1zZykge1xuXHRcdFx0XHRjb25zdCBkYXRhID0gbXNnLmRhdGFcblx0XHRcdFx0bGV0IGFnZW50cyA9IE9iamVjdC5rZXlzKGRhdGEpLnNvcnQoKVxuXG5cdFx0XHRcdHZhciBjbGllbnRzID0gYWdlbnRzLm1hcChmdW5jdGlvbihhZ2VudCkge1xuXG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHRvcGljczogZGF0YVthZ2VudF0ucmVnaXN0ZXJlZFRvcGljcy5qb2luKCc8YnI+JyksXG5cdFx0XHRcdFx0XHRzZXJ2aWNlczogZGF0YVthZ2VudF0ucmVnaXN0ZXJlZFNlcnZpY2VzLmpvaW4oJzxicj4nKSxcblx0XHRcdFx0XHRcdG5hbWU6IGFnZW50XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH0pXHRcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtjbGllbnRzOiBjbGllbnRzfSlcdFx0XG5cdFx0XHR9XG5cblx0XHRcdGNsaWVudC5yZWdpc3RlcignbWFzdGVyQ2xpZW50cycsIHRydWUsIG9uTWFzdGVyQ2xpZW50cylcblxuXG5cdFx0XHRjbGllbnQub25DbG9zZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRjdHJsLnNldERhdGEoe2NsaWVudHM6IFtdfSlcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5kaXNwb3NlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNsaWVudC51bnJlZ2lzdGVyKCdtYXN0ZXJDbGllbnRzJywgb25NYXN0ZXJDbGllbnRzKVxuXHRcdFx0fVxuXHRcdH1cblxuXHR9KVxuXG5cblxufSkoKTtcbiIsIihmdW5jdGlvbigpIHtcblxuXG5cblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ01hc3Rlckhpc3RDb250cm9sJywge1xuXG5cdFx0ZGVwczogWydXZWJTb2NrZXRTZXJ2aWNlJ10sXG5cblx0XHRcblx0bGliOiAnc3lzJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucywgY2xpZW50KSB7XG5cblx0XHRcdHZhciBtb2RlbCA9IHtcblx0XHRcdFx0dGFibGVDb25maWc6IHtcblx0XHRcdFx0XHRjb2x1bW5zOiB7XG5cdFx0XHRcdFx0XHQndG9waWMnOiAnVG9waWMnLFxuXHRcdFx0XHRcdFx0J3NyYyc6ICdTb3VyY2UnLFxuXHRcdFx0XHRcdFx0J2xhc3RNb2RpZic6ICdMYXN0IE1vZGlmaWVkJ1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0YWN0aW9uczoge1xuXHRcdFx0XHRcdFx0J2RldGFpbCc6ICdmYSBmYS1pbmZvJ1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSxcblx0XHRcdFx0bmJNc2c6IDBcblx0XHRcdH1cblxuXG5cblx0XHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XG5cdFx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtY29sIGJuLWZsZXgtMVxcXCI+XFxuXHQ8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LXJvdyBibi1zcGFjZS1iZXR3ZWVuXFxcIj5cXG5cdFx0PGRpdiBjbGFzcz1cXFwiYm4tY29udGFpbmVyIGZpbHRlcnNcXFwiIGJuLWV2ZW50PVxcXCJpbnB1dC5maWx0ZXI6IG9uRmlsdGVyQ2hhbmdlXFxcIj5cXG5cdFx0XHQ8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgcGxhY2Vob2xkZXI9XFxcIkZpbHRlciB0b3BpY1xcXCIgZGF0YS1maWx0ZXI9XFxcInRvcGljXFxcIiBjbGFzcz1cXFwiZmlsdGVyXFxcIj5cXG5cdFx0XHQ8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgcGxhY2Vob2xkZXI9XFxcIkZpbHRlciBzb3VyY2VcXFwiIGRhdGEtZmlsdGVyPVxcXCJzcmNcXFwiIGNsYXNzPVxcXCJmaWx0ZXJcXFwiPlx0XHRcdFx0XHRcXG5cdFx0PC9kaXY+XFxuXHRcdDxkaXY+TWVzc2FnZXMgTnVtYmVyOjxzcGFuIGJuLXRleHQ9XFxcIm5iTXNnXFxcIj48L3NwYW4+PC9kaXY+XFxuXHQ8L2Rpdj5cXG5cXG5cXG5cdDxkaXYgYm4tY29udHJvbD1cXFwiRmlsdGVyZWRUYWJsZUNvbnRyb2xcXFwiIGJuLW9wdGlvbnM9XFxcInRhYmxlQ29uZmlnXFxcIiBjbGFzcz1cXFwiYm4tZmxleC0xIGJuLW5vLW92ZXJmbG93XFxcIiBibi1pZmFjZT1cXFwiaWZhY2VcXFwiIGJuLWV2ZW50PVxcXCJpdGVtQWN0aW9uOiBvbkl0ZW1BY3Rpb25cXFwiPlx0XFxuPC9kaXY+XFxuXCIsXG5cdFx0XHRcdGRhdGE6IG1vZGVsLCBcblx0XHRcdFx0ZXZlbnRzOiBcblx0XHRcdFx0e1xuXHRcdFx0XHRcdG9uSXRlbUFjdGlvbjogZnVuY3Rpb24oYWN0aW9uLCBpZCkge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ29uSXRlbUFjdGlvbicsIGFjdGlvbiwgaWQpXG5cdFx0XHRcdFx0XHR2YXIgaXRlbSA9IGN0cmwuc2NvcGUuaWZhY2UuZ2V0SXRlbShpZClcblx0XHRcdFx0XHRcdHZhciBodG1sID0gYDxwcmU+JHtKU09OLnN0cmluZ2lmeShpdGVtLmRhdGEsIG51bGwsIDQpfTwvcHJlPmBcblx0XHRcdFx0XHRcdCQkLnNob3dBbGVydChodG1sLCAnRGV0YWlsJylcblx0XHRcdFx0XHR9LFxuXG5cdFx0XHRcdFx0b25GaWx0ZXJDaGFuZ2U6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnb25GaWx0ZXJDaGFuZ2UnKVxuXHRcdFx0XHRcdFx0dmFyIGZpbHRlciA9ICQodGhpcykuZGF0YSgnZmlsdGVyJylcblx0XHRcdFx0XHRcdGZpbHRlcnNbZmlsdGVyXSA9ICQodGhpcykudmFsKClcblx0XHRcdFx0XHRcdGN0cmwuc2NvcGUuaWZhY2Uuc2V0RmlsdGVycyhmaWx0ZXJzKVxuXHRcdFx0XHRcdFx0dXBkYXRlVG9waWNOdW1iZXIoKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSlcblxuXHRcdFx0bGV0IGZpbHRlcnMgPSB7fVxuXG5cdFx0XHR2YXIgdGJvZHkgPSBjdHJsLmVsdC5maW5kKCd0Ym9keScpXG5cblx0XHRcdGZ1bmN0aW9uIHVwZGF0ZVRvcGljTnVtYmVyKCkge1xuXHRcdFx0XHR2YXIgbmJNc2cgPSB0Ym9keS5maW5kKCd0cicpLmxlbmd0aFxuXHRcdFx0XHRjdHJsLnNldERhdGEoe25iTXNnOiBuYk1zZ30pXG5cdFx0XHR9XG5cblxuXHRcdFx0ZnVuY3Rpb24gb25NZXNzYWdlKG1zZykge1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbk1lc3NhZ2UnKVxuXHRcdFx0XHRjdHJsLnNjb3BlLmlmYWNlLmFkZEl0ZW0obXNnLnRvcGljLCBnZXRJdGVtRGF0YShtc2cpKVxuXHRcdFx0XHR1cGRhdGVUb3BpY051bWJlcigpXHRcdFx0XG5cdFx0XHR9XG5cblx0XHRcdGNsaWVudC5yZWdpc3RlcignKionLCB0cnVlLCBvbk1lc3NhZ2UpXG5cblx0XHRcdGNsaWVudC5vbkNsb3NlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGN0cmwuc2NvcGUuaWZhY2UucmVtb3ZlQWxsSXRlbXMoKVxuXHRcdFx0fVxuXG5cblx0XHRcdFxuXHRcdFx0ZnVuY3Rpb24gZ2V0SXRlbURhdGEobXNnKSB7XG5cblxuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdHRvcGljOiBtc2cudG9waWMsXG5cdFx0XHRcdFx0c3JjOiBtc2cuc3JjLFxuXHRcdFx0XHRcdGxhc3RNb2RpZjogbmV3IERhdGUobXNnLnRpbWUpLnRvTG9jYWxlU3RyaW5nKCksXG5cdFx0XHRcdFx0ZGF0YTogbXNnLmRhdGFcdFx0XHRcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmRpc3Bvc2UgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y2xpZW50LnVucmVnaXN0ZXIoJyoqJywgb25NZXNzYWdlKVxuXHRcdFx0fVxuXHRcdH1cblxuXG5cblx0fSlcblxufSkoKTtcblxuXG5cblxuXG4iLCIoZnVuY3Rpb24oKSB7XG5cblxuXHQkJC5yZWdpc3RlckNvbnRyb2xFeCgnVXNlckRldGFpbHNDb250cm9sJywge1xuXG5cdFx0ZGVwczogWydIdHRwU2VydmljZSddLFxuXHRcdGlmYWNlOiAnc2V0VXNlcih1c2VyTmFtZSk7Z2V0VXNlcigpJyxcblxuXHRcdFxuXHRsaWI6ICdzeXMnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBodHRwKSB7XG5cblx0XHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XG5cdFx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcIm1haW5cXFwiPlxcblxcblx0PGRpdiBibi1jb250cm9sPVxcXCJUYWJDb250cm9sXFxcIiBzdHlsZT1cXFwiaGVpZ2h0OiAxMDAlOyBkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xcXCIgYm4taWZhY2U9XFxcInRhYkN0cmxcXFwiPlxcblx0XHQ8ZGl2IHRpdGxlPVxcXCJJbmZvXFxcIiBzdHlsZT1cXFwiZmxleDogMVxcXCIgPlxcblx0XHRcdDxmb3JtIGJuLWJpbmQ9XFxcImluZm9cXFwiPlxcblx0XHRcdFx0PHRhYmxlIGNsYXNzPVxcXCJpbmZvIHczLXRhYmxlIHczLWJvcmRlclxcXCI+XFxuXFxuXFxuXHRcdFx0XHRcdDx0cj5cXG5cdFx0XHRcdFx0XHQ8dGQ+UGFzc3dvcmQ8L3RkPlxcblx0XHRcdFx0XHRcdDx0ZD48aW5wdXQgY2xhc3M9XFxcInB3ZCB3My1pbnB1dCB3My1ib3JkZXJcXFwiIHR5cGU9XFxcInRleHRcXFwiIG5hbWU9XFxcInB3ZFxcXCI+PC90ZD5cXG5cdFx0XHRcdFx0PC90cj5cXG5cXG5cdFx0XHRcdFx0PHRyPlxcblx0XHRcdFx0XHRcdDx0ZD5OYW1lPC90ZD5cXG5cdFx0XHRcdFx0XHQ8dGQ+PGlucHV0IGNsYXNzPVxcXCJwd2QgdzMtaW5wdXQgdzMtYm9yZGVyXFxcIiB0eXBlPVxcXCJ0ZXh0XFxcIiBuYW1lPVxcXCJuYW1lXFxcIj48L3RkPlxcblx0XHRcdFx0XHQ8L3RyPlxcblxcblx0XHRcdFx0XHQ8dHI+XFxuXHRcdFx0XHRcdFx0PHRkPkVtYWlsPC90ZD5cXG5cdFx0XHRcdFx0XHQ8dGQ+PGlucHV0IGNsYXNzPVxcXCJwd2QgdzMtaW5wdXQgdzMtYm9yZGVyXFxcIiB0eXBlPVxcXCJlbWFpbFxcXCIgbmFtZT1cXFwiZW1haWxcXFwiPjwvdGQ+XFxuXHRcdFx0XHRcdDwvdHI+XFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFxcblxcblx0XHRcdFx0PC90YWJsZT5cdFxcblx0XHRcdDwvZm9ybT5cXG5cdFx0PC9kaXY+XFxuXHRcdFx0XHRcXG5cdFx0PGRpdiB0aXRsZT1cXFwid2ViYXBwc1xcXCIgc3R5bGU9XFxcImZsZXg6IDE7IG92ZXJmbG93OiBhdXRvO1xcXCI+XFxuXHRcdFx0PHRhYmxlIGNsYXNzPVxcXCJhcHBzIHczLXRhYmxlLWFsbFxcXCI+XFxuXHRcdFx0XHQ8dGhlYWQ+XFxuXHRcdFx0XHRcdDx0ciBjbGFzcz1cXFwidzMtZ3JlZW5cXFwiPlxcblx0XHRcdFx0XHRcdDx0aD5BcHAgTmFtZTwvdGg+XFxuXHRcdFx0XHRcdFx0PHRoPkFsbG93ZWQ8L3RoPlxcblx0XHRcdFx0XHRcdDx0aD5Db25maWd1cmF0aW9uPC90aD5cdFx0XHRcXG5cdFx0XHRcdFx0PC90cj5cXG5cXG5cdFx0XHRcdDwvdGhlYWQ+XFxuXHRcdFx0XHQ8dGJvZHkgYm4tZWFjaD1cXFwiYXBwIG9mIGFwcHNcXFwiIGJuLWJpbmQ9XFxcInRib2R5XFxcIj5cXG5cdFx0XHRcdFx0PHRyPlxcblx0XHRcdFx0XHRcdDx0ZCBibi10ZXh0PVxcXCJhcHAuYXBwTmFtZVxcXCIgbmFtZT1cXFwibmFtZVxcXCIgYm4tdmFsPVxcXCJhcHAuYXBwTmFtZVxcXCI+PC90ZD5cXG5cdFx0XHRcdFx0XHQ8dGQ+PGlucHV0IG5hbWU9XFxcImVuYWJsZWRcXFwiIHR5cGU9XFxcImNoZWNrYm94XFxcIiBibi1wcm9wPVxcXCJjaGVja2VkOiBhcHAuYWxsb3dlZFxcXCI+PC90ZD5cXG5cdFx0XHRcdFx0XHQ8dGQ+PHNlbGVjdCBuYW1lPVxcXCJjb25maWdcXFwiICBjbGFzcz1cXFwidzMtYm9yZGVyIGJuLWZpbGxcXFwiIGJuLWxpc3Q9XFxcImFwcC5jb25maWdzXFxcIiBibi12YWw9XFxcImFwcC5zZWxDb25maWdcXFwiPjwvc2VsZWN0PjwvdGQ+XFxuXHRcdFx0XHRcdDwvdHI+XHRcdFx0XHRcXG5cdFx0XHRcdDwvdGJvZHk+XFxuXHRcdFx0PC90YWJsZT5cXG5cdFx0PC9kaXY+XFxuXHQ8L2Rpdj5cXG5cdDxwPjxidXR0b24gY2xhc3M9XFxcImFwcGx5IHczLWJ0biB3My1ibHVlXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uQXBwbHlcXFwiPkFwcGx5IGNoYW5nZXM8L2J1dHRvbj48L3A+XFxuPC9kaXY+XCIsXG5cdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRhcHBzOiBbXVxuXHRcdFx0XHR9LFx0XG5cdFx0XHRcdGV2ZW50czoge1xuXHRcdFx0XHRcdG9uQXBwbHk6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnQXBwbHknLCBnZXRJbmZvcygpKVxuXHRcdFx0XHRcdFx0aHR0cC5wdXQoYC9hcGkvdXNlcnMvJHt1c2VyfWAsIGdldEluZm9zKCkpLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHQkKHRoaXMpLm5vdGlmeSgnQ29uZmlnIHNhdmVkIHN1Y2Nlc3NmdWxseScsIHtwb3NpdGlvbjogJ3JpZ2h0IHRvcCcsIGNsYXNzTmFtZTogJ3N1Y2Nlc3MnfSlcblx0XHRcdFx0XHRcdH0pXHRcdFx0XHRcdFxuXHRcdFx0XHRcdH1cblxuXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cblxuXHRcdFx0dmFyIHVzZXJcblx0XHRcdHZhciBfYXBwcyA9IFtdXG5cblxuXG5cdFx0XHRodHRwLmdldCgnL2FwaS9hcHAnKS50aGVuKGZ1bmN0aW9uKGFwcHMpIHtcblx0XHRcdFx0X2FwcHMgPSBhcHBzXG5cblx0XHRcdH0pXG5cblx0XHRcdHRoaXMuc2V0VXNlciA9IGZ1bmN0aW9uKGlkKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbVXNlckRldGFpbHNDb250cm9sXSBzZXRVc2VyJywgaWQpXG5cdFx0XHRcdHVzZXIgPSBpZFxuXHRcdFx0XHRjdHJsLnNjb3BlLnRhYkN0cmwuc2V0QWN0aXZlKDApXG5cdFx0XHRcdGdldFVzZXJEZXRhaWxzKGlkKVxuXHRcdFx0XHQvL21haW5FbHQuc2hvdygpXHRcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gZ2V0SW5mb3MoKSB7XG5cdFx0XHRcdHZhciBpbmZvcyA9IGN0cmwuc2NvcGUuaW5mby5nZXRGb3JtRGF0YSgpXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdpbmZvcycsIGluZm9zKVxuXG5cdFx0XHRcdHZhciBhbGxvd2VkQXBwcyA9IHt9XG5cdFx0XHRcdGN0cmwuc2NvcGUudGJvZHkuZmluZCgndHInKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHZhciBhcHBJbmZvcyA9ICQodGhpcykuZ2V0Rm9ybURhdGEoKVxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ2FwcEluZm9zJywgYXBwSW5mb3MpXG5cdFx0XHRcdFx0aWYgKGFwcEluZm9zLmVuYWJsZWQpIHtcblx0XHRcdFx0XHRcdGFsbG93ZWRBcHBzW2FwcEluZm9zLm5hbWVdID0gKGFwcEluZm9zLmNvbmZpZyA9PSAnbm9uZScpID8gdHJ1ZSA6IGFwcEluZm9zLmNvbmZpZ1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdFx0aW5mb3MuYWxsb3dlZEFwcHMgPSBhbGxvd2VkQXBwc1xuXG5cblx0XHRcdFx0cmV0dXJuIGluZm9zXG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIGdldFVzZXJEZXRhaWxzKHVzZXIpIHtcblx0XHRcdFx0aHR0cC5nZXQoYC9hcGkvdXNlcnMvJHt1c2VyfWApLnRoZW4oZnVuY3Rpb24odXNlckRldGFpbHMpIHtcblxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCd1c2VyRGV0YWlscycsIHVzZXJEZXRhaWxzKVxuXG5cdFx0XHRcdFx0Y3RybC5zY29wZS5pbmZvLnNldEZvcm1EYXRhKHVzZXJEZXRhaWxzKVxuXG5cdFx0XHRcdFx0dmFyIGFsbG93ZWRBcHBzID0gdXNlckRldGFpbHMuYWxsb3dlZEFwcHNcblxuXHRcdFx0XHRcdHZhciBhcHBzID0gJCQub2JqMkFycmF5KF9hcHBzKS5tYXAoZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0XHRcdFx0dmFyIGFwcE5hbWUgPSBpdGVtLmtleVxuXG5cdFx0XHRcdFx0XHR2YXIgY29uZmlnID0gYWxsb3dlZEFwcHNbYXBwTmFtZV1cblxuXHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0YXBwTmFtZTogYXBwTmFtZSxcblx0XHRcdFx0XHRcdFx0YWxsb3dlZDogKGNvbmZpZyAhPSB1bmRlZmluZWQpLFxuXHRcdFx0XHRcdFx0XHRzZWxDb25maWc6ICh0eXBlb2YgY29uZmlnID09ICdzdHJpbmcnKSA/IGNvbmZpZyA6ICdub25lJyxcblx0XHRcdFx0XHRcdFx0Y29uZmlnczogWydub25lJ10uY29uY2F0KGl0ZW0udmFsdWUpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSlcdFxuXG5cdFx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHthcHBzfSlcblxuXHRcdFx0XHR9KVx0XHRcdFxuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmdldFVzZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIHVzZXJcblx0XHRcdH1cblxuXHRcdH1cblxuXHR9KVxuXG59KSgpO1xuIiwiXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnVXNlcnNDb250cm9sJywge1xuXHRkZXBzOiBbJ0h0dHBTZXJ2aWNlJ10sXG5cdGV2ZW50czogJ3VzZXJTZWxlY3RlZCx1c2VyRGVsZXRlZCcsXG5cdFxuXHRsaWI6ICdzeXMnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBodHRwKSB7XG5cblx0XHR2YXIgZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxuXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcblx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtY29sIGJuLWZsZXgtMVxcXCI+XFxuXFxuXHQ8aDE+QWRkIFVzZXI8L2gxPlxcblx0PGRpdj5cXG5cdFx0PGZvcm0gYm4tZXZlbnQ9XFxcInN1Ym1pdDogb25BZGRVc2VyXFxcIj5cXG5cdFx0XHQ8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgcGxhY2Vob2xkZXI9XFxcInVzZXJuYW1lXFxcIiBuYW1lPVxcXCJ1c2VyTmFtZVxcXCIgcmVxdWlyZWQgYXV0b2NvbXBsZXRlPVxcXCJvZmZcXFwiIGNsYXNzPVxcXCJ3My1pbnB1dCB3My1ib3JkZXJcXFwiPlxcblx0XHRcdDxidXR0b24gdHlwZT1cXFwic3VibWl0XFxcIiBjbGFzcz1cXFwidzMtYnRuIHczLWJsdWUgdzMtYmFyLWl0ZW0gdzMtcmlnaHRcXFwiPkFkZDwvYnV0dG9uPlx0XHRcdFxcblxcblx0XHQ8L2Zvcm0+XFxuXHQ8L2Rpdj5cdFx0XFxuXHQ8aDE+UmVnaXN0ZXJlZCBVc2VyczwvaDE+XFxuXHQ8ZGl2IGNsYXNzPVxcXCJzY3JvbGxQYW5lbFxcXCI+XFxuXHRcdDx1bCBjbGFzcz1cXFwidzMtdWwgdzMtYm9yZGVyIHczLXdoaXRlXFxcIiBibi1lYWNoPVxcXCJ1c2VyIG9mIHVzZXJzXFxcIiBibi1ldmVudD1cXFwiY2xpY2suZGVsZXRlOiBvbkRlbGV0ZVVzZXIsIGNsaWNrLnVzZXI6IG9uVXNlckNsaWNrZWQsIGNsaWNrLm5vdGlmOiBvbk5vdGlmQ2xpY2tlZFxcXCIgYm4tYmluZD1cXFwidWxcXFwiPlxcblx0XHRcdDxsaSBjbGFzcz1cXFwidzMtYmFyXFxcIiBibi1kYXRhPVxcXCJ1c2VyOiB1c2VyXFxcIj5cXG5cdFx0XHRcdDxzcGFuIGNsYXNzPVxcXCJ3My1idXR0b24gdzMtcmlnaHQgZGVsZXRlXFxcIiB0aXRsZT1cXFwiRGVsZXRlXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtdHJhc2hcXFwiPjwvaT48L3NwYW4+XFxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cXFwidzMtYnV0dG9uIHczLXJpZ2h0IG5vdGlmXFxcIiB0aXRsZT1cXFwiU2VuZCBOb3RpZmljYXRpb25cXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1iZWxsXFxcIj48L2k+PC9zcGFuPlxcblx0XHRcdFx0PGRpdiBjbGFzcz1cXFwidzMtYmFyLWl0ZW1cXFwiPlxcblx0XHRcdFx0XHQ8YSBocmVmPVxcXCIjXFxcIiBibi10ZXh0PVxcXCJ1c2VyXFxcIiBjbGFzcz1cXFwidXNlclxcXCI+PC9hPlxcblx0XHRcdFx0PC9kaXY+XFxuXHRcdFx0PC9saT5cXG5cdFx0PC91bD5cXG5cdDwvZGl2PlxcblxcblxcbjwvZGl2Plxcblxcblx0XHRcIixcblx0XHRcdGRhdGE6IHt1c2VyczogW119LFxuXHRcdFx0ZXZlbnRzOiB7XG5cblx0XHRcdFx0b25BZGRVc2VyOiBmdW5jdGlvbihldikge1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQWRkVXNlcicpXG5cdFx0XHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHRcdHZhciBkYXRhID0gJCh0aGlzKS5nZXRGb3JtRGF0YSgpXG5cdFx0XHRcdFx0JCh0aGlzKS5nZXQoMCkucmVzZXQoKVxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ3N1Ym1pdCcsIGRhdGEpXG5cdFx0XHRcdFx0aHR0cC5wb3N0KCcvYXBpL3VzZXJzJywgZGF0YSkudGhlbihsb2FkVXNlcnMpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uRGVsZXRlVXNlcjogZnVuY3Rpb24oZXYpIHtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvbkRlbGV0ZVVzZXInKVxuXHRcdFx0XHRcdHZhciB1c2VyID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpLmRhdGEoJ3VzZXInKVxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ3VzZXInLCB1c2VyKVxuXHRcdFx0XHRcdCQkLnNob3dDb25maXJtKCdBcmUgeW91ciBzdXJlID8nLCAnSW5mb3JtYXRpb24nLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdGh0dHAuZGVsZXRlKGAvYXBpL3VzZXJzLyR7dXNlcn1gKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRsb2FkVXNlcnMoKVxuXHRcdFx0XHRcdFx0XHRldmVudHMuZW1pdCgndXNlckRlbGV0ZWQnLCB1c2VyKVxuXHRcdFx0XHRcdFx0fSlcdFx0XHRcdFxuXHRcdFx0XHRcdH0pXHRcdFx0XHRcblx0XHRcdFx0fSxcblx0XHRcdFx0b25Vc2VyQ2xpY2tlZDogZnVuY3Rpb24oZXYpIHtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvblVzZXJDbGlja2VkJylcblx0XHRcdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdFx0Y3RybC5zY29wZS51bC5maW5kKCdsaScpLnJlbW92ZUNsYXNzKCd3My1ibHVlJylcblx0XHRcdFx0XHR2YXIgJGxpID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpXG5cdFx0XHRcdFx0Ly8kbGkuYWRkQ2xhc3MoJ3czLWJsdWUnKVxuXHRcdFx0XHRcdHZhciB1c2VyID0gJGxpLmRhdGEoJ3VzZXInKVxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ3VzZXInLCB1c2VyKVxuXHRcdFx0XHRcdGV2ZW50cy5lbWl0KCd1c2VyU2VsZWN0ZWQnLCB1c2VyKVx0XHRcdFx0XG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uTm90aWZDbGlja2VkOiBmdW5jdGlvbihldikge1xuXHRcdFx0XHRcdHZhciB1c2VyID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpLmRhdGEoJ3VzZXInKVxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdvbk5vdGlmQ2xpY2tlZCcsIHVzZXIpXG5cdFx0XHRcdFx0JCQuc2hvd1Byb21wdCgnTWVzc2FnZScsICdTZW5kTm90aWZpY2F0aW9uJywgKG1lc3NhZ2UpID0+IHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdtZXNzYWdlJywgbWVzc2FnZSlcblx0XHRcdFx0XHRcdHZhciBkYXRhID0ge1xuXHRcdFx0XHRcdFx0XHR0eXBlOiAnbWVzc2FnZScsXG5cdFx0XHRcdFx0XHRcdG1lc3NhZ2Vcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aHR0cC5wb3N0KCcvYXBpL25vdGlmLycgKyB1c2VyLCBkYXRhKS50aGVuKChyZXNwKSA9PiB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pXHRcdFx0XG5cblxuXHRcdGZ1bmN0aW9uIGxvYWRVc2VycygpIHtcblx0XHRcdGh0dHAuZ2V0KCcvYXBpL3VzZXJzJykudGhlbihmdW5jdGlvbih1c2Vycykge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnbG9hZFVzZXJzJywgdXNlcnMpXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7dXNlcnM6IHVzZXJzfSlcblx0XHRcdH0pXHRcdFx0XG5cdFx0fVxuXG5cdFx0bG9hZFVzZXJzKClcblxuXHRcdHRoaXMub24gPSBldmVudHMub24uYmluZChldmVudHMpXG5cblxuXHR9XG5cbn0pO1xuXG5cbiJdfQ==
