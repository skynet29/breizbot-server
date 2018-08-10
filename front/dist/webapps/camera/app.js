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
		template: "<div class=\"bn-flex-col bn-flex-1\">\n\n	<div bn-show=\"!showPhoto\" class=\"bn-flex-1 bn-flex-col\">\n		<div bn-show=\"showBtn\" class=\"bn-toolbar\">\n			<button title=\"Take a picture\" bn-event=\"click: onTakePhoto\" class=\"bn-circle\"><i class=\"fa fa-camera\"></i></button>\n		</div>\n\n		<div class=\"contentPanel bn-flex-1\">\n			<div bn-control=\"WebcamControl\" bn-iface=\"video\" bn-event=\"mediaReady: onMediaReady\" class=\"bn-flex-col bn-flex-1\"></div>\n		</div>\n		\n		\n			\n	</div>\n\n	<div bn-show=\"showPhoto\" class=\"bn-flex-1 bn-flex-col\">\n		<div class=\"bn-toolbar\">\n			<button title=\"Back\" bn-event=\"click: onBack\" class=\"bn-circle\"><i class=\"fa fa-arrow-left\"></i></button>\n			<button title=\"Save Picture\" bn-event=\"click: onSave\" class=\"bn-circle\"><i class=\"fa fa-save\"></i></button>\n		</div>\n		<div class=\"contentPanel  bn-flex-1\" >\n			<div style=\"text-align: center;\">\n				<img bn-attr=\"src: imgUrl\" class=\"responsive-image\">\n			</div>\n			\n		</div>\n		\n	</div>\n\n\n</div>",
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJCQuY29uZmlnUmVhZHkoZnVuY3Rpb24oY29uZmlnKSB7XG5cblx0JCQuc3RhcnRBcHAoJ01haW5Db250cm9sJylcbn0pIiwiJCQucmVnaXN0ZXJDb250cm9sKCdNYWluQ29udHJvbCcsIFsnRmlsZVNlcnZpY2UnXSwgZnVuY3Rpb24oZWx0LCBmaWxlU3J2KSB7XG5cblx0dmFyIGF1ZGlvID0gbmV3IEF1ZGlvKCcvd2ViYXBwcy9jYW1lcmEvYXNzZXRzL2NhbWVyYV9zaHV0dGVyLm1wMycpXG5cblxuXHR2YXIgcGljdHVyZVVybFxuXG5cdGZ1bmN0aW9uIHNhdmVQaWN0dXJlKCkge1xuXHRcdGZpbGVTcnYudXBsb2FkRmlsZShwaWN0dXJlVXJsLCAnaW1hZ2UucG5nJywgJy8nKS50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcblx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcblx0XHRcdCQubm90aWZ5KCdGaWxlIHVwbG9hZGVkIHN1Y2Nlc3NmdWxseScsIHtwb3NpdGlvbjogJ3JpZ2h0IHRvcCcsIGNsYXNzTmFtZTogJ3N1Y2Nlc3MnfSlcblx0XHR9KVx0XG5cdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3ApIHtcblx0XHRcdGNvbnNvbGUud2Fybignc2F2ZVBpY3R1cmUgZXJyb3InLCByZXNwLnJlc3BvbnNlVGV4dClcblx0XHR9KVxuIFxuXHR9XG5cblx0Y29uc3Qgc2F2ZURsZ0N0cmwgPSAkJC5mb3JtRGlhbG9nQ29udHJvbGxlcignU2F2ZSBQaWN0dXJlJywge1xuXHRcdHRlbXBsYXRlOiBcIjxkaXY+XFxuXHQ8bGFiZWw+Q2hvb3NlIGZvbGRlciA6PC9sYWJlbD5cXG5cdDxkaXYgc3R5bGU9XFxcImhlaWdodDogMjAwcHhcXFwiIGNsYXNzPVxcXCJzY3JvbGxQYW5lbFxcXCI+XFxuXHRcdDxkaXYgYm4tY29udHJvbD1cXFwiRmlsZVRyZWVDb250cm9sXFxcIiBuYW1lPVxcXCJmb2xkZXJOYW1lXFxcIiAgYm4taWZhY2U9XFxcInRyZWVDdHJsXFxcIj48L2Rpdj5cXG5cdDwvZGl2Plxcblx0XFxuXHQ8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LWNvbFxcXCIgYm4tY29udHJvbD1cXFwiSW5wdXRHcm91cENvbnRyb2xcXFwiPlxcblx0XHQ8bGFiZWw+RmlsZU5hbWUgOjwvbGFiZWw+XFxuXHRcdDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBuYW1lPVxcXCJmaWxlTmFtZVxcXCIgcmVxdWlyZWQ+XFxuXHQ8L2Rpdj5cXG5cXG48L2Rpdj5cIlxuXHR9KVxuXG5cdHNhdmVEbGdDdHJsLmJlZm9yZVNob3cgPSBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZygnYmVmb3JlU2hvdycpXG5cdFx0dGhpcy5zY29wZS50cmVlQ3RybC5yZWZyZXNoKClcdFx0XG5cdH1cblxuXHRjb25zdCBjdHJsID0gd2luZG93LmFwcCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtY29sIGJuLWZsZXgtMVxcXCI+XFxuXFxuXHQ8ZGl2IGJuLXNob3c9XFxcIiFzaG93UGhvdG9cXFwiIGNsYXNzPVxcXCJibi1mbGV4LTEgYm4tZmxleC1jb2xcXFwiPlxcblx0XHQ8ZGl2IGJuLXNob3c9XFxcInNob3dCdG5cXFwiIGNsYXNzPVxcXCJibi10b29sYmFyXFxcIj5cXG5cdFx0XHQ8YnV0dG9uIHRpdGxlPVxcXCJUYWtlIGEgcGljdHVyZVxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvblRha2VQaG90b1xcXCIgY2xhc3M9XFxcImJuLWNpcmNsZVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWNhbWVyYVxcXCI+PC9pPjwvYnV0dG9uPlxcblx0XHQ8L2Rpdj5cXG5cXG5cdFx0PGRpdiBjbGFzcz1cXFwiY29udGVudFBhbmVsIGJuLWZsZXgtMVxcXCI+XFxuXHRcdFx0PGRpdiBibi1jb250cm9sPVxcXCJXZWJjYW1Db250cm9sXFxcIiBibi1pZmFjZT1cXFwidmlkZW9cXFwiIGJuLWV2ZW50PVxcXCJtZWRpYVJlYWR5OiBvbk1lZGlhUmVhZHlcXFwiIGNsYXNzPVxcXCJibi1mbGV4LWNvbCBibi1mbGV4LTFcXFwiPjwvZGl2Plxcblx0XHQ8L2Rpdj5cXG5cdFx0XFxuXHRcdFxcblx0XHRcdFxcblx0PC9kaXY+XFxuXFxuXHQ8ZGl2IGJuLXNob3c9XFxcInNob3dQaG90b1xcXCIgY2xhc3M9XFxcImJuLWZsZXgtMSBibi1mbGV4LWNvbFxcXCI+XFxuXHRcdDxkaXYgY2xhc3M9XFxcImJuLXRvb2xiYXJcXFwiPlxcblx0XHRcdDxidXR0b24gdGl0bGU9XFxcIkJhY2tcXFwiIGJuLWV2ZW50PVxcXCJjbGljazogb25CYWNrXFxcIiBjbGFzcz1cXFwiYm4tY2lyY2xlXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtYXJyb3ctbGVmdFxcXCI+PC9pPjwvYnV0dG9uPlxcblx0XHRcdDxidXR0b24gdGl0bGU9XFxcIlNhdmUgUGljdHVyZVxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvblNhdmVcXFwiIGNsYXNzPVxcXCJibi1jaXJjbGVcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1zYXZlXFxcIj48L2k+PC9idXR0b24+XFxuXHRcdDwvZGl2Plxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJjb250ZW50UGFuZWwgIGJuLWZsZXgtMVxcXCIgPlxcblx0XHRcdDxkaXYgc3R5bGU9XFxcInRleHQtYWxpZ246IGNlbnRlcjtcXFwiPlxcblx0XHRcdFx0PGltZyBibi1hdHRyPVxcXCJzcmM6IGltZ1VybFxcXCIgY2xhc3M9XFxcInJlc3BvbnNpdmUtaW1hZ2VcXFwiPlxcblx0XHRcdDwvZGl2Plxcblx0XHRcdFxcblx0XHQ8L2Rpdj5cXG5cdFx0XFxuXHQ8L2Rpdj5cXG5cXG5cXG48L2Rpdj5cIixcblx0XHRkYXRhOiB7XG5cdFx0XHRzaG93QnRuOiBmYWxzZSxcblx0XHRcdGltZ1VybDogJycsXG5cdFx0XHRzaG93UGhvdG86IGZhbHNlXG5cdFx0fSxcblx0XHRldmVudHM6IHtcblx0XHRcdG9uVGFrZVBob3RvOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ29uVGFrZVBob3RvJylcblx0XHRcdFx0YXVkaW8ucGxheSgpXG5cdFx0XHRcdHBpY3R1cmVVcmwgPSBjdHJsLnNjb3BlLnZpZGVvLnRha2VQaWN0dXJlKClcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtpbWdVcmw6IHBpY3R1cmVVcmwsIHNob3dQaG90bzogdHJ1ZX0pXG5cdFx0XHRcdFxuXHRcdFx0fSxcblxuXHRcdFx0b25NZWRpYVJlYWR5OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ29uTWVkaWFSZWFkeScpXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSgnc2hvd0J0bicsIHRydWUpXG5cdFx0XHR9LFxuXG5cdFx0XHRvbkJhY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRjdHJsLnNldERhdGEoe3Nob3dQaG90bzogZmFsc2V9KVxuXHRcdFx0fSxcblxuXHRcdFx0b25TYXZlOiBmdW5jdGlvbigpIHtcblxuXG5cdFx0XHRcdHNhdmVEbGdDdHJsLnNob3coe30sIGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnZGF0YScsIGRhdGEpXG5cblx0XHRcdFx0XHRmaWxlU3J2LnVwbG9hZEZpbGUocGljdHVyZVVybCwgZGF0YS5maWxlTmFtZSArICcucG5nJywgZGF0YS5mb2xkZXJOYW1lKS50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcblx0XHRcdFx0XHRcdCQubm90aWZ5KCdGaWxlIHVwbG9hZGVkIHN1Y2Nlc3NmdWxseScsIHtwb3NpdGlvbjogJ3JpZ2h0IHRvcCcsIGNsYXNzTmFtZTogJ3N1Y2Nlc3MnfSlcblx0XHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7c2hvd1Bob3RvOiBmYWxzZX0pXG5cdFx0XHRcdFx0fSlcdFxuXHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbihyZXNwKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ3NhdmVQaWN0dXJlIGVycm9yJywgcmVzcC5yZXNwb25zZVRleHQpXG5cdFx0XHRcdFx0XHRjdHJsLnNldERhdGEoe3Nob3dQaG90bzogZmFsc2V9KVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0pXG5cdFx0XHRcblx0XHRcdH0sXG5cblxuXG5cdFx0fVxuXHR9KVxuXG59KTtcbiJdfQ==
