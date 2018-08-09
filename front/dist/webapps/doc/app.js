$$.configReady(function() {


	var routes = [
		{href: '/', redirect: '/controls'},
		{href: '/controls', control: '$MainControl'},
		{href: '/services', control: '$ServicesControl'},
		{href: '/core', control: '$CoreControl'},
		{href: '/control/:name', control: '$DetailControl'}



	]


	$$.viewController('body', {
		template: "<div class=\"bn-flex-col bn-flex-1\">\n	<div class=\"w3-blue\" bn-control=\"NavbarControl\">\n	    <a href=\"#/controls\">Controls</a>\n	    <a href=\"#/services\">Services</a>\n	    <a href=\"#/core\">Core</a>\n	</div>\n\n	<div bn-control=\"RouterControl\" bn-data=\"routes: routes\" class=\"mainPanel bn-flex-1\"></div>\n</div>\n",
		data: {routes}	
	})

});
$$.registerControlEx('$CoreControl', {

	init: function(elt, options) {

		var ctrl = $$.viewController(elt, {
			template: "<div class=\"main bn-flex-1 bn-flex-col\">\n	<h3>Available Functions</h3>\n	<div class=\"scrollPanel\">\n		<ul bn-each=\"m of methods\">\n			<li bn-text=\"m\"></li>\n		</ul>		\n	</div>\n\n</div>",
			data: {
				methods: Object.keys($$).sort()
			}
		})
	}
});

$$.registerControlEx('$DetailControl', {

	init: function(elt, options) {

		var name = options.$params.name

		var info = $$.getControlInfo(name)
		//console.log('info', info)

		var ctrl = $$.viewController(elt, {
			template: "<div class=\"bn-flex-1 bn-flex-col\">\n	<div>\n		<button title=\"Back\" class=\"backBtn\" bn-event=\"click: onBack\"><i class=\"fa fa-2x fa-arrow-circle-left\"></i></button>\n		<h1 bn-text=\"name\"></h1>\n	</div>\n	<div class=\"scrollPanel\">\n		\n		<pre bn-text=\"detail\"></pre>		\n	</div>\n\n</div>",
			data: {
				name,
				detail: JSON.stringify(info, null, 4).replace(/\"/g, '')
			},
			events: {
				onBack: function() {
					history.back()
				}
			}
		})
	}
});
$$.registerControl('$MainControl', function(elt) {

	var ctrls = $$.getRegisteredControlsEx()
	var libs = []
	for(var k in ctrls) {
		libs.push({
			name: k, 
			ctrls: ctrls[k].map((name) => {
				return {name, url: '#/control/' + name}
			})
		})
	}
	//console.log('libs', libs)

	var ctrl = $$.viewController(elt, {
		template: "<div class=\"main bn-flex-1 bn-flex-col\">\n	<h3>Available Controls</h3>\n	<div class=\"scrollPanel\" style=\"padding: 10px\">\n		<div bn-each=\"l of libs\">\n			<div>\n				<p>Library <strong bn-text=\"l.name\"></strong></p>\n				<ul bn-each=\"c of l.ctrls\">\n					<li><a bn-attr=\"href: c.url\" bn-text=\"c.name\"></a></li>\n				</ul>\n				\n			</div>\n		</div>\n	</div>\n\n</div>",
		data: {
			libs
		}
	})

});
$$.registerControlEx('$ServicesControl', {

	init: function(elt, options) {
		var ctrl = $$.viewController(elt, {
			template: "<div class=\"main bn-flex-1 bn-flex-col\">\n	<h3>Available Services</h3>\n	<div class=\"scrollPanel\">\n		<ul bn-each=\"s of services\">\n			<li bn-text=\"s\"></li>\n		</ul>		\n	</div>\n\n</div>",
			data: {
				services: $$.getRegisteredServices().map((s) => s.name)
			}
		})
	}
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvcmUuanMiLCJkZXRhaWwuanMiLCJtYWluLmpzIiwic2VydmljZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJCQuY29uZmlnUmVhZHkoZnVuY3Rpb24oKSB7XG5cblxuXHR2YXIgcm91dGVzID0gW1xuXHRcdHtocmVmOiAnLycsIHJlZGlyZWN0OiAnL2NvbnRyb2xzJ30sXG5cdFx0e2hyZWY6ICcvY29udHJvbHMnLCBjb250cm9sOiAnJE1haW5Db250cm9sJ30sXG5cdFx0e2hyZWY6ICcvc2VydmljZXMnLCBjb250cm9sOiAnJFNlcnZpY2VzQ29udHJvbCd9LFxuXHRcdHtocmVmOiAnL2NvcmUnLCBjb250cm9sOiAnJENvcmVDb250cm9sJ30sXG5cdFx0e2hyZWY6ICcvY29udHJvbC86bmFtZScsIGNvbnRyb2w6ICckRGV0YWlsQ29udHJvbCd9XG5cblxuXG5cdF1cblxuXG5cdCQkLnZpZXdDb250cm9sbGVyKCdib2R5Jywge1xuXHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtY29sIGJuLWZsZXgtMVxcXCI+XFxuXHQ8ZGl2IGNsYXNzPVxcXCJ3My1ibHVlXFxcIiBibi1jb250cm9sPVxcXCJOYXZiYXJDb250cm9sXFxcIj5cXG5cdCAgICA8YSBocmVmPVxcXCIjL2NvbnRyb2xzXFxcIj5Db250cm9sczwvYT5cXG5cdCAgICA8YSBocmVmPVxcXCIjL3NlcnZpY2VzXFxcIj5TZXJ2aWNlczwvYT5cXG5cdCAgICA8YSBocmVmPVxcXCIjL2NvcmVcXFwiPkNvcmU8L2E+XFxuXHQ8L2Rpdj5cXG5cXG5cdDxkaXYgYm4tY29udHJvbD1cXFwiUm91dGVyQ29udHJvbFxcXCIgYm4tZGF0YT1cXFwicm91dGVzOiByb3V0ZXNcXFwiIGNsYXNzPVxcXCJtYWluUGFuZWwgYm4tZmxleC0xXFxcIj48L2Rpdj5cXG48L2Rpdj5cXG5cIixcblx0XHRkYXRhOiB7cm91dGVzfVx0XG5cdH0pXG5cbn0pOyIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCckQ29yZUNvbnRyb2wnLCB7XG5cblx0aW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XG5cblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwibWFpbiBibi1mbGV4LTEgYm4tZmxleC1jb2xcXFwiPlxcblx0PGgzPkF2YWlsYWJsZSBGdW5jdGlvbnM8L2gzPlxcblx0PGRpdiBjbGFzcz1cXFwic2Nyb2xsUGFuZWxcXFwiPlxcblx0XHQ8dWwgYm4tZWFjaD1cXFwibSBvZiBtZXRob2RzXFxcIj5cXG5cdFx0XHQ8bGkgYm4tdGV4dD1cXFwibVxcXCI+PC9saT5cXG5cdFx0PC91bD5cdFx0XFxuXHQ8L2Rpdj5cXG5cXG48L2Rpdj5cIixcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0bWV0aG9kczogT2JqZWN0LmtleXMoJCQpLnNvcnQoKVxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cbn0pO1xuIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJyREZXRhaWxDb250cm9sJywge1xuXG5cdGluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xuXG5cdFx0dmFyIG5hbWUgPSBvcHRpb25zLiRwYXJhbXMubmFtZVxuXG5cdFx0dmFyIGluZm8gPSAkJC5nZXRDb250cm9sSW5mbyhuYW1lKVxuXHRcdC8vY29uc29sZS5sb2coJ2luZm8nLCBpbmZvKVxuXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcblx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtMSBibi1mbGV4LWNvbFxcXCI+XFxuXHQ8ZGl2Plxcblx0XHQ8YnV0dG9uIHRpdGxlPVxcXCJCYWNrXFxcIiBjbGFzcz1cXFwiYmFja0J0blxcXCIgYm4tZXZlbnQ9XFxcImNsaWNrOiBvbkJhY2tcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS0yeCBmYS1hcnJvdy1jaXJjbGUtbGVmdFxcXCI+PC9pPjwvYnV0dG9uPlxcblx0XHQ8aDEgYm4tdGV4dD1cXFwibmFtZVxcXCI+PC9oMT5cXG5cdDwvZGl2Plxcblx0PGRpdiBjbGFzcz1cXFwic2Nyb2xsUGFuZWxcXFwiPlxcblx0XHRcXG5cdFx0PHByZSBibi10ZXh0PVxcXCJkZXRhaWxcXFwiPjwvcHJlPlx0XHRcXG5cdDwvZGl2PlxcblxcbjwvZGl2PlwiLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRuYW1lLFxuXHRcdFx0XHRkZXRhaWw6IEpTT04uc3RyaW5naWZ5KGluZm8sIG51bGwsIDQpLnJlcGxhY2UoL1xcXCIvZywgJycpXG5cdFx0XHR9LFxuXHRcdFx0ZXZlbnRzOiB7XG5cdFx0XHRcdG9uQmFjazogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0aGlzdG9yeS5iYWNrKClcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cbn0pOyIsIiQkLnJlZ2lzdGVyQ29udHJvbCgnJE1haW5Db250cm9sJywgZnVuY3Rpb24oZWx0KSB7XG5cblx0dmFyIGN0cmxzID0gJCQuZ2V0UmVnaXN0ZXJlZENvbnRyb2xzRXgoKVxuXHR2YXIgbGlicyA9IFtdXG5cdGZvcih2YXIgayBpbiBjdHJscykge1xuXHRcdGxpYnMucHVzaCh7XG5cdFx0XHRuYW1lOiBrLCBcblx0XHRcdGN0cmxzOiBjdHJsc1trXS5tYXAoKG5hbWUpID0+IHtcblx0XHRcdFx0cmV0dXJuIHtuYW1lLCB1cmw6ICcjL2NvbnRyb2wvJyArIG5hbWV9XG5cdFx0XHR9KVxuXHRcdH0pXG5cdH1cblx0Ly9jb25zb2xlLmxvZygnbGlicycsIGxpYnMpXG5cblx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcblx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJtYWluIGJuLWZsZXgtMSBibi1mbGV4LWNvbFxcXCI+XFxuXHQ8aDM+QXZhaWxhYmxlIENvbnRyb2xzPC9oMz5cXG5cdDxkaXYgY2xhc3M9XFxcInNjcm9sbFBhbmVsXFxcIiBzdHlsZT1cXFwicGFkZGluZzogMTBweFxcXCI+XFxuXHRcdDxkaXYgYm4tZWFjaD1cXFwibCBvZiBsaWJzXFxcIj5cXG5cdFx0XHQ8ZGl2Plxcblx0XHRcdFx0PHA+TGlicmFyeSA8c3Ryb25nIGJuLXRleHQ9XFxcImwubmFtZVxcXCI+PC9zdHJvbmc+PC9wPlxcblx0XHRcdFx0PHVsIGJuLWVhY2g9XFxcImMgb2YgbC5jdHJsc1xcXCI+XFxuXHRcdFx0XHRcdDxsaT48YSBibi1hdHRyPVxcXCJocmVmOiBjLnVybFxcXCIgYm4tdGV4dD1cXFwiYy5uYW1lXFxcIj48L2E+PC9saT5cXG5cdFx0XHRcdDwvdWw+XFxuXHRcdFx0XHRcXG5cdFx0XHQ8L2Rpdj5cXG5cdFx0PC9kaXY+XFxuXHQ8L2Rpdj5cXG5cXG48L2Rpdj5cIixcblx0XHRkYXRhOiB7XG5cdFx0XHRsaWJzXG5cdFx0fVxuXHR9KVxuXG59KTsiLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnJFNlcnZpY2VzQ29udHJvbCcsIHtcblxuXHRpbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xuXHRcdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwibWFpbiBibi1mbGV4LTEgYm4tZmxleC1jb2xcXFwiPlxcblx0PGgzPkF2YWlsYWJsZSBTZXJ2aWNlczwvaDM+XFxuXHQ8ZGl2IGNsYXNzPVxcXCJzY3JvbGxQYW5lbFxcXCI+XFxuXHRcdDx1bCBibi1lYWNoPVxcXCJzIG9mIHNlcnZpY2VzXFxcIj5cXG5cdFx0XHQ8bGkgYm4tdGV4dD1cXFwic1xcXCI+PC9saT5cXG5cdFx0PC91bD5cdFx0XFxuXHQ8L2Rpdj5cXG5cXG48L2Rpdj5cIixcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0c2VydmljZXM6ICQkLmdldFJlZ2lzdGVyZWRTZXJ2aWNlcygpLm1hcCgocykgPT4gcy5uYW1lKVxuXHRcdFx0fVxuXHRcdH0pXG5cdH1cbn0pO1xuIl19
