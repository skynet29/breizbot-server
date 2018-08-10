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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uKCkge1xuXG5cdCQkLnN0YXJ0QXBwKCdNYWluQ29udHJvbCcpXG59KSIsIiQkLnJlZ2lzdGVyQ29udHJvbCgnTWFpbkNvbnRyb2wnLCBbJ0ZpbGVTZXJ2aWNlJ10sIGZ1bmN0aW9uKGVsdCwgZmlsZVNydikge1xuXG5cblx0dmFyIGN0cmwgPSB3aW5kb3cuYXBwID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XG5cdFx0dGVtcGxhdGU6IFwiPGRpdj5cXG5cdDxkaXYgXFxuXHRcdGJuLWNvbnRyb2w9XFxcIkZpbGVDb250cm9sXFxcIiBcXG5cdFx0ZGF0YS10b29sYmFyPVxcXCJmYWxzZVxcXCIgXFxuXHRcdGRhdGEtaW1hZ2Utb25seT1cXFwidHJ1ZVxcXCJcXG5cdFx0Ym4tZXZlbnQ9XFxcImZpbGVDbGljazogb25GaWxlQ2xpY2tlZFxcXCIgXFxuXHRcdGJuLXNob3c9XFxcInNob3dGaWxlc1xcXCJcXG5cdFx0Plx0XHRcdFxcblx0PC9kaXY+XFxuXHQ8ZGl2IFxcblx0XHRibi1zaG93PVxcXCIhc2hvd0ZpbGVzXFxcIiBcXG5cdFx0Plxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJibi10b29sYmFyXFxcIj5cXG5cdFx0XHQ8YnV0dG9uIFxcblx0XHRcdFx0Y2xhc3M9XFxcImJuLWNpcmNsZVxcXCIgXFxuXHRcdFx0XHR0aXRsZT1cXFwiQmFja1xcXCIgXFxuXHRcdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uQmFja0NsaWNrZWRcXFwiXFxuXHRcdFx0Plxcblx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLWFycm93LWxlZnRcXFwiPjwvaT5cXG5cdFx0XHQ8L2J1dHRvbj5cXG5cdFx0PC9kaXY+XFxuXHRcdDxkaXYgY2xhc3M9XFxcImNvbnRlbnRcXFwiPlxcblx0XHRcdDxkaXYgXFxuXHRcdFx0XHRibi1jb250cm9sPVxcXCJQaWN0dXJlQ2Fyb3VzZWxDb250cm9sXFxcIiBcXG5cdFx0XHRcdGJuLWRhdGE9XFxcImltYWdlczogaW1hZ2VzLCBpbmRleDogaW5kZXhcXFwiIFxcblx0XHRcdFx0ZGF0YS13aWR0aD1cXFwiNjAwXFxcIiBcXG5cdFx0XHRcdGRhdGEtaGVpZ2h0PVxcXCI0MDBcXFwiIFxcblx0XHRcdFx0ZGF0YS1jb2xvcj1cXFwiY3lhblxcXCJcXG5cdFx0XHRcdD5cXG5cdFx0XHQ8L2Rpdj5cdFx0XHRcXG5cdFx0PC9kaXY+XFxuXFxuXHQ8L2Rpdj5cXG48L2Rpdj5cIixcblx0XHRkYXRhOiB7XG5cdFx0XHRpbWFnZXM6IFtdLFxuXHRcdFx0aW5kZXg6IDAsXG5cdFx0XHRzaG93RmlsZXM6IHRydWVcblx0XHR9LFxuXHRcdGV2ZW50czoge1xuXHRcdFx0b25GaWxlQ2xpY2tlZDogZnVuY3Rpb24oZXYsIGRhdGEpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25GaWxlQ2xpY2tlZCcsIGRhdGEpXG5cdFx0XHRcdHZhciBmaWxlcyA9ICQodGhpcykuaW50ZXJmYWNlKCkuZ2V0RmlsZXMoKVxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdmaWxlcycsIGZpbGVzKVxuXG5cdFx0XHRcdHZhciBpbWFnZXMgPSBmaWxlc1xuXHRcdFx0XHQuZmlsdGVyKChmKSA9PiAhZi5pc0Rpcilcblx0XHRcdFx0Lm1hcCgoZikgPT4gZmlsZVNydi5maWxlVXJsKGRhdGEucm9vdERpciArIGYubmFtZSkpXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2ltYWdlcycsIGltYWdlcylcblx0XHRcdFx0XG5cblx0XHRcdFx0dmFyIGluZGV4ID0gZmlsZXMuZmluZEluZGV4KChmKSA9PiBmLm5hbWUgPT0gZGF0YS5uYW1lKVxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdpbmRleCcsIGluZGV4KVxuXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7aW1hZ2VzLCBpbmRleCwgc2hvd0ZpbGVzOiBmYWxzZX0pXG5cdFx0XHR9LFxuXG5cdFx0XHRvbkJhY2tDbGlja2VkOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtzaG93RmlsZXM6IHRydWV9KVxuXHRcdFx0fVxuXHRcdH1cblx0fSlcblxufSk7Il19
