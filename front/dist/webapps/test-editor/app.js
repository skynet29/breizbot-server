$$.configReady(function() {

	var ctrl = $$.viewController('body', {
		template: "<div class=\"bn-flex-1 bn-flex-col\">\n	<div bn-control=\"HtmlEditorControl\" bn-iface=\"editorCtrl\" class=\"bn-flex-1\"></div>\n	<div>\n		<button bn-event=\"click: onShowHtml\">Show HTML</button>	\n	</div>\n	\n</div>\n",
		events: {
			onShowHtml: function() {
				console.log('onShowHtml', ctrl.scope.editorCtrl.html())
			}
		}
	})
})
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uKCkge1xuXG5cdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoJ2JvZHknLCB7XG5cdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiYm4tZmxleC0xIGJuLWZsZXgtY29sXFxcIj5cXG5cdDxkaXYgYm4tY29udHJvbD1cXFwiSHRtbEVkaXRvckNvbnRyb2xcXFwiIGJuLWlmYWNlPVxcXCJlZGl0b3JDdHJsXFxcIiBjbGFzcz1cXFwiYm4tZmxleC0xXFxcIj48L2Rpdj5cXG5cdDxkaXY+XFxuXHRcdDxidXR0b24gYm4tZXZlbnQ9XFxcImNsaWNrOiBvblNob3dIdG1sXFxcIj5TaG93IEhUTUw8L2J1dHRvbj5cdFxcblx0PC9kaXY+XFxuXHRcXG48L2Rpdj5cXG5cIixcblx0XHRldmVudHM6IHtcblx0XHRcdG9uU2hvd0h0bWw6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnb25TaG93SHRtbCcsIGN0cmwuc2NvcGUuZWRpdG9yQ3RybC5odG1sKCkpXG5cdFx0XHR9XG5cdFx0fVxuXHR9KVxufSkiXX0=
