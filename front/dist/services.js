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


$$.registerService('UserService', function(config) {


	return {
		getName() {
			return config.userName
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

		var id = `hmi.${config.userName}.${config.appName}.` +  (Date.now() % 100000)

		console.log('id', id)


		const client = new WebSocketClient(id)
		client.connect()

		return client;
	})


})();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGUuanMiLCJodHRwLmpzIiwibGVhZmxldC5qcyIsIm1pbHN5bWJvbC5qcyIsIm9sLmpzIiwidHJlZS5qcyIsInR3ZWVuLmpzIiwidXNlci5qcyIsIndlYnNvY2tldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InNlcnZpY2VzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJCQucmVnaXN0ZXJTZXJ2aWNlKCdGaWxlU2VydmljZScsIFsnSHR0cFNlcnZpY2UnXSwgZnVuY3Rpb24oY29uZmlnLCBodHRwKSB7XG5cblx0cmV0dXJuIHtcblx0XHRsaXN0OiBmdW5jdGlvbihwYXRoLCBpbWFnZU9ubHksIGZvbGRlck9ubHkpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdbRmlsZVNlcnZpY2VdIGxpc3QnLCBwYXRoKVxuXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0KCcvYXBpL2ZpbGUvbGlzdCcsIHtwYXRoLCBpbWFnZU9ubHksIGZvbGRlck9ubHl9KVxuXHRcdH0sXG5cblx0XHRmaWxlVXJsOiBmdW5jdGlvbihmaWxlTmFtZSkge1xuXHRcdFx0cmV0dXJuICcvYXBpL2ZpbGUvbG9hZD9maWxlTmFtZT0nICsgZmlsZU5hbWVcblx0XHR9LFxuXG5cdFx0dXBsb2FkRmlsZTogZnVuY3Rpb24oZGF0YVVybCwgc2F2ZUFzZmlsZU5hbWUsIGRlc3RQYXRoKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSB1cGxvYWRGaWxlJywgc2F2ZUFzZmlsZU5hbWUpXG5cdFx0XHR2YXIgYmxvYiA9ICQkLmRhdGFVUkx0b0Jsb2IoZGF0YVVybClcblx0XHRcdGlmIChibG9iID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZWplY3QoJ0ZpbGUgZm9ybWF0IG5vdCBzdXBwb3J0ZWQnKVxuXHRcdFx0fVxuXHRcdFx0Ly9jb25zb2xlLmxvZygnYmxvYicsIGJsb2IpXG5cdFx0XHR2YXIgZmQgPSBuZXcgRm9ybURhdGEoKVxuXHRcdFx0ZmQuYXBwZW5kKCdwaWN0dXJlJywgYmxvYiwgc2F2ZUFzZmlsZU5hbWUpXG5cdFx0XHRmZC5hcHBlbmQoJ2Rlc3RQYXRoJywgZGVzdFBhdGgpXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0Rm9ybURhdGEoJy9hcGkvZmlsZS9zYXZlJywgZmQpXG5cdFx0fSxcblxuXHRcdHJlbW92ZUZpbGVzOiBmdW5jdGlvbihmaWxlTmFtZXMpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdbRmlsZVNlcnZpY2VdIHJlbW92ZUZpbGVzJywgZmlsZU5hbWVzKVxuXHRcdFx0cmV0dXJuIGh0dHAucG9zdCgnL2FwaS9maWxlL2RlbGV0ZScsIGZpbGVOYW1lcylcblx0XHR9LFxuXG5cdFx0bWtkaXI6IGZ1bmN0aW9uKGZpbGVOYW1lKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSBta2RpcicsIGZpbGVOYW1lKVxuXHRcdFx0cmV0dXJuIGh0dHAucG9zdCgnL2FwaS9maWxlL21rZGlyJywge2ZpbGVOYW1lOiBmaWxlTmFtZX0pXG5cdFx0fSxcblxuXHRcdHJtZGlyOiBmdW5jdGlvbihmaWxlTmFtZSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ1tGaWxlU2VydmljZV0gcm1kaXInLCBmaWxlTmFtZSlcblx0XHRcdHJldHVybiBodHRwLnBvc3QoJy9hcGkvZmlsZS9ybWRpcicsIHtmaWxlTmFtZTogZmlsZU5hbWV9KVxuXHRcdH0sXG5cblx0XHRtb3ZlRmlsZXM6IGZ1bmN0aW9uKGZpbGVOYW1lcywgZGVzdFBhdGgpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdbRmlsZVNlcnZpY2VdIG1vdmVGaWxlcycsIGZpbGVOYW1lcywgZGVzdFBhdGgpXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0KCcvYXBpL2ZpbGUvbW92ZScsIHtmaWxlTmFtZXMsIGRlc3RQYXRofSlcblx0XHR9LFxuXG5cdFx0Y29weUZpbGVzOiBmdW5jdGlvbihmaWxlTmFtZXMsIGRlc3RQYXRoKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSBjb3B5RmlsZXMnLCBmaWxlTmFtZXMsIGRlc3RQYXRoKVxuXHRcdFx0cmV0dXJuIGh0dHAucG9zdCgnL2FwaS9maWxlL2NvcHknLCB7ZmlsZU5hbWVzLCBkZXN0UGF0aH0pXG5cdFx0fVx0XG5cdH1cblxufSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cblx0JCQucmVnaXN0ZXJTZXJ2aWNlKCdIdHRwU2VydmljZScsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRnZXQodXJsKSB7XG5cdFx0XHRcdHJldHVybiAkLmdldEpTT04odXJsKVxuXHRcdFx0fSxcblxuXG5cdFx0XHRwb3N0KHVybCwgZGF0YSkge1xuXHRcdFx0XHRyZXR1cm4gJC5hamF4KHtcblx0XHRcdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdFx0XHR1cmwgOiB1cmwsXG5cdFx0XHRcdFx0Y29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcblx0XHRcdFx0XHRkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKVxuXHRcdFx0XHR9KVxuXHRcdFx0fSxcblxuXHRcdFx0cHV0KHVybCwgZGF0YSkge1xuXHRcdFx0XHRyZXR1cm4gJC5hamF4KHtcblx0XHRcdFx0XHRtZXRob2Q6ICdQVVQnLFxuXHRcdFx0XHRcdHVybCA6IHVybCxcblx0XHRcdFx0XHRjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuXHRcdFx0XHRcdGRhdGE6IEpTT04uc3RyaW5naWZ5KGRhdGEpXG5cdFx0XHRcdH0pXG5cdFx0XHR9LFx0XHRcdFxuXG5cdFx0XHRkZWxldGUodXJsKSB7XG5cdFx0XHRcdHJldHVybiAkLmFqYXgoe1xuXHRcdFx0XHRcdG1ldGhvZDogJ0RFTEVURScsXG5cdFx0XHRcdFx0dXJsIDogdXJsLFxuXHRcdFx0XHR9KVx0XHRcdFx0XG5cdFx0XHR9LFxuXG5cdFx0XHRwb3N0Rm9ybURhdGEodXJsLCBmZCkge1xuXHRcdFx0XHRyZXR1cm4gJC5hamF4KHtcblx0XHRcdFx0ICB1cmw6IHVybCxcblx0XHRcdFx0ICB0eXBlOiBcIlBPU1RcIixcblx0XHRcdFx0ICBkYXRhOiBmZCxcblx0XHRcdFx0ICBwcm9jZXNzRGF0YTogZmFsc2UsICAvLyBpbmRpcXVlIMOgIGpRdWVyeSBkZSBuZSBwYXMgdHJhaXRlciBsZXMgZG9ubsOpZXNcblx0XHRcdFx0ICBjb250ZW50VHlwZTogZmFsc2UgICAvLyBpbmRpcXVlIMOgIGpRdWVyeSBkZSBuZSBwYXMgY29uZmlndXJlciBsZSBjb250ZW50VHlwZVxuXHRcdFx0XHR9KVx0XHRcdFx0XG5cdFx0XHR9XG5cblx0XHRcdFxuXHRcdH1cblx0fSlcblxuXHRcbn0pKCk7XG5cblxuXG4iLCIoZnVuY3Rpb24oKSB7XG5cblx0JCQucmVnaXN0ZXJTZXJ2aWNlKCdMZWFmbGV0U2VydmljZScsIFsnV2ViU29ja2V0U2VydmljZSddLCBmdW5jdGlvbihjb25maWcsIGNsaWVudCkge1xuXG5cdFx0dmFyIEwgPSB3aW5kb3cuTFxuXG5cdFx0aWYgKCEgTCkge1xuXHRcdFx0dGhyb3coYFtMZWFmbGV0U2VydmljZV0gTWlzc2luZyBsaWJyYXJ5IGRlcGVuZGFuY3kgJ2xlYWZsZXQuanMnYClcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRjb25zb2xlLmxvZygnTGVhZmxldCB2ZXJzaW9uJywgTC52ZXJzaW9uKVxuXHRcdFx0Y29uc29sZS5sb2coJ0xlYWZsZXREcmF3IHZlcnNpb24nLCBMLmRyYXdWZXJzaW9uKVxuXHRcdFx0Ly9kZWxldGUgd2luZG93Lkxcblx0XHRcdCQkLmxvYWRTdHlsZSgnL2Nzcy9sZWFmbGV0LmNzcycpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIExcblxuXHR9KVxuXG59KSgpOyIsIihmdW5jdGlvbigpIHtcblxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ01pbFN5bWJvbFNlcnZpY2UnLCBmdW5jdGlvbihjb25maWcpIHtcblxuXHRcdHZhciBtcyA9IHdpbmRvdy5tc1xuXG5cdFx0aWYgKCEgbXMpIHtcblx0XHRcdHRocm93KGBbTWlsU3ltYm9sU2VydmljZV0gTWlzc2luZyBsaWJyYXJ5IGRlcGVuZGFuY3kgJ21pbHN5bWJvbC5qcydgKVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGRlbGV0ZSB3aW5kb3cubXNcblx0XHR9XG5cblx0XHRyZXR1cm4gbXNcblxuXHR9KVxuXG59KSgpOyIsIihmdW5jdGlvbigpIHtcblxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ09wZW5MYXllclNlcnZpY2UnLCBmdW5jdGlvbihjb25maWcpIHtcblxuXHRcdHZhciBvbCA9IHdpbmRvdy5vbFxuXG5cdFx0aWYgKCEgb2wpIHtcblx0XHRcdHRocm93KGBbT3BlbkxheWVyU2VydmljZV0gTWlzc2luZyBsaWJyYXJ5IGRlcGVuZGFuY3kgJ29sLmonYClcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRkZWxldGUgd2luZG93Lm9sXG5cdFx0XHQkJC5sb2FkU3R5bGUoJy9jc3Mvb2wuY3NzJylcblx0XHR9XG5cblx0XHRyZXR1cm4gb2xcblxuXHR9KVxuXG59KSgpOyIsIihmdW5jdGlvbigpIHtcblxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ1RyZWVDdHJsU2VydmljZScsIGZ1bmN0aW9uKGNvbmZpZykge1xuXG5cblx0XHRpZiAoJC51aS5mYW5jeXRyZWUgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR0aHJvdyhgW1RyZWVDdHJsU2VydmljZV0gTWlzc2luZyBsaWJyYXJ5IGRlcGVuZGFuY3kgJ3RyZWUuanMnYClcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRjb25zb2xlLmxvZygnRmFuY3l0cmVlIHZlcnNpb246JywgJC51aS5mYW5jeXRyZWUudmVyc2lvbilcblx0XHRcdCQkLmxvYWRTdHlsZSgnL2Nzcy90cmVlL3RyZWUuY3NzJylcblx0XHR9XG5cblx0XHRyZXR1cm4ge31cblxuXHR9KVxuXG59KSgpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG5cdCQkLnJlZ2lzdGVyU2VydmljZSgnVHdlZW5NYXhTZXJ2aWNlJywgZnVuY3Rpb24oY29uZmlnKSB7XG5cblx0XHR2YXIgVHdlZW5NYXggPSB3aW5kb3cuVHdlZW5NYXhcblxuXHRcdGlmICghIFR3ZWVuTWF4KSB7XG5cdFx0XHR0aHJvdyhgW1R3ZWVuTWF4U2VydmljZV0gTWlzc2luZyBsaWJyYXJ5IGRlcGVuZGFuY3kgJ3R3ZWVuLmpzJ2ApXG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Ly9kZWxldGUgd2luZG93LlR3ZWVuTWF4XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFR3ZWVuTWF4XG5cblx0fSlcblxufSkoKTsiLCJcblxuJCQucmVnaXN0ZXJTZXJ2aWNlKCdVc2VyU2VydmljZScsIGZ1bmN0aW9uKGNvbmZpZykge1xuXG5cblx0cmV0dXJuIHtcblx0XHRnZXROYW1lKCkge1xuXHRcdFx0cmV0dXJuIGNvbmZpZy51c2VyTmFtZVxuXHRcdH1cblxuXG5cdFx0XG5cdH1cbn0pO1xuXG5cblx0XG5cblxuXG5cbiIsIihmdW5jdGlvbigpIHtcblxuXHR2YXIgc3RhdHVzQ29kZU1hcCA9IHtcblx0XHQwOiAnT0snLFxuXHRcdDEwMDogJ1NlcnZpY2Ugbm90IGF2YWlsYWJsZScsXG5cdFx0MjAwOiAnSW52YWxpZCBwYXJhbWV0ZXJzJ1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0RXJyb3JNZXNzYWdlKHN0YXR1c0NvZGUpIHtcblx0XHRyZXR1cm4gc3RhdHVzQ29kZU1hcFtzdGF0dXNDb2RlXSB8fCAnJ1xuXHR9XG5cblx0Y2xhc3MgV2ViU29ja2V0Q2xpZW50IHtcblxuXHRcdGNvbnN0cnVjdG9yKGlkKSB7XG5cdFx0XHR0aGlzLnNvY2sgPSBudWxsXG5cdFx0XHR0aGlzLmlzQ29ubmVjdGVkID0gZmFsc2Vcblx0XHRcdHRoaXMudG9waWNzID0gbmV3IEV2ZW50RW1pdHRlcjIoe3dpbGRjYXJkOiB0cnVlfSlcblx0XHRcdHRoaXMuc2VydmljZXMgPSBuZXcgRXZlbnRFbWl0dGVyMigpXG5cdFx0XHR0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIyKClcblxuXHRcdFx0dGhpcy5yZWdpc3RlcmVkVG9waWNzID0ge31cblx0XHRcdHRoaXMucmVnaXN0ZXJlZFNlcnZpY2VzID0ge31cblx0XHRcdHRoaXMud2FpdGluZ01zZyA9IHt9XG5cdFx0XHR0aGlzLnN1c3BlbmRlZCA9IGZhbHNlXG5cblx0XHRcdGNvbnN0IGhvc3QgPSBsb2NhdGlvbi5ob3N0bmFtZVxuXHRcdFx0Y29uc3QgcG9ydCA9IDgwOTBcblxuXHRcdFx0dGhpcy51cmwgPSBgd3NzOi8vJHtob3N0fToke3BvcnR9LyR7aWR9YFxuXHRcdH1cblxuXHRcdHN1c3BlbmQoKSB7XG5cdFx0XHR0aGlzLnN1c3BlbmRlZCA9IHRydWVcblx0XHR9XG5cblx0XHRyZXN1bWUoKSB7XG5cdFx0XHRpZiAodGhpcy5zdXNwZW5kZWQpIHtcblx0XHRcdFx0Zm9yKGxldCB0b3BpYyBpbiB0aGlzLndhaXRpbmdNc2cpIHtcblx0XHRcdFx0XHRjb25zdCBtc2cgPSB0aGlzLndhaXRpbmdNc2dbdG9waWNdXG5cdFx0XHRcdFx0dGhpcy50b3BpY3MuZW1pdCh0b3BpYywgbXNnKVxuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMud2FpdGluZ01zZyA9IHt9XG5cdFx0XHRcdHRoaXMuc3VzcGVuZGVkID0gZmFsc2Vcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25uZWN0KCkge1xuXG5cdFx0XHRjb25zb2xlLmxvZygndHJ5IHRvIGNvbm5lY3QuLi4nKVxuXG5cdFx0XHR2YXIgc29jayA9IG5ldyBXZWJTb2NrZXQodGhpcy51cmwpXG5cdFxuXHRcdFx0c29jay5hZGRFdmVudExpc3RlbmVyKCdvcGVuJywgKCkgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIkNvbm5lY3RlZCB0byBNYXN0ZXJcIilcblx0XHRcdFx0dGhpcy5pc0Nvbm5lY3RlZCA9IHRydWVcblx0XHRcdFx0dGhpcy5ldmVudHMuZW1pdCgnY29ubmVjdCcpXG5cblx0XHRcdFx0Zm9yKGxldCB0b3BpYyBpbiB0aGlzLnJlZ2lzdGVyZWRUb3BpY3MpIHtcblx0XHRcdFx0XHR2YXIgZ2V0TGFzdCA9IHRoaXMucmVnaXN0ZXJlZFRvcGljc1t0b3BpY11cblx0XHRcdFx0XHR0aGlzLnNlbmRNc2coe3R5cGU6ICdyZWdpc3RlcicsIHRvcGljOiB0b3BpYywgZ2V0TGFzdDogZ2V0TGFzdH0pXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmb3IobGV0IHNydk5hbWUgaW4gdGhpcy5yZWdpc3RlcmVkU2VydmljZXMpIHtcblx0XHRcdFx0XHR0aGlzLnNlbmRNc2coe3R5cGU6ICdyZWdpc3RlclNlcnZpY2UnLCBzcnZOYW1lOiBzcnZOYW1lfSlcblx0XHRcdFx0fVxuXG5cdFx0XHR9KSBcblxuXHRcdFx0c29jay5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2KSA9PiB7XG5cdFx0XHRcdHZhciBtc2cgPSBKU09OLnBhcnNlKGV2LmRhdGEpXG5cblxuXHRcdFx0XHRpZiAodHlwZW9mIG1zZy50b3BpYyA9PSAnc3RyaW5nJykge1xuXHRcdFx0XHRcdGxldCBzcGxpdCA9IG1zZy50b3BpYy5zcGxpdCgnLicpIC8vIGNvbXB1dGUgdGhlIGlkIChsYXllcklkLm9iamVjdElkKSBmcm9tIHRvcGljXG5cdFx0XHRcdFx0aWYgKHNwbGl0Lmxlbmd0aCA9PSAzKSB7XG5cdFx0XHRcdFx0XHRzcGxpdC5zaGlmdCgpXG5cdFx0XHRcdFx0XHRtc2cuaWQgPSBzcGxpdC5qb2luKCcuJylcblx0XHRcdFx0XHR9XHRcdFx0XHRcdFxuXG5cdFx0XHRcdFx0aWYgKHRoaXMuc3VzcGVuZGVkKSB7XG5cdFx0XHRcdFx0XHR0aGlzLndhaXRpbmdNc2dbbXNnLnRvcGljXSA9IG1zZ1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdHRoaXMudG9waWNzLmVtaXQobXNnLnRvcGljLCBtc2cpXHRcdFx0XHRcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChtc2cudHlwZSA9PSAnY2FsbFNlcnZpY2UnKSB7XG5cdFx0XHRcdFx0dGhpcy5oYW5kbGVDYWxsU2VydmljZShtc2cpXG5cdFx0XHRcdH1cdFx0XHRcdFxuXG5cdFx0XHRcdGlmIChtc2cudHlwZSA9PSAnY2FsbFNlcnZpY2VSZXNwJykge1xuXHRcdFx0XHRcdHRoaXMuc2VydmljZXMuZW1pdChtc2cuc3J2TmFtZSwgbXNnKVxuXHRcdFx0XHR9XHRcdFx0XHRcblx0XHRcdFxuXHRcdFx0fSlcblxuXHRcdFx0c29jay5hZGRFdmVudExpc3RlbmVyKCdjbG9zZScsIChjb2RlLCByZWFzb24pID0+IHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnV1MgY2xvc2UnLCBjb2RlLCByZWFzb24pXG5cdFx0XHRcdGlmICh0aGlzLmlzQ29ubmVjdGVkKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ0Rpc2Nvbm5lY3RlZCAhJylcblx0XHRcdFx0XHR0aGlzLmV2ZW50cy5lbWl0KCdkaXNjb25uZWN0Jylcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLmlzQ29ubmVjdGVkID0gZmFsc2Vcblx0XHRcdFx0c2V0VGltZW91dCgoKSA9PiB7dGhpcy5jb25uZWN0KCl9LCA1MDAwKVxuXG5cdFx0XHR9KVxuXG5cblx0XHRcdHRoaXMuc29jayA9IHNvY2tcdFx0XG5cdFx0fVxuXG5cdFx0aGFuZGxlQ2FsbFNlcnZpY2UobXNnKSB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKCdoYW5kbGVDYWxsU2VydmljZScpXG5cdFx0XHRjb25zdCBmdW5jID0gdGhpcy5yZWdpc3RlcmVkU2VydmljZXNbbXNnLnNydk5hbWVdXG5cdFx0XHRpZiAodHlwZW9mIGZ1bmMgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHR2YXIgcmVzcE1zZyA9IHtcblx0XHRcdFx0XHR0eXBlOiAnY2FsbFNlcnZpY2VSZXNwJyxcblx0XHRcdFx0XHRzcnZOYW1lOiBtc2cuc3J2TmFtZSxcblx0XHRcdFx0XHRkZXN0OiBtc2cuc3JjLFxuXHRcdFx0XHRcdHN0YXR1c0NvZGU6IDBcblx0XHRcdFx0fVxuXHRcdFx0XHRmdW5jKG1zZy5kYXRhLCByZXNwTXNnKVxuXHRcdFx0XHR0aGlzLnNlbmRNc2cocmVzcE1zZylcdFx0XHRcblx0XHRcdH1cblx0XHR9XG5cblx0XHRzZW5kTXNnKG1zZykge1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnW0NsaWVudF0gc2VuZE1zZycsIG1zZylcblx0XHRcdG1zZy50aW1lID0gRGF0ZS5ub3coKVxuXHRcdFx0dmFyIHRleHQgPSBKU09OLnN0cmluZ2lmeShtc2cpXG5cdFx0XHRpZiAodGhpcy5pc0Nvbm5lY3RlZCkge1xuXHRcdFx0XHR0aGlzLnNvY2suc2VuZCh0ZXh0KVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGVtaXQodG9waWMsIGRhdGEpIHtcblx0XHRcdC8vY29uc29sZS5sb2coJ3B1Ymxpc2gnLCB0b3BpYywgZGF0YSlcblx0XHRcdHZhciBtc2cgPSB7XG5cdFx0XHRcdHR5cGU6ICdub3RpZicsXG5cdFx0XHRcdHRvcGljOiB0b3BpY1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdG1zZy5kYXRhID0gZGF0YVxuXHRcdFx0fVxuXHRcdFx0dGhpcy5zZW5kTXNnKG1zZylcblx0XHR9XG5cblx0XHRvbih0b3BpYywgY2FsbGJhY2spIHtcblxuXHRcdFx0dGhpcy50b3BpY3Mub24odG9waWMsIGNhbGxiYWNrKVxuXHRcdH1cblxuXHRcdHJlZ2lzdGVyKHRvcGljcywgZ2V0TGFzdCwgY2FsbGJhY2spIHtcblx0XHRcdGlmICh0eXBlb2YgdG9waWNzID09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdHRvcGljcyA9IFt0b3BpY3NdXG5cdFx0XHR9XG5cblx0XHRcdHRvcGljcy5mb3JFYWNoKCh0b3BpYykgPT4ge1xuXHRcdFx0XHR0aGlzLnJlZ2lzdGVyZWRUb3BpY3NbdG9waWNdID0gZ2V0TGFzdFxuXHRcdFx0XHR0aGlzLm9uKHRvcGljLCBjYWxsYmFjaylcblx0XHRcdFx0aWYgKHRoaXMuaXNDb25uZWN0ZWQpIHtcblx0XHRcdFx0XHR0aGlzLnNlbmRNc2coe3R5cGU6ICdyZWdpc3RlcicsIHRvcGljOiB0b3BpYywgZ2V0TGFzdDogZ2V0TGFzdH0pXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHRcblx0XHR9XG5cblx0XHR1bnJlZ2lzdGVyKHRvcGljcywgY2FsbGJhY2spIHtcblx0XHRcdGlmICh0eXBlb2YgdG9waWNzID09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdHRvcGljcyA9IFt0b3BpY3NdXG5cdFx0XHR9XG5cblx0XHRcdHRvcGljcy5mb3JFYWNoKCh0b3BpYykgPT4ge1xuXG5cdFx0XHRcdHRoaXMudG9waWNzLm9mZih0b3BpYywgY2FsbGJhY2spXG5cdFx0XHRcdHZhciBuYkxpc3RlbmVycyA9IHRoaXMudG9waWNzLmxpc3RlbmVycyh0b3BpYykubGVuZ3RoXG5cblx0XHRcdFx0aWYgKHRoaXMuaXNDb25uZWN0ZWQgJiYgbmJMaXN0ZW5lcnMgPT0gMCkgeyAvLyBubyBtb3JlIGxpc3RlbmVycyBmb3IgdGhpcyB0b3BpY1xuXHRcdFx0XHRcdHRoaXMuc2VuZE1zZyh7dHlwZTogJ3VucmVnaXN0ZXInLCB0b3BpYzogdG9waWN9KVxuXHRcdFx0XHR9XHRcdFxuXHRcdFx0fSlcblx0XHR9XHRcdFxuXG5cdFx0cmVnaXN0ZXJTZXJ2aWNlKHNydk5hbWUsIGZ1bmMpIHtcblx0XHRcdHRoaXMucmVnaXN0ZXJlZFNlcnZpY2VzW3Nydk5hbWVdID0gZnVuY1xuXHRcdFx0aWYgKHRoaXMuaXNDb25uZWN0ZWQpIHtcblx0XHRcdFx0dGhpcy5zZW5kTXNnKHt0eXBlOiAncmVnaXN0ZXJTZXJ2aWNlJywgc3J2TmFtZTogc3J2TmFtZX0pXG5cdFx0XHR9XHRcdFxuXHRcdH1cblxuXG5cdFx0Y2FsbFNlcnZpY2Uoc3J2TmFtZSwgZGF0YSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ1tDbGllbnRdIGNhbGxTZXJ2aWNlJywgc3J2TmFtZSwgZGF0YSlcblx0XHRcdHZhciB0aGF0ID0gdGhpc1xuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdFx0dGhpcy5zZXJ2aWNlcy5vbmNlKHNydk5hbWUsIGZ1bmN0aW9uKG1zZykge1xuXHRcdFx0XHRcdHZhciBzdGF0dXNDb2RlID0gbXNnLnN0YXR1c0NvZGVcblx0XHRcdFx0XHRpZiAoc3RhdHVzQ29kZSA9PSAwKSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKG1zZy5kYXRhKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdHJlamVjdCh7XG5cdFx0XHRcdFx0XHRcdGNvZGU6IHN0YXR1c0NvZGUsXG5cdFx0XHRcdFx0XHRcdG1lc3NhZ2U6IGdldEVycm9yTWVzc2FnZShtc2cuc3RhdHVzQ29kZSlcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KVxuXG5cdFx0XHRcdHRoaXMuc2VuZE1zZyh7XG5cdFx0XHRcdFx0dHlwZTogJ2NhbGxTZXJ2aWNlJyxcblx0XHRcdFx0XHRzcnZOYW1lOiBzcnZOYW1lLFxuXHRcdFx0XHRcdGRhdGE6IGRhdGFcblx0XHRcdFx0fSlcblx0XHRcdH0pXG5cdFx0fVxuXG5cblxuXHRcdHNlbmRUbyhkZXN0LCB0b3BpYywgZGF0YSkge1xuXHRcdFx0dmFyIG1zZyA9IHtcblx0XHRcdFx0dHlwZTogJ2NtZCcsXG5cdFx0XHRcdHRvcGljOiB0b3BpYyxcblx0XHRcdFx0ZGVzdDogZGVzdFxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZGF0YSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdG1zZy5kYXRhID0gZGF0YVxuXHRcdFx0fVxuXHRcdFx0dGhpcy5zZW5kTXNnKG1zZylcdFx0XG5cdFx0fVx0XG5cdFx0XG5cdH1cblxuXG5cblxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ1dlYlNvY2tldFNlcnZpY2UnLCBmdW5jdGlvbihjb25maWcpIHtcblxuXHRcdHZhciBpZCA9IGBobWkuJHtjb25maWcudXNlck5hbWV9LiR7Y29uZmlnLmFwcE5hbWV9LmAgKyAgKERhdGUubm93KCkgJSAxMDAwMDApXG5cblx0XHRjb25zb2xlLmxvZygnaWQnLCBpZClcblxuXG5cdFx0Y29uc3QgY2xpZW50ID0gbmV3IFdlYlNvY2tldENsaWVudChpZClcblx0XHRjbGllbnQuY29ubmVjdCgpXG5cblx0XHRyZXR1cm4gY2xpZW50O1xuXHR9KVxuXG5cbn0pKCk7XG4iXX0=
