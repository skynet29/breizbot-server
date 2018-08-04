$$.configReady(function(config) {

	$$.startApp('MainControl')
})
$$.registerControl('MainControl', ['FileService'], function(elt, fileSrv) {



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
		template: "<div class=\"bn-flex-col\">\r\n\r\n	<div bn-show=\"!showPhoto\">\r\n		<div bn-show=\"showBtn\" class=\"toolbar\">\r\n			<button title=\"Take a picture\" bn-event=\"click: onTakePhoto\" ><i class=\"fa fa-camera\"></i></button>\r\n		</div>\r\n\r\n		<div class=\"contentPanel\">\r\n			<div bn-control=\"WebcamControl\" bn-iface=\"video\" bn-event=\"mediaReady: onMediaReady\"></div>\r\n		</div>\r\n		\r\n		\r\n			\r\n	</div>\r\n\r\n	<div bn-show=\"showPhoto\" >\r\n		<div class=\"toolbar\">\r\n			<button title=\"Back\" bn-event=\"click: onBack\"><i class=\"fa fa-arrow-left\"></i></button>\r\n			<button title=\"Save Picture\" bn-event=\"click: onSave\"><i class=\"fa fa-save\"></i></button>\r\n		</div>\r\n		<div class=\"contentPanel\">\r\n			<img bn-attr=\"src: imgUrl\">\r\n		</div>\r\n		\r\n	</div>\r\n\r\n\r\n</div>",
		data: {
			showBtn: false,
			imgUrl: '',
			showPhoto: false
		},
		events: {
			onTakePhoto: function() {
				console.log('onTakePhoto')
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkJC5jb25maWdSZWFkeShmdW5jdGlvbihjb25maWcpIHtcclxuXHJcblx0JCQuc3RhcnRBcHAoJ01haW5Db250cm9sJylcclxufSkiLCIkJC5yZWdpc3RlckNvbnRyb2woJ01haW5Db250cm9sJywgWydGaWxlU2VydmljZSddLCBmdW5jdGlvbihlbHQsIGZpbGVTcnYpIHtcclxuXHJcblxyXG5cclxuXHR2YXIgcGljdHVyZVVybFxyXG5cclxuXHRmdW5jdGlvbiBzYXZlUGljdHVyZSgpIHtcclxuXHRcdGZpbGVTcnYudXBsb2FkRmlsZShwaWN0dXJlVXJsLCAnaW1hZ2UucG5nJywgJy8nKS50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxyXG5cdFx0XHQkLm5vdGlmeSgnRmlsZSB1cGxvYWRlZCBzdWNjZXNzZnVsbHknLCB7cG9zaXRpb246ICdyaWdodCB0b3AnLCBjbGFzc05hbWU6ICdzdWNjZXNzJ30pXHJcblx0XHR9KVx0XHJcblx0XHQuY2F0Y2goZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRjb25zb2xlLndhcm4oJ3NhdmVQaWN0dXJlIGVycm9yJywgcmVzcC5yZXNwb25zZVRleHQpXHJcblx0XHR9KVxyXG4gXHJcblx0fVxyXG5cclxuXHRjb25zdCBzYXZlRGxnQ3RybCA9ICQkLmZvcm1EaWFsb2dDb250cm9sbGVyKCdTYXZlIFBpY3R1cmUnLCB7XHJcblx0XHR0ZW1wbGF0ZTogXCI8ZGl2Plxcclxcblx0PGxhYmVsPkNob29zZSBmb2xkZXIgOjwvbGFiZWw+XFxyXFxuXHQ8ZGl2IHN0eWxlPVxcXCJoZWlnaHQ6IDIwMHB4XFxcIiBjbGFzcz1cXFwic2Nyb2xsUGFuZWxcXFwiPlxcclxcblx0XHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIkZpbGVUcmVlQ29udHJvbFxcXCIgbmFtZT1cXFwiZm9sZGVyTmFtZVxcXCIgIGJuLWlmYWNlPVxcXCJ0cmVlQ3RybFxcXCI+PC9kaXY+XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cdFxcclxcblx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC1jb2xcXFwiIGJuLWNvbnRyb2w9XFxcIklucHV0R3JvdXBDb250cm9sXFxcIj5cXHJcXG5cdFx0PGxhYmVsPkZpbGVOYW1lIDo8L2xhYmVsPlxcclxcblx0XHQ8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgbmFtZT1cXFwiZmlsZU5hbWVcXFwiIHJlcXVpcmVkPlxcclxcblx0PC9kaXY+XFxyXFxuXFxyXFxuPC9kaXY+XCJcclxuXHR9KVxyXG5cclxuXHRzYXZlRGxnQ3RybC5iZWZvcmVTaG93ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRjb25zb2xlLmxvZygnYmVmb3JlU2hvdycpXHJcblx0XHR0aGlzLnNjb3BlLnRyZWVDdHJsLnJlZnJlc2goKVx0XHRcclxuXHR9XHJcblxyXG5cdGNvbnN0IGN0cmwgPSB3aW5kb3cuYXBwID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LWNvbFxcXCI+XFxyXFxuXFxyXFxuXHQ8ZGl2IGJuLXNob3c9XFxcIiFzaG93UGhvdG9cXFwiPlxcclxcblx0XHQ8ZGl2IGJuLXNob3c9XFxcInNob3dCdG5cXFwiIGNsYXNzPVxcXCJ0b29sYmFyXFxcIj5cXHJcXG5cdFx0XHQ8YnV0dG9uIHRpdGxlPVxcXCJUYWtlIGEgcGljdHVyZVxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvblRha2VQaG90b1xcXCIgPjxpIGNsYXNzPVxcXCJmYSBmYS1jYW1lcmFcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0PC9kaXY+XFxyXFxuXFxyXFxuXHRcdDxkaXYgY2xhc3M9XFxcImNvbnRlbnRQYW5lbFxcXCI+XFxyXFxuXHRcdFx0PGRpdiBibi1jb250cm9sPVxcXCJXZWJjYW1Db250cm9sXFxcIiBibi1pZmFjZT1cXFwidmlkZW9cXFwiIGJuLWV2ZW50PVxcXCJtZWRpYVJlYWR5OiBvbk1lZGlhUmVhZHlcXFwiPjwvZGl2Plxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cdFx0XFxyXFxuXHRcdFxcclxcblx0XHRcdFxcclxcblx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8ZGl2IGJuLXNob3c9XFxcInNob3dQaG90b1xcXCIgPlxcclxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJ0b29sYmFyXFxcIj5cXHJcXG5cdFx0XHQ8YnV0dG9uIHRpdGxlPVxcXCJCYWNrXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uQmFja1xcXCI+PGkgY2xhc3M9XFxcImZhIGZhLWFycm93LWxlZnRcXFwiPjwvaT48L2J1dHRvbj5cXHJcXG5cdFx0XHQ8YnV0dG9uIHRpdGxlPVxcXCJTYXZlIFBpY3R1cmVcXFwiIGJuLWV2ZW50PVxcXCJjbGljazogb25TYXZlXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtc2F2ZVxcXCI+PC9pPjwvYnV0dG9uPlxcclxcblx0XHQ8L2Rpdj5cXHJcXG5cdFx0PGRpdiBjbGFzcz1cXFwiY29udGVudFBhbmVsXFxcIj5cXHJcXG5cdFx0XHQ8aW1nIGJuLWF0dHI9XFxcInNyYzogaW1nVXJsXFxcIj5cXHJcXG5cdFx0PC9kaXY+XFxyXFxuXHRcdFxcclxcblx0PC9kaXY+XFxyXFxuXFxyXFxuXFxyXFxuPC9kaXY+XCIsXHJcblx0XHRkYXRhOiB7XHJcblx0XHRcdHNob3dCdG46IGZhbHNlLFxyXG5cdFx0XHRpbWdVcmw6ICcnLFxyXG5cdFx0XHRzaG93UGhvdG86IGZhbHNlXHJcblx0XHR9LFxyXG5cdFx0ZXZlbnRzOiB7XHJcblx0XHRcdG9uVGFrZVBob3RvOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnb25UYWtlUGhvdG8nKVxyXG5cdFx0XHRcdHBpY3R1cmVVcmwgPSBjdHJsLnNjb3BlLnZpZGVvLnRha2VQaWN0dXJlKClcclxuXHRcdFx0XHRjdHJsLnNldERhdGEoe2ltZ1VybDogcGljdHVyZVVybCwgc2hvd1Bob3RvOiB0cnVlfSlcclxuXHRcdFx0XHRcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdG9uTWVkaWFSZWFkeTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ29uTWVkaWFSZWFkeScpXHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKCdzaG93QnRuJywgdHJ1ZSlcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdG9uQmFjazogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtzaG93UGhvdG86IGZhbHNlfSlcclxuXHRcdFx0fSxcclxuXHJcblx0XHRcdG9uU2F2ZTogZnVuY3Rpb24oKSB7XHJcblxyXG5cclxuXHRcdFx0XHRzYXZlRGxnQ3RybC5zaG93KHt9LCBmdW5jdGlvbihkYXRhKSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnZGF0YScsIGRhdGEpXHJcblxyXG5cdFx0XHRcdFx0ZmlsZVNydi51cGxvYWRGaWxlKHBpY3R1cmVVcmwsIGRhdGEuZmlsZU5hbWUgKyAnLnBuZycsIGRhdGEuZm9sZGVyTmFtZSkudGhlbihmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcclxuXHRcdFx0XHRcdFx0JC5ub3RpZnkoJ0ZpbGUgdXBsb2FkZWQgc3VjY2Vzc2Z1bGx5Jywge3Bvc2l0aW9uOiAncmlnaHQgdG9wJywgY2xhc3NOYW1lOiAnc3VjY2Vzcyd9KVxyXG5cdFx0XHRcdFx0XHRjdHJsLnNldERhdGEoe3Nob3dQaG90bzogZmFsc2V9KVxyXG5cdFx0XHRcdFx0fSlcdFxyXG5cdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdzYXZlUGljdHVyZSBlcnJvcicsIHJlc3AucmVzcG9uc2VUZXh0KVxyXG5cdFx0XHRcdFx0XHRjdHJsLnNldERhdGEoe3Nob3dQaG90bzogZmFsc2V9KVxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHRcclxuXHRcdFx0fSxcclxuXHJcblxyXG5cclxuXHRcdH1cclxuXHR9KVxyXG5cclxufSk7XHJcbiJdfQ==
