$$.configReady(function() {

	$$.startApp('MainControl')
})
$$.registerControl('MainControl', ['FileService'], function(elt, fileSrv) {


	var ctrl = window.app = $$.viewController(elt, {
		template: "<div>\n	<div \n		bn-control=\"FileControl\" \n		data-toolbar=\"false\" \n		data-image-only=\"true\"\n		bn-event=\"fileClick: onFileClicked\" \n		bn-show=\"showFiles\"\n		>			\n	</div>\n	<div \n		bn-show=\"!showFiles\" \n		>\n		<div class=\"bn-toolbar\">\n			<button \n				title=\"Back\" \n				bn-event=\"click: onBackClicked\"\n			>\n				<i class=\"fa fa-arrow-left\"></i>\n			</button>\n		</div>\n		<div class=\"content\">\n			<div \n				bn-control=\"PictureCarouselControl\" \n				bn-data=\"images: images, index: index\" \n				data-width=\"600\" \n				data-height=\"400\" \n				data-color=\"cyan\"\n				>\n			</div>			\n		</div>\n\n	</div>\n</div>",
		data: {
			images: [],
			index: 0,
			showFiles: true
		},
		events: {
			onFileClicked: function(ev, data) {
				//console.log('onFileClicked', data)
				var files = $(this).interface().getFiles()
				//console.log('files', files)

				var images = files
				.filter((f) => !f.isDir)
				.map((f) => fileSrv.fileUrl(data.rootDir + f.name))
				//console.log('images', images)
				

				var index = files.findIndex((f) => f.name == data.name)
				//console.log('index', index)

				ctrl.setData({images, index, showFiles: false})
			},

			onBackClicked: function() {
				ctrl.setData({showFiles: true})
			}
		}
	})

});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uKCkge1xuXG5cdCQkLnN0YXJ0QXBwKCdNYWluQ29udHJvbCcpXG59KSIsIiQkLnJlZ2lzdGVyQ29udHJvbCgnTWFpbkNvbnRyb2wnLCBbJ0ZpbGVTZXJ2aWNlJ10sIGZ1bmN0aW9uKGVsdCwgZmlsZVNydikge1xuXG5cblx0dmFyIGN0cmwgPSB3aW5kb3cuYXBwID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XG5cdFx0dGVtcGxhdGU6IFwiPGRpdj5cXG5cdDxkaXYgXFxuXHRcdGJuLWNvbnRyb2w9XFxcIkZpbGVDb250cm9sXFxcIiBcXG5cdFx0ZGF0YS10b29sYmFyPVxcXCJmYWxzZVxcXCIgXFxuXHRcdGRhdGEtaW1hZ2Utb25seT1cXFwidHJ1ZVxcXCJcXG5cdFx0Ym4tZXZlbnQ9XFxcImZpbGVDbGljazogb25GaWxlQ2xpY2tlZFxcXCIgXFxuXHRcdGJuLXNob3c9XFxcInNob3dGaWxlc1xcXCJcXG5cdFx0Plx0XHRcdFxcblx0PC9kaXY+XFxuXHQ8ZGl2IFxcblx0XHRibi1zaG93PVxcXCIhc2hvd0ZpbGVzXFxcIiBcXG5cdFx0Plxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJibi10b29sYmFyXFxcIj5cXG5cdFx0XHQ8YnV0dG9uIFxcblx0XHRcdFx0dGl0bGU9XFxcIkJhY2tcXFwiIFxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkJhY2tDbGlja2VkXFxcIlxcblx0XHRcdD5cXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS1hcnJvdy1sZWZ0XFxcIj48L2k+XFxuXHRcdFx0PC9idXR0b24+XFxuXHRcdDwvZGl2Plxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJjb250ZW50XFxcIj5cXG5cdFx0XHQ8ZGl2IFxcblx0XHRcdFx0Ym4tY29udHJvbD1cXFwiUGljdHVyZUNhcm91c2VsQ29udHJvbFxcXCIgXFxuXHRcdFx0XHRibi1kYXRhPVxcXCJpbWFnZXM6IGltYWdlcywgaW5kZXg6IGluZGV4XFxcIiBcXG5cdFx0XHRcdGRhdGEtd2lkdGg9XFxcIjYwMFxcXCIgXFxuXHRcdFx0XHRkYXRhLWhlaWdodD1cXFwiNDAwXFxcIiBcXG5cdFx0XHRcdGRhdGEtY29sb3I9XFxcImN5YW5cXFwiXFxuXHRcdFx0XHQ+XFxuXHRcdFx0PC9kaXY+XHRcdFx0XFxuXHRcdDwvZGl2Plxcblxcblx0PC9kaXY+XFxuPC9kaXY+XCIsXG5cdFx0ZGF0YToge1xuXHRcdFx0aW1hZ2VzOiBbXSxcblx0XHRcdGluZGV4OiAwLFxuXHRcdFx0c2hvd0ZpbGVzOiB0cnVlXG5cdFx0fSxcblx0XHRldmVudHM6IHtcblx0XHRcdG9uRmlsZUNsaWNrZWQ6IGZ1bmN0aW9uKGV2LCBkYXRhKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ29uRmlsZUNsaWNrZWQnLCBkYXRhKVxuXHRcdFx0XHR2YXIgZmlsZXMgPSAkKHRoaXMpLmludGVyZmFjZSgpLmdldEZpbGVzKClcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZmlsZXMnLCBmaWxlcylcblxuXHRcdFx0XHR2YXIgaW1hZ2VzID0gZmlsZXNcblx0XHRcdFx0LmZpbHRlcigoZikgPT4gIWYuaXNEaXIpXG5cdFx0XHRcdC5tYXAoKGYpID0+IGZpbGVTcnYuZmlsZVVybChkYXRhLnJvb3REaXIgKyBmLm5hbWUpKVxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdpbWFnZXMnLCBpbWFnZXMpXG5cdFx0XHRcdFxuXG5cdFx0XHRcdHZhciBpbmRleCA9IGZpbGVzLmZpbmRJbmRleCgoZikgPT4gZi5uYW1lID09IGRhdGEubmFtZSlcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnaW5kZXgnLCBpbmRleClcblxuXHRcdFx0XHRjdHJsLnNldERhdGEoe2ltYWdlcywgaW5kZXgsIHNob3dGaWxlczogZmFsc2V9KVxuXHRcdFx0fSxcblxuXHRcdFx0b25CYWNrQ2xpY2tlZDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7c2hvd0ZpbGVzOiB0cnVlfSlcblx0XHRcdH1cblx0XHR9XG5cdH0pXG5cbn0pOyJdfQ==
