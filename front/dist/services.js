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
			host: config.host || location.hostname
		}

		var id = (config.id || 'WebSocket') + (Date.now() % 100000)

		const client = new WebSocketClient(id, options)
		client.connect()

		return client;
	})


})();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGUuanMiLCJodHRwLmpzIiwibGVhZmxldC5qcyIsIm1pbHN5bWJvbC5qcyIsIm9sLmpzIiwidHJlZS5qcyIsInR3ZWVuLmpzIiwid2Vic29ja2V0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InNlcnZpY2VzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJCQucmVnaXN0ZXJTZXJ2aWNlKCdGaWxlU2VydmljZScsIFsnSHR0cFNlcnZpY2UnXSwgZnVuY3Rpb24oY29uZmlnLCBodHRwKSB7XHJcblxyXG5cdHJldHVybiB7XHJcblx0XHRsaXN0OiBmdW5jdGlvbihwYXRoLCBpbWFnZU9ubHksIGZvbGRlck9ubHkpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tGaWxlU2VydmljZV0gbGlzdCcsIHBhdGgpXHJcblxyXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0KCcvYXBpL2ZpbGUvbGlzdCcsIHtwYXRoLCBpbWFnZU9ubHksIGZvbGRlck9ubHl9KVxyXG5cdFx0fSxcclxuXHJcblx0XHRmaWxlVXJsOiBmdW5jdGlvbihmaWxlTmFtZSkge1xyXG5cdFx0XHRyZXR1cm4gJy9hcGkvZmlsZS9sb2FkP2ZpbGVOYW1lPScgKyBmaWxlTmFtZVxyXG5cdFx0fSxcclxuXHJcblx0XHR1cGxvYWRGaWxlOiBmdW5jdGlvbihkYXRhVXJsLCBzYXZlQXNmaWxlTmFtZSwgZGVzdFBhdGgpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tGaWxlU2VydmljZV0gdXBsb2FkRmlsZScsIHNhdmVBc2ZpbGVOYW1lKVxyXG5cdFx0XHR2YXIgYmxvYiA9ICQkLmRhdGFVUkx0b0Jsb2IoZGF0YVVybClcclxuXHRcdFx0aWYgKGJsb2IgPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0cmV0dXJuIFByb21pc2UucmVqZWN0KCdGaWxlIGZvcm1hdCBub3Qgc3VwcG9ydGVkJylcclxuXHRcdFx0fVxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdibG9iJywgYmxvYilcclxuXHRcdFx0dmFyIGZkID0gbmV3IEZvcm1EYXRhKClcclxuXHRcdFx0ZmQuYXBwZW5kKCdwaWN0dXJlJywgYmxvYiwgc2F2ZUFzZmlsZU5hbWUpXHJcblx0XHRcdGZkLmFwcGVuZCgnZGVzdFBhdGgnLCBkZXN0UGF0aClcclxuXHRcdFx0cmV0dXJuIGh0dHAucG9zdEZvcm1EYXRhKCcvYXBpL2ZpbGUvc2F2ZScsIGZkKVxyXG5cdFx0fSxcclxuXHJcblx0XHRyZW1vdmVGaWxlczogZnVuY3Rpb24oZmlsZU5hbWVzKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdbRmlsZVNlcnZpY2VdIHJlbW92ZUZpbGVzJywgZmlsZU5hbWVzKVxyXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0KCcvYXBpL2ZpbGUvZGVsZXRlJywgZmlsZU5hbWVzKVxyXG5cdFx0fSxcclxuXHJcblx0XHRta2RpcjogZnVuY3Rpb24oZmlsZU5hbWUpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tGaWxlU2VydmljZV0gbWtkaXInLCBmaWxlTmFtZSlcclxuXHRcdFx0cmV0dXJuIGh0dHAucG9zdCgnL2FwaS9maWxlL21rZGlyJywge2ZpbGVOYW1lOiBmaWxlTmFtZX0pXHJcblx0XHR9LFxyXG5cclxuXHRcdHJtZGlyOiBmdW5jdGlvbihmaWxlTmFtZSkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSBybWRpcicsIGZpbGVOYW1lKVxyXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0KCcvYXBpL2ZpbGUvcm1kaXInLCB7ZmlsZU5hbWU6IGZpbGVOYW1lfSlcclxuXHRcdH0sXHJcblxyXG5cdFx0bW92ZUZpbGVzOiBmdW5jdGlvbihmaWxlTmFtZXMsIGRlc3RQYXRoKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdbRmlsZVNlcnZpY2VdIG1vdmVGaWxlcycsIGZpbGVOYW1lcywgZGVzdFBhdGgpXHJcblx0XHRcdHJldHVybiBodHRwLnBvc3QoJy9hcGkvZmlsZS9tb3ZlJywge2ZpbGVOYW1lcywgZGVzdFBhdGh9KVxyXG5cdFx0fSxcclxuXHJcblx0XHRjb3B5RmlsZXM6IGZ1bmN0aW9uKGZpbGVOYW1lcywgZGVzdFBhdGgpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tGaWxlU2VydmljZV0gY29weUZpbGVzJywgZmlsZU5hbWVzLCBkZXN0UGF0aClcclxuXHRcdFx0cmV0dXJuIGh0dHAucG9zdCgnL2FwaS9maWxlL2NvcHknLCB7ZmlsZU5hbWVzLCBkZXN0UGF0aH0pXHJcblx0XHR9XHRcclxuXHR9XHJcblxyXG59KTtcclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ0h0dHBTZXJ2aWNlJywgZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHRnZXQodXJsKSB7XHJcblx0XHRcdFx0cmV0dXJuICQuZ2V0SlNPTih1cmwpXHJcblx0XHRcdH0sXHJcblxyXG5cclxuXHRcdFx0cG9zdCh1cmwsIGRhdGEpIHtcclxuXHRcdFx0XHRyZXR1cm4gJC5hamF4KHtcclxuXHRcdFx0XHRcdG1ldGhvZDogJ1BPU1QnLFxyXG5cdFx0XHRcdFx0dXJsIDogdXJsLFxyXG5cdFx0XHRcdFx0Y29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuXHRcdFx0XHRcdGRhdGE6IEpTT04uc3RyaW5naWZ5KGRhdGEpXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHB1dCh1cmwsIGRhdGEpIHtcclxuXHRcdFx0XHRyZXR1cm4gJC5hamF4KHtcclxuXHRcdFx0XHRcdG1ldGhvZDogJ1BVVCcsXHJcblx0XHRcdFx0XHR1cmwgOiB1cmwsXHJcblx0XHRcdFx0XHRjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG5cdFx0XHRcdFx0ZGF0YTogSlNPTi5zdHJpbmdpZnkoZGF0YSlcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9LFx0XHRcdFxyXG5cclxuXHRcdFx0ZGVsZXRlKHVybCkge1xyXG5cdFx0XHRcdHJldHVybiAkLmFqYXgoe1xyXG5cdFx0XHRcdFx0bWV0aG9kOiAnREVMRVRFJyxcclxuXHRcdFx0XHRcdHVybCA6IHVybCxcclxuXHRcdFx0XHR9KVx0XHRcdFx0XHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRwb3N0Rm9ybURhdGEodXJsLCBmZCkge1xyXG5cdFx0XHRcdHJldHVybiAkLmFqYXgoe1xyXG5cdFx0XHRcdCAgdXJsOiB1cmwsXHJcblx0XHRcdFx0ICB0eXBlOiBcIlBPU1RcIixcclxuXHRcdFx0XHQgIGRhdGE6IGZkLFxyXG5cdFx0XHRcdCAgcHJvY2Vzc0RhdGE6IGZhbHNlLCAgLy8gaW5kaXF1ZSDDoCBqUXVlcnkgZGUgbmUgcGFzIHRyYWl0ZXIgbGVzIGRvbm7DqWVzXHJcblx0XHRcdFx0ICBjb250ZW50VHlwZTogZmFsc2UgICAvLyBpbmRpcXVlIMOgIGpRdWVyeSBkZSBuZSBwYXMgY29uZmlndXJlciBsZSBjb250ZW50VHlwZVxyXG5cdFx0XHRcdH0pXHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0XHJcblx0XHR9XHJcblx0fSlcclxuXHJcblx0XHJcbn0pKCk7XHJcblxyXG5cclxuXHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJTZXJ2aWNlKCdMZWFmbGV0U2VydmljZScsIFsnV2ViU29ja2V0U2VydmljZSddLCBmdW5jdGlvbihjb25maWcsIGNsaWVudCkge1xyXG5cclxuXHRcdHZhciBMID0gd2luZG93LkxcclxuXHJcblx0XHRpZiAoISBMKSB7XHJcblx0XHRcdHRocm93KGBbTGVhZmxldFNlcnZpY2VdIE1pc3NpbmcgbGlicmFyeSBkZXBlbmRhbmN5ICdsZWFmbGV0LmpzJ2ApXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ0xlYWZsZXQgdmVyc2lvbicsIEwudmVyc2lvbilcclxuXHRcdFx0Y29uc29sZS5sb2coJ0xlYWZsZXREcmF3IHZlcnNpb24nLCBMLmRyYXdWZXJzaW9uKVxyXG5cdFx0XHQvL2RlbGV0ZSB3aW5kb3cuTFxyXG5cdFx0XHQkJC5sb2FkU3R5bGUoJy9jc3MvbGVhZmxldC5jc3MnKVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBMXHJcblxyXG5cdH0pXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJTZXJ2aWNlKCdNaWxTeW1ib2xTZXJ2aWNlJywgZnVuY3Rpb24oY29uZmlnKSB7XHJcblxyXG5cdFx0dmFyIG1zID0gd2luZG93Lm1zXHJcblxyXG5cdFx0aWYgKCEgbXMpIHtcclxuXHRcdFx0dGhyb3coYFtNaWxTeW1ib2xTZXJ2aWNlXSBNaXNzaW5nIGxpYnJhcnkgZGVwZW5kYW5jeSAnbWlsc3ltYm9sLmpzJ2ApXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0ZGVsZXRlIHdpbmRvdy5tc1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBtc1xyXG5cclxuXHR9KVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyU2VydmljZSgnT3BlbkxheWVyU2VydmljZScsIGZ1bmN0aW9uKGNvbmZpZykge1xyXG5cclxuXHRcdHZhciBvbCA9IHdpbmRvdy5vbFxyXG5cclxuXHRcdGlmICghIG9sKSB7XHJcblx0XHRcdHRocm93KGBbT3BlbkxheWVyU2VydmljZV0gTWlzc2luZyBsaWJyYXJ5IGRlcGVuZGFuY3kgJ29sLmonYClcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRkZWxldGUgd2luZG93Lm9sXHJcblx0XHRcdCQkLmxvYWRTdHlsZSgnL2Nzcy9vbC5jc3MnKVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBvbFxyXG5cclxuXHR9KVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyU2VydmljZSgnVHJlZUN0cmxTZXJ2aWNlJywgZnVuY3Rpb24oY29uZmlnKSB7XHJcblxyXG5cclxuXHRcdGlmICgkLnVpLmZhbmN5dHJlZSA9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0dGhyb3coYFtUcmVlQ3RybFNlcnZpY2VdIE1pc3NpbmcgbGlicmFyeSBkZXBlbmRhbmN5ICd0cmVlLmpzJ2ApXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ0ZhbmN5dHJlZSB2ZXJzaW9uOicsICQudWkuZmFuY3l0cmVlLnZlcnNpb24pXHJcblx0XHRcdCQkLmxvYWRTdHlsZSgnL2Nzcy90cmVlL3RyZWUuY3NzJylcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4ge31cclxuXHJcblx0fSlcclxuXHJcbn0pKCk7XHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJTZXJ2aWNlKCdUd2Vlbk1heFNlcnZpY2UnLCBmdW5jdGlvbihjb25maWcpIHtcclxuXHJcblx0XHR2YXIgVHdlZW5NYXggPSB3aW5kb3cuVHdlZW5NYXhcclxuXHJcblx0XHRpZiAoISBUd2Vlbk1heCkge1xyXG5cdFx0XHR0aHJvdyhgW1R3ZWVuTWF4U2VydmljZV0gTWlzc2luZyBsaWJyYXJ5IGRlcGVuZGFuY3kgJ3R3ZWVuLmpzJ2ApXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Ly9kZWxldGUgd2luZG93LlR3ZWVuTWF4XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIFR3ZWVuTWF4XHJcblxyXG5cdH0pXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0Y2xhc3MgV2ViU29ja2V0Q2xpZW50IHtcclxuXHJcblx0XHRjb25zdHJ1Y3RvcihpZCwgb3B0aW9ucykge1xyXG5cdFx0XHR0aGlzLnNvY2sgPSBudWxsXHJcblx0XHRcdHRoaXMuaWQgPSBpZFxyXG5cdFx0XHR0aGlzLmlzQ29ubmVjdGVkID0gZmFsc2VcclxuXHRcdFx0dGhpcy50b3BpY3MgPSBuZXcgRXZlbnRFbWl0dGVyMih7d2lsZGNhcmQ6IHRydWV9KVxyXG5cdFx0XHR0aGlzLnNlcnZpY2VzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxyXG5cdFx0XHR0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIyKClcclxuXHJcblx0XHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcblxyXG5cdFx0XHRjb25zdCBwb3J0ID0gb3B0aW9ucy5wb3J0IHx8IDgwOTBcclxuXHRcdFx0Y29uc3QgaG9zdCA9IG9wdGlvbnMuaG9zdCB8fCAnMTI3LjAuMC4xJ1xyXG5cclxuXHRcdFx0dGhpcy51cmwgPSBgd3NzOi8vJHtob3N0fToke3BvcnR9LyR7aWR9YFxyXG5cclxuXHRcdFx0dGhpcy5yZWdpc3RlcmVkVG9waWNzID0ge31cclxuXHRcdFx0dGhpcy5yZWdpc3RlcmVkU2VydmljZXMgPSB7fVxyXG5cdFx0XHR0aGlzLndhaXRpbmdNc2cgPSB7fVxyXG5cdFx0XHR0aGlzLnN1c3BlbmRlZCA9IGZhbHNlXHJcblx0XHR9XHJcblxyXG5cdFx0c3VzcGVuZCgpIHtcclxuXHRcdFx0dGhpcy5zdXNwZW5kZWQgPSB0cnVlXHJcblx0XHR9XHJcblxyXG5cdFx0cmVzdW1lKCkge1xyXG5cdFx0XHRpZiAodGhpcy5zdXNwZW5kZWQpIHtcclxuXHRcdFx0XHRmb3IobGV0IHRvcGljIGluIHRoaXMud2FpdGluZ01zZykge1xyXG5cdFx0XHRcdFx0Y29uc3QgbXNnID0gdGhpcy53YWl0aW5nTXNnW3RvcGljXVxyXG5cdFx0XHRcdFx0dGhpcy50b3BpY3MuZW1pdCh0b3BpYywgbXNnKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLndhaXRpbmdNc2cgPSB7fVxyXG5cdFx0XHRcdHRoaXMuc3VzcGVuZGVkID0gZmFsc2VcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGNvbm5lY3QoKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCd0cnkgdG8gY29ubmVjdC4uLicpXHJcblxyXG5cdFx0XHR2YXIgc29jayA9IG5ldyBXZWJTb2NrZXQodGhpcy51cmwpXHJcblx0XHJcblx0XHRcdHNvY2suYWRkRXZlbnRMaXN0ZW5lcignb3BlbicsICgpID0+IHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZyhcIkNvbm5lY3RlZCB0byBNYXN0ZXJcIilcclxuXHRcdFx0XHR0aGlzLmlzQ29ubmVjdGVkID0gdHJ1ZVxyXG5cdFx0XHRcdHRoaXMuZXZlbnRzLmVtaXQoJ2Nvbm5lY3QnKVxyXG5cclxuXHRcdFx0XHRmb3IobGV0IHRvcGljIGluIHRoaXMucmVnaXN0ZXJlZFRvcGljcykge1xyXG5cdFx0XHRcdFx0dmFyIGdldExhc3QgPSB0aGlzLnJlZ2lzdGVyZWRUb3BpY3NbdG9waWNdXHJcblx0XHRcdFx0XHR0aGlzLnNlbmRNc2coe3R5cGU6ICdyZWdpc3RlcicsIHRvcGljOiB0b3BpYywgZ2V0TGFzdDogZ2V0TGFzdH0pXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRmb3IobGV0IHNydk5hbWUgaW4gdGhpcy5yZWdpc3RlcmVkU2VydmljZXMpIHtcclxuXHRcdFx0XHRcdHRoaXMuc2VuZE1zZyh7dHlwZTogJ3JlZ2lzdGVyU2VydmljZScsIHNydk5hbWU6IHNydk5hbWV9KVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdH0pIFxyXG5cclxuXHRcdFx0c29jay5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2KSA9PiB7XHJcblx0XHRcdFx0dmFyIG1zZyA9IEpTT04ucGFyc2UoZXYuZGF0YSlcclxuXHJcblxyXG5cdFx0XHRcdGlmICh0eXBlb2YgbXNnLnRvcGljID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRsZXQgc3BsaXQgPSBtc2cudG9waWMuc3BsaXQoJy4nKSAvLyBjb21wdXRlIHRoZSBpZCAobGF5ZXJJZC5vYmplY3RJZCkgZnJvbSB0b3BpY1xyXG5cdFx0XHRcdFx0aWYgKHNwbGl0Lmxlbmd0aCA9PSAzKSB7XHJcblx0XHRcdFx0XHRcdHNwbGl0LnNoaWZ0KClcclxuXHRcdFx0XHRcdFx0bXNnLmlkID0gc3BsaXQuam9pbignLicpXHJcblx0XHRcdFx0XHR9XHRcdFx0XHRcdFxyXG5cclxuXHRcdFx0XHRcdGlmICh0aGlzLnN1c3BlbmRlZCkge1xyXG5cdFx0XHRcdFx0XHR0aGlzLndhaXRpbmdNc2dbbXNnLnRvcGljXSA9IG1zZ1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdHRoaXMudG9waWNzLmVtaXQobXNnLnRvcGljLCBtc2cpXHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZiAobXNnLnR5cGUgPT0gJ2NhbGxTZXJ2aWNlJykge1xyXG5cdFx0XHRcdFx0dGhpcy5oYW5kbGVDYWxsU2VydmljZShtc2cpXHJcblx0XHRcdFx0fVx0XHRcdFx0XHJcblxyXG5cdFx0XHRcdGlmIChtc2cudHlwZSA9PSAnY2FsbFNlcnZpY2VSZXNwJykge1xyXG5cdFx0XHRcdFx0dGhpcy5zZXJ2aWNlcy5lbWl0KG1zZy5zcnZOYW1lLCBtc2cpXHJcblx0XHRcdFx0fVx0XHRcdFx0XHJcblx0XHRcdFxyXG5cdFx0XHR9KVxyXG5cclxuXHRcdFx0c29jay5hZGRFdmVudExpc3RlbmVyKCdjbG9zZScsIChjb2RlLCByZWFzb24pID0+IHtcclxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdXUyBjbG9zZScsIGNvZGUsIHJlYXNvbilcclxuXHRcdFx0XHRpZiAodGhpcy5pc0Nvbm5lY3RlZCkge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ0Rpc2Nvbm5lY3RlZCAhJylcclxuXHRcdFx0XHRcdHRoaXMuZXZlbnRzLmVtaXQoJ2Rpc2Nvbm5lY3QnKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0aGlzLmlzQ29ubmVjdGVkID0gZmFsc2VcclxuXHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IHt0aGlzLmNvbm5lY3QoKX0sIDUwMDApXHJcblxyXG5cdFx0XHR9KVxyXG5cclxuXHJcblx0XHRcdHRoaXMuc29jayA9IHNvY2tcdFx0XHJcblx0XHR9XHJcblxyXG5cdFx0aGFuZGxlQ2FsbFNlcnZpY2UobXNnKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2hhbmRsZUNhbGxTZXJ2aWNlJylcclxuXHRcdFx0Y29uc3QgZnVuYyA9IHRoaXMucmVnaXN0ZXJlZFNlcnZpY2VzW21zZy5zcnZOYW1lXVxyXG5cdFx0XHRpZiAodHlwZW9mIGZ1bmMgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdHZhciByZXNwTXNnID0ge1xyXG5cdFx0XHRcdFx0dHlwZTogJ2NhbGxTZXJ2aWNlUmVzcCcsXHJcblx0XHRcdFx0XHRzcnZOYW1lOiBtc2cuc3J2TmFtZSxcclxuXHRcdFx0XHRcdGRlc3Q6IG1zZy5zcmMsXHJcblx0XHRcdFx0XHRzdGF0dXNDb2RlOiAwXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGZ1bmMobXNnLmRhdGEsIHJlc3BNc2cpXHJcblx0XHRcdFx0dGhpcy5zZW5kTXNnKHJlc3BNc2cpXHRcdFx0XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRzZW5kTXNnKG1zZykge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbQ2xpZW50XSBzZW5kTXNnJywgbXNnKVxyXG5cdFx0XHRtc2cudGltZSA9IERhdGUubm93KClcclxuXHRcdFx0dmFyIHRleHQgPSBKU09OLnN0cmluZ2lmeShtc2cpXHJcblx0XHRcdGlmICh0aGlzLmlzQ29ubmVjdGVkKSB7XHJcblx0XHRcdFx0dGhpcy5zb2NrLnNlbmQodGV4dClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGVtaXQodG9waWMsIGRhdGEpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygncHVibGlzaCcsIHRvcGljLCBkYXRhKVxyXG5cdFx0XHR2YXIgbXNnID0ge1xyXG5cdFx0XHRcdHR5cGU6ICdub3RpZicsXHJcblx0XHRcdFx0dG9waWM6IHRvcGljXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChkYXRhICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRtc2cuZGF0YSA9IGRhdGFcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLnNlbmRNc2cobXNnKVxyXG5cdFx0fVxyXG5cclxuXHRcdG9uKHRvcGljLCBjYWxsYmFjaykge1xyXG5cclxuXHRcdFx0dGhpcy50b3BpY3Mub24odG9waWMsIGNhbGxiYWNrKVxyXG5cdFx0fVxyXG5cclxuXHRcdHJlZ2lzdGVyKHRvcGljcywgZ2V0TGFzdCwgY2FsbGJhY2spIHtcclxuXHRcdFx0aWYgKHR5cGVvZiB0b3BpY3MgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHR0b3BpY3MgPSBbdG9waWNzXVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0b3BpY3MuZm9yRWFjaCgodG9waWMpID0+IHtcclxuXHRcdFx0XHR0aGlzLnJlZ2lzdGVyZWRUb3BpY3NbdG9waWNdID0gZ2V0TGFzdFxyXG5cdFx0XHRcdHRoaXMub24odG9waWMsIGNhbGxiYWNrKVxyXG5cdFx0XHRcdGlmICh0aGlzLmlzQ29ubmVjdGVkKSB7XHJcblx0XHRcdFx0XHR0aGlzLnNlbmRNc2coe3R5cGU6ICdyZWdpc3RlcicsIHRvcGljOiB0b3BpYywgZ2V0TGFzdDogZ2V0TGFzdH0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0XHRcclxuXHRcdH1cclxuXHJcblx0XHR1bnJlZ2lzdGVyKHRvcGljcywgY2FsbGJhY2spIHtcclxuXHRcdFx0aWYgKHR5cGVvZiB0b3BpY3MgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHR0b3BpY3MgPSBbdG9waWNzXVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0b3BpY3MuZm9yRWFjaCgodG9waWMpID0+IHtcclxuXHJcblx0XHRcdFx0dGhpcy50b3BpY3Mub2ZmKHRvcGljLCBjYWxsYmFjaylcclxuXHRcdFx0XHR2YXIgbmJMaXN0ZW5lcnMgPSB0aGlzLnRvcGljcy5saXN0ZW5lcnModG9waWMpLmxlbmd0aFxyXG5cclxuXHRcdFx0XHRpZiAodGhpcy5pc0Nvbm5lY3RlZCAmJiBuYkxpc3RlbmVycyA9PSAwKSB7IC8vIG5vIG1vcmUgbGlzdGVuZXJzIGZvciB0aGlzIHRvcGljXHJcblx0XHRcdFx0XHR0aGlzLnNlbmRNc2coe3R5cGU6ICd1bnJlZ2lzdGVyJywgdG9waWM6IHRvcGljfSlcclxuXHRcdFx0XHR9XHRcdFxyXG5cdFx0XHR9KVxyXG5cdFx0fVx0XHRcclxuXHJcblx0XHRyZWdpc3RlclNlcnZpY2Uoc3J2TmFtZSwgZnVuYykge1xyXG5cdFx0XHR0aGlzLnJlZ2lzdGVyZWRTZXJ2aWNlc1tzcnZOYW1lXSA9IGZ1bmNcclxuXHRcdFx0aWYgKHRoaXMuaXNDb25uZWN0ZWQpIHtcclxuXHRcdFx0XHR0aGlzLnNlbmRNc2coe3R5cGU6ICdyZWdpc3RlclNlcnZpY2UnLCBzcnZOYW1lOiBzcnZOYW1lfSlcclxuXHRcdFx0fVx0XHRcclxuXHRcdH1cclxuXHJcblxyXG5cdFx0Y2FsbFNlcnZpY2Uoc3J2TmFtZSwgZGF0YSkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0NsaWVudF0gY2FsbFNlcnZpY2UnLCBzcnZOYW1lLCBkYXRhKVxyXG5cdFx0XHR2YXIgdGhhdCA9IHRoaXNcclxuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuXHRcdFx0XHR0aGlzLnNlcnZpY2VzLm9uY2Uoc3J2TmFtZSwgZnVuY3Rpb24obXNnKSB7XHJcblx0XHRcdFx0XHR2YXIgc3RhdHVzQ29kZSA9IG1zZy5zdGF0dXNDb2RlXHJcblx0XHRcdFx0XHRpZiAoc3RhdHVzQ29kZSA9PSAwKSB7XHJcblx0XHRcdFx0XHRcdHJlc29sdmUobXNnLmRhdGEpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0cmVqZWN0KHtcclxuXHRcdFx0XHRcdFx0XHRjb2RlOiBzdGF0dXNDb2RlLFxyXG5cdFx0XHRcdFx0XHRcdG1lc3NhZ2U6IGdldEVycm9yTWVzc2FnZShtc2cuc3RhdHVzQ29kZSlcclxuXHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KVxyXG5cclxuXHRcdFx0XHR0aGlzLnNlbmRNc2coe1xyXG5cdFx0XHRcdFx0dHlwZTogJ2NhbGxTZXJ2aWNlJyxcclxuXHRcdFx0XHRcdHNydk5hbWU6IHNydk5hbWUsXHJcblx0XHRcdFx0XHRkYXRhOiBkYXRhXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHJcblxyXG5cclxuXHRcdHNlbmRUbyhkZXN0LCB0b3BpYywgZGF0YSkge1xyXG5cdFx0XHR2YXIgbXNnID0ge1xyXG5cdFx0XHRcdHR5cGU6ICdjbWQnLFxyXG5cdFx0XHRcdHRvcGljOiB0b3BpYyxcclxuXHRcdFx0XHRkZXN0OiBkZXN0XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChkYXRhICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRtc2cuZGF0YSA9IGRhdGFcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLnNlbmRNc2cobXNnKVx0XHRcclxuXHRcdH1cdFxyXG5cdFx0XHJcblx0fVxyXG5cclxuXHJcblxyXG5cclxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ1dlYlNvY2tldFNlcnZpY2UnLCBmdW5jdGlvbihjb25maWcpIHtcclxuXHRcdGNvbnN0IG9wdGlvbnMgPSB7XHJcblx0XHRcdHBvcnQ6IGNvbmZpZy5wb3J0IHx8IDgwOTAsXHJcblx0XHRcdGhvc3Q6IGNvbmZpZy5ob3N0IHx8IGxvY2F0aW9uLmhvc3RuYW1lXHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGlkID0gKGNvbmZpZy5pZCB8fCAnV2ViU29ja2V0JykgKyAoRGF0ZS5ub3coKSAlIDEwMDAwMClcclxuXHJcblx0XHRjb25zdCBjbGllbnQgPSBuZXcgV2ViU29ja2V0Q2xpZW50KGlkLCBvcHRpb25zKVxyXG5cdFx0Y2xpZW50LmNvbm5lY3QoKVxyXG5cclxuXHRcdHJldHVybiBjbGllbnQ7XHJcblx0fSlcclxuXHJcblxyXG59KSgpO1xyXG4iXX0=
