$$.configReady(function(config) {

	$$.startApp('MainControl')
})
$$.registerControl('MainControl', ['FileService'], function(elt, fileSrv) {

	var audio = new Audio('/webapps/camera/assets/camera_shutter.mp3')


	var pictureUrl

	function savePicture() {
		fileSrv.uploadFile(pictureUrl, 'image.png', '/').then(function(resp) {
			console.log('resp', resp)
			$.notify('File uploaded successfully', {position: 'right top', className: 'success'})
		})	
		.catch(function(resp) {
			console.warn('savePicture error', resp.responseText)
		})
 
	}

	const saveDlgCtrl = $$.formDialogController('Save Picture', {
		template: "<div>\n	<label>Choose folder :</label>\n	<div style=\"height: 200px\" class=\"scrollPanel\">\n		<div bn-control=\"FileTreeControl\" name=\"folderName\"  bn-iface=\"treeCtrl\"></div>\n	</div>\n	\n	<div class=\"bn-flex-col\" bn-control=\"InputGroupControl\">\n		<label>FileName :</label>\n		<input type=\"text\" name=\"fileName\" required>\n	</div>\n\n</div>"
	})

	saveDlgCtrl.beforeShow = function() {
		console.log('beforeShow')
		this.scope.treeCtrl.refresh()		
	}

	const ctrl = window.app = $$.viewController(elt, {
		template: "<div class=\"bn-flex-col bn-flex-1\">\n\n	<div bn-show=\"!showPhoto\" class=\"bn-flex-1 bn-flex-col\">\n		<div bn-show=\"showBtn\" class=\"bn-toolbar\">\n			<button title=\"Take a picture\" bn-event=\"click: onTakePhoto\" ><i class=\"fa fa-camera\"></i></button>\n		</div>\n\n		<div class=\"contentPanel bn-flex-1\">\n			<div bn-control=\"WebcamControl\" bn-iface=\"video\" bn-event=\"mediaReady: onMediaReady\" class=\"bn-flex-col bn-flex-1\"></div>\n		</div>\n		\n		\n			\n	</div>\n\n	<div bn-show=\"showPhoto\" class=\"bn-flex-1 bn-flex-col\">\n		<div class=\"bn-toolbar\">\n			<button title=\"Back\" bn-event=\"click: onBack\"><i class=\"fa fa-arrow-left\"></i></button>\n			<button title=\"Save Picture\" bn-event=\"click: onSave\"><i class=\"fa fa-save\"></i></button>\n		</div>\n		<div class=\"contentPanel  bn-flex-1\" >\n			<div style=\"text-align: center;\">\n				<img bn-attr=\"src: imgUrl\" class=\"responsive-image\">\n			</div>\n			\n		</div>\n		\n	</div>\n\n\n</div>",
		data: {
			showBtn: false,
			imgUrl: '',
			showPhoto: false
		},
		events: {
			onTakePhoto: function() {
				console.log('onTakePhoto')
				audio.play()
				pictureUrl = ctrl.scope.video.takePicture()
				ctrl.setData({imgUrl: pictureUrl, showPhoto: true})
				
			},

			onMediaReady: function() {
				console.log('onMediaReady')
				ctrl.setData('showBtn', true)
			},

			onBack: function() {
				ctrl.setData({showPhoto: false})
			},

			onSave: function() {


				saveDlgCtrl.show({}, function(data) {
					console.log('data', data)

					fileSrv.uploadFile(pictureUrl, data.fileName + '.png', data.folderName).then(function(resp) {
						console.log('resp', resp)
						$.notify('File uploaded successfully', {position: 'right top', className: 'success'})
						ctrl.setData({showPhoto: false})
					})	
					.catch(function(resp) {
						console.warn('savePicture error', resp.responseText)
						ctrl.setData({showPhoto: false})
					})
				})
			
			},



		}
	})

});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJCQuY29uZmlnUmVhZHkoZnVuY3Rpb24oY29uZmlnKSB7XG5cblx0JCQuc3RhcnRBcHAoJ01haW5Db250cm9sJylcbn0pIiwiJCQucmVnaXN0ZXJDb250cm9sKCdNYWluQ29udHJvbCcsIFsnRmlsZVNlcnZpY2UnXSwgZnVuY3Rpb24oZWx0LCBmaWxlU3J2KSB7XG5cblx0dmFyIGF1ZGlvID0gbmV3IEF1ZGlvKCcvd2ViYXBwcy9jYW1lcmEvYXNzZXRzL2NhbWVyYV9zaHV0dGVyLm1wMycpXG5cblxuXHR2YXIgcGljdHVyZVVybFxuXG5cdGZ1bmN0aW9uIHNhdmVQaWN0dXJlKCkge1xuXHRcdGZpbGVTcnYudXBsb2FkRmlsZShwaWN0dXJlVXJsLCAnaW1hZ2UucG5nJywgJy8nKS50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcblx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcblx0XHRcdCQubm90aWZ5KCdGaWxlIHVwbG9hZGVkIHN1Y2Nlc3NmdWxseScsIHtwb3NpdGlvbjogJ3JpZ2h0IHRvcCcsIGNsYXNzTmFtZTogJ3N1Y2Nlc3MnfSlcblx0XHR9KVx0XG5cdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3ApIHtcblx0XHRcdGNvbnNvbGUud2Fybignc2F2ZVBpY3R1cmUgZXJyb3InLCByZXNwLnJlc3BvbnNlVGV4dClcblx0XHR9KVxuIFxuXHR9XG5cblx0Y29uc3Qgc2F2ZURsZ0N0cmwgPSAkJC5mb3JtRGlhbG9nQ29udHJvbGxlcignU2F2ZSBQaWN0dXJlJywge1xuXHRcdHRlbXBsYXRlOiBcIjxkaXY+XFxuXHQ8bGFiZWw+Q2hvb3NlIGZvbGRlciA6PC9sYWJlbD5cXG5cdDxkaXYgc3R5bGU9XFxcImhlaWdodDogMjAwcHhcXFwiIGNsYXNzPVxcXCJzY3JvbGxQYW5lbFxcXCI+XFxuXHRcdDxkaXYgYm4tY29udHJvbD1cXFwiRmlsZVRyZWVDb250cm9sXFxcIiBuYW1lPVxcXCJmb2xkZXJOYW1lXFxcIiAgYm4taWZhY2U9XFxcInRyZWVDdHJsXFxcIj48L2Rpdj5cXG5cdDwvZGl2Plxcblx0XFxuXHQ8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LWNvbFxcXCIgYm4tY29udHJvbD1cXFwiSW5wdXRHcm91cENvbnRyb2xcXFwiPlxcblx0XHQ8bGFiZWw+RmlsZU5hbWUgOjwvbGFiZWw+XFxuXHRcdDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBuYW1lPVxcXCJmaWxlTmFtZVxcXCIgcmVxdWlyZWQ+XFxuXHQ8L2Rpdj5cXG5cXG48L2Rpdj5cIlxuXHR9KVxuXG5cdHNhdmVEbGdDdHJsLmJlZm9yZVNob3cgPSBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZygnYmVmb3JlU2hvdycpXG5cdFx0dGhpcy5zY29wZS50cmVlQ3RybC5yZWZyZXNoKClcdFx0XG5cdH1cblxuXHRjb25zdCBjdHJsID0gd2luZG93LmFwcCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtY29sIGJuLWZsZXgtMVxcXCI+XFxuXFxuXHQ8ZGl2IGJuLXNob3c9XFxcIiFzaG93UGhvdG9cXFwiIGNsYXNzPVxcXCJibi1mbGV4LTEgYm4tZmxleC1jb2xcXFwiPlxcblx0XHQ8ZGl2IGJuLXNob3c9XFxcInNob3dCdG5cXFwiIGNsYXNzPVxcXCJibi10b29sYmFyXFxcIj5cXG5cdFx0XHQ8YnV0dG9uIHRpdGxlPVxcXCJUYWtlIGEgcGljdHVyZVxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvblRha2VQaG90b1xcXCIgPjxpIGNsYXNzPVxcXCJmYSBmYS1jYW1lcmFcXFwiPjwvaT48L2J1dHRvbj5cXG5cdFx0PC9kaXY+XFxuXFxuXHRcdDxkaXYgY2xhc3M9XFxcImNvbnRlbnRQYW5lbCBibi1mbGV4LTFcXFwiPlxcblx0XHRcdDxkaXYgYm4tY29udHJvbD1cXFwiV2ViY2FtQ29udHJvbFxcXCIgYm4taWZhY2U9XFxcInZpZGVvXFxcIiBibi1ldmVudD1cXFwibWVkaWFSZWFkeTogb25NZWRpYVJlYWR5XFxcIiBjbGFzcz1cXFwiYm4tZmxleC1jb2wgYm4tZmxleC0xXFxcIj48L2Rpdj5cXG5cdFx0PC9kaXY+XFxuXHRcdFxcblx0XHRcXG5cdFx0XHRcXG5cdDwvZGl2Plxcblxcblx0PGRpdiBibi1zaG93PVxcXCJzaG93UGhvdG9cXFwiIGNsYXNzPVxcXCJibi1mbGV4LTEgYm4tZmxleC1jb2xcXFwiPlxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJibi10b29sYmFyXFxcIj5cXG5cdFx0XHQ8YnV0dG9uIHRpdGxlPVxcXCJCYWNrXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uQmFja1xcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWFycm93LWxlZnRcXFwiPjwvaT48L2J1dHRvbj5cXG5cdFx0XHQ8YnV0dG9uIHRpdGxlPVxcXCJTYXZlIFBpY3R1cmVcXFwiIGJuLWV2ZW50PVxcXCJjbGljazogb25TYXZlXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtc2F2ZVxcXCI+PC9pPjwvYnV0dG9uPlxcblx0XHQ8L2Rpdj5cXG5cdFx0PGRpdiBjbGFzcz1cXFwiY29udGVudFBhbmVsICBibi1mbGV4LTFcXFwiID5cXG5cdFx0XHQ8ZGl2IHN0eWxlPVxcXCJ0ZXh0LWFsaWduOiBjZW50ZXI7XFxcIj5cXG5cdFx0XHRcdDxpbWcgYm4tYXR0cj1cXFwic3JjOiBpbWdVcmxcXFwiIGNsYXNzPVxcXCJyZXNwb25zaXZlLWltYWdlXFxcIj5cXG5cdFx0XHQ8L2Rpdj5cXG5cdFx0XHRcXG5cdFx0PC9kaXY+XFxuXHRcdFxcblx0PC9kaXY+XFxuXFxuXFxuPC9kaXY+XCIsXG5cdFx0ZGF0YToge1xuXHRcdFx0c2hvd0J0bjogZmFsc2UsXG5cdFx0XHRpbWdVcmw6ICcnLFxuXHRcdFx0c2hvd1Bob3RvOiBmYWxzZVxuXHRcdH0sXG5cdFx0ZXZlbnRzOiB7XG5cdFx0XHRvblRha2VQaG90bzogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdvblRha2VQaG90bycpXG5cdFx0XHRcdGF1ZGlvLnBsYXkoKVxuXHRcdFx0XHRwaWN0dXJlVXJsID0gY3RybC5zY29wZS52aWRlby50YWtlUGljdHVyZSgpXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7aW1nVXJsOiBwaWN0dXJlVXJsLCBzaG93UGhvdG86IHRydWV9KVxuXHRcdFx0XHRcblx0XHRcdH0sXG5cblx0XHRcdG9uTWVkaWFSZWFkeTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdvbk1lZGlhUmVhZHknKVxuXHRcdFx0XHRjdHJsLnNldERhdGEoJ3Nob3dCdG4nLCB0cnVlKVxuXHRcdFx0fSxcblxuXHRcdFx0b25CYWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtzaG93UGhvdG86IGZhbHNlfSlcblx0XHRcdH0sXG5cblx0XHRcdG9uU2F2ZTogZnVuY3Rpb24oKSB7XG5cblxuXHRcdFx0XHRzYXZlRGxnQ3RybC5zaG93KHt9LCBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ2RhdGEnLCBkYXRhKVxuXG5cdFx0XHRcdFx0ZmlsZVNydi51cGxvYWRGaWxlKHBpY3R1cmVVcmwsIGRhdGEuZmlsZU5hbWUgKyAnLnBuZycsIGRhdGEuZm9sZGVyTmFtZSkudGhlbihmdW5jdGlvbihyZXNwKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXG5cdFx0XHRcdFx0XHQkLm5vdGlmeSgnRmlsZSB1cGxvYWRlZCBzdWNjZXNzZnVsbHknLCB7cG9zaXRpb246ICdyaWdodCB0b3AnLCBjbGFzc05hbWU6ICdzdWNjZXNzJ30pXG5cdFx0XHRcdFx0XHRjdHJsLnNldERhdGEoe3Nob3dQaG90bzogZmFsc2V9KVxuXHRcdFx0XHRcdH0pXHRcblx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24ocmVzcCkge1xuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdzYXZlUGljdHVyZSBlcnJvcicsIHJlc3AucmVzcG9uc2VUZXh0KVxuXHRcdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtzaG93UGhvdG86IGZhbHNlfSlcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9KVxuXHRcdFx0XG5cdFx0XHR9LFxuXG5cblxuXHRcdH1cblx0fSlcblxufSk7XG4iXX0=
