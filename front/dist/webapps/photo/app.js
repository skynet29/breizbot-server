$$.configReady(function() {

	$$.startApp('MainControl')
})
$$.registerControl('MainControl', ['FileService'], function(elt, fileSrv) {


	var ctrl = window.app = $$.viewController(elt, {
		template: "<div>\n	<div \n		bn-control=\"FileControl\" \n		data-toolbar=\"false\" \n		data-image-only=\"true\"\n		bn-event=\"fileClick: onFileClicked\" \n		bn-show=\"showFiles\"\n		>			\n	</div>\n	<div \n		bn-show=\"!showFiles\" \n		>\n		<div class=\"bn-toolbar\">\n			<button \n				class=\"bn-circle\" \n				title=\"Back\" \n				bn-event=\"click: onBackClicked\"\n			>\n				<i class=\"fa fa-arrow-left\"></i>\n			</button>\n		</div>\n		<div class=\"content\">\n			<div \n				bn-control=\"PictureCarouselControl\" \n				bn-data=\"images: images, index: index\" \n				data-width=\"600\" \n				data-height=\"400\" \n				data-color=\"cyan\"\n				>\n			</div>			\n		</div>\n\n	</div>\n</div>",
		data: {
			images: [],
			index: 0,
			showFiles: true
		},
		events: {
			onFileClicked: function(ev, data) {
				console.log('onFileClicked', data)
				var files = $(this).interface().getFiles()
				console.log('files', files)

				var images = files.filter((f) => !f.isDir)

				var index = images.findIndex((f) => f.name == data.name)

				var imagesUrl = images.map((f) => fileSrv.fileUrl(data.rootDir + f.name))
				console.log('imagesUrl', imagesUrl)
				

				
				//console.log('index', index)

				ctrl.setData({images: imagesUrl, index, showFiles: false})
			},

			onBackClicked: function() {
				ctrl.setData({showFiles: true})
			}
		}
	})

});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkJC5jb25maWdSZWFkeShmdW5jdGlvbigpIHtcblxuXHQkJC5zdGFydEFwcCgnTWFpbkNvbnRyb2wnKVxufSkiLCIkJC5yZWdpc3RlckNvbnRyb2woJ01haW5Db250cm9sJywgWydGaWxlU2VydmljZSddLCBmdW5jdGlvbihlbHQsIGZpbGVTcnYpIHtcblxuXG5cdHZhciBjdHJsID0gd2luZG93LmFwcCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdHRlbXBsYXRlOiBcIjxkaXY+XFxuXHQ8ZGl2IFxcblx0XHRibi1jb250cm9sPVxcXCJGaWxlQ29udHJvbFxcXCIgXFxuXHRcdGRhdGEtdG9vbGJhcj1cXFwiZmFsc2VcXFwiIFxcblx0XHRkYXRhLWltYWdlLW9ubHk9XFxcInRydWVcXFwiXFxuXHRcdGJuLWV2ZW50PVxcXCJmaWxlQ2xpY2s6IG9uRmlsZUNsaWNrZWRcXFwiIFxcblx0XHRibi1zaG93PVxcXCJzaG93RmlsZXNcXFwiXFxuXHRcdD5cdFx0XHRcXG5cdDwvZGl2Plxcblx0PGRpdiBcXG5cdFx0Ym4tc2hvdz1cXFwiIXNob3dGaWxlc1xcXCIgXFxuXHRcdD5cXG5cdFx0PGRpdiBjbGFzcz1cXFwiYm4tdG9vbGJhclxcXCI+XFxuXHRcdFx0PGJ1dHRvbiBcXG5cdFx0XHRcdGNsYXNzPVxcXCJibi1jaXJjbGVcXFwiIFxcblx0XHRcdFx0dGl0bGU9XFxcIkJhY2tcXFwiIFxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkJhY2tDbGlja2VkXFxcIlxcblx0XHRcdD5cXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS1hcnJvdy1sZWZ0XFxcIj48L2k+XFxuXHRcdFx0PC9idXR0b24+XFxuXHRcdDwvZGl2Plxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJjb250ZW50XFxcIj5cXG5cdFx0XHQ8ZGl2IFxcblx0XHRcdFx0Ym4tY29udHJvbD1cXFwiUGljdHVyZUNhcm91c2VsQ29udHJvbFxcXCIgXFxuXHRcdFx0XHRibi1kYXRhPVxcXCJpbWFnZXM6IGltYWdlcywgaW5kZXg6IGluZGV4XFxcIiBcXG5cdFx0XHRcdGRhdGEtd2lkdGg9XFxcIjYwMFxcXCIgXFxuXHRcdFx0XHRkYXRhLWhlaWdodD1cXFwiNDAwXFxcIiBcXG5cdFx0XHRcdGRhdGEtY29sb3I9XFxcImN5YW5cXFwiXFxuXHRcdFx0XHQ+XFxuXHRcdFx0PC9kaXY+XHRcdFx0XFxuXHRcdDwvZGl2Plxcblxcblx0PC9kaXY+XFxuPC9kaXY+XCIsXG5cdFx0ZGF0YToge1xuXHRcdFx0aW1hZ2VzOiBbXSxcblx0XHRcdGluZGV4OiAwLFxuXHRcdFx0c2hvd0ZpbGVzOiB0cnVlXG5cdFx0fSxcblx0XHRldmVudHM6IHtcblx0XHRcdG9uRmlsZUNsaWNrZWQ6IGZ1bmN0aW9uKGV2LCBkYXRhKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdvbkZpbGVDbGlja2VkJywgZGF0YSlcblx0XHRcdFx0dmFyIGZpbGVzID0gJCh0aGlzKS5pbnRlcmZhY2UoKS5nZXRGaWxlcygpXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdmaWxlcycsIGZpbGVzKVxuXG5cdFx0XHRcdHZhciBpbWFnZXMgPSBmaWxlcy5maWx0ZXIoKGYpID0+ICFmLmlzRGlyKVxuXG5cdFx0XHRcdHZhciBpbmRleCA9IGltYWdlcy5maW5kSW5kZXgoKGYpID0+IGYubmFtZSA9PSBkYXRhLm5hbWUpXG5cblx0XHRcdFx0dmFyIGltYWdlc1VybCA9IGltYWdlcy5tYXAoKGYpID0+IGZpbGVTcnYuZmlsZVVybChkYXRhLnJvb3REaXIgKyBmLm5hbWUpKVxuXHRcdFx0XHRjb25zb2xlLmxvZygnaW1hZ2VzVXJsJywgaW1hZ2VzVXJsKVxuXHRcdFx0XHRcblxuXHRcdFx0XHRcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnaW5kZXgnLCBpbmRleClcblxuXHRcdFx0XHRjdHJsLnNldERhdGEoe2ltYWdlczogaW1hZ2VzVXJsLCBpbmRleCwgc2hvd0ZpbGVzOiBmYWxzZX0pXG5cdFx0XHR9LFxuXG5cdFx0XHRvbkJhY2tDbGlja2VkOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtzaG93RmlsZXM6IHRydWV9KVxuXHRcdFx0fVxuXHRcdH1cblx0fSlcblxufSk7Il19
