$$.configReady(function() {


	$$.startApp('MainControl')
})
$$.registerControl('MainControl', ['FileService'], function(elt, fileSrv) {


	var ctrl = $$.viewController(elt, {
		template: "<div bn-control=\"FileControl\" bn-event=\"fileClick: onFileClick\" style=\"height: 100%\"></div>\n\n",
		events: {
			onFileClick: function(ev, data) {
				//console.log('onFileClick', data)
				if ($$.isImage(data.name)) {
					$$.showPicture(data.name, fileSrv.fileUrl(data.rootDir + data.name))
				}
				
			}
		}

	})



});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkJC5jb25maWdSZWFkeShmdW5jdGlvbigpIHtcblxuXG5cdCQkLnN0YXJ0QXBwKCdNYWluQ29udHJvbCcpXG59KSIsIiQkLnJlZ2lzdGVyQ29udHJvbCgnTWFpbkNvbnRyb2wnLCBbJ0ZpbGVTZXJ2aWNlJ10sIGZ1bmN0aW9uKGVsdCwgZmlsZVNydikge1xuXG5cblx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcblx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGJuLWNvbnRyb2w9XFxcIkZpbGVDb250cm9sXFxcIiBibi1ldmVudD1cXFwiZmlsZUNsaWNrOiBvbkZpbGVDbGlja1xcXCIgc3R5bGU9XFxcImhlaWdodDogMTAwJVxcXCI+PC9kaXY+XFxuXFxuXCIsXG5cdFx0ZXZlbnRzOiB7XG5cdFx0XHRvbkZpbGVDbGljazogZnVuY3Rpb24oZXYsIGRhdGEpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25GaWxlQ2xpY2snLCBkYXRhKVxuXHRcdFx0XHRpZiAoJCQuaXNJbWFnZShkYXRhLm5hbWUpKSB7XG5cdFx0XHRcdFx0JCQuc2hvd1BpY3R1cmUoZGF0YS5uYW1lLCBmaWxlU3J2LmZpbGVVcmwoZGF0YS5yb290RGlyICsgZGF0YS5uYW1lKSlcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdH1cblx0XHR9XG5cblx0fSlcblxuXG5cbn0pO1xuIl19
