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

		constructor(id, options) {
			this.sock = null
			this.id = id
			this.isConnected = false
			this.topics = new EventEmitter2({wildcard: true})
			this.services = new EventEmitter2()
			this.events = new EventEmitter2()

			options = options || {}

			const port = options.port || 8090
			const host = options.host || '127.0.0.1'

			this.url = `wss://${host}:${port}/${id}`

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
		const options = {
			port: config.port || 8090,
			host: 'com.breizbot.ovh'
			//host: config.host || location.hostname
		}

		var id = (config.id || 'WebSocket') + (Date.now() % 100000)

		const client = new WebSocketClient(id, options)
		client.connect()

		return client;
	})


})();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGUuanMiLCJodHRwLmpzIiwibGVhZmxldC5qcyIsIm1pbHN5bWJvbC5qcyIsIm9sLmpzIiwidHJlZS5qcyIsInR3ZWVuLmpzIiwid2Vic29ja2V0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoic2VydmljZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkJC5yZWdpc3RlclNlcnZpY2UoJ0ZpbGVTZXJ2aWNlJywgWydIdHRwU2VydmljZSddLCBmdW5jdGlvbihjb25maWcsIGh0dHApIHtcclxuXHJcblx0cmV0dXJuIHtcclxuXHRcdGxpc3Q6IGZ1bmN0aW9uKHBhdGgsIGltYWdlT25seSwgZm9sZGVyT25seSkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSBsaXN0JywgcGF0aClcclxuXHJcblx0XHRcdHJldHVybiBodHRwLnBvc3QoJy9hcGkvZmlsZS9saXN0Jywge3BhdGgsIGltYWdlT25seSwgZm9sZGVyT25seX0pXHJcblx0XHR9LFxyXG5cclxuXHRcdGZpbGVVcmw6IGZ1bmN0aW9uKGZpbGVOYW1lKSB7XHJcblx0XHRcdHJldHVybiAnL2FwaS9maWxlL2xvYWQ/ZmlsZU5hbWU9JyArIGZpbGVOYW1lXHJcblx0XHR9LFxyXG5cclxuXHRcdHVwbG9hZEZpbGU6IGZ1bmN0aW9uKGRhdGFVcmwsIHNhdmVBc2ZpbGVOYW1lLCBkZXN0UGF0aCkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSB1cGxvYWRGaWxlJywgc2F2ZUFzZmlsZU5hbWUpXHJcblx0XHRcdHZhciBibG9iID0gJCQuZGF0YVVSTHRvQmxvYihkYXRhVXJsKVxyXG5cdFx0XHRpZiAoYmxvYiA9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZWplY3QoJ0ZpbGUgZm9ybWF0IG5vdCBzdXBwb3J0ZWQnKVxyXG5cdFx0XHR9XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2Jsb2InLCBibG9iKVxyXG5cdFx0XHR2YXIgZmQgPSBuZXcgRm9ybURhdGEoKVxyXG5cdFx0XHRmZC5hcHBlbmQoJ3BpY3R1cmUnLCBibG9iLCBzYXZlQXNmaWxlTmFtZSlcclxuXHRcdFx0ZmQuYXBwZW5kKCdkZXN0UGF0aCcsIGRlc3RQYXRoKVxyXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0Rm9ybURhdGEoJy9hcGkvZmlsZS9zYXZlJywgZmQpXHJcblx0XHR9LFxyXG5cclxuXHRcdHJlbW92ZUZpbGVzOiBmdW5jdGlvbihmaWxlTmFtZXMpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tGaWxlU2VydmljZV0gcmVtb3ZlRmlsZXMnLCBmaWxlTmFtZXMpXHJcblx0XHRcdHJldHVybiBodHRwLnBvc3QoJy9hcGkvZmlsZS9kZWxldGUnLCBmaWxlTmFtZXMpXHJcblx0XHR9LFxyXG5cclxuXHRcdG1rZGlyOiBmdW5jdGlvbihmaWxlTmFtZSkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSBta2RpcicsIGZpbGVOYW1lKVxyXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0KCcvYXBpL2ZpbGUvbWtkaXInLCB7ZmlsZU5hbWU6IGZpbGVOYW1lfSlcclxuXHRcdH0sXHJcblxyXG5cdFx0cm1kaXI6IGZ1bmN0aW9uKGZpbGVOYW1lKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdbRmlsZVNlcnZpY2VdIHJtZGlyJywgZmlsZU5hbWUpXHJcblx0XHRcdHJldHVybiBodHRwLnBvc3QoJy9hcGkvZmlsZS9ybWRpcicsIHtmaWxlTmFtZTogZmlsZU5hbWV9KVxyXG5cdFx0fSxcclxuXHJcblx0XHRtb3ZlRmlsZXM6IGZ1bmN0aW9uKGZpbGVOYW1lcywgZGVzdFBhdGgpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tGaWxlU2VydmljZV0gbW92ZUZpbGVzJywgZmlsZU5hbWVzLCBkZXN0UGF0aClcclxuXHRcdFx0cmV0dXJuIGh0dHAucG9zdCgnL2FwaS9maWxlL21vdmUnLCB7ZmlsZU5hbWVzLCBkZXN0UGF0aH0pXHJcblx0XHR9LFxyXG5cclxuXHRcdGNvcHlGaWxlczogZnVuY3Rpb24oZmlsZU5hbWVzLCBkZXN0UGF0aCkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSBjb3B5RmlsZXMnLCBmaWxlTmFtZXMsIGRlc3RQYXRoKVxyXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0KCcvYXBpL2ZpbGUvY29weScsIHtmaWxlTmFtZXMsIGRlc3RQYXRofSlcclxuXHRcdH1cdFxyXG5cdH1cclxuXHJcbn0pO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyU2VydmljZSgnSHR0cFNlcnZpY2UnLCBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiB7XHJcblx0XHRcdGdldCh1cmwpIHtcclxuXHRcdFx0XHRyZXR1cm4gJC5nZXRKU09OKHVybClcclxuXHRcdFx0fSxcclxuXHJcblxyXG5cdFx0XHRwb3N0KHVybCwgZGF0YSkge1xyXG5cdFx0XHRcdHJldHVybiAkLmFqYXgoe1xyXG5cdFx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXHJcblx0XHRcdFx0XHR1cmwgOiB1cmwsXHJcblx0XHRcdFx0XHRjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG5cdFx0XHRcdFx0ZGF0YTogSlNPTi5zdHJpbmdpZnkoZGF0YSlcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0cHV0KHVybCwgZGF0YSkge1xyXG5cdFx0XHRcdHJldHVybiAkLmFqYXgoe1xyXG5cdFx0XHRcdFx0bWV0aG9kOiAnUFVUJyxcclxuXHRcdFx0XHRcdHVybCA6IHVybCxcclxuXHRcdFx0XHRcdGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXHJcblx0XHRcdFx0XHRkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH0sXHRcdFx0XHJcblxyXG5cdFx0XHRkZWxldGUodXJsKSB7XHJcblx0XHRcdFx0cmV0dXJuICQuYWpheCh7XHJcblx0XHRcdFx0XHRtZXRob2Q6ICdERUxFVEUnLFxyXG5cdFx0XHRcdFx0dXJsIDogdXJsLFxyXG5cdFx0XHRcdH0pXHRcdFx0XHRcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHBvc3RGb3JtRGF0YSh1cmwsIGZkKSB7XHJcblx0XHRcdFx0cmV0dXJuICQuYWpheCh7XHJcblx0XHRcdFx0ICB1cmw6IHVybCxcclxuXHRcdFx0XHQgIHR5cGU6IFwiUE9TVFwiLFxyXG5cdFx0XHRcdCAgZGF0YTogZmQsXHJcblx0XHRcdFx0ICBwcm9jZXNzRGF0YTogZmFsc2UsICAvLyBpbmRpcXVlIMOgIGpRdWVyeSBkZSBuZSBwYXMgdHJhaXRlciBsZXMgZG9ubsOpZXNcclxuXHRcdFx0XHQgIGNvbnRlbnRUeXBlOiBmYWxzZSAgIC8vIGluZGlxdWUgw6AgalF1ZXJ5IGRlIG5lIHBhcyBjb25maWd1cmVyIGxlIGNvbnRlbnRUeXBlXHJcblx0XHRcdFx0fSlcdFx0XHRcdFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRcclxuXHRcdH1cclxuXHR9KVxyXG5cclxuXHRcclxufSkoKTtcclxuXHJcblxyXG5cclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ0xlYWZsZXRTZXJ2aWNlJywgWydXZWJTb2NrZXRTZXJ2aWNlJ10sIGZ1bmN0aW9uKGNvbmZpZywgY2xpZW50KSB7XHJcblxyXG5cdFx0dmFyIEwgPSB3aW5kb3cuTFxyXG5cclxuXHRcdGlmICghIEwpIHtcclxuXHRcdFx0dGhyb3coYFtMZWFmbGV0U2VydmljZV0gTWlzc2luZyBsaWJyYXJ5IGRlcGVuZGFuY3kgJ2xlYWZsZXQuanMnYClcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnTGVhZmxldCB2ZXJzaW9uJywgTC52ZXJzaW9uKVxyXG5cdFx0XHRjb25zb2xlLmxvZygnTGVhZmxldERyYXcgdmVyc2lvbicsIEwuZHJhd1ZlcnNpb24pXHJcblx0XHRcdC8vZGVsZXRlIHdpbmRvdy5MXHJcblx0XHRcdCQkLmxvYWRTdHlsZSgnL2Nzcy9sZWFmbGV0LmNzcycpXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIExcclxuXHJcblx0fSlcclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ01pbFN5bWJvbFNlcnZpY2UnLCBmdW5jdGlvbihjb25maWcpIHtcclxuXHJcblx0XHR2YXIgbXMgPSB3aW5kb3cubXNcclxuXHJcblx0XHRpZiAoISBtcykge1xyXG5cdFx0XHR0aHJvdyhgW01pbFN5bWJvbFNlcnZpY2VdIE1pc3NpbmcgbGlicmFyeSBkZXBlbmRhbmN5ICdtaWxzeW1ib2wuanMnYClcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRkZWxldGUgd2luZG93Lm1zXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIG1zXHJcblxyXG5cdH0pXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJTZXJ2aWNlKCdPcGVuTGF5ZXJTZXJ2aWNlJywgZnVuY3Rpb24oY29uZmlnKSB7XHJcblxyXG5cdFx0dmFyIG9sID0gd2luZG93Lm9sXHJcblxyXG5cdFx0aWYgKCEgb2wpIHtcclxuXHRcdFx0dGhyb3coYFtPcGVuTGF5ZXJTZXJ2aWNlXSBNaXNzaW5nIGxpYnJhcnkgZGVwZW5kYW5jeSAnb2wuaidgKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGRlbGV0ZSB3aW5kb3cub2xcclxuXHRcdFx0JCQubG9hZFN0eWxlKCcvY3NzL29sLmNzcycpXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIG9sXHJcblxyXG5cdH0pXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJTZXJ2aWNlKCdUcmVlQ3RybFNlcnZpY2UnLCBmdW5jdGlvbihjb25maWcpIHtcclxuXHJcblxyXG5cdFx0aWYgKCQudWkuZmFuY3l0cmVlID09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHR0aHJvdyhgW1RyZWVDdHJsU2VydmljZV0gTWlzc2luZyBsaWJyYXJ5IGRlcGVuZGFuY3kgJ3RyZWUuanMnYClcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnRmFuY3l0cmVlIHZlcnNpb246JywgJC51aS5mYW5jeXRyZWUudmVyc2lvbilcclxuXHRcdFx0JCQubG9hZFN0eWxlKCcvY3NzL3RyZWUvdHJlZS5jc3MnKVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB7fVxyXG5cclxuXHR9KVxyXG5cclxufSkoKTtcclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ1R3ZWVuTWF4U2VydmljZScsIGZ1bmN0aW9uKGNvbmZpZykge1xyXG5cclxuXHRcdHZhciBUd2Vlbk1heCA9IHdpbmRvdy5Ud2Vlbk1heFxyXG5cclxuXHRcdGlmICghIFR3ZWVuTWF4KSB7XHJcblx0XHRcdHRocm93KGBbVHdlZW5NYXhTZXJ2aWNlXSBNaXNzaW5nIGxpYnJhcnkgZGVwZW5kYW5jeSAndHdlZW4uanMnYClcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHQvL2RlbGV0ZSB3aW5kb3cuVHdlZW5NYXhcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gVHdlZW5NYXhcclxuXHJcblx0fSlcclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHRjbGFzcyBXZWJTb2NrZXRDbGllbnQge1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKGlkLCBvcHRpb25zKSB7XHJcblx0XHRcdHRoaXMuc29jayA9IG51bGxcclxuXHRcdFx0dGhpcy5pZCA9IGlkXHJcblx0XHRcdHRoaXMuaXNDb25uZWN0ZWQgPSBmYWxzZVxyXG5cdFx0XHR0aGlzLnRvcGljcyA9IG5ldyBFdmVudEVtaXR0ZXIyKHt3aWxkY2FyZDogdHJ1ZX0pXHJcblx0XHRcdHRoaXMuc2VydmljZXMgPSBuZXcgRXZlbnRFbWl0dGVyMigpXHJcblx0XHRcdHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxyXG5cclxuXHRcdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge31cclxuXHJcblx0XHRcdGNvbnN0IHBvcnQgPSBvcHRpb25zLnBvcnQgfHwgODA5MFxyXG5cdFx0XHRjb25zdCBob3N0ID0gb3B0aW9ucy5ob3N0IHx8ICcxMjcuMC4wLjEnXHJcblxyXG5cdFx0XHR0aGlzLnVybCA9IGB3c3M6Ly8ke2hvc3R9OiR7cG9ydH0vJHtpZH1gXHJcblxyXG5cdFx0XHR0aGlzLnJlZ2lzdGVyZWRUb3BpY3MgPSB7fVxyXG5cdFx0XHR0aGlzLnJlZ2lzdGVyZWRTZXJ2aWNlcyA9IHt9XHJcblx0XHRcdHRoaXMud2FpdGluZ01zZyA9IHt9XHJcblx0XHRcdHRoaXMuc3VzcGVuZGVkID0gZmFsc2VcclxuXHRcdH1cclxuXHJcblx0XHRzdXNwZW5kKCkge1xyXG5cdFx0XHR0aGlzLnN1c3BlbmRlZCA9IHRydWVcclxuXHRcdH1cclxuXHJcblx0XHRyZXN1bWUoKSB7XHJcblx0XHRcdGlmICh0aGlzLnN1c3BlbmRlZCkge1xyXG5cdFx0XHRcdGZvcihsZXQgdG9waWMgaW4gdGhpcy53YWl0aW5nTXNnKSB7XHJcblx0XHRcdFx0XHRjb25zdCBtc2cgPSB0aGlzLndhaXRpbmdNc2dbdG9waWNdXHJcblx0XHRcdFx0XHR0aGlzLnRvcGljcy5lbWl0KHRvcGljLCBtc2cpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMud2FpdGluZ01zZyA9IHt9XHJcblx0XHRcdFx0dGhpcy5zdXNwZW5kZWQgPSBmYWxzZVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0Y29ubmVjdCgpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ3RyeSB0byBjb25uZWN0Li4uJylcclxuXHJcblx0XHRcdHZhciBzb2NrID0gbmV3IFdlYlNvY2tldCh0aGlzLnVybClcclxuXHRcclxuXHRcdFx0c29jay5hZGRFdmVudExpc3RlbmVyKCdvcGVuJywgKCkgPT4ge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiQ29ubmVjdGVkIHRvIE1hc3RlclwiKVxyXG5cdFx0XHRcdHRoaXMuaXNDb25uZWN0ZWQgPSB0cnVlXHJcblx0XHRcdFx0dGhpcy5ldmVudHMuZW1pdCgnY29ubmVjdCcpXHJcblxyXG5cdFx0XHRcdGZvcihsZXQgdG9waWMgaW4gdGhpcy5yZWdpc3RlcmVkVG9waWNzKSB7XHJcblx0XHRcdFx0XHR2YXIgZ2V0TGFzdCA9IHRoaXMucmVnaXN0ZXJlZFRvcGljc1t0b3BpY11cclxuXHRcdFx0XHRcdHRoaXMuc2VuZE1zZyh7dHlwZTogJ3JlZ2lzdGVyJywgdG9waWM6IHRvcGljLCBnZXRMYXN0OiBnZXRMYXN0fSlcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGZvcihsZXQgc3J2TmFtZSBpbiB0aGlzLnJlZ2lzdGVyZWRTZXJ2aWNlcykge1xyXG5cdFx0XHRcdFx0dGhpcy5zZW5kTXNnKHt0eXBlOiAncmVnaXN0ZXJTZXJ2aWNlJywgc3J2TmFtZTogc3J2TmFtZX0pXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0fSkgXHJcblxyXG5cdFx0XHRzb2NrLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXYpID0+IHtcclxuXHRcdFx0XHR2YXIgbXNnID0gSlNPTi5wYXJzZShldi5kYXRhKVxyXG5cclxuXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBtc2cudG9waWMgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdGxldCBzcGxpdCA9IG1zZy50b3BpYy5zcGxpdCgnLicpIC8vIGNvbXB1dGUgdGhlIGlkIChsYXllcklkLm9iamVjdElkKSBmcm9tIHRvcGljXHJcblx0XHRcdFx0XHRpZiAoc3BsaXQubGVuZ3RoID09IDMpIHtcclxuXHRcdFx0XHRcdFx0c3BsaXQuc2hpZnQoKVxyXG5cdFx0XHRcdFx0XHRtc2cuaWQgPSBzcGxpdC5qb2luKCcuJylcclxuXHRcdFx0XHRcdH1cdFx0XHRcdFx0XHJcblxyXG5cdFx0XHRcdFx0aWYgKHRoaXMuc3VzcGVuZGVkKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMud2FpdGluZ01zZ1ttc2cudG9waWNdID0gbXNnXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0dGhpcy50b3BpY3MuZW1pdChtc2cudG9waWMsIG1zZylcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmIChtc2cudHlwZSA9PSAnY2FsbFNlcnZpY2UnKSB7XHJcblx0XHRcdFx0XHR0aGlzLmhhbmRsZUNhbGxTZXJ2aWNlKG1zZylcclxuXHRcdFx0XHR9XHRcdFx0XHRcclxuXHJcblx0XHRcdFx0aWYgKG1zZy50eXBlID09ICdjYWxsU2VydmljZVJlc3AnKSB7XHJcblx0XHRcdFx0XHR0aGlzLnNlcnZpY2VzLmVtaXQobXNnLnNydk5hbWUsIG1zZylcclxuXHRcdFx0XHR9XHRcdFx0XHRcclxuXHRcdFx0XHJcblx0XHRcdH0pXHJcblxyXG5cdFx0XHRzb2NrLmFkZEV2ZW50TGlzdGVuZXIoJ2Nsb3NlJywgKGNvZGUsIHJlYXNvbikgPT4ge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1dTIGNsb3NlJywgY29kZSwgcmVhc29uKVxyXG5cdFx0XHRcdGlmICh0aGlzLmlzQ29ubmVjdGVkKSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnRGlzY29ubmVjdGVkICEnKVxyXG5cdFx0XHRcdFx0dGhpcy5ldmVudHMuZW1pdCgnZGlzY29ubmVjdCcpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMuaXNDb25uZWN0ZWQgPSBmYWxzZVxyXG5cdFx0XHRcdHNldFRpbWVvdXQoKCkgPT4ge3RoaXMuY29ubmVjdCgpfSwgNTAwMClcclxuXHJcblx0XHRcdH0pXHJcblxyXG5cclxuXHRcdFx0dGhpcy5zb2NrID0gc29ja1x0XHRcclxuXHRcdH1cclxuXHJcblx0XHRoYW5kbGVDYWxsU2VydmljZShtc2cpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnaGFuZGxlQ2FsbFNlcnZpY2UnKVxyXG5cdFx0XHRjb25zdCBmdW5jID0gdGhpcy5yZWdpc3RlcmVkU2VydmljZXNbbXNnLnNydk5hbWVdXHJcblx0XHRcdGlmICh0eXBlb2YgZnVuYyA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0dmFyIHJlc3BNc2cgPSB7XHJcblx0XHRcdFx0XHR0eXBlOiAnY2FsbFNlcnZpY2VSZXNwJyxcclxuXHRcdFx0XHRcdHNydk5hbWU6IG1zZy5zcnZOYW1lLFxyXG5cdFx0XHRcdFx0ZGVzdDogbXNnLnNyYyxcclxuXHRcdFx0XHRcdHN0YXR1c0NvZGU6IDBcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZnVuYyhtc2cuZGF0YSwgcmVzcE1zZylcclxuXHRcdFx0XHR0aGlzLnNlbmRNc2cocmVzcE1zZylcdFx0XHRcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHNlbmRNc2cobXNnKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ1tDbGllbnRdIHNlbmRNc2cnLCBtc2cpXHJcblx0XHRcdG1zZy50aW1lID0gRGF0ZS5ub3coKVxyXG5cdFx0XHR2YXIgdGV4dCA9IEpTT04uc3RyaW5naWZ5KG1zZylcclxuXHRcdFx0aWYgKHRoaXMuaXNDb25uZWN0ZWQpIHtcclxuXHRcdFx0XHR0aGlzLnNvY2suc2VuZCh0ZXh0KVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZW1pdCh0b3BpYywgZGF0YSkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdwdWJsaXNoJywgdG9waWMsIGRhdGEpXHJcblx0XHRcdHZhciBtc2cgPSB7XHJcblx0XHRcdFx0dHlwZTogJ25vdGlmJyxcclxuXHRcdFx0XHR0b3BpYzogdG9waWNcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdG1zZy5kYXRhID0gZGF0YVxyXG5cdFx0XHR9XHJcblx0XHRcdHRoaXMuc2VuZE1zZyhtc2cpXHJcblx0XHR9XHJcblxyXG5cdFx0b24odG9waWMsIGNhbGxiYWNrKSB7XHJcblxyXG5cdFx0XHR0aGlzLnRvcGljcy5vbih0b3BpYywgY2FsbGJhY2spXHJcblx0XHR9XHJcblxyXG5cdFx0cmVnaXN0ZXIodG9waWNzLCBnZXRMYXN0LCBjYWxsYmFjaykge1xyXG5cdFx0XHRpZiAodHlwZW9mIHRvcGljcyA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdHRvcGljcyA9IFt0b3BpY3NdXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRvcGljcy5mb3JFYWNoKCh0b3BpYykgPT4ge1xyXG5cdFx0XHRcdHRoaXMucmVnaXN0ZXJlZFRvcGljc1t0b3BpY10gPSBnZXRMYXN0XHJcblx0XHRcdFx0dGhpcy5vbih0b3BpYywgY2FsbGJhY2spXHJcblx0XHRcdFx0aWYgKHRoaXMuaXNDb25uZWN0ZWQpIHtcclxuXHRcdFx0XHRcdHRoaXMuc2VuZE1zZyh7dHlwZTogJ3JlZ2lzdGVyJywgdG9waWM6IHRvcGljLCBnZXRMYXN0OiBnZXRMYXN0fSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdHVucmVnaXN0ZXIodG9waWNzLCBjYWxsYmFjaykge1xyXG5cdFx0XHRpZiAodHlwZW9mIHRvcGljcyA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdHRvcGljcyA9IFt0b3BpY3NdXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRvcGljcy5mb3JFYWNoKCh0b3BpYykgPT4ge1xyXG5cclxuXHRcdFx0XHR0aGlzLnRvcGljcy5vZmYodG9waWMsIGNhbGxiYWNrKVxyXG5cdFx0XHRcdHZhciBuYkxpc3RlbmVycyA9IHRoaXMudG9waWNzLmxpc3RlbmVycyh0b3BpYykubGVuZ3RoXHJcblxyXG5cdFx0XHRcdGlmICh0aGlzLmlzQ29ubmVjdGVkICYmIG5iTGlzdGVuZXJzID09IDApIHsgLy8gbm8gbW9yZSBsaXN0ZW5lcnMgZm9yIHRoaXMgdG9waWNcclxuXHRcdFx0XHRcdHRoaXMuc2VuZE1zZyh7dHlwZTogJ3VucmVnaXN0ZXInLCB0b3BpYzogdG9waWN9KVxyXG5cdFx0XHRcdH1cdFx0XHJcblx0XHRcdH0pXHJcblx0XHR9XHRcdFxyXG5cclxuXHRcdHJlZ2lzdGVyU2VydmljZShzcnZOYW1lLCBmdW5jKSB7XHJcblx0XHRcdHRoaXMucmVnaXN0ZXJlZFNlcnZpY2VzW3Nydk5hbWVdID0gZnVuY1xyXG5cdFx0XHRpZiAodGhpcy5pc0Nvbm5lY3RlZCkge1xyXG5cdFx0XHRcdHRoaXMuc2VuZE1zZyh7dHlwZTogJ3JlZ2lzdGVyU2VydmljZScsIHNydk5hbWU6IHNydk5hbWV9KVxyXG5cdFx0XHR9XHRcdFxyXG5cdFx0fVxyXG5cclxuXHJcblx0XHRjYWxsU2VydmljZShzcnZOYW1lLCBkYXRhKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdbQ2xpZW50XSBjYWxsU2VydmljZScsIHNydk5hbWUsIGRhdGEpXHJcblx0XHRcdHZhciB0aGF0ID0gdGhpc1xyXG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG5cdFx0XHRcdHRoaXMuc2VydmljZXMub25jZShzcnZOYW1lLCBmdW5jdGlvbihtc2cpIHtcclxuXHRcdFx0XHRcdHZhciBzdGF0dXNDb2RlID0gbXNnLnN0YXR1c0NvZGVcclxuXHRcdFx0XHRcdGlmIChzdGF0dXNDb2RlID09IDApIHtcclxuXHRcdFx0XHRcdFx0cmVzb2x2ZShtc2cuZGF0YSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRyZWplY3Qoe1xyXG5cdFx0XHRcdFx0XHRcdGNvZGU6IHN0YXR1c0NvZGUsXHJcblx0XHRcdFx0XHRcdFx0bWVzc2FnZTogZ2V0RXJyb3JNZXNzYWdlKG1zZy5zdGF0dXNDb2RlKVxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pXHJcblxyXG5cdFx0XHRcdHRoaXMuc2VuZE1zZyh7XHJcblx0XHRcdFx0XHR0eXBlOiAnY2FsbFNlcnZpY2UnLFxyXG5cdFx0XHRcdFx0c3J2TmFtZTogc3J2TmFtZSxcclxuXHRcdFx0XHRcdGRhdGE6IGRhdGFcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cclxuXHJcblxyXG5cdFx0c2VuZFRvKGRlc3QsIHRvcGljLCBkYXRhKSB7XHJcblx0XHRcdHZhciBtc2cgPSB7XHJcblx0XHRcdFx0dHlwZTogJ2NtZCcsXHJcblx0XHRcdFx0dG9waWM6IHRvcGljLFxyXG5cdFx0XHRcdGRlc3Q6IGRlc3RcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdG1zZy5kYXRhID0gZGF0YVxyXG5cdFx0XHR9XHJcblx0XHRcdHRoaXMuc2VuZE1zZyhtc2cpXHRcdFxyXG5cdFx0fVx0XHJcblx0XHRcclxuXHR9XHJcblxyXG5cclxuXHJcblxyXG5cdCQkLnJlZ2lzdGVyU2VydmljZSgnV2ViU29ja2V0U2VydmljZScsIGZ1bmN0aW9uKGNvbmZpZykge1xyXG5cdFx0Y29uc3Qgb3B0aW9ucyA9IHtcclxuXHRcdFx0cG9ydDogY29uZmlnLnBvcnQgfHwgODA5MCxcclxuXHRcdFx0aG9zdDogJ2NvbS5icmVpemJvdC5vdmgnXHJcblx0XHRcdC8vaG9zdDogY29uZmlnLmhvc3QgfHwgbG9jYXRpb24uaG9zdG5hbWVcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgaWQgPSAoY29uZmlnLmlkIHx8ICdXZWJTb2NrZXQnKSArIChEYXRlLm5vdygpICUgMTAwMDAwKVxyXG5cclxuXHRcdGNvbnN0IGNsaWVudCA9IG5ldyBXZWJTb2NrZXRDbGllbnQoaWQsIG9wdGlvbnMpXHJcblx0XHRjbGllbnQuY29ubmVjdCgpXHJcblxyXG5cdFx0cmV0dXJuIGNsaWVudDtcclxuXHR9KVxyXG5cclxuXHJcbn0pKCk7XHJcbiJdfQ==
