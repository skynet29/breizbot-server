$$.configReady(function(config) {

	var tacticConfig = {
		"map": {
			"attributionControl": false,
			"zoomControl": true,
			"center": [48.3583, -4.53417],
			"zoom": 13		
		},

		"tileLayer": {
			"maxZoom": 19,
			"urlTemplate": "http://{s}.tile.osm.org/{z}/{x}/{y}.png"
		},

		"controls": {

			"layers": {
				"mission": {"label": "Mission", "visible": true},
				"default": {"label": "Default", "visible": true},
				"vehicule": {"label": "Vehicule", "visible": true}
			}

			
		},		

		"plugins": {

			"ShapeDecoder": {}
		}		
	}	

	var routes = [
		{href: '/', redirect: '/agents'},
		{href: '/agents', control: 'MasterAgentsControl'},
		{href: '/clients', control: 'MasterClientsControl'},
		{href: '/shapes', control: 'TacticShapesControl'},
		{href: '/tactic', control: 'TacticViewControl', options: tacticConfig}
	]

	$$.viewController('body', {
		template: "<div class=\"bn-flex-col bn-flex-1\">\n	<div class=\"w3-blue\" bn-control=\"NavbarControl\" data-active-color=\"w3-black\">\n	    <a href=\"#/agents\">Agents</a>\n	    <a href=\"#/clients\">Clients</a>\n	    <a href=\"#/shapes\">Shapes</a>\n	    <a href=\"#/tactic\">TacticView</a>\n	</div>\n\n	<div bn-control=\"RouterControl\" bn-data=\"routes: routes\" class=\"mainPanel bn-flex-1\"></div>\n</div>",
		data: {routes}	
	})


})
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uKGNvbmZpZykge1xuXG5cdHZhciB0YWN0aWNDb25maWcgPSB7XG5cdFx0XCJtYXBcIjoge1xuXHRcdFx0XCJhdHRyaWJ1dGlvbkNvbnRyb2xcIjogZmFsc2UsXG5cdFx0XHRcInpvb21Db250cm9sXCI6IHRydWUsXG5cdFx0XHRcImNlbnRlclwiOiBbNDguMzU4MywgLTQuNTM0MTddLFxuXHRcdFx0XCJ6b29tXCI6IDEzXHRcdFxuXHRcdH0sXG5cblx0XHRcInRpbGVMYXllclwiOiB7XG5cdFx0XHRcIm1heFpvb21cIjogMTksXG5cdFx0XHRcInVybFRlbXBsYXRlXCI6IFwiaHR0cDovL3tzfS50aWxlLm9zbS5vcmcve3p9L3t4fS97eX0ucG5nXCJcblx0XHR9LFxuXG5cdFx0XCJjb250cm9sc1wiOiB7XG5cblx0XHRcdFwibGF5ZXJzXCI6IHtcblx0XHRcdFx0XCJtaXNzaW9uXCI6IHtcImxhYmVsXCI6IFwiTWlzc2lvblwiLCBcInZpc2libGVcIjogdHJ1ZX0sXG5cdFx0XHRcdFwiZGVmYXVsdFwiOiB7XCJsYWJlbFwiOiBcIkRlZmF1bHRcIiwgXCJ2aXNpYmxlXCI6IHRydWV9LFxuXHRcdFx0XHRcInZlaGljdWxlXCI6IHtcImxhYmVsXCI6IFwiVmVoaWN1bGVcIiwgXCJ2aXNpYmxlXCI6IHRydWV9XG5cdFx0XHR9XG5cblx0XHRcdFxuXHRcdH0sXHRcdFxuXG5cdFx0XCJwbHVnaW5zXCI6IHtcblxuXHRcdFx0XCJTaGFwZURlY29kZXJcIjoge31cblx0XHR9XHRcdFxuXHR9XHRcblxuXHR2YXIgcm91dGVzID0gW1xuXHRcdHtocmVmOiAnLycsIHJlZGlyZWN0OiAnL2FnZW50cyd9LFxuXHRcdHtocmVmOiAnL2FnZW50cycsIGNvbnRyb2w6ICdNYXN0ZXJBZ2VudHNDb250cm9sJ30sXG5cdFx0e2hyZWY6ICcvY2xpZW50cycsIGNvbnRyb2w6ICdNYXN0ZXJDbGllbnRzQ29udHJvbCd9LFxuXHRcdHtocmVmOiAnL3NoYXBlcycsIGNvbnRyb2w6ICdUYWN0aWNTaGFwZXNDb250cm9sJ30sXG5cdFx0e2hyZWY6ICcvdGFjdGljJywgY29udHJvbDogJ1RhY3RpY1ZpZXdDb250cm9sJywgb3B0aW9uczogdGFjdGljQ29uZmlnfVxuXHRdXG5cblx0JCQudmlld0NvbnRyb2xsZXIoJ2JvZHknLCB7XG5cdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiYm4tZmxleC1jb2wgYm4tZmxleC0xXFxcIj5cXG5cdDxkaXYgY2xhc3M9XFxcInczLWJsdWVcXFwiIGJuLWNvbnRyb2w9XFxcIk5hdmJhckNvbnRyb2xcXFwiIGRhdGEtYWN0aXZlLWNvbG9yPVxcXCJ3My1ibGFja1xcXCI+XFxuXHQgICAgPGEgaHJlZj1cXFwiIy9hZ2VudHNcXFwiPkFnZW50czwvYT5cXG5cdCAgICA8YSBocmVmPVxcXCIjL2NsaWVudHNcXFwiPkNsaWVudHM8L2E+XFxuXHQgICAgPGEgaHJlZj1cXFwiIy9zaGFwZXNcXFwiPlNoYXBlczwvYT5cXG5cdCAgICA8YSBocmVmPVxcXCIjL3RhY3RpY1xcXCI+VGFjdGljVmlldzwvYT5cXG5cdDwvZGl2Plxcblxcblx0PGRpdiBibi1jb250cm9sPVxcXCJSb3V0ZXJDb250cm9sXFxcIiBibi1kYXRhPVxcXCJyb3V0ZXM6IHJvdXRlc1xcXCIgY2xhc3M9XFxcIm1haW5QYW5lbCBibi1mbGV4LTFcXFwiPjwvZGl2PlxcbjwvZGl2PlwiLFxuXHRcdGRhdGE6IHtyb3V0ZXN9XHRcblx0fSlcblxuXG59KSJdfQ==
