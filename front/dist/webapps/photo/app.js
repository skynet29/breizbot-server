$$.configReady(function() {

	$$.startApp('MainControl')
})
$$.registerControl('MainControl', ['FileService'], function(elt, fileSrv) {

	var ctrl = window.app = $$.viewController(elt, {
		template: "<div>\r\n	<div \r\n		bn-control=\"FileControl\" \r\n		data-toolbar=\"false\" \r\n		data-image-only=\"true\"\r\n		bn-event=\"fileClick: onFileClicked\" \r\n		bn-show=\"showFiles\"\r\n		>			\r\n	</div>\r\n	<div \r\n		bn-show=\"!showFiles\" \r\n		>\r\n		<div class=\"bn-toolbar\">\r\n			<button \r\n				title=\"Back\" \r\n				bn-event=\"click: onBackClicked\"\r\n			>\r\n				<i class=\"fa fa-arrow-left\"></i>\r\n			</button>\r\n		</div>\r\n		<div class=\"content\">\r\n			<div \r\n				bn-control=\"PictureCarouselControl\" \r\n				bn-data=\"images: images, index: index\" \r\n				data-width=\"600\" \r\n				data-height=\"400\" \r\n				data-color=\"cyan\"\r\n				>\r\n			</div>			\r\n		</div>\r\n\r\n	</div>\r\n</div>",
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkJC5jb25maWdSZWFkeShmdW5jdGlvbigpIHtcclxuXHJcblx0JCQuc3RhcnRBcHAoJ01haW5Db250cm9sJylcclxufSkiLCIkJC5yZWdpc3RlckNvbnRyb2woJ01haW5Db250cm9sJywgWydGaWxlU2VydmljZSddLCBmdW5jdGlvbihlbHQsIGZpbGVTcnYpIHtcclxuXHJcblx0dmFyIGN0cmwgPSB3aW5kb3cuYXBwID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XHJcblx0XHR0ZW1wbGF0ZTogXCI8ZGl2Plxcclxcblx0PGRpdiBcXHJcXG5cdFx0Ym4tY29udHJvbD1cXFwiRmlsZUNvbnRyb2xcXFwiIFxcclxcblx0XHRkYXRhLXRvb2xiYXI9XFxcImZhbHNlXFxcIiBcXHJcXG5cdFx0ZGF0YS1pbWFnZS1vbmx5PVxcXCJ0cnVlXFxcIlxcclxcblx0XHRibi1ldmVudD1cXFwiZmlsZUNsaWNrOiBvbkZpbGVDbGlja2VkXFxcIiBcXHJcXG5cdFx0Ym4tc2hvdz1cXFwic2hvd0ZpbGVzXFxcIlxcclxcblx0XHQ+XHRcdFx0XFxyXFxuXHQ8L2Rpdj5cXHJcXG5cdDxkaXYgXFxyXFxuXHRcdGJuLXNob3c9XFxcIiFzaG93RmlsZXNcXFwiIFxcclxcblx0XHQ+XFxyXFxuXHRcdDxkaXYgY2xhc3M9XFxcImJuLXRvb2xiYXJcXFwiPlxcclxcblx0XHRcdDxidXR0b24gXFxyXFxuXHRcdFx0XHR0aXRsZT1cXFwiQmFja1xcXCIgXFxyXFxuXHRcdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uQmFja0NsaWNrZWRcXFwiXFxyXFxuXHRcdFx0Plxcclxcblx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLWFycm93LWxlZnRcXFwiPjwvaT5cXHJcXG5cdFx0XHQ8L2J1dHRvbj5cXHJcXG5cdFx0PC9kaXY+XFxyXFxuXHRcdDxkaXYgY2xhc3M9XFxcImNvbnRlbnRcXFwiPlxcclxcblx0XHRcdDxkaXYgXFxyXFxuXHRcdFx0XHRibi1jb250cm9sPVxcXCJQaWN0dXJlQ2Fyb3VzZWxDb250cm9sXFxcIiBcXHJcXG5cdFx0XHRcdGJuLWRhdGE9XFxcImltYWdlczogaW1hZ2VzLCBpbmRleDogaW5kZXhcXFwiIFxcclxcblx0XHRcdFx0ZGF0YS13aWR0aD1cXFwiNjAwXFxcIiBcXHJcXG5cdFx0XHRcdGRhdGEtaGVpZ2h0PVxcXCI0MDBcXFwiIFxcclxcblx0XHRcdFx0ZGF0YS1jb2xvcj1cXFwiY3lhblxcXCJcXHJcXG5cdFx0XHRcdD5cXHJcXG5cdFx0XHQ8L2Rpdj5cdFx0XHRcXHJcXG5cdFx0PC9kaXY+XFxyXFxuXFxyXFxuXHQ8L2Rpdj5cXHJcXG48L2Rpdj5cIixcclxuXHRcdGRhdGE6IHtcclxuXHRcdFx0aW1hZ2VzOiBbXSxcclxuXHRcdFx0aW5kZXg6IDAsXHJcblx0XHRcdHNob3dGaWxlczogdHJ1ZVxyXG5cdFx0fSxcclxuXHRcdGV2ZW50czoge1xyXG5cdFx0XHRvbkZpbGVDbGlja2VkOiBmdW5jdGlvbihldiwgZGF0YSkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ29uRmlsZUNsaWNrZWQnLCBkYXRhKVxyXG5cdFx0XHRcdHZhciBmaWxlcyA9ICQodGhpcykuaW50ZXJmYWNlKCkuZ2V0RmlsZXMoKVxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2ZpbGVzJywgZmlsZXMpXHJcblxyXG5cdFx0XHRcdHZhciBpbWFnZXMgPSBmaWxlc1xyXG5cdFx0XHRcdC5maWx0ZXIoKGYpID0+ICFmLmlzRGlyKVxyXG5cdFx0XHRcdC5tYXAoKGYpID0+IGZpbGVTcnYuZmlsZVVybChkYXRhLnJvb3REaXIgKyBmLm5hbWUpKVxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2ltYWdlcycsIGltYWdlcylcclxuXHRcdFx0XHRcclxuXHJcblx0XHRcdFx0dmFyIGluZGV4ID0gZmlsZXMuZmluZEluZGV4KChmKSA9PiBmLm5hbWUgPT0gZGF0YS5uYW1lKVxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2luZGV4JywgaW5kZXgpXHJcblxyXG5cdFx0XHRcdGN0cmwuc2V0RGF0YSh7aW1hZ2VzLCBpbmRleCwgc2hvd0ZpbGVzOiBmYWxzZX0pXHJcblx0XHRcdH0sXHJcblxyXG5cdFx0XHRvbkJhY2tDbGlja2VkOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRjdHJsLnNldERhdGEoe3Nob3dGaWxlczogdHJ1ZX0pXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9KVxyXG5cclxufSk7Il19
