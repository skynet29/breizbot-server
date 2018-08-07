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
		template: "<div>\r\n	<label>Choose folder :</label>\r\n	<div style=\"height: 200px\" class=\"scrollPanel\">\r\n		<div bn-control=\"FileTreeControl\" name=\"folderName\"  bn-iface=\"treeCtrl\"></div>\r\n	</div>\r\n	\r\n	<div class=\"bn-flex-col\" bn-control=\"InputGroupControl\">\r\n		<label>FileName :</label>\r\n		<input type=\"text\" name=\"fileName\" required>\r\n	</div>\r\n\r\n</div>"
	})

	saveDlgCtrl.beforeShow = function() {
		console.log('beforeShow')
		this.scope.treeCtrl.refresh()		
	}

	const ctrl = window.app = $$.viewController(elt, {
		template: "<div class=\"bn-flex-col bn-flex-1\">\r\n\r\n	<div bn-show=\"!showPhoto\" class=\"bn-flex-1 bn-flex-col\">\r\n		<div bn-show=\"showBtn\" class=\"bn-toolbar\">\r\n			<button title=\"Take a picture\" bn-event=\"click: onTakePhoto\" ><i class=\"fa fa-camera\"></i></button>\r\n		</div>\r\n\r\n		<div class=\"contentPanel bn-flex-1\">\r\n			<div bn-control=\"WebcamControl\" bn-iface=\"video\" bn-event=\"mediaReady: onMediaReady\" class=\"bn-flex-col bn-flex-1\"></div>\r\n		</div>\r\n		\r\n		\r\n			\r\n	</div>\r\n\r\n	<div bn-show=\"showPhoto\" class=\"bn-flex-1 bn-flex-col\">\r\n		<div class=\"bn-toolbar\">\r\n			<button title=\"Back\" bn-event=\"click: onBack\"><i class=\"fa fa-arrow-left\"></i></button>\r\n			<button title=\"Save Picture\" bn-event=\"click: onSave\"><i class=\"fa fa-save\"></i></button>\r\n		</div>\r\n		<div class=\"contentPanel  bn-flex-1\" >\r\n			<div style=\"text-align: center;\">\r\n				<img bn-attr=\"src: imgUrl\" class=\"responsive-image\">\r\n			</div>\r\n			\r\n		</div>\r\n		\r\n	</div>\r\n\r\n\r\n</div>",
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJCQuY29uZmlnUmVhZHkoZnVuY3Rpb24oY29uZmlnKSB7XHJcblxyXG5cdCQkLnN0YXJ0QXBwKCdNYWluQ29udHJvbCcpXHJcbn0pIiwiJCQucmVnaXN0ZXJDb250cm9sKCdNYWluQ29udHJvbCcsIFsnRmlsZVNlcnZpY2UnXSwgZnVuY3Rpb24oZWx0LCBmaWxlU3J2KSB7XHJcblxyXG5cdHZhciBhdWRpbyA9IG5ldyBBdWRpbygnL3dlYmFwcHMvY2FtZXJhL2Fzc2V0cy9jYW1lcmFfc2h1dHRlci5tcDMnKVxyXG5cclxuXHJcblx0dmFyIHBpY3R1cmVVcmxcclxuXHJcblx0ZnVuY3Rpb24gc2F2ZVBpY3R1cmUoKSB7XHJcblx0XHRmaWxlU3J2LnVwbG9hZEZpbGUocGljdHVyZVVybCwgJ2ltYWdlLnBuZycsICcvJykudGhlbihmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcclxuXHRcdFx0JC5ub3RpZnkoJ0ZpbGUgdXBsb2FkZWQgc3VjY2Vzc2Z1bGx5Jywge3Bvc2l0aW9uOiAncmlnaHQgdG9wJywgY2xhc3NOYW1lOiAnc3VjY2Vzcyd9KVxyXG5cdFx0fSlcdFxyXG5cdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0Y29uc29sZS53YXJuKCdzYXZlUGljdHVyZSBlcnJvcicsIHJlc3AucmVzcG9uc2VUZXh0KVxyXG5cdFx0fSlcclxuIFxyXG5cdH1cclxuXHJcblx0Y29uc3Qgc2F2ZURsZ0N0cmwgPSAkJC5mb3JtRGlhbG9nQ29udHJvbGxlcignU2F2ZSBQaWN0dXJlJywge1xyXG5cdFx0dGVtcGxhdGU6IFwiPGRpdj5cXHJcXG5cdDxsYWJlbD5DaG9vc2UgZm9sZGVyIDo8L2xhYmVsPlxcclxcblx0PGRpdiBzdHlsZT1cXFwiaGVpZ2h0OiAyMDBweFxcXCIgY2xhc3M9XFxcInNjcm9sbFBhbmVsXFxcIj5cXHJcXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJGaWxlVHJlZUNvbnRyb2xcXFwiIG5hbWU9XFxcImZvbGRlck5hbWVcXFwiICBibi1pZmFjZT1cXFwidHJlZUN0cmxcXFwiPjwvZGl2Plxcclxcblx0PC9kaXY+XFxyXFxuXHRcXHJcXG5cdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtY29sXFxcIiBibi1jb250cm9sPVxcXCJJbnB1dEdyb3VwQ29udHJvbFxcXCI+XFxyXFxuXHRcdDxsYWJlbD5GaWxlTmFtZSA6PC9sYWJlbD5cXHJcXG5cdFx0PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIG5hbWU9XFxcImZpbGVOYW1lXFxcIiByZXF1aXJlZD5cXHJcXG5cdDwvZGl2PlxcclxcblxcclxcbjwvZGl2PlwiXHJcblx0fSlcclxuXHJcblx0c2F2ZURsZ0N0cmwuYmVmb3JlU2hvdyA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0Y29uc29sZS5sb2coJ2JlZm9yZVNob3cnKVxyXG5cdFx0dGhpcy5zY29wZS50cmVlQ3RybC5yZWZyZXNoKClcdFx0XHJcblx0fVxyXG5cclxuXHRjb25zdCBjdHJsID0gd2luZG93LmFwcCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiYm4tZmxleC1jb2wgYm4tZmxleC0xXFxcIj5cXHJcXG5cXHJcXG5cdDxkaXYgYm4tc2hvdz1cXFwiIXNob3dQaG90b1xcXCIgY2xhc3M9XFxcImJuLWZsZXgtMSBibi1mbGV4LWNvbFxcXCI+XFxyXFxuXHRcdDxkaXYgYm4tc2hvdz1cXFwic2hvd0J0blxcXCIgY2xhc3M9XFxcImJuLXRvb2xiYXJcXFwiPlxcclxcblx0XHRcdDxidXR0b24gdGl0bGU9XFxcIlRha2UgYSBwaWN0dXJlXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uVGFrZVBob3RvXFxcIiA+PGkgY2xhc3M9XFxcImZhIGZhLWNhbWVyYVxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdFx0PGRpdiBjbGFzcz1cXFwiY29udGVudFBhbmVsIGJuLWZsZXgtMVxcXCI+XFxyXFxuXHRcdFx0PGRpdiBibi1jb250cm9sPVxcXCJXZWJjYW1Db250cm9sXFxcIiBibi1pZmFjZT1cXFwidmlkZW9cXFwiIGJuLWV2ZW50PVxcXCJtZWRpYVJlYWR5OiBvbk1lZGlhUmVhZHlcXFwiIGNsYXNzPVxcXCJibi1mbGV4LWNvbCBibi1mbGV4LTFcXFwiPjwvZGl2Plxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cdFx0XFxyXFxuXHRcdFxcclxcblx0XHRcdFxcclxcblx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8ZGl2IGJuLXNob3c9XFxcInNob3dQaG90b1xcXCIgY2xhc3M9XFxcImJuLWZsZXgtMSBibi1mbGV4LWNvbFxcXCI+XFxyXFxuXHRcdDxkaXYgY2xhc3M9XFxcImJuLXRvb2xiYXJcXFwiPlxcclxcblx0XHRcdDxidXR0b24gdGl0bGU9XFxcIkJhY2tcXFwiIGJuLWV2ZW50PVxcXCJjbGljazogb25CYWNrXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtYXJyb3ctbGVmdFxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHRcdDxidXR0b24gdGl0bGU9XFxcIlNhdmUgUGljdHVyZVxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvblNhdmVcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1zYXZlXFxcIj48L2k+PC9idXR0b24+XFxyXFxuXHRcdDwvZGl2Plxcclxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJjb250ZW50UGFuZWwgIGJuLWZsZXgtMVxcXCIgPlxcclxcblx0XHRcdDxkaXYgc3R5bGU9XFxcInRleHQtYWxpZ246IGNlbnRlcjtcXFwiPlxcclxcblx0XHRcdFx0PGltZyBibi1hdHRyPVxcXCJzcmM6IGltZ1VybFxcXCIgY2xhc3M9XFxcInJlc3BvbnNpdmUtaW1hZ2VcXFwiPlxcclxcblx0XHRcdDwvZGl2Plxcclxcblx0XHRcdFxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cdFx0XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG5cXHJcXG48L2Rpdj5cIixcclxuXHRcdGRhdGE6IHtcclxuXHRcdFx0c2hvd0J0bjogZmFsc2UsXHJcblx0XHRcdGltZ1VybDogJycsXHJcblx0XHRcdHNob3dQaG90bzogZmFsc2VcclxuXHRcdH0sXHJcblx0XHRldmVudHM6IHtcclxuXHRcdFx0b25UYWtlUGhvdG86IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdvblRha2VQaG90bycpXHJcblx0XHRcdFx0YXVkaW8ucGxheSgpXHJcblx0XHRcdFx0cGljdHVyZVVybCA9IGN0cmwuc2NvcGUudmlkZW8udGFrZVBpY3R1cmUoKVxyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7aW1nVXJsOiBwaWN0dXJlVXJsLCBzaG93UGhvdG86IHRydWV9KVxyXG5cdFx0XHRcdFxyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0b25NZWRpYVJlYWR5OiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnb25NZWRpYVJlYWR5JylcclxuXHRcdFx0XHRjdHJsLnNldERhdGEoJ3Nob3dCdG4nLCB0cnVlKVxyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0b25CYWNrOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjdHJsLnNldERhdGEoe3Nob3dQaG90bzogZmFsc2V9KVxyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0b25TYXZlOiBmdW5jdGlvbigpIHtcclxuXHJcblxyXG5cdFx0XHRcdHNhdmVEbGdDdHJsLnNob3coe30sIGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdkYXRhJywgZGF0YSlcclxuXHJcblx0XHRcdFx0XHRmaWxlU3J2LnVwbG9hZEZpbGUocGljdHVyZVVybCwgZGF0YS5maWxlTmFtZSArICcucG5nJywgZGF0YS5mb2xkZXJOYW1lKS50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxyXG5cdFx0XHRcdFx0XHQkLm5vdGlmeSgnRmlsZSB1cGxvYWRlZCBzdWNjZXNzZnVsbHknLCB7cG9zaXRpb246ICdyaWdodCB0b3AnLCBjbGFzc05hbWU6ICdzdWNjZXNzJ30pXHJcblx0XHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7c2hvd1Bob3RvOiBmYWxzZX0pXHJcblx0XHRcdFx0XHR9KVx0XHJcblx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ3NhdmVQaWN0dXJlIGVycm9yJywgcmVzcC5yZXNwb25zZVRleHQpXHJcblx0XHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7c2hvd1Bob3RvOiBmYWxzZX0pXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFxyXG5cdFx0XHR9LFxyXG5cclxuXHJcblxyXG5cdFx0fVxyXG5cdH0pXHJcblxyXG59KTtcclxuIl19
