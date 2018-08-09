(function() {

	$$.registerControlEx('WebcamControl', {

		events: 'mediaReady',
		iface: 'takePicture():dataURL',

		
	lib: 'media',
init: function(elt) {


			var canvas
			var video

			const ctrl = $$.viewController(elt, {
				template: "<div class=\"bn-flex-1 bn-flex-col\">\n	<div><span bn-text=\"message\"></span></div>\n	<video bn-bind=\"video\" bn-event=\"canplay: onCanPlay\" class=\"bn-flex-1 responsive-image\" ></video>\n	<canvas bn-bind=\"canvas\" hidden=\"\"></canvas>\n</div>",
				events: {
					onCanPlay: function() {
						console.log(`[WebcamControl] onCanPlay, width: ${this.videoWidth}, height: ${this.videoHeight}`)
						canvas.width = this.videoWidth
						canvas.height = this.videoHeight
						elt.trigger('mediaReady')
					}
				},
				init: function() {
					video = this.scope.video.get(0)
					canvas = this.scope.canvas.get(0)
				} 
			})

			this.takePicture = function() {
			    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
			    return canvas.toDataURL('image/png');
			}

			navigator.getUserMedia({video: true}, function(stream) {
				//console.log('stream')

				var url = URL.createObjectURL(stream)
				video.src = url
				video.play()

			},
			function(err) {
				console.log('[WebcamControl] error', err)
				ctrl.setData('message', err.name)
			})	

	
		}
	})

})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInZpZGVvLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtZWRpYS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcblxuXHQkJC5yZWdpc3RlckNvbnRyb2xFeCgnV2ViY2FtQ29udHJvbCcsIHtcblxuXHRcdGV2ZW50czogJ21lZGlhUmVhZHknLFxuXHRcdGlmYWNlOiAndGFrZVBpY3R1cmUoKTpkYXRhVVJMJyxcblxuXHRcdFxuXHRsaWI6ICdtZWRpYScsXG5pbml0OiBmdW5jdGlvbihlbHQpIHtcblxuXG5cdFx0XHR2YXIgY2FudmFzXG5cdFx0XHR2YXIgdmlkZW9cblxuXHRcdFx0Y29uc3QgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LTEgYm4tZmxleC1jb2xcXFwiPlxcblx0PGRpdj48c3BhbiBibi10ZXh0PVxcXCJtZXNzYWdlXFxcIj48L3NwYW4+PC9kaXY+XFxuXHQ8dmlkZW8gYm4tYmluZD1cXFwidmlkZW9cXFwiIGJuLWV2ZW50PVxcXCJjYW5wbGF5OiBvbkNhblBsYXlcXFwiIGNsYXNzPVxcXCJibi1mbGV4LTEgcmVzcG9uc2l2ZS1pbWFnZVxcXCIgPjwvdmlkZW8+XFxuXHQ8Y2FudmFzIGJuLWJpbmQ9XFxcImNhbnZhc1xcXCIgaGlkZGVuPVxcXCJcXFwiPjwvY2FudmFzPlxcbjwvZGl2PlwiLFxuXHRcdFx0XHRldmVudHM6IHtcblx0XHRcdFx0XHRvbkNhblBsYXk6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coYFtXZWJjYW1Db250cm9sXSBvbkNhblBsYXksIHdpZHRoOiAke3RoaXMudmlkZW9XaWR0aH0sIGhlaWdodDogJHt0aGlzLnZpZGVvSGVpZ2h0fWApXG5cdFx0XHRcdFx0XHRjYW52YXMud2lkdGggPSB0aGlzLnZpZGVvV2lkdGhcblx0XHRcdFx0XHRcdGNhbnZhcy5oZWlnaHQgPSB0aGlzLnZpZGVvSGVpZ2h0XG5cdFx0XHRcdFx0XHRlbHQudHJpZ2dlcignbWVkaWFSZWFkeScpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRpbml0OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR2aWRlbyA9IHRoaXMuc2NvcGUudmlkZW8uZ2V0KDApXG5cdFx0XHRcdFx0Y2FudmFzID0gdGhpcy5zY29wZS5jYW52YXMuZ2V0KDApXG5cdFx0XHRcdH0gXG5cdFx0XHR9KVxuXG5cdFx0XHR0aGlzLnRha2VQaWN0dXJlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQgICAgY2FudmFzLmdldENvbnRleHQoJzJkJykuZHJhd0ltYWdlKHZpZGVvLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXHRcdFx0ICAgIHJldHVybiBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKTtcblx0XHRcdH1cblxuXHRcdFx0bmF2aWdhdG9yLmdldFVzZXJNZWRpYSh7dmlkZW86IHRydWV9LCBmdW5jdGlvbihzdHJlYW0pIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnc3RyZWFtJylcblxuXHRcdFx0XHR2YXIgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChzdHJlYW0pXG5cdFx0XHRcdHZpZGVvLnNyYyA9IHVybFxuXHRcdFx0XHR2aWRlby5wbGF5KClcblxuXHRcdFx0fSxcblx0XHRcdGZ1bmN0aW9uKGVycikge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnW1dlYmNhbUNvbnRyb2xdIGVycm9yJywgZXJyKVxuXHRcdFx0XHRjdHJsLnNldERhdGEoJ21lc3NhZ2UnLCBlcnIubmFtZSlcblx0XHRcdH0pXHRcblxuXHRcblx0XHR9XG5cdH0pXG5cbn0pKCk7Il19
