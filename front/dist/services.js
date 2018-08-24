

$$.registerService('AppService', ['HttpService'], function(config, http) {


	return {
		getUserAppsInfo: function() {
			return http.get('/api/app/webapps')
		},


		list: function() {
			return http.get('/api/app')
		}

		
	}
});


	





$$.registerService('FileService', ['HttpService'], function(config, http) {

	return {
		list: function(path, imageOnly, folderOnly) {
			console.log('[FileService] list', path)

			return http.post('/api/file/list', {path, imageOnly, folderOnly})
		},

		fileUrl: function(fileName) {
			return '/api/file/load?fileName=' + fileName
		},

		uploadFile: function(dataUrl, saveAsfileName, destPath) {
			console.log('[FileService] uploadFile', saveAsfileName)
			var blob = $$.dataURLtoBlob(dataUrl)
			if (blob == undefined) {
				return Promise.reject('File format not supported')
			}
			//console.log('blob', blob)
			var fd = new FormData()
			fd.append('picture', blob, saveAsfileName)
			fd.append('destPath', destPath)
			return http.postFormData('/api/file/save', fd)
		},

		removeFiles: function(fileNames) {
			console.log('[FileService] removeFiles', fileNames)
			return http.post('/api/file/delete', fileNames)
		},

		mkdir: function(fileName) {
			console.log('[FileService] mkdir', fileName)
			return http.post('/api/file/mkdir', {fileName: fileName})
		},

		rmdir: function(fileName) {
			console.log('[FileService] rmdir', fileName)
			return http.post('/api/file/rmdir', {fileName: fileName})
		},

		moveFiles: function(fileNames, destPath) {
			console.log('[FileService] moveFiles', fileNames, destPath)
			return http.post('/api/file/move', {fileNames, destPath})
		},

		copyFiles: function(fileNames, destPath) {
			console.log('[FileService] copyFiles', fileNames, destPath)
			return http.post('/api/file/copy', {fileNames, destPath})
		}	
	}

});

(function() {

	$$.registerService('HttpService', function() {
		return {
			get(url) {
				return $.getJSON(url)
			},


			post(url, data) {
				return $.ajax({
					method: 'POST',
					url : url,
					contentType: 'application/json',
					data: JSON.stringify(data)
				})
			},

			put(url, data) {
				return $.ajax({
					method: 'PUT',
					url : url,
					contentType: 'application/json',
					data: JSON.stringify(data)
				})
			},			

			delete(url) {
				return $.ajax({
					method: 'DELETE',
					url : url,
				})				
			},

			postFormData(url, fd) {
				return $.ajax({
				  url: url,
				  type: "POST",
				  data: fd,
				  processData: false,  // indique à jQuery de ne pas traiter les données
				  contentType: false   // indique à jQuery de ne pas configurer le contentType
				})				
			}

			
		}
	})

	
})();






$$.registerService('InvitService', ['HttpService'], function(config, http) {


	return {
		accept: function(from) {
			return http.post('/api/invit/accept/' + from)
		}

		
	}
});


	





(function() {

	$$.registerService('LeafletService', ['WebSocketService'], function(config, client) {

		var L = window.L

		if (! L) {
			throw(`[LeafletService] Missing library dependancy 'leaflet.js'`)
		}
		else {
			console.log('Leaflet version', L.version)
			console.log('LeafletDraw version', L.drawVersion)
			//delete window.L
			$$.loadStyle('/css/leaflet.css')
		}

		return L

	})

})();
(function() {

	$$.registerService('MilSymbolService', function(config) {

		var ms = window.ms

		if (! ms) {
			throw(`[MilSymbolService] Missing library dependancy 'milsymbol.js'`)
		}
		else {
			delete window.ms
		}

		return ms

	})

})();


$$.registerService('NotifService', ['HttpService'], function(config, http) {


	return {
		send: function(dest, notif) {
			return http.post('/api/notif/' + dest, notif)
		},


		sendInvit(to, from) {
			return this.send(to, {
				type: 'invit',
				message: `User <strong>${from}</strong> want to be your friend`,
				from
			})
		},

		delete: function(notifId) {
			return http.delete('/api/notif/' + notifId)
		}


		
	}
});


	





(function() {

	$$.registerService('OpenLayerService', function(config) {

		var ol = window.ol

		if (! ol) {
			throw(`[OpenLayerService] Missing library dependancy 'ol.j'`)
		}
		else {
			delete window.ol
			$$.loadStyle('/css/ol.css')
		}

		return ol

	})

})();


$$.registerService('TchatService', ['HttpService'], function(config, http) {


	return {
		sendText: function(dest, text) {
			return http.post('/api/tchat/send/' + dest, {text})
		}

		
	}
});


	





(function() {

	$$.registerService('TreeCtrlService', function(config) {


		if ($.ui.fancytree == undefined) {
			throw(`[TreeCtrlService] Missing library dependancy 'tree.js'`)
		}
		else {
			console.log('Fancytree version:', $.ui.fancytree.version)
			$$.loadStyle('/css/tree/tree.css')
		}

		return {}

	})

})();

(function() {

	$$.registerService('TweenMaxService', function(config) {

		var TweenMax = window.TweenMax

		if (! TweenMax) {
			throw(`[TweenMaxService] Missing library dependancy 'tween.js'`)
		}
		else {
			//delete window.TweenMax
		}

		return TweenMax

	})

})();


$$.registerService('UserService', function(config) {


	return {
		getName: function() {
			return config.userName
		}


		
	}
});


	







$$.registerService('UsersService', ['HttpService'], function(config, http) {


	return {
		list: function() {
			return http.get('/api/users')
		},

		add: function(data) {
			return http.post('/api/users', data)
		},

		remove: function(user) {
			return http.delete(`/api/users/${user}`)
		},

		update: function(user, data) {
			return http.put(`/api/users/${user}`, data)
		},

		get: function(user) {
			return http.get(`/api/users/${user}`)
		}


		
	}
});


	





(function() {

	var statusCodeMap = {
		0: 'OK',
		100: 'Service not available',
		200: 'Invalid parameters'
	}

	function getErrorMessage(statusCode) {
		return statusCodeMap[statusCode] || ''
	}

	class WebSocketClient {

		constructor(id) {
			this.sock = null
			this.isConnected = false
			this.topics = new EventEmitter2({wildcard: true})
			this.services = new EventEmitter2()
			this.events = new EventEmitter2()

			this.registeredTopics = {}
			this.registeredServices = {}
			this.waitingMsg = {}
			this.suspended = false

			const host = location.hostname
			const port = 8090

			this.url = `wss://${host}:${port}/${id}`
		}

		suspend() {
			this.suspended = true
		}

		resume() {
			if (this.suspended) {
				for(let topic in this.waitingMsg) {
					const msg = this.waitingMsg[topic]
					this.topics.emit(topic, msg)
				}
				this.waitingMsg = {}
				this.suspended = false
			}
		}

		connect() {

			console.log('try to connect...')

			var sock = new WebSocket(this.url)
	
			sock.addEventListener('open', () => {
				console.log("Connected to Master")
				this.isConnected = true
				this.events.emit('connect')

				for(let topic in this.registeredTopics) {
					var getLast = this.registeredTopics[topic]
					this.sendMsg({type: 'register', topic: topic, getLast: getLast})
				}

				for(let srvName in this.registeredServices) {
					this.sendMsg({type: 'registerService', srvName: srvName})
				}

			}) 

			sock.addEventListener('message', (ev) => {
				var msg = JSON.parse(ev.data)


				if (typeof msg.topic == 'string') {
					let split = msg.topic.split('.') // compute the id (layerId.objectId) from topic
					if (split.length == 3) {
						split.shift()
						msg.id = split.join('.')
					}					

					if (this.suspended) {
						this.waitingMsg[msg.topic] = msg
					}
					else {
						this.topics.emit(msg.topic, msg)				
					}

				}

				if (msg.type == 'callService') {
					this.handleCallService(msg)
				}				

				if (msg.type == 'callServiceResp') {
					this.services.emit(msg.srvName, msg)
				}				
			
			})

			sock.addEventListener('close', (code, reason) => {
				//console.log('WS close', code, reason)
				if (this.isConnected) {
					console.log('Disconnected !')
					this.events.emit('disconnect')
				}
				this.isConnected = false
				setTimeout(() => {this.connect()}, 5000)

			})


			this.sock = sock		
		}

		handleCallService(msg) {
			//console.log('handleCallService')
			const func = this.registeredServices[msg.srvName]
			if (typeof func == 'function') {
				var respMsg = {
					type: 'callServiceResp',
					srvName: msg.srvName,
					dest: msg.src,
					statusCode: 0
				}
				func(msg.data, respMsg)
				this.sendMsg(respMsg)			
			}
		}

		sendMsg(msg) {
			//console.log('[Client] sendMsg', msg)
			msg.time = Date.now()
			var text = JSON.stringify(msg)
			if (this.isConnected) {
				this.sock.send(text)
			}
		}

		emit(topic, data) {
			//console.log('publish', topic, data)
			var msg = {
				type: 'notif',
				topic: topic
			}

			if (data !== undefined) {
				msg.data = data
			}
			this.sendMsg(msg)
		}

		on(topic, callback) {

			this.topics.on(topic, callback)
		}

		register(topics, getLast, callback) {
			if (typeof topics == 'string') {
				topics = [topics]
			}

			topics.forEach((topic) => {
				this.registeredTopics[topic] = getLast
				this.on(topic, callback)
				if (this.isConnected) {
					this.sendMsg({type: 'register', topic: topic, getLast: getLast})
				}
			})
			
		}

		unregister(topics, callback) {
			if (typeof topics == 'string') {
				topics = [topics]
			}

			topics.forEach((topic) => {

				this.topics.off(topic, callback)
				var nbListeners = this.topics.listeners(topic).length

				if (this.isConnected && nbListeners == 0) { // no more listeners for this topic
					this.sendMsg({type: 'unregister', topic: topic})
				}		
			})
		}		

		registerService(srvName, func) {
			this.registeredServices[srvName] = func
			if (this.isConnected) {
				this.sendMsg({type: 'registerService', srvName: srvName})
			}		
		}


		callService(srvName, data) {
			console.log('[Client] callService', srvName, data)
			var that = this
			return new Promise((resolve, reject) => {
				this.services.once(srvName, function(msg) {
					var statusCode = msg.statusCode
					if (statusCode == 0) {
						resolve(msg.data)
					}
					else {
						reject({
							code: statusCode,
							message: getErrorMessage(msg.statusCode)
						})
					}
				})

				this.sendMsg({
					type: 'callService',
					srvName: srvName,
					data: data
				})
			})
		}



		sendTo(dest, topic, data) {
			var msg = {
				type: 'cmd',
				topic: topic,
				dest: dest
			}

			if (data !== undefined) {
				msg.data = data
			}
			this.sendMsg(msg)		
		}	
		
	}




	$$.registerService('WebSocketService', function(config) {

		var id = `hmi.${config.appName}.` +  (Date.now() % 100000)

		console.log('id', id)


		const client = new WebSocketClient(id)
		client.connect()

		return client;
	})


})();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZpbGUuanMiLCJodHRwLmpzIiwiaW52aXQuanMiLCJsZWFmbGV0LmpzIiwibWlsc3ltYm9sLmpzIiwibm90aWYuanMiLCJvbC5qcyIsInRjaGF0LmpzIiwidHJlZS5qcyIsInR3ZWVuLmpzIiwidXNlci5qcyIsInVzZXJzLmpzIiwid2Vic29ja2V0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJzZXJ2aWNlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuXG4kJC5yZWdpc3RlclNlcnZpY2UoJ0FwcFNlcnZpY2UnLCBbJ0h0dHBTZXJ2aWNlJ10sIGZ1bmN0aW9uKGNvbmZpZywgaHR0cCkge1xuXG5cblx0cmV0dXJuIHtcblx0XHRnZXRVc2VyQXBwc0luZm86IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGh0dHAuZ2V0KCcvYXBpL2FwcC93ZWJhcHBzJylcblx0XHR9LFxuXG5cblx0XHRsaXN0OiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBodHRwLmdldCgnL2FwaS9hcHAnKVxuXHRcdH1cblxuXHRcdFxuXHR9XG59KTtcblxuXG5cdFxuXG5cblxuXG4iLCIkJC5yZWdpc3RlclNlcnZpY2UoJ0ZpbGVTZXJ2aWNlJywgWydIdHRwU2VydmljZSddLCBmdW5jdGlvbihjb25maWcsIGh0dHApIHtcblxuXHRyZXR1cm4ge1xuXHRcdGxpc3Q6IGZ1bmN0aW9uKHBhdGgsIGltYWdlT25seSwgZm9sZGVyT25seSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ1tGaWxlU2VydmljZV0gbGlzdCcsIHBhdGgpXG5cblx0XHRcdHJldHVybiBodHRwLnBvc3QoJy9hcGkvZmlsZS9saXN0Jywge3BhdGgsIGltYWdlT25seSwgZm9sZGVyT25seX0pXG5cdFx0fSxcblxuXHRcdGZpbGVVcmw6IGZ1bmN0aW9uKGZpbGVOYW1lKSB7XG5cdFx0XHRyZXR1cm4gJy9hcGkvZmlsZS9sb2FkP2ZpbGVOYW1lPScgKyBmaWxlTmFtZVxuXHRcdH0sXG5cblx0XHR1cGxvYWRGaWxlOiBmdW5jdGlvbihkYXRhVXJsLCBzYXZlQXNmaWxlTmFtZSwgZGVzdFBhdGgpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdbRmlsZVNlcnZpY2VdIHVwbG9hZEZpbGUnLCBzYXZlQXNmaWxlTmFtZSlcblx0XHRcdHZhciBibG9iID0gJCQuZGF0YVVSTHRvQmxvYihkYXRhVXJsKVxuXHRcdFx0aWYgKGJsb2IgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHJldHVybiBQcm9taXNlLnJlamVjdCgnRmlsZSBmb3JtYXQgbm90IHN1cHBvcnRlZCcpXG5cdFx0XHR9XG5cdFx0XHQvL2NvbnNvbGUubG9nKCdibG9iJywgYmxvYilcblx0XHRcdHZhciBmZCA9IG5ldyBGb3JtRGF0YSgpXG5cdFx0XHRmZC5hcHBlbmQoJ3BpY3R1cmUnLCBibG9iLCBzYXZlQXNmaWxlTmFtZSlcblx0XHRcdGZkLmFwcGVuZCgnZGVzdFBhdGgnLCBkZXN0UGF0aClcblx0XHRcdHJldHVybiBodHRwLnBvc3RGb3JtRGF0YSgnL2FwaS9maWxlL3NhdmUnLCBmZClcblx0XHR9LFxuXG5cdFx0cmVtb3ZlRmlsZXM6IGZ1bmN0aW9uKGZpbGVOYW1lcykge1xuXHRcdFx0Y29uc29sZS5sb2coJ1tGaWxlU2VydmljZV0gcmVtb3ZlRmlsZXMnLCBmaWxlTmFtZXMpXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0KCcvYXBpL2ZpbGUvZGVsZXRlJywgZmlsZU5hbWVzKVxuXHRcdH0sXG5cblx0XHRta2RpcjogZnVuY3Rpb24oZmlsZU5hbWUpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdbRmlsZVNlcnZpY2VdIG1rZGlyJywgZmlsZU5hbWUpXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0KCcvYXBpL2ZpbGUvbWtkaXInLCB7ZmlsZU5hbWU6IGZpbGVOYW1lfSlcblx0XHR9LFxuXG5cdFx0cm1kaXI6IGZ1bmN0aW9uKGZpbGVOYW1lKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSBybWRpcicsIGZpbGVOYW1lKVxuXHRcdFx0cmV0dXJuIGh0dHAucG9zdCgnL2FwaS9maWxlL3JtZGlyJywge2ZpbGVOYW1lOiBmaWxlTmFtZX0pXG5cdFx0fSxcblxuXHRcdG1vdmVGaWxlczogZnVuY3Rpb24oZmlsZU5hbWVzLCBkZXN0UGF0aCkge1xuXHRcdFx0Y29uc29sZS5sb2coJ1tGaWxlU2VydmljZV0gbW92ZUZpbGVzJywgZmlsZU5hbWVzLCBkZXN0UGF0aClcblx0XHRcdHJldHVybiBodHRwLnBvc3QoJy9hcGkvZmlsZS9tb3ZlJywge2ZpbGVOYW1lcywgZGVzdFBhdGh9KVxuXHRcdH0sXG5cblx0XHRjb3B5RmlsZXM6IGZ1bmN0aW9uKGZpbGVOYW1lcywgZGVzdFBhdGgpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdbRmlsZVNlcnZpY2VdIGNvcHlGaWxlcycsIGZpbGVOYW1lcywgZGVzdFBhdGgpXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0KCcvYXBpL2ZpbGUvY29weScsIHtmaWxlTmFtZXMsIGRlc3RQYXRofSlcblx0XHR9XHRcblx0fVxuXG59KTtcbiIsIihmdW5jdGlvbigpIHtcblxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ0h0dHBTZXJ2aWNlJywgZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGdldCh1cmwpIHtcblx0XHRcdFx0cmV0dXJuICQuZ2V0SlNPTih1cmwpXG5cdFx0XHR9LFxuXG5cblx0XHRcdHBvc3QodXJsLCBkYXRhKSB7XG5cdFx0XHRcdHJldHVybiAkLmFqYXgoe1xuXHRcdFx0XHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdFx0XHRcdHVybCA6IHVybCxcblx0XHRcdFx0XHRjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuXHRcdFx0XHRcdGRhdGE6IEpTT04uc3RyaW5naWZ5KGRhdGEpXG5cdFx0XHRcdH0pXG5cdFx0XHR9LFxuXG5cdFx0XHRwdXQodXJsLCBkYXRhKSB7XG5cdFx0XHRcdHJldHVybiAkLmFqYXgoe1xuXHRcdFx0XHRcdG1ldGhvZDogJ1BVVCcsXG5cdFx0XHRcdFx0dXJsIDogdXJsLFxuXHRcdFx0XHRcdGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG5cdFx0XHRcdFx0ZGF0YTogSlNPTi5zdHJpbmdpZnkoZGF0YSlcblx0XHRcdFx0fSlcblx0XHRcdH0sXHRcdFx0XG5cblx0XHRcdGRlbGV0ZSh1cmwpIHtcblx0XHRcdFx0cmV0dXJuICQuYWpheCh7XG5cdFx0XHRcdFx0bWV0aG9kOiAnREVMRVRFJyxcblx0XHRcdFx0XHR1cmwgOiB1cmwsXG5cdFx0XHRcdH0pXHRcdFx0XHRcblx0XHRcdH0sXG5cblx0XHRcdHBvc3RGb3JtRGF0YSh1cmwsIGZkKSB7XG5cdFx0XHRcdHJldHVybiAkLmFqYXgoe1xuXHRcdFx0XHQgIHVybDogdXJsLFxuXHRcdFx0XHQgIHR5cGU6IFwiUE9TVFwiLFxuXHRcdFx0XHQgIGRhdGE6IGZkLFxuXHRcdFx0XHQgIHByb2Nlc3NEYXRhOiBmYWxzZSwgIC8vIGluZGlxdWUgw6AgalF1ZXJ5IGRlIG5lIHBhcyB0cmFpdGVyIGxlcyBkb25uw6llc1xuXHRcdFx0XHQgIGNvbnRlbnRUeXBlOiBmYWxzZSAgIC8vIGluZGlxdWUgw6AgalF1ZXJ5IGRlIG5lIHBhcyBjb25maWd1cmVyIGxlIGNvbnRlbnRUeXBlXG5cdFx0XHRcdH0pXHRcdFx0XHRcblx0XHRcdH1cblxuXHRcdFx0XG5cdFx0fVxuXHR9KVxuXG5cdFxufSkoKTtcblxuXG5cbiIsIlxuXG4kJC5yZWdpc3RlclNlcnZpY2UoJ0ludml0U2VydmljZScsIFsnSHR0cFNlcnZpY2UnXSwgZnVuY3Rpb24oY29uZmlnLCBodHRwKSB7XG5cblxuXHRyZXR1cm4ge1xuXHRcdGFjY2VwdDogZnVuY3Rpb24oZnJvbSkge1xuXHRcdFx0cmV0dXJuIGh0dHAucG9zdCgnL2FwaS9pbnZpdC9hY2NlcHQvJyArIGZyb20pXG5cdFx0fVxuXG5cdFx0XG5cdH1cbn0pO1xuXG5cblx0XG5cblxuXG5cbiIsIihmdW5jdGlvbigpIHtcblxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ0xlYWZsZXRTZXJ2aWNlJywgWydXZWJTb2NrZXRTZXJ2aWNlJ10sIGZ1bmN0aW9uKGNvbmZpZywgY2xpZW50KSB7XG5cblx0XHR2YXIgTCA9IHdpbmRvdy5MXG5cblx0XHRpZiAoISBMKSB7XG5cdFx0XHR0aHJvdyhgW0xlYWZsZXRTZXJ2aWNlXSBNaXNzaW5nIGxpYnJhcnkgZGVwZW5kYW5jeSAnbGVhZmxldC5qcydgKVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGNvbnNvbGUubG9nKCdMZWFmbGV0IHZlcnNpb24nLCBMLnZlcnNpb24pXG5cdFx0XHRjb25zb2xlLmxvZygnTGVhZmxldERyYXcgdmVyc2lvbicsIEwuZHJhd1ZlcnNpb24pXG5cdFx0XHQvL2RlbGV0ZSB3aW5kb3cuTFxuXHRcdFx0JCQubG9hZFN0eWxlKCcvY3NzL2xlYWZsZXQuY3NzJylcblx0XHR9XG5cblx0XHRyZXR1cm4gTFxuXG5cdH0pXG5cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuXG5cdCQkLnJlZ2lzdGVyU2VydmljZSgnTWlsU3ltYm9sU2VydmljZScsIGZ1bmN0aW9uKGNvbmZpZykge1xuXG5cdFx0dmFyIG1zID0gd2luZG93Lm1zXG5cblx0XHRpZiAoISBtcykge1xuXHRcdFx0dGhyb3coYFtNaWxTeW1ib2xTZXJ2aWNlXSBNaXNzaW5nIGxpYnJhcnkgZGVwZW5kYW5jeSAnbWlsc3ltYm9sLmpzJ2ApXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0ZGVsZXRlIHdpbmRvdy5tc1xuXHRcdH1cblxuXHRcdHJldHVybiBtc1xuXG5cdH0pXG5cbn0pKCk7IiwiXG5cbiQkLnJlZ2lzdGVyU2VydmljZSgnTm90aWZTZXJ2aWNlJywgWydIdHRwU2VydmljZSddLCBmdW5jdGlvbihjb25maWcsIGh0dHApIHtcblxuXG5cdHJldHVybiB7XG5cdFx0c2VuZDogZnVuY3Rpb24oZGVzdCwgbm90aWYpIHtcblx0XHRcdHJldHVybiBodHRwLnBvc3QoJy9hcGkvbm90aWYvJyArIGRlc3QsIG5vdGlmKVxuXHRcdH0sXG5cblxuXHRcdHNlbmRJbnZpdCh0bywgZnJvbSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuc2VuZCh0bywge1xuXHRcdFx0XHR0eXBlOiAnaW52aXQnLFxuXHRcdFx0XHRtZXNzYWdlOiBgVXNlciA8c3Ryb25nPiR7ZnJvbX08L3N0cm9uZz4gd2FudCB0byBiZSB5b3VyIGZyaWVuZGAsXG5cdFx0XHRcdGZyb21cblx0XHRcdH0pXG5cdFx0fSxcblxuXHRcdGRlbGV0ZTogZnVuY3Rpb24obm90aWZJZCkge1xuXHRcdFx0cmV0dXJuIGh0dHAuZGVsZXRlKCcvYXBpL25vdGlmLycgKyBub3RpZklkKVxuXHRcdH1cblxuXG5cdFx0XG5cdH1cbn0pO1xuXG5cblx0XG5cblxuXG5cbiIsIihmdW5jdGlvbigpIHtcblxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ09wZW5MYXllclNlcnZpY2UnLCBmdW5jdGlvbihjb25maWcpIHtcblxuXHRcdHZhciBvbCA9IHdpbmRvdy5vbFxuXG5cdFx0aWYgKCEgb2wpIHtcblx0XHRcdHRocm93KGBbT3BlbkxheWVyU2VydmljZV0gTWlzc2luZyBsaWJyYXJ5IGRlcGVuZGFuY3kgJ29sLmonYClcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRkZWxldGUgd2luZG93Lm9sXG5cdFx0XHQkJC5sb2FkU3R5bGUoJy9jc3Mvb2wuY3NzJylcblx0XHR9XG5cblx0XHRyZXR1cm4gb2xcblxuXHR9KVxuXG59KSgpOyIsIlxuXG4kJC5yZWdpc3RlclNlcnZpY2UoJ1RjaGF0U2VydmljZScsIFsnSHR0cFNlcnZpY2UnXSwgZnVuY3Rpb24oY29uZmlnLCBodHRwKSB7XG5cblxuXHRyZXR1cm4ge1xuXHRcdHNlbmRUZXh0OiBmdW5jdGlvbihkZXN0LCB0ZXh0KSB7XG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0KCcvYXBpL3RjaGF0L3NlbmQvJyArIGRlc3QsIHt0ZXh0fSlcblx0XHR9XG5cblx0XHRcblx0fVxufSk7XG5cblxuXHRcblxuXG5cblxuIiwiKGZ1bmN0aW9uKCkge1xuXG5cdCQkLnJlZ2lzdGVyU2VydmljZSgnVHJlZUN0cmxTZXJ2aWNlJywgZnVuY3Rpb24oY29uZmlnKSB7XG5cblxuXHRcdGlmICgkLnVpLmZhbmN5dHJlZSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdHRocm93KGBbVHJlZUN0cmxTZXJ2aWNlXSBNaXNzaW5nIGxpYnJhcnkgZGVwZW5kYW5jeSAndHJlZS5qcydgKVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGNvbnNvbGUubG9nKCdGYW5jeXRyZWUgdmVyc2lvbjonLCAkLnVpLmZhbmN5dHJlZS52ZXJzaW9uKVxuXHRcdFx0JCQubG9hZFN0eWxlKCcvY3NzL3RyZWUvdHJlZS5jc3MnKVxuXHRcdH1cblxuXHRcdHJldHVybiB7fVxuXG5cdH0pXG5cbn0pKCk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cblx0JCQucmVnaXN0ZXJTZXJ2aWNlKCdUd2Vlbk1heFNlcnZpY2UnLCBmdW5jdGlvbihjb25maWcpIHtcblxuXHRcdHZhciBUd2Vlbk1heCA9IHdpbmRvdy5Ud2Vlbk1heFxuXG5cdFx0aWYgKCEgVHdlZW5NYXgpIHtcblx0XHRcdHRocm93KGBbVHdlZW5NYXhTZXJ2aWNlXSBNaXNzaW5nIGxpYnJhcnkgZGVwZW5kYW5jeSAndHdlZW4uanMnYClcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQvL2RlbGV0ZSB3aW5kb3cuVHdlZW5NYXhcblx0XHR9XG5cblx0XHRyZXR1cm4gVHdlZW5NYXhcblxuXHR9KVxuXG59KSgpOyIsIlxuXG4kJC5yZWdpc3RlclNlcnZpY2UoJ1VzZXJTZXJ2aWNlJywgZnVuY3Rpb24oY29uZmlnKSB7XG5cblxuXHRyZXR1cm4ge1xuXHRcdGdldE5hbWU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGNvbmZpZy51c2VyTmFtZVxuXHRcdH1cblxuXG5cdFx0XG5cdH1cbn0pO1xuXG5cblx0XG5cblxuXG5cbiIsIlxuXG4kJC5yZWdpc3RlclNlcnZpY2UoJ1VzZXJzU2VydmljZScsIFsnSHR0cFNlcnZpY2UnXSwgZnVuY3Rpb24oY29uZmlnLCBodHRwKSB7XG5cblxuXHRyZXR1cm4ge1xuXHRcdGxpc3Q6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGh0dHAuZ2V0KCcvYXBpL3VzZXJzJylcblx0XHR9LFxuXG5cdFx0YWRkOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0KCcvYXBpL3VzZXJzJywgZGF0YSlcblx0XHR9LFxuXG5cdFx0cmVtb3ZlOiBmdW5jdGlvbih1c2VyKSB7XG5cdFx0XHRyZXR1cm4gaHR0cC5kZWxldGUoYC9hcGkvdXNlcnMvJHt1c2VyfWApXG5cdFx0fSxcblxuXHRcdHVwZGF0ZTogZnVuY3Rpb24odXNlciwgZGF0YSkge1xuXHRcdFx0cmV0dXJuIGh0dHAucHV0KGAvYXBpL3VzZXJzLyR7dXNlcn1gLCBkYXRhKVxuXHRcdH0sXG5cblx0XHRnZXQ6IGZ1bmN0aW9uKHVzZXIpIHtcblx0XHRcdHJldHVybiBodHRwLmdldChgL2FwaS91c2Vycy8ke3VzZXJ9YClcblx0XHR9XG5cblxuXHRcdFxuXHR9XG59KTtcblxuXG5cdFxuXG5cblxuXG4iLCIoZnVuY3Rpb24oKSB7XG5cblx0dmFyIHN0YXR1c0NvZGVNYXAgPSB7XG5cdFx0MDogJ09LJyxcblx0XHQxMDA6ICdTZXJ2aWNlIG5vdCBhdmFpbGFibGUnLFxuXHRcdDIwMDogJ0ludmFsaWQgcGFyYW1ldGVycydcblx0fVxuXG5cdGZ1bmN0aW9uIGdldEVycm9yTWVzc2FnZShzdGF0dXNDb2RlKSB7XG5cdFx0cmV0dXJuIHN0YXR1c0NvZGVNYXBbc3RhdHVzQ29kZV0gfHwgJydcblx0fVxuXG5cdGNsYXNzIFdlYlNvY2tldENsaWVudCB7XG5cblx0XHRjb25zdHJ1Y3RvcihpZCkge1xuXHRcdFx0dGhpcy5zb2NrID0gbnVsbFxuXHRcdFx0dGhpcy5pc0Nvbm5lY3RlZCA9IGZhbHNlXG5cdFx0XHR0aGlzLnRvcGljcyA9IG5ldyBFdmVudEVtaXR0ZXIyKHt3aWxkY2FyZDogdHJ1ZX0pXG5cdFx0XHR0aGlzLnNlcnZpY2VzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxuXHRcdFx0dGhpcy5ldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyMigpXG5cblx0XHRcdHRoaXMucmVnaXN0ZXJlZFRvcGljcyA9IHt9XG5cdFx0XHR0aGlzLnJlZ2lzdGVyZWRTZXJ2aWNlcyA9IHt9XG5cdFx0XHR0aGlzLndhaXRpbmdNc2cgPSB7fVxuXHRcdFx0dGhpcy5zdXNwZW5kZWQgPSBmYWxzZVxuXG5cdFx0XHRjb25zdCBob3N0ID0gbG9jYXRpb24uaG9zdG5hbWVcblx0XHRcdGNvbnN0IHBvcnQgPSA4MDkwXG5cblx0XHRcdHRoaXMudXJsID0gYHdzczovLyR7aG9zdH06JHtwb3J0fS8ke2lkfWBcblx0XHR9XG5cblx0XHRzdXNwZW5kKCkge1xuXHRcdFx0dGhpcy5zdXNwZW5kZWQgPSB0cnVlXG5cdFx0fVxuXG5cdFx0cmVzdW1lKCkge1xuXHRcdFx0aWYgKHRoaXMuc3VzcGVuZGVkKSB7XG5cdFx0XHRcdGZvcihsZXQgdG9waWMgaW4gdGhpcy53YWl0aW5nTXNnKSB7XG5cdFx0XHRcdFx0Y29uc3QgbXNnID0gdGhpcy53YWl0aW5nTXNnW3RvcGljXVxuXHRcdFx0XHRcdHRoaXMudG9waWNzLmVtaXQodG9waWMsIG1zZylcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLndhaXRpbmdNc2cgPSB7fVxuXHRcdFx0XHR0aGlzLnN1c3BlbmRlZCA9IGZhbHNlXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29ubmVjdCgpIHtcblxuXHRcdFx0Y29uc29sZS5sb2coJ3RyeSB0byBjb25uZWN0Li4uJylcblxuXHRcdFx0dmFyIHNvY2sgPSBuZXcgV2ViU29ja2V0KHRoaXMudXJsKVxuXHRcblx0XHRcdHNvY2suYWRkRXZlbnRMaXN0ZW5lcignb3BlbicsICgpID0+IHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJDb25uZWN0ZWQgdG8gTWFzdGVyXCIpXG5cdFx0XHRcdHRoaXMuaXNDb25uZWN0ZWQgPSB0cnVlXG5cdFx0XHRcdHRoaXMuZXZlbnRzLmVtaXQoJ2Nvbm5lY3QnKVxuXG5cdFx0XHRcdGZvcihsZXQgdG9waWMgaW4gdGhpcy5yZWdpc3RlcmVkVG9waWNzKSB7XG5cdFx0XHRcdFx0dmFyIGdldExhc3QgPSB0aGlzLnJlZ2lzdGVyZWRUb3BpY3NbdG9waWNdXG5cdFx0XHRcdFx0dGhpcy5zZW5kTXNnKHt0eXBlOiAncmVnaXN0ZXInLCB0b3BpYzogdG9waWMsIGdldExhc3Q6IGdldExhc3R9KVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Zm9yKGxldCBzcnZOYW1lIGluIHRoaXMucmVnaXN0ZXJlZFNlcnZpY2VzKSB7XG5cdFx0XHRcdFx0dGhpcy5zZW5kTXNnKHt0eXBlOiAncmVnaXN0ZXJTZXJ2aWNlJywgc3J2TmFtZTogc3J2TmFtZX0pXG5cdFx0XHRcdH1cblxuXHRcdFx0fSkgXG5cblx0XHRcdHNvY2suYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldikgPT4ge1xuXHRcdFx0XHR2YXIgbXNnID0gSlNPTi5wYXJzZShldi5kYXRhKVxuXG5cblx0XHRcdFx0aWYgKHR5cGVvZiBtc2cudG9waWMgPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHRsZXQgc3BsaXQgPSBtc2cudG9waWMuc3BsaXQoJy4nKSAvLyBjb21wdXRlIHRoZSBpZCAobGF5ZXJJZC5vYmplY3RJZCkgZnJvbSB0b3BpY1xuXHRcdFx0XHRcdGlmIChzcGxpdC5sZW5ndGggPT0gMykge1xuXHRcdFx0XHRcdFx0c3BsaXQuc2hpZnQoKVxuXHRcdFx0XHRcdFx0bXNnLmlkID0gc3BsaXQuam9pbignLicpXG5cdFx0XHRcdFx0fVx0XHRcdFx0XHRcblxuXHRcdFx0XHRcdGlmICh0aGlzLnN1c3BlbmRlZCkge1xuXHRcdFx0XHRcdFx0dGhpcy53YWl0aW5nTXNnW21zZy50b3BpY10gPSBtc2dcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHR0aGlzLnRvcGljcy5lbWl0KG1zZy50b3BpYywgbXNnKVx0XHRcdFx0XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAobXNnLnR5cGUgPT0gJ2NhbGxTZXJ2aWNlJykge1xuXHRcdFx0XHRcdHRoaXMuaGFuZGxlQ2FsbFNlcnZpY2UobXNnKVxuXHRcdFx0XHR9XHRcdFx0XHRcblxuXHRcdFx0XHRpZiAobXNnLnR5cGUgPT0gJ2NhbGxTZXJ2aWNlUmVzcCcpIHtcblx0XHRcdFx0XHR0aGlzLnNlcnZpY2VzLmVtaXQobXNnLnNydk5hbWUsIG1zZylcblx0XHRcdFx0fVx0XHRcdFx0XG5cdFx0XHRcblx0XHRcdH0pXG5cblx0XHRcdHNvY2suYWRkRXZlbnRMaXN0ZW5lcignY2xvc2UnLCAoY29kZSwgcmVhc29uKSA9PiB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1dTIGNsb3NlJywgY29kZSwgcmVhc29uKVxuXHRcdFx0XHRpZiAodGhpcy5pc0Nvbm5lY3RlZCkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdEaXNjb25uZWN0ZWQgIScpXG5cdFx0XHRcdFx0dGhpcy5ldmVudHMuZW1pdCgnZGlzY29ubmVjdCcpXG5cdFx0XHRcdH1cblx0XHRcdFx0dGhpcy5pc0Nvbm5lY3RlZCA9IGZhbHNlXG5cdFx0XHRcdHNldFRpbWVvdXQoKCkgPT4ge3RoaXMuY29ubmVjdCgpfSwgNTAwMClcblxuXHRcdFx0fSlcblxuXG5cdFx0XHR0aGlzLnNvY2sgPSBzb2NrXHRcdFxuXHRcdH1cblxuXHRcdGhhbmRsZUNhbGxTZXJ2aWNlKG1zZykge1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnaGFuZGxlQ2FsbFNlcnZpY2UnKVxuXHRcdFx0Y29uc3QgZnVuYyA9IHRoaXMucmVnaXN0ZXJlZFNlcnZpY2VzW21zZy5zcnZOYW1lXVxuXHRcdFx0aWYgKHR5cGVvZiBmdW5jID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0dmFyIHJlc3BNc2cgPSB7XG5cdFx0XHRcdFx0dHlwZTogJ2NhbGxTZXJ2aWNlUmVzcCcsXG5cdFx0XHRcdFx0c3J2TmFtZTogbXNnLnNydk5hbWUsXG5cdFx0XHRcdFx0ZGVzdDogbXNnLnNyYyxcblx0XHRcdFx0XHRzdGF0dXNDb2RlOiAwXG5cdFx0XHRcdH1cblx0XHRcdFx0ZnVuYyhtc2cuZGF0YSwgcmVzcE1zZylcblx0XHRcdFx0dGhpcy5zZW5kTXNnKHJlc3BNc2cpXHRcdFx0XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0c2VuZE1zZyhtc2cpIHtcblx0XHRcdC8vY29uc29sZS5sb2coJ1tDbGllbnRdIHNlbmRNc2cnLCBtc2cpXG5cdFx0XHRtc2cudGltZSA9IERhdGUubm93KClcblx0XHRcdHZhciB0ZXh0ID0gSlNPTi5zdHJpbmdpZnkobXNnKVxuXHRcdFx0aWYgKHRoaXMuaXNDb25uZWN0ZWQpIHtcblx0XHRcdFx0dGhpcy5zb2NrLnNlbmQodGV4dClcblx0XHRcdH1cblx0XHR9XG5cblx0XHRlbWl0KHRvcGljLCBkYXRhKSB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKCdwdWJsaXNoJywgdG9waWMsIGRhdGEpXG5cdFx0XHR2YXIgbXNnID0ge1xuXHRcdFx0XHR0eXBlOiAnbm90aWYnLFxuXHRcdFx0XHR0b3BpYzogdG9waWNcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRtc2cuZGF0YSA9IGRhdGFcblx0XHRcdH1cblx0XHRcdHRoaXMuc2VuZE1zZyhtc2cpXG5cdFx0fVxuXG5cdFx0b24odG9waWMsIGNhbGxiYWNrKSB7XG5cblx0XHRcdHRoaXMudG9waWNzLm9uKHRvcGljLCBjYWxsYmFjaylcblx0XHR9XG5cblx0XHRyZWdpc3Rlcih0b3BpY3MsIGdldExhc3QsIGNhbGxiYWNrKSB7XG5cdFx0XHRpZiAodHlwZW9mIHRvcGljcyA9PSAnc3RyaW5nJykge1xuXHRcdFx0XHR0b3BpY3MgPSBbdG9waWNzXVxuXHRcdFx0fVxuXG5cdFx0XHR0b3BpY3MuZm9yRWFjaCgodG9waWMpID0+IHtcblx0XHRcdFx0dGhpcy5yZWdpc3RlcmVkVG9waWNzW3RvcGljXSA9IGdldExhc3Rcblx0XHRcdFx0dGhpcy5vbih0b3BpYywgY2FsbGJhY2spXG5cdFx0XHRcdGlmICh0aGlzLmlzQ29ubmVjdGVkKSB7XG5cdFx0XHRcdFx0dGhpcy5zZW5kTXNnKHt0eXBlOiAncmVnaXN0ZXInLCB0b3BpYzogdG9waWMsIGdldExhc3Q6IGdldExhc3R9KVxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0XG5cdFx0fVxuXG5cdFx0dW5yZWdpc3Rlcih0b3BpY3MsIGNhbGxiYWNrKSB7XG5cdFx0XHRpZiAodHlwZW9mIHRvcGljcyA9PSAnc3RyaW5nJykge1xuXHRcdFx0XHR0b3BpY3MgPSBbdG9waWNzXVxuXHRcdFx0fVxuXG5cdFx0XHR0b3BpY3MuZm9yRWFjaCgodG9waWMpID0+IHtcblxuXHRcdFx0XHR0aGlzLnRvcGljcy5vZmYodG9waWMsIGNhbGxiYWNrKVxuXHRcdFx0XHR2YXIgbmJMaXN0ZW5lcnMgPSB0aGlzLnRvcGljcy5saXN0ZW5lcnModG9waWMpLmxlbmd0aFxuXG5cdFx0XHRcdGlmICh0aGlzLmlzQ29ubmVjdGVkICYmIG5iTGlzdGVuZXJzID09IDApIHsgLy8gbm8gbW9yZSBsaXN0ZW5lcnMgZm9yIHRoaXMgdG9waWNcblx0XHRcdFx0XHR0aGlzLnNlbmRNc2coe3R5cGU6ICd1bnJlZ2lzdGVyJywgdG9waWM6IHRvcGljfSlcblx0XHRcdFx0fVx0XHRcblx0XHRcdH0pXG5cdFx0fVx0XHRcblxuXHRcdHJlZ2lzdGVyU2VydmljZShzcnZOYW1lLCBmdW5jKSB7XG5cdFx0XHR0aGlzLnJlZ2lzdGVyZWRTZXJ2aWNlc1tzcnZOYW1lXSA9IGZ1bmNcblx0XHRcdGlmICh0aGlzLmlzQ29ubmVjdGVkKSB7XG5cdFx0XHRcdHRoaXMuc2VuZE1zZyh7dHlwZTogJ3JlZ2lzdGVyU2VydmljZScsIHNydk5hbWU6IHNydk5hbWV9KVxuXHRcdFx0fVx0XHRcblx0XHR9XG5cblxuXHRcdGNhbGxTZXJ2aWNlKHNydk5hbWUsIGRhdGEpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdbQ2xpZW50XSBjYWxsU2VydmljZScsIHNydk5hbWUsIGRhdGEpXG5cdFx0XHR2YXIgdGhhdCA9IHRoaXNcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRcdHRoaXMuc2VydmljZXMub25jZShzcnZOYW1lLCBmdW5jdGlvbihtc2cpIHtcblx0XHRcdFx0XHR2YXIgc3RhdHVzQ29kZSA9IG1zZy5zdGF0dXNDb2RlXG5cdFx0XHRcdFx0aWYgKHN0YXR1c0NvZGUgPT0gMCkge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZShtc2cuZGF0YSlcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRyZWplY3Qoe1xuXHRcdFx0XHRcdFx0XHRjb2RlOiBzdGF0dXNDb2RlLFxuXHRcdFx0XHRcdFx0XHRtZXNzYWdlOiBnZXRFcnJvck1lc3NhZ2UobXNnLnN0YXR1c0NvZGUpXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblxuXHRcdFx0XHR0aGlzLnNlbmRNc2coe1xuXHRcdFx0XHRcdHR5cGU6ICdjYWxsU2VydmljZScsXG5cdFx0XHRcdFx0c3J2TmFtZTogc3J2TmFtZSxcblx0XHRcdFx0XHRkYXRhOiBkYXRhXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdH1cblxuXG5cblx0XHRzZW5kVG8oZGVzdCwgdG9waWMsIGRhdGEpIHtcblx0XHRcdHZhciBtc2cgPSB7XG5cdFx0XHRcdHR5cGU6ICdjbWQnLFxuXHRcdFx0XHR0b3BpYzogdG9waWMsXG5cdFx0XHRcdGRlc3Q6IGRlc3Rcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRtc2cuZGF0YSA9IGRhdGFcblx0XHRcdH1cblx0XHRcdHRoaXMuc2VuZE1zZyhtc2cpXHRcdFxuXHRcdH1cdFxuXHRcdFxuXHR9XG5cblxuXG5cblx0JCQucmVnaXN0ZXJTZXJ2aWNlKCdXZWJTb2NrZXRTZXJ2aWNlJywgZnVuY3Rpb24oY29uZmlnKSB7XG5cblx0XHR2YXIgaWQgPSBgaG1pLiR7Y29uZmlnLmFwcE5hbWV9LmAgKyAgKERhdGUubm93KCkgJSAxMDAwMDApXG5cblx0XHRjb25zb2xlLmxvZygnaWQnLCBpZClcblxuXG5cdFx0Y29uc3QgY2xpZW50ID0gbmV3IFdlYlNvY2tldENsaWVudChpZClcblx0XHRjbGllbnQuY29ubmVjdCgpXG5cblx0XHRyZXR1cm4gY2xpZW50O1xuXHR9KVxuXG5cbn0pKCk7XG4iXX0=
