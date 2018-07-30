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
(function() {

	class WebSocketClient {

		constructor(options) {
			this.sock = null
			this.isConnected = false
			this.topics = new EventEmitter2({wildcard: true})
			this.services = new EventEmitter2()
			this.events = new EventEmitter2()

			this.options = options

			this.registeredTopics = {}
			this.registeredServices = {}
			this.waitingMsg = {}
			this.suspended = false
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
			const {port, host, id} = this.options

			if (!port || !host) {
				console.warn('Websocket not configured !')
				return
				}


			const url = `wss://${host}:${port}/${id}`

			console.log('try to connect...')

			var sock = new WebSocket(url)
	
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


		const client = new WebSocketClient(config)
		client.connect()

		return client;
	})


})();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGUuanMiLCJodHRwLmpzIiwibGVhZmxldC5qcyIsIm1pbHN5bWJvbC5qcyIsIm9sLmpzIiwidHJlZS5qcyIsInR3ZWVuLmpzIiwid2Vic29ja2V0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJzZXJ2aWNlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLnJlZ2lzdGVyU2VydmljZSgnRmlsZVNlcnZpY2UnLCBbJ0h0dHBTZXJ2aWNlJ10sIGZ1bmN0aW9uKGNvbmZpZywgaHR0cCkge1xyXG5cclxuXHRyZXR1cm4ge1xyXG5cdFx0bGlzdDogZnVuY3Rpb24ocGF0aCwgaW1hZ2VPbmx5LCBmb2xkZXJPbmx5KSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdbRmlsZVNlcnZpY2VdIGxpc3QnLCBwYXRoKVxyXG5cclxuXHRcdFx0cmV0dXJuIGh0dHAucG9zdCgnL2FwaS9maWxlL2xpc3QnLCB7cGF0aCwgaW1hZ2VPbmx5LCBmb2xkZXJPbmx5fSlcclxuXHRcdH0sXHJcblxyXG5cdFx0ZmlsZVVybDogZnVuY3Rpb24oZmlsZU5hbWUpIHtcclxuXHRcdFx0cmV0dXJuICcvYXBpL2ZpbGUvbG9hZD9maWxlTmFtZT0nICsgZmlsZU5hbWVcclxuXHRcdH0sXHJcblxyXG5cdFx0dXBsb2FkRmlsZTogZnVuY3Rpb24oZGF0YVVybCwgc2F2ZUFzZmlsZU5hbWUsIGRlc3RQYXRoKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdbRmlsZVNlcnZpY2VdIHVwbG9hZEZpbGUnLCBzYXZlQXNmaWxlTmFtZSlcclxuXHRcdFx0dmFyIGJsb2IgPSAkJC5kYXRhVVJMdG9CbG9iKGRhdGFVcmwpXHJcblx0XHRcdGlmIChibG9iID09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdHJldHVybiBQcm9taXNlLnJlamVjdCgnRmlsZSBmb3JtYXQgbm90IHN1cHBvcnRlZCcpXHJcblx0XHRcdH1cclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnYmxvYicsIGJsb2IpXHJcblx0XHRcdHZhciBmZCA9IG5ldyBGb3JtRGF0YSgpXHJcblx0XHRcdGZkLmFwcGVuZCgncGljdHVyZScsIGJsb2IsIHNhdmVBc2ZpbGVOYW1lKVxyXG5cdFx0XHRmZC5hcHBlbmQoJ2Rlc3RQYXRoJywgZGVzdFBhdGgpXHJcblx0XHRcdHJldHVybiBodHRwLnBvc3RGb3JtRGF0YSgnL2FwaS9maWxlL3NhdmUnLCBmZClcclxuXHRcdH0sXHJcblxyXG5cdFx0cmVtb3ZlRmlsZXM6IGZ1bmN0aW9uKGZpbGVOYW1lcykge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSByZW1vdmVGaWxlcycsIGZpbGVOYW1lcylcclxuXHRcdFx0cmV0dXJuIGh0dHAucG9zdCgnL2FwaS9maWxlL2RlbGV0ZScsIGZpbGVOYW1lcylcclxuXHRcdH0sXHJcblxyXG5cdFx0bWtkaXI6IGZ1bmN0aW9uKGZpbGVOYW1lKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdbRmlsZVNlcnZpY2VdIG1rZGlyJywgZmlsZU5hbWUpXHJcblx0XHRcdHJldHVybiBodHRwLnBvc3QoJy9hcGkvZmlsZS9ta2RpcicsIHtmaWxlTmFtZTogZmlsZU5hbWV9KVxyXG5cdFx0fSxcclxuXHJcblx0XHRybWRpcjogZnVuY3Rpb24oZmlsZU5hbWUpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tGaWxlU2VydmljZV0gcm1kaXInLCBmaWxlTmFtZSlcclxuXHRcdFx0cmV0dXJuIGh0dHAucG9zdCgnL2FwaS9maWxlL3JtZGlyJywge2ZpbGVOYW1lOiBmaWxlTmFtZX0pXHJcblx0XHR9LFxyXG5cclxuXHRcdG1vdmVGaWxlczogZnVuY3Rpb24oZmlsZU5hbWVzLCBkZXN0UGF0aCkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSBtb3ZlRmlsZXMnLCBmaWxlTmFtZXMsIGRlc3RQYXRoKVxyXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0KCcvYXBpL2ZpbGUvbW92ZScsIHtmaWxlTmFtZXMsIGRlc3RQYXRofSlcclxuXHRcdH0sXHJcblxyXG5cdFx0Y29weUZpbGVzOiBmdW5jdGlvbihmaWxlTmFtZXMsIGRlc3RQYXRoKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdbRmlsZVNlcnZpY2VdIGNvcHlGaWxlcycsIGZpbGVOYW1lcywgZGVzdFBhdGgpXHJcblx0XHRcdHJldHVybiBodHRwLnBvc3QoJy9hcGkvZmlsZS9jb3B5Jywge2ZpbGVOYW1lcywgZGVzdFBhdGh9KVxyXG5cdFx0fVx0XHJcblx0fVxyXG5cclxufSk7XHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJTZXJ2aWNlKCdIdHRwU2VydmljZScsIGZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuIHtcclxuXHRcdFx0Z2V0KHVybCkge1xyXG5cdFx0XHRcdHJldHVybiAkLmdldEpTT04odXJsKVxyXG5cdFx0XHR9LFxyXG5cclxuXHJcblx0XHRcdHBvc3QodXJsLCBkYXRhKSB7XHJcblx0XHRcdFx0cmV0dXJuICQuYWpheCh7XHJcblx0XHRcdFx0XHRtZXRob2Q6ICdQT1NUJyxcclxuXHRcdFx0XHRcdHVybCA6IHVybCxcclxuXHRcdFx0XHRcdGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXHJcblx0XHRcdFx0XHRkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRwdXQodXJsLCBkYXRhKSB7XHJcblx0XHRcdFx0cmV0dXJuICQuYWpheCh7XHJcblx0XHRcdFx0XHRtZXRob2Q6ICdQVVQnLFxyXG5cdFx0XHRcdFx0dXJsIDogdXJsLFxyXG5cdFx0XHRcdFx0Y29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuXHRcdFx0XHRcdGRhdGE6IEpTT04uc3RyaW5naWZ5KGRhdGEpXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fSxcdFx0XHRcclxuXHJcblx0XHRcdGRlbGV0ZSh1cmwpIHtcclxuXHRcdFx0XHRyZXR1cm4gJC5hamF4KHtcclxuXHRcdFx0XHRcdG1ldGhvZDogJ0RFTEVURScsXHJcblx0XHRcdFx0XHR1cmwgOiB1cmwsXHJcblx0XHRcdFx0fSlcdFx0XHRcdFxyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0cG9zdEZvcm1EYXRhKHVybCwgZmQpIHtcclxuXHRcdFx0XHRyZXR1cm4gJC5hamF4KHtcclxuXHRcdFx0XHQgIHVybDogdXJsLFxyXG5cdFx0XHRcdCAgdHlwZTogXCJQT1NUXCIsXHJcblx0XHRcdFx0ICBkYXRhOiBmZCxcclxuXHRcdFx0XHQgIHByb2Nlc3NEYXRhOiBmYWxzZSwgIC8vIGluZGlxdWUgw6AgalF1ZXJ5IGRlIG5lIHBhcyB0cmFpdGVyIGxlcyBkb25uw6llc1xyXG5cdFx0XHRcdCAgY29udGVudFR5cGU6IGZhbHNlICAgLy8gaW5kaXF1ZSDDoCBqUXVlcnkgZGUgbmUgcGFzIGNvbmZpZ3VyZXIgbGUgY29udGVudFR5cGVcclxuXHRcdFx0XHR9KVx0XHRcdFx0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdFxyXG5cdFx0fVxyXG5cdH0pXHJcblxyXG5cdFxyXG59KSgpO1xyXG5cclxuXHJcblxyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyU2VydmljZSgnTGVhZmxldFNlcnZpY2UnLCBbJ1dlYlNvY2tldFNlcnZpY2UnXSwgZnVuY3Rpb24oY29uZmlnLCBjbGllbnQpIHtcclxuXHJcblx0XHR2YXIgTCA9IHdpbmRvdy5MXHJcblxyXG5cdFx0aWYgKCEgTCkge1xyXG5cdFx0XHR0aHJvdyhgW0xlYWZsZXRTZXJ2aWNlXSBNaXNzaW5nIGxpYnJhcnkgZGVwZW5kYW5jeSAnbGVhZmxldC5qcydgKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdMZWFmbGV0IHZlcnNpb24nLCBMLnZlcnNpb24pXHJcblx0XHRcdGNvbnNvbGUubG9nKCdMZWFmbGV0RHJhdyB2ZXJzaW9uJywgTC5kcmF3VmVyc2lvbilcclxuXHRcdFx0Ly9kZWxldGUgd2luZG93LkxcclxuXHRcdFx0JCQubG9hZFN0eWxlKCcvY3NzL2xlYWZsZXQuY3NzJylcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gTFxyXG5cclxuXHR9KVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyU2VydmljZSgnTWlsU3ltYm9sU2VydmljZScsIGZ1bmN0aW9uKGNvbmZpZykge1xyXG5cclxuXHRcdHZhciBtcyA9IHdpbmRvdy5tc1xyXG5cclxuXHRcdGlmICghIG1zKSB7XHJcblx0XHRcdHRocm93KGBbTWlsU3ltYm9sU2VydmljZV0gTWlzc2luZyBsaWJyYXJ5IGRlcGVuZGFuY3kgJ21pbHN5bWJvbC5qcydgKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGRlbGV0ZSB3aW5kb3cubXNcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gbXNcclxuXHJcblx0fSlcclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ09wZW5MYXllclNlcnZpY2UnLCBmdW5jdGlvbihjb25maWcpIHtcclxuXHJcblx0XHR2YXIgb2wgPSB3aW5kb3cub2xcclxuXHJcblx0XHRpZiAoISBvbCkge1xyXG5cdFx0XHR0aHJvdyhgW09wZW5MYXllclNlcnZpY2VdIE1pc3NpbmcgbGlicmFyeSBkZXBlbmRhbmN5ICdvbC5qJ2ApXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0ZGVsZXRlIHdpbmRvdy5vbFxyXG5cdFx0XHQkJC5sb2FkU3R5bGUoJy9jc3Mvb2wuY3NzJylcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gb2xcclxuXHJcblx0fSlcclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ1RyZWVDdHJsU2VydmljZScsIGZ1bmN0aW9uKGNvbmZpZykge1xyXG5cclxuXHJcblx0XHRpZiAoJC51aS5mYW5jeXRyZWUgPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdHRocm93KGBbVHJlZUN0cmxTZXJ2aWNlXSBNaXNzaW5nIGxpYnJhcnkgZGVwZW5kYW5jeSAndHJlZS5qcydgKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdGYW5jeXRyZWUgdmVyc2lvbjonLCAkLnVpLmZhbmN5dHJlZS52ZXJzaW9uKVxyXG5cdFx0XHQkJC5sb2FkU3R5bGUoJy9jc3MvdHJlZS90cmVlLmNzcycpXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHt9XHJcblxyXG5cdH0pXHJcblxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyU2VydmljZSgnVHdlZW5NYXhTZXJ2aWNlJywgZnVuY3Rpb24oY29uZmlnKSB7XHJcblxyXG5cdFx0dmFyIFR3ZWVuTWF4ID0gd2luZG93LlR3ZWVuTWF4XHJcblxyXG5cdFx0aWYgKCEgVHdlZW5NYXgpIHtcclxuXHRcdFx0dGhyb3coYFtUd2Vlbk1heFNlcnZpY2VdIE1pc3NpbmcgbGlicmFyeSBkZXBlbmRhbmN5ICd0d2Vlbi5qcydgKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdC8vZGVsZXRlIHdpbmRvdy5Ud2Vlbk1heFxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBUd2Vlbk1heFxyXG5cclxuXHR9KVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdGNsYXNzIFdlYlNvY2tldENsaWVudCB7XHJcblxyXG5cdFx0Y29uc3RydWN0b3Iob3B0aW9ucykge1xyXG5cdFx0XHR0aGlzLnNvY2sgPSBudWxsXHJcblx0XHRcdHRoaXMuaXNDb25uZWN0ZWQgPSBmYWxzZVxyXG5cdFx0XHR0aGlzLnRvcGljcyA9IG5ldyBFdmVudEVtaXR0ZXIyKHt3aWxkY2FyZDogdHJ1ZX0pXHJcblx0XHRcdHRoaXMuc2VydmljZXMgPSBuZXcgRXZlbnRFbWl0dGVyMigpXHJcblx0XHRcdHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxyXG5cclxuXHRcdFx0dGhpcy5vcHRpb25zID0gb3B0aW9uc1xyXG5cclxuXHRcdFx0dGhpcy5yZWdpc3RlcmVkVG9waWNzID0ge31cclxuXHRcdFx0dGhpcy5yZWdpc3RlcmVkU2VydmljZXMgPSB7fVxyXG5cdFx0XHR0aGlzLndhaXRpbmdNc2cgPSB7fVxyXG5cdFx0XHR0aGlzLnN1c3BlbmRlZCA9IGZhbHNlXHJcblx0XHR9XHJcblxyXG5cdFx0c3VzcGVuZCgpIHtcclxuXHRcdFx0dGhpcy5zdXNwZW5kZWQgPSB0cnVlXHJcblx0XHR9XHJcblxyXG5cdFx0cmVzdW1lKCkge1xyXG5cdFx0XHRpZiAodGhpcy5zdXNwZW5kZWQpIHtcclxuXHRcdFx0XHRmb3IobGV0IHRvcGljIGluIHRoaXMud2FpdGluZ01zZykge1xyXG5cdFx0XHRcdFx0Y29uc3QgbXNnID0gdGhpcy53YWl0aW5nTXNnW3RvcGljXVxyXG5cdFx0XHRcdFx0dGhpcy50b3BpY3MuZW1pdCh0b3BpYywgbXNnKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLndhaXRpbmdNc2cgPSB7fVxyXG5cdFx0XHRcdHRoaXMuc3VzcGVuZGVkID0gZmFsc2VcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGNvbm5lY3QoKSB7XHJcblx0XHRcdGNvbnN0IHtwb3J0LCBob3N0LCBpZH0gPSB0aGlzLm9wdGlvbnNcclxuXHJcblx0XHRcdGlmICghcG9ydCB8fCAhaG9zdCkge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybignV2Vic29ja2V0IG5vdCBjb25maWd1cmVkICEnKVxyXG5cdFx0XHRcdHJldHVyblxyXG5cdFx0XHRcdH1cclxuXHJcblxyXG5cdFx0XHRjb25zdCB1cmwgPSBgd3NzOi8vJHtob3N0fToke3BvcnR9LyR7aWR9YFxyXG5cclxuXHRcdFx0Y29uc29sZS5sb2coJ3RyeSB0byBjb25uZWN0Li4uJylcclxuXHJcblx0XHRcdHZhciBzb2NrID0gbmV3IFdlYlNvY2tldCh1cmwpXHJcblx0XHJcblx0XHRcdHNvY2suYWRkRXZlbnRMaXN0ZW5lcignb3BlbicsICgpID0+IHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhcIkNvbm5lY3RlZCB0byBNYXN0ZXJcIilcclxuXHRcdFx0XHR0aGlzLmlzQ29ubmVjdGVkID0gdHJ1ZVxyXG5cdFx0XHRcdHRoaXMuZXZlbnRzLmVtaXQoJ2Nvbm5lY3QnKVxyXG5cclxuXHRcdFx0XHRmb3IobGV0IHRvcGljIGluIHRoaXMucmVnaXN0ZXJlZFRvcGljcykge1xyXG5cdFx0XHRcdFx0dmFyIGdldExhc3QgPSB0aGlzLnJlZ2lzdGVyZWRUb3BpY3NbdG9waWNdXHJcblx0XHRcdFx0XHR0aGlzLnNlbmRNc2coe3R5cGU6ICdyZWdpc3RlcicsIHRvcGljOiB0b3BpYywgZ2V0TGFzdDogZ2V0TGFzdH0pXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRmb3IobGV0IHNydk5hbWUgaW4gdGhpcy5yZWdpc3RlcmVkU2VydmljZXMpIHtcclxuXHRcdFx0XHRcdHRoaXMuc2VuZE1zZyh7dHlwZTogJ3JlZ2lzdGVyU2VydmljZScsIHNydk5hbWU6IHNydk5hbWV9KVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdH0pIFxyXG5cclxuXHRcdFx0c29jay5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2KSA9PiB7XHJcblx0XHRcdFx0dmFyIG1zZyA9IEpTT04ucGFyc2UoZXYuZGF0YSlcclxuXHJcblxyXG5cdFx0XHRcdGlmICh0eXBlb2YgbXNnLnRvcGljID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRsZXQgc3BsaXQgPSBtc2cudG9waWMuc3BsaXQoJy4nKSAvLyBjb21wdXRlIHRoZSBpZCAobGF5ZXJJZC5vYmplY3RJZCkgZnJvbSB0b3BpY1xyXG5cdFx0XHRcdFx0aWYgKHNwbGl0Lmxlbmd0aCA9PSAzKSB7XHJcblx0XHRcdFx0XHRcdHNwbGl0LnNoaWZ0KClcclxuXHRcdFx0XHRcdFx0bXNnLmlkID0gc3BsaXQuam9pbignLicpXHJcblx0XHRcdFx0XHR9XHRcdFx0XHRcdFxyXG5cclxuXHRcdFx0XHRcdGlmICh0aGlzLnN1c3BlbmRlZCkge1xyXG5cdFx0XHRcdFx0XHR0aGlzLndhaXRpbmdNc2dbbXNnLnRvcGljXSA9IG1zZ1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdHRoaXMudG9waWNzLmVtaXQobXNnLnRvcGljLCBtc2cpXHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZiAobXNnLnR5cGUgPT0gJ2NhbGxTZXJ2aWNlJykge1xyXG5cdFx0XHRcdFx0dGhpcy5oYW5kbGVDYWxsU2VydmljZShtc2cpXHJcblx0XHRcdFx0fVx0XHRcdFx0XHJcblxyXG5cdFx0XHRcdGlmIChtc2cudHlwZSA9PSAnY2FsbFNlcnZpY2VSZXNwJykge1xyXG5cdFx0XHRcdFx0dGhpcy5zZXJ2aWNlcy5lbWl0KG1zZy5zcnZOYW1lLCBtc2cpXHJcblx0XHRcdFx0fVx0XHRcdFx0XHJcblx0XHRcdFxyXG5cdFx0XHR9KVxyXG5cclxuXHRcdFx0c29jay5hZGRFdmVudExpc3RlbmVyKCdjbG9zZScsIChjb2RlLCByZWFzb24pID0+IHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdXUyBjbG9zZScsIGNvZGUsIHJlYXNvbilcclxuXHRcdFx0XHRpZiAodGhpcy5pc0Nvbm5lY3RlZCkge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ0Rpc2Nvbm5lY3RlZCAhJylcclxuXHRcdFx0XHRcdHRoaXMuZXZlbnRzLmVtaXQoJ2Rpc2Nvbm5lY3QnKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLmlzQ29ubmVjdGVkID0gZmFsc2VcclxuXHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IHt0aGlzLmNvbm5lY3QoKX0sIDUwMDApXHJcblxyXG5cdFx0XHR9KVxyXG5cclxuXHJcblx0XHRcdHRoaXMuc29jayA9IHNvY2tcdFx0XHJcblx0XHR9XHJcblxyXG5cdFx0aGFuZGxlQ2FsbFNlcnZpY2UobXNnKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2hhbmRsZUNhbGxTZXJ2aWNlJylcclxuXHRcdFx0Y29uc3QgZnVuYyA9IHRoaXMucmVnaXN0ZXJlZFNlcnZpY2VzW21zZy5zcnZOYW1lXVxyXG5cdFx0XHRpZiAodHlwZW9mIGZ1bmMgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdHZhciByZXNwTXNnID0ge1xyXG5cdFx0XHRcdFx0dHlwZTogJ2NhbGxTZXJ2aWNlUmVzcCcsXHJcblx0XHRcdFx0XHRzcnZOYW1lOiBtc2cuc3J2TmFtZSxcclxuXHRcdFx0XHRcdGRlc3Q6IG1zZy5zcmMsXHJcblx0XHRcdFx0XHRzdGF0dXNDb2RlOiAwXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZ1bmMobXNnLmRhdGEsIHJlc3BNc2cpXHJcblx0XHRcdFx0dGhpcy5zZW5kTXNnKHJlc3BNc2cpXHRcdFx0XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRzZW5kTXNnKG1zZykge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbQ2xpZW50XSBzZW5kTXNnJywgbXNnKVxyXG5cdFx0XHRtc2cudGltZSA9IERhdGUubm93KClcclxuXHRcdFx0dmFyIHRleHQgPSBKU09OLnN0cmluZ2lmeShtc2cpXHJcblx0XHRcdGlmICh0aGlzLmlzQ29ubmVjdGVkKSB7XHJcblx0XHRcdFx0dGhpcy5zb2NrLnNlbmQodGV4dClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGVtaXQodG9waWMsIGRhdGEpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygncHVibGlzaCcsIHRvcGljLCBkYXRhKVxyXG5cdFx0XHR2YXIgbXNnID0ge1xyXG5cdFx0XHRcdHR5cGU6ICdub3RpZicsXHJcblx0XHRcdFx0dG9waWM6IHRvcGljXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChkYXRhICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRtc2cuZGF0YSA9IGRhdGFcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLnNlbmRNc2cobXNnKVxyXG5cdFx0fVxyXG5cclxuXHRcdG9uKHRvcGljLCBjYWxsYmFjaykge1xyXG5cclxuXHRcdFx0dGhpcy50b3BpY3Mub24odG9waWMsIGNhbGxiYWNrKVxyXG5cdFx0fVxyXG5cclxuXHRcdHJlZ2lzdGVyKHRvcGljcywgZ2V0TGFzdCwgY2FsbGJhY2spIHtcclxuXHRcdFx0aWYgKHR5cGVvZiB0b3BpY3MgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHR0b3BpY3MgPSBbdG9waWNzXVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0b3BpY3MuZm9yRWFjaCgodG9waWMpID0+IHtcclxuXHRcdFx0XHR0aGlzLnJlZ2lzdGVyZWRUb3BpY3NbdG9waWNdID0gZ2V0TGFzdFxyXG5cdFx0XHRcdHRoaXMub24odG9waWMsIGNhbGxiYWNrKVxyXG5cdFx0XHRcdGlmICh0aGlzLmlzQ29ubmVjdGVkKSB7XHJcblx0XHRcdFx0XHR0aGlzLnNlbmRNc2coe3R5cGU6ICdyZWdpc3RlcicsIHRvcGljOiB0b3BpYywgZ2V0TGFzdDogZ2V0TGFzdH0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0XHRcclxuXHRcdH1cclxuXHJcblx0XHR1bnJlZ2lzdGVyKHRvcGljcywgY2FsbGJhY2spIHtcclxuXHRcdFx0aWYgKHR5cGVvZiB0b3BpY3MgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHR0b3BpY3MgPSBbdG9waWNzXVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0b3BpY3MuZm9yRWFjaCgodG9waWMpID0+IHtcclxuXHJcblx0XHRcdFx0dGhpcy50b3BpY3Mub2ZmKHRvcGljLCBjYWxsYmFjaylcclxuXHRcdFx0XHR2YXIgbmJMaXN0ZW5lcnMgPSB0aGlzLnRvcGljcy5saXN0ZW5lcnModG9waWMpLmxlbmd0aFxyXG5cclxuXHRcdFx0XHRpZiAodGhpcy5pc0Nvbm5lY3RlZCAmJiBuYkxpc3RlbmVycyA9PSAwKSB7IC8vIG5vIG1vcmUgbGlzdGVuZXJzIGZvciB0aGlzIHRvcGljXHJcblx0XHRcdFx0XHR0aGlzLnNlbmRNc2coe3R5cGU6ICd1bnJlZ2lzdGVyJywgdG9waWM6IHRvcGljfSlcclxuXHRcdFx0XHR9XHRcdFxyXG5cdFx0XHR9KVxyXG5cdFx0fVx0XHRcclxuXHJcblx0XHRyZWdpc3RlclNlcnZpY2Uoc3J2TmFtZSwgZnVuYykge1xyXG5cdFx0XHR0aGlzLnJlZ2lzdGVyZWRTZXJ2aWNlc1tzcnZOYW1lXSA9IGZ1bmNcclxuXHRcdFx0aWYgKHRoaXMuaXNDb25uZWN0ZWQpIHtcclxuXHRcdFx0XHR0aGlzLnNlbmRNc2coe3R5cGU6ICdyZWdpc3RlclNlcnZpY2UnLCBzcnZOYW1lOiBzcnZOYW1lfSlcclxuXHRcdFx0fVx0XHRcclxuXHRcdH1cclxuXHJcblxyXG5cdFx0Y2FsbFNlcnZpY2Uoc3J2TmFtZSwgZGF0YSkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0NsaWVudF0gY2FsbFNlcnZpY2UnLCBzcnZOYW1lLCBkYXRhKVxyXG5cdFx0XHR2YXIgdGhhdCA9IHRoaXNcclxuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuXHRcdFx0XHR0aGlzLnNlcnZpY2VzLm9uY2Uoc3J2TmFtZSwgZnVuY3Rpb24obXNnKSB7XHJcblx0XHRcdFx0XHR2YXIgc3RhdHVzQ29kZSA9IG1zZy5zdGF0dXNDb2RlXHJcblx0XHRcdFx0XHRpZiAoc3RhdHVzQ29kZSA9PSAwKSB7XHJcblx0XHRcdFx0XHRcdHJlc29sdmUobXNnLmRhdGEpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0cmVqZWN0KHtcclxuXHRcdFx0XHRcdFx0XHRjb2RlOiBzdGF0dXNDb2RlLFxyXG5cdFx0XHRcdFx0XHRcdG1lc3NhZ2U6IGdldEVycm9yTWVzc2FnZShtc2cuc3RhdHVzQ29kZSlcclxuXHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KVxyXG5cclxuXHRcdFx0XHR0aGlzLnNlbmRNc2coe1xyXG5cdFx0XHRcdFx0dHlwZTogJ2NhbGxTZXJ2aWNlJyxcclxuXHRcdFx0XHRcdHNydk5hbWU6IHNydk5hbWUsXHJcblx0XHRcdFx0XHRkYXRhOiBkYXRhXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHJcblxyXG5cclxuXHRcdHNlbmRUbyhkZXN0LCB0b3BpYywgZGF0YSkge1xyXG5cdFx0XHR2YXIgbXNnID0ge1xyXG5cdFx0XHRcdHR5cGU6ICdjbWQnLFxyXG5cdFx0XHRcdHRvcGljOiB0b3BpYyxcclxuXHRcdFx0XHRkZXN0OiBkZXN0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChkYXRhICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRtc2cuZGF0YSA9IGRhdGFcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLnNlbmRNc2cobXNnKVx0XHRcclxuXHRcdH1cdFxyXG5cdFx0XHJcblx0fVxyXG5cclxuXHJcblxyXG5cclxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ1dlYlNvY2tldFNlcnZpY2UnLCBmdW5jdGlvbihjb25maWcpIHtcclxuXHJcblxyXG5cdFx0Y29uc3QgY2xpZW50ID0gbmV3IFdlYlNvY2tldENsaWVudChjb25maWcpXHJcblx0XHRjbGllbnQuY29ubmVjdCgpXHJcblxyXG5cdFx0cmV0dXJuIGNsaWVudDtcclxuXHR9KVxyXG5cclxuXHJcbn0pKCk7XHJcbiJdfQ==
