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

	$$.registerService('WebSocketService', function(config) {
		const options = {
			masterPort: config.port || 8090,
			masterHost: config.host || location.hostname
		}

		var id = (config.id || 'WebSocket') + (Date.now() % 100000)

		const client = new WebSocketClient(id, options)
		client.connect()

		return client;
	})


})();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGUuanMiLCJodHRwLmpzIiwibGVhZmxldC5qcyIsIm1pbHN5bWJvbC5qcyIsIm9sLmpzIiwidHJlZS5qcyIsInR3ZWVuLmpzIiwid2Vic29ja2V0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoic2VydmljZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkJC5yZWdpc3RlclNlcnZpY2UoJ0ZpbGVTZXJ2aWNlJywgWydIdHRwU2VydmljZSddLCBmdW5jdGlvbihjb25maWcsIGh0dHApIHtcclxuXHJcblx0cmV0dXJuIHtcclxuXHRcdGxpc3Q6IGZ1bmN0aW9uKHBhdGgsIGltYWdlT25seSwgZm9sZGVyT25seSkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSBsaXN0JywgcGF0aClcclxuXHJcblx0XHRcdHJldHVybiBodHRwLnBvc3QoJy9hcGkvZmlsZS9saXN0Jywge3BhdGgsIGltYWdlT25seSwgZm9sZGVyT25seX0pXHJcblx0XHR9LFxyXG5cclxuXHRcdGZpbGVVcmw6IGZ1bmN0aW9uKGZpbGVOYW1lKSB7XHJcblx0XHRcdHJldHVybiAnL2FwaS9maWxlL2xvYWQ/ZmlsZU5hbWU9JyArIGZpbGVOYW1lXHJcblx0XHR9LFxyXG5cclxuXHRcdHVwbG9hZEZpbGU6IGZ1bmN0aW9uKGRhdGFVcmwsIHNhdmVBc2ZpbGVOYW1lLCBkZXN0UGF0aCkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSB1cGxvYWRGaWxlJywgc2F2ZUFzZmlsZU5hbWUpXHJcblx0XHRcdHZhciBibG9iID0gJCQuZGF0YVVSTHRvQmxvYihkYXRhVXJsKVxyXG5cdFx0XHRpZiAoYmxvYiA9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZWplY3QoJ0ZpbGUgZm9ybWF0IG5vdCBzdXBwb3J0ZWQnKVxyXG5cdFx0XHR9XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2Jsb2InLCBibG9iKVxyXG5cdFx0XHR2YXIgZmQgPSBuZXcgRm9ybURhdGEoKVxyXG5cdFx0XHRmZC5hcHBlbmQoJ3BpY3R1cmUnLCBibG9iLCBzYXZlQXNmaWxlTmFtZSlcclxuXHRcdFx0ZmQuYXBwZW5kKCdkZXN0UGF0aCcsIGRlc3RQYXRoKVxyXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0Rm9ybURhdGEoJy9hcGkvZmlsZS9zYXZlJywgZmQpXHJcblx0XHR9LFxyXG5cclxuXHRcdHJlbW92ZUZpbGVzOiBmdW5jdGlvbihmaWxlTmFtZXMpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tGaWxlU2VydmljZV0gcmVtb3ZlRmlsZXMnLCBmaWxlTmFtZXMpXHJcblx0XHRcdHJldHVybiBodHRwLnBvc3QoJy9hcGkvZmlsZS9kZWxldGUnLCBmaWxlTmFtZXMpXHJcblx0XHR9LFxyXG5cclxuXHRcdG1rZGlyOiBmdW5jdGlvbihmaWxlTmFtZSkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSBta2RpcicsIGZpbGVOYW1lKVxyXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0KCcvYXBpL2ZpbGUvbWtkaXInLCB7ZmlsZU5hbWU6IGZpbGVOYW1lfSlcclxuXHRcdH0sXHJcblxyXG5cdFx0cm1kaXI6IGZ1bmN0aW9uKGZpbGVOYW1lKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdbRmlsZVNlcnZpY2VdIHJtZGlyJywgZmlsZU5hbWUpXHJcblx0XHRcdHJldHVybiBodHRwLnBvc3QoJy9hcGkvZmlsZS9ybWRpcicsIHtmaWxlTmFtZTogZmlsZU5hbWV9KVxyXG5cdFx0fSxcclxuXHJcblx0XHRtb3ZlRmlsZXM6IGZ1bmN0aW9uKGZpbGVOYW1lcywgZGVzdFBhdGgpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ1tGaWxlU2VydmljZV0gbW92ZUZpbGVzJywgZmlsZU5hbWVzLCBkZXN0UGF0aClcclxuXHRcdFx0cmV0dXJuIGh0dHAucG9zdCgnL2FwaS9maWxlL21vdmUnLCB7ZmlsZU5hbWVzLCBkZXN0UGF0aH0pXHJcblx0XHR9LFxyXG5cclxuXHRcdGNvcHlGaWxlczogZnVuY3Rpb24oZmlsZU5hbWVzLCBkZXN0UGF0aCkge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnW0ZpbGVTZXJ2aWNlXSBjb3B5RmlsZXMnLCBmaWxlTmFtZXMsIGRlc3RQYXRoKVxyXG5cdFx0XHRyZXR1cm4gaHR0cC5wb3N0KCcvYXBpL2ZpbGUvY29weScsIHtmaWxlTmFtZXMsIGRlc3RQYXRofSlcclxuXHRcdH1cdFxyXG5cdH1cclxuXHJcbn0pO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQkLnJlZ2lzdGVyU2VydmljZSgnSHR0cFNlcnZpY2UnLCBmdW5jdGlvbigpIHtcclxuXHRcdHJldHVybiB7XHJcblx0XHRcdGdldCh1cmwpIHtcclxuXHRcdFx0XHRyZXR1cm4gJC5nZXRKU09OKHVybClcclxuXHRcdFx0fSxcclxuXHJcblxyXG5cdFx0XHRwb3N0KHVybCwgZGF0YSkge1xyXG5cdFx0XHRcdHJldHVybiAkLmFqYXgoe1xyXG5cdFx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXHJcblx0XHRcdFx0XHR1cmwgOiB1cmwsXHJcblx0XHRcdFx0XHRjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG5cdFx0XHRcdFx0ZGF0YTogSlNPTi5zdHJpbmdpZnkoZGF0YSlcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0cHV0KHVybCwgZGF0YSkge1xyXG5cdFx0XHRcdHJldHVybiAkLmFqYXgoe1xyXG5cdFx0XHRcdFx0bWV0aG9kOiAnUFVUJyxcclxuXHRcdFx0XHRcdHVybCA6IHVybCxcclxuXHRcdFx0XHRcdGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXHJcblx0XHRcdFx0XHRkYXRhOiBKU09OLnN0cmluZ2lmeShkYXRhKVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH0sXHRcdFx0XHJcblxyXG5cdFx0XHRkZWxldGUodXJsKSB7XHJcblx0XHRcdFx0cmV0dXJuICQuYWpheCh7XHJcblx0XHRcdFx0XHRtZXRob2Q6ICdERUxFVEUnLFxyXG5cdFx0XHRcdFx0dXJsIDogdXJsLFxyXG5cdFx0XHRcdH0pXHRcdFx0XHRcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdHBvc3RGb3JtRGF0YSh1cmwsIGZkKSB7XHJcblx0XHRcdFx0cmV0dXJuICQuYWpheCh7XHJcblx0XHRcdFx0ICB1cmw6IHVybCxcclxuXHRcdFx0XHQgIHR5cGU6IFwiUE9TVFwiLFxyXG5cdFx0XHRcdCAgZGF0YTogZmQsXHJcblx0XHRcdFx0ICBwcm9jZXNzRGF0YTogZmFsc2UsICAvLyBpbmRpcXVlIMOgIGpRdWVyeSBkZSBuZSBwYXMgdHJhaXRlciBsZXMgZG9ubsOpZXNcclxuXHRcdFx0XHQgIGNvbnRlbnRUeXBlOiBmYWxzZSAgIC8vIGluZGlxdWUgw6AgalF1ZXJ5IGRlIG5lIHBhcyBjb25maWd1cmVyIGxlIGNvbnRlbnRUeXBlXHJcblx0XHRcdFx0fSlcdFx0XHRcdFxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRcclxuXHRcdH1cclxuXHR9KVxyXG5cclxuXHRcclxufSkoKTtcclxuXHJcblxyXG5cclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ0xlYWZsZXRTZXJ2aWNlJywgWydXZWJTb2NrZXRTZXJ2aWNlJ10sIGZ1bmN0aW9uKGNvbmZpZywgY2xpZW50KSB7XHJcblxyXG5cdFx0dmFyIEwgPSB3aW5kb3cuTFxyXG5cclxuXHRcdGlmICghIEwpIHtcclxuXHRcdFx0dGhyb3coYFtMZWFmbGV0U2VydmljZV0gTWlzc2luZyBsaWJyYXJ5IGRlcGVuZGFuY3kgJ2xlYWZsZXQuanMnYClcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnTGVhZmxldCB2ZXJzaW9uJywgTC52ZXJzaW9uKVxyXG5cdFx0XHRjb25zb2xlLmxvZygnTGVhZmxldERyYXcgdmVyc2lvbicsIEwuZHJhd1ZlcnNpb24pXHJcblx0XHRcdC8vZGVsZXRlIHdpbmRvdy5MXHJcblx0XHRcdCQkLmxvYWRTdHlsZSgnL2Nzcy9sZWFmbGV0LmNzcycpXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIExcclxuXHJcblx0fSlcclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ01pbFN5bWJvbFNlcnZpY2UnLCBmdW5jdGlvbihjb25maWcpIHtcclxuXHJcblx0XHR2YXIgbXMgPSB3aW5kb3cubXNcclxuXHJcblx0XHRpZiAoISBtcykge1xyXG5cdFx0XHR0aHJvdyhgW01pbFN5bWJvbFNlcnZpY2VdIE1pc3NpbmcgbGlicmFyeSBkZXBlbmRhbmN5ICdtaWxzeW1ib2wuanMnYClcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRkZWxldGUgd2luZG93Lm1zXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIG1zXHJcblxyXG5cdH0pXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJTZXJ2aWNlKCdPcGVuTGF5ZXJTZXJ2aWNlJywgZnVuY3Rpb24oY29uZmlnKSB7XHJcblxyXG5cdFx0dmFyIG9sID0gd2luZG93Lm9sXHJcblxyXG5cdFx0aWYgKCEgb2wpIHtcclxuXHRcdFx0dGhyb3coYFtPcGVuTGF5ZXJTZXJ2aWNlXSBNaXNzaW5nIGxpYnJhcnkgZGVwZW5kYW5jeSAnb2wuaidgKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGRlbGV0ZSB3aW5kb3cub2xcclxuXHRcdFx0JCQubG9hZFN0eWxlKCcvY3NzL29sLmNzcycpXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIG9sXHJcblxyXG5cdH0pXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JCQucmVnaXN0ZXJTZXJ2aWNlKCdUcmVlQ3RybFNlcnZpY2UnLCBmdW5jdGlvbihjb25maWcpIHtcclxuXHJcblxyXG5cdFx0aWYgKCQudWkuZmFuY3l0cmVlID09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHR0aHJvdyhgW1RyZWVDdHJsU2VydmljZV0gTWlzc2luZyBsaWJyYXJ5IGRlcGVuZGFuY3kgJ3RyZWUuanMnYClcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRjb25zb2xlLmxvZygnRmFuY3l0cmVlIHZlcnNpb246JywgJC51aS5mYW5jeXRyZWUudmVyc2lvbilcclxuXHRcdFx0JCQubG9hZFN0eWxlKCcvY3NzL3RyZWUvdHJlZS5jc3MnKVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB7fVxyXG5cclxuXHR9KVxyXG5cclxufSkoKTtcclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ1R3ZWVuTWF4U2VydmljZScsIGZ1bmN0aW9uKGNvbmZpZykge1xyXG5cclxuXHRcdHZhciBUd2Vlbk1heCA9IHdpbmRvdy5Ud2Vlbk1heFxyXG5cclxuXHRcdGlmICghIFR3ZWVuTWF4KSB7XHJcblx0XHRcdHRocm93KGBbVHdlZW5NYXhTZXJ2aWNlXSBNaXNzaW5nIGxpYnJhcnkgZGVwZW5kYW5jeSAndHdlZW4uanMnYClcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHQvL2RlbGV0ZSB3aW5kb3cuVHdlZW5NYXhcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gVHdlZW5NYXhcclxuXHJcblx0fSlcclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkJC5yZWdpc3RlclNlcnZpY2UoJ1dlYlNvY2tldFNlcnZpY2UnLCBmdW5jdGlvbihjb25maWcpIHtcclxuXHRcdGNvbnN0IG9wdGlvbnMgPSB7XHJcblx0XHRcdG1hc3RlclBvcnQ6IGNvbmZpZy5wb3J0IHx8IDgwOTAsXHJcblx0XHRcdG1hc3Rlckhvc3Q6IGNvbmZpZy5ob3N0IHx8IGxvY2F0aW9uLmhvc3RuYW1lXHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGlkID0gKGNvbmZpZy5pZCB8fCAnV2ViU29ja2V0JykgKyAoRGF0ZS5ub3coKSAlIDEwMDAwMClcclxuXHJcblx0XHRjb25zdCBjbGllbnQgPSBuZXcgV2ViU29ja2V0Q2xpZW50KGlkLCBvcHRpb25zKVxyXG5cdFx0Y2xpZW50LmNvbm5lY3QoKVxyXG5cclxuXHRcdHJldHVybiBjbGllbnQ7XHJcblx0fSlcclxuXHJcblxyXG59KSgpO1xyXG4iXX0=
