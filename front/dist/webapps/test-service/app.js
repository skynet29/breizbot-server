$$.configReady(function(config) {

	$$.startApp('MainControl')

})
$$.registerControl('MainControl', ['WebSocketService'], function(elt, client) {

	var ctrl = $$.viewController(elt, {
		template: "<div id=\"main\">\n	<form bn-event=\"submit: onCompute\">\n		<input type=\"number\" placeholder=\"nombre 1\" name=\"a\" required=\"\">\n		&nbsp;+&nbsp;\n		<input type=\"number\" placeholder=\"nombre 2\" name=\"b\" required=\"\">\n		&nbsp;=&nbsp;\n		<input type=\"text\" placeholder=\"resultat\" readonly=\"\" bn-val=\"result\">\n		<button type=\"submit\">Compute</button>\n	</form>\n	<p bn-text=\"message\"></p>\n\n</div>",
		data: {
			message: ''
		},
		events: {
			onCompute: function(ev) {
				ev.preventDefault()
				var data = $(this).getFormData()
				console.log('data', data)
				client.callService('sum', data).then(function(result) {
					ctrl.setData({result, message: ''})
				})
				.catch(function(err) {
					ctrl.setData('message', err.message)
				})
			}
		}
	})
})
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uKGNvbmZpZykge1xuXG5cdCQkLnN0YXJ0QXBwKCdNYWluQ29udHJvbCcpXG5cbn0pIiwiJCQucmVnaXN0ZXJDb250cm9sKCdNYWluQ29udHJvbCcsIFsnV2ViU29ja2V0U2VydmljZSddLCBmdW5jdGlvbihlbHQsIGNsaWVudCkge1xuXG5cdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XG5cdFx0dGVtcGxhdGU6IFwiPGRpdiBpZD1cXFwibWFpblxcXCI+XFxuXHQ8Zm9ybSBibi1ldmVudD1cXFwic3VibWl0OiBvbkNvbXB1dGVcXFwiPlxcblx0XHQ8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiBwbGFjZWhvbGRlcj1cXFwibm9tYnJlIDFcXFwiIG5hbWU9XFxcImFcXFwiIHJlcXVpcmVkPVxcXCJcXFwiPlxcblx0XHQmbmJzcDsrJm5ic3A7XFxuXHRcdDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHBsYWNlaG9sZGVyPVxcXCJub21icmUgMlxcXCIgbmFtZT1cXFwiYlxcXCIgcmVxdWlyZWQ9XFxcIlxcXCI+XFxuXHRcdCZuYnNwOz0mbmJzcDtcXG5cdFx0PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIHBsYWNlaG9sZGVyPVxcXCJyZXN1bHRhdFxcXCIgcmVhZG9ubHk9XFxcIlxcXCIgYm4tdmFsPVxcXCJyZXN1bHRcXFwiPlxcblx0XHQ8YnV0dG9uIHR5cGU9XFxcInN1Ym1pdFxcXCI+Q29tcHV0ZTwvYnV0dG9uPlxcblx0PC9mb3JtPlxcblx0PHAgYm4tdGV4dD1cXFwibWVzc2FnZVxcXCI+PC9wPlxcblxcbjwvZGl2PlwiLFxuXHRcdGRhdGE6IHtcblx0XHRcdG1lc3NhZ2U6ICcnXG5cdFx0fSxcblx0XHRldmVudHM6IHtcblx0XHRcdG9uQ29tcHV0ZTogZnVuY3Rpb24oZXYpIHtcblx0XHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHR2YXIgZGF0YSA9ICQodGhpcykuZ2V0Rm9ybURhdGEoKVxuXHRcdFx0XHRjb25zb2xlLmxvZygnZGF0YScsIGRhdGEpXG5cdFx0XHRcdGNsaWVudC5jYWxsU2VydmljZSgnc3VtJywgZGF0YSkudGhlbihmdW5jdGlvbihyZXN1bHQpIHtcblx0XHRcdFx0XHRjdHJsLnNldERhdGEoe3Jlc3VsdCwgbWVzc2FnZTogJyd9KVxuXHRcdFx0XHR9KVxuXHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKCdtZXNzYWdlJywgZXJyLm1lc3NhZ2UpXG5cdFx0XHRcdH0pXG5cdFx0XHR9XG5cdFx0fVxuXHR9KVxufSkiXX0=
