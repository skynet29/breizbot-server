(function() {


	$$.registerControlEx('ShapesControl', {

		deps: ['WebSocketService'], 

		
	lib: 'shapes',
init: function(elt, options, client) {


			var model = {
				tableConfig: {
					columns: {
						name: 'Name',
						layer: 'Layer',
						shapeType: 'Shape Type',
						src: 'Source',
						lastModif: 'Last Modified'
					},
					actions: {
						'delete': 'fa fa-trash',
						'detail': 'fa fa-info'
					}
				},
				nbMsg: 0,
				filters: {
					name: '',
					layer: ''
				}			
			}
		
			var ctrl = $$.viewController(elt, {
				template: "<div class=\"bn-flex-1 bn-flex-col\">\n	<div class=\"header\">\n		<div class=\"bn-flex-row bn-space-between bn-container\">\n			<div class=\"filters\" bn-event=\"input.filter: onFilterChange\">\n				<input type=\"text\" autofocus placeholder=\"Filter name\" data-filter=\"name\" class=\"filter\" bn-val=\"filters.name\">\n				<input type=\"text\" placeholder=\"Filter layer\" data-filter=\"layer\" class=\"filter\" bn-val=\"filters.layer\">\n			</div>\n			<div>Number of shapes: <span bn-text=\"nbMsg\"></span></div>\n		</div>		\n		<div class=\"bn-flex-row bn-space-between bn-container\">\n			<button class=\"removeAll w3-btn w3-blue\" bn-event=\"click: onRemoveAll\">Remove all shapes</button>\n\n		</div>\n	</div>\n	<div bn-iface=\"iface\" bn-control=\"FilteredTableControl\" bn-options=\"tableConfig\" class=\"bn-flex-1 bn-no-overflow\" bn-event=\"itemAction: onItemAction\"></div>	\n</div>\n\n",
				data: model,
				events: {


					onRemoveAll: function(ev) {
						for(let shapeId in ctrl.scope.iface.getDisplayedDatas()) {
							client.emit('mapViewAddShape.' + shapeId)
						}					
					},
					onItemAction: function(action, id) {
						console.log('itemAction', id, action)
						if (action == 'delete') {
							client.emit('mapViewAddShape.' + id)
						}
						if (action == 'detail') {
							var msg = ctrl.scope.iface.getItem(id)
							console.log('msg', msg)
							var html = `<pre>${JSON.stringify(msg.data, null, 4)}</pre>`
							$$.showAlert(html, 'Detail')
						}
					},
					onFilterChange: function(ev) {
						var field = $(this).data('filter')
						console.log('field', field)
						ctrl.model.filters[field] = $(this).val()
						ctrl.update('filters')					
					}
				},
				watches: {

					filters: function(newValue) {
						console.log('filters has change:', newValue)
						ctrl.scope.iface.setFilters(newValue)
						updateShapeNumber()
					}
				},
				init: function() {
					this.scope.iface.setFilters(this.model.filters)
				}
			})

			var tbody = elt.find('.FilteredTableControl tbody')

			function updateShapeNumber() {
				var nbMsg = tbody.find('tr').length
				ctrl.setData({nbMsg: nbMsg})
			}


			function getItemData(msg) {
				var tokens = msg.id.split('.')
				var layer = tokens[0]
				var id = tokens[1]
				return {
					name: id,
					layer: layer,
					shapeType: msg.data.shape,
					src: msg.src,
					lastModif: new Date(msg.time).toLocaleString(),
					data: msg.data
				}
			}


			function onTacticViewAddShape(msg) {
				if (msg.data == undefined) {
					ctrl.scope.iface.removeItem(msg.id)
				}
				else {
					ctrl.scope.iface.addItem(msg.id, getItemData(msg))
				}	
				updateShapeNumber()	
			}

			client.register('mapViewAddShape.*.*', true, onTacticViewAddShape)

			client.onClose = function() {
				ctrl.scope.iface.removeAllItems()
			}



			this.dispose = function() {
				console.log('[TacticShapesControl] dispose !!')
				client.unregister('mapViewAddShape.*.*', onTacticViewAddShape)
			}
			
		}

	})

})();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNoYXBlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InNoYXBlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcblxuXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdTaGFwZXNDb250cm9sJywge1xuXG5cdFx0ZGVwczogWydXZWJTb2NrZXRTZXJ2aWNlJ10sIFxuXG5cdFx0XG5cdGxpYjogJ3NoYXBlcycsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGNsaWVudCkge1xuXG5cblx0XHRcdHZhciBtb2RlbCA9IHtcblx0XHRcdFx0dGFibGVDb25maWc6IHtcblx0XHRcdFx0XHRjb2x1bW5zOiB7XG5cdFx0XHRcdFx0XHRuYW1lOiAnTmFtZScsXG5cdFx0XHRcdFx0XHRsYXllcjogJ0xheWVyJyxcblx0XHRcdFx0XHRcdHNoYXBlVHlwZTogJ1NoYXBlIFR5cGUnLFxuXHRcdFx0XHRcdFx0c3JjOiAnU291cmNlJyxcblx0XHRcdFx0XHRcdGxhc3RNb2RpZjogJ0xhc3QgTW9kaWZpZWQnXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRhY3Rpb25zOiB7XG5cdFx0XHRcdFx0XHQnZGVsZXRlJzogJ2ZhIGZhLXRyYXNoJyxcblx0XHRcdFx0XHRcdCdkZXRhaWwnOiAnZmEgZmEtaW5mbydcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdG5iTXNnOiAwLFxuXHRcdFx0XHRmaWx0ZXJzOiB7XG5cdFx0XHRcdFx0bmFtZTogJycsXG5cdFx0XHRcdFx0bGF5ZXI6ICcnXG5cdFx0XHRcdH1cdFx0XHRcblx0XHRcdH1cblx0XHRcblx0XHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZWx0LCB7XG5cdFx0XHRcdHRlbXBsYXRlOiBcIjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtMSBibi1mbGV4LWNvbFxcXCI+XFxuXHQ8ZGl2IGNsYXNzPVxcXCJoZWFkZXJcXFwiPlxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LXJvdyBibi1zcGFjZS1iZXR3ZWVuIGJuLWNvbnRhaW5lclxcXCI+XFxuXHRcdFx0PGRpdiBjbGFzcz1cXFwiZmlsdGVyc1xcXCIgYm4tZXZlbnQ9XFxcImlucHV0LmZpbHRlcjogb25GaWx0ZXJDaGFuZ2VcXFwiPlxcblx0XHRcdFx0PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGF1dG9mb2N1cyBwbGFjZWhvbGRlcj1cXFwiRmlsdGVyIG5hbWVcXFwiIGRhdGEtZmlsdGVyPVxcXCJuYW1lXFxcIiBjbGFzcz1cXFwiZmlsdGVyXFxcIiBibi12YWw9XFxcImZpbHRlcnMubmFtZVxcXCI+XFxuXHRcdFx0XHQ8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgcGxhY2Vob2xkZXI9XFxcIkZpbHRlciBsYXllclxcXCIgZGF0YS1maWx0ZXI9XFxcImxheWVyXFxcIiBjbGFzcz1cXFwiZmlsdGVyXFxcIiBibi12YWw9XFxcImZpbHRlcnMubGF5ZXJcXFwiPlxcblx0XHRcdDwvZGl2Plxcblx0XHRcdDxkaXY+TnVtYmVyIG9mIHNoYXBlczogPHNwYW4gYm4tdGV4dD1cXFwibmJNc2dcXFwiPjwvc3Bhbj48L2Rpdj5cXG5cdFx0PC9kaXY+XHRcdFxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LXJvdyBibi1zcGFjZS1iZXR3ZWVuIGJuLWNvbnRhaW5lclxcXCI+XFxuXHRcdFx0PGJ1dHRvbiBjbGFzcz1cXFwicmVtb3ZlQWxsIHczLWJ0biB3My1ibHVlXFxcIiBibi1ldmVudD1cXFwiY2xpY2s6IG9uUmVtb3ZlQWxsXFxcIj5SZW1vdmUgYWxsIHNoYXBlczwvYnV0dG9uPlxcblxcblx0XHQ8L2Rpdj5cXG5cdDwvZGl2Plxcblx0PGRpdiBibi1pZmFjZT1cXFwiaWZhY2VcXFwiIGJuLWNvbnRyb2w9XFxcIkZpbHRlcmVkVGFibGVDb250cm9sXFxcIiBibi1vcHRpb25zPVxcXCJ0YWJsZUNvbmZpZ1xcXCIgY2xhc3M9XFxcImJuLWZsZXgtMSBibi1uby1vdmVyZmxvd1xcXCIgYm4tZXZlbnQ9XFxcIml0ZW1BY3Rpb246IG9uSXRlbUFjdGlvblxcXCI+PC9kaXY+XHRcXG48L2Rpdj5cXG5cXG5cIixcblx0XHRcdFx0ZGF0YTogbW9kZWwsXG5cdFx0XHRcdGV2ZW50czoge1xuXG5cblx0XHRcdFx0XHRvblJlbW92ZUFsbDogZnVuY3Rpb24oZXYpIHtcblx0XHRcdFx0XHRcdGZvcihsZXQgc2hhcGVJZCBpbiBjdHJsLnNjb3BlLmlmYWNlLmdldERpc3BsYXllZERhdGFzKCkpIHtcblx0XHRcdFx0XHRcdFx0Y2xpZW50LmVtaXQoJ21hcFZpZXdBZGRTaGFwZS4nICsgc2hhcGVJZClcblx0XHRcdFx0XHRcdH1cdFx0XHRcdFx0XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRvbkl0ZW1BY3Rpb246IGZ1bmN0aW9uKGFjdGlvbiwgaWQpIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdpdGVtQWN0aW9uJywgaWQsIGFjdGlvbilcblx0XHRcdFx0XHRcdGlmIChhY3Rpb24gPT0gJ2RlbGV0ZScpIHtcblx0XHRcdFx0XHRcdFx0Y2xpZW50LmVtaXQoJ21hcFZpZXdBZGRTaGFwZS4nICsgaWQpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpZiAoYWN0aW9uID09ICdkZXRhaWwnKSB7XG5cdFx0XHRcdFx0XHRcdHZhciBtc2cgPSBjdHJsLnNjb3BlLmlmYWNlLmdldEl0ZW0oaWQpXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdtc2cnLCBtc2cpXG5cdFx0XHRcdFx0XHRcdHZhciBodG1sID0gYDxwcmU+JHtKU09OLnN0cmluZ2lmeShtc2cuZGF0YSwgbnVsbCwgNCl9PC9wcmU+YFxuXHRcdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQoaHRtbCwgJ0RldGFpbCcpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRvbkZpbHRlckNoYW5nZTogZnVuY3Rpb24oZXYpIHtcblx0XHRcdFx0XHRcdHZhciBmaWVsZCA9ICQodGhpcykuZGF0YSgnZmlsdGVyJylcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdmaWVsZCcsIGZpZWxkKVxuXHRcdFx0XHRcdFx0Y3RybC5tb2RlbC5maWx0ZXJzW2ZpZWxkXSA9ICQodGhpcykudmFsKClcblx0XHRcdFx0XHRcdGN0cmwudXBkYXRlKCdmaWx0ZXJzJylcdFx0XHRcdFx0XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHR3YXRjaGVzOiB7XG5cblx0XHRcdFx0XHRmaWx0ZXJzOiBmdW5jdGlvbihuZXdWYWx1ZSkge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ2ZpbHRlcnMgaGFzIGNoYW5nZTonLCBuZXdWYWx1ZSlcblx0XHRcdFx0XHRcdGN0cmwuc2NvcGUuaWZhY2Uuc2V0RmlsdGVycyhuZXdWYWx1ZSlcblx0XHRcdFx0XHRcdHVwZGF0ZVNoYXBlTnVtYmVyKClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGluaXQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHRoaXMuc2NvcGUuaWZhY2Uuc2V0RmlsdGVycyh0aGlzLm1vZGVsLmZpbHRlcnMpXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cblx0XHRcdHZhciB0Ym9keSA9IGVsdC5maW5kKCcuRmlsdGVyZWRUYWJsZUNvbnRyb2wgdGJvZHknKVxuXG5cdFx0XHRmdW5jdGlvbiB1cGRhdGVTaGFwZU51bWJlcigpIHtcblx0XHRcdFx0dmFyIG5iTXNnID0gdGJvZHkuZmluZCgndHInKS5sZW5ndGhcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtuYk1zZzogbmJNc2d9KVxuXHRcdFx0fVxuXG5cblx0XHRcdGZ1bmN0aW9uIGdldEl0ZW1EYXRhKG1zZykge1xuXHRcdFx0XHR2YXIgdG9rZW5zID0gbXNnLmlkLnNwbGl0KCcuJylcblx0XHRcdFx0dmFyIGxheWVyID0gdG9rZW5zWzBdXG5cdFx0XHRcdHZhciBpZCA9IHRva2Vuc1sxXVxuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdG5hbWU6IGlkLFxuXHRcdFx0XHRcdGxheWVyOiBsYXllcixcblx0XHRcdFx0XHRzaGFwZVR5cGU6IG1zZy5kYXRhLnNoYXBlLFxuXHRcdFx0XHRcdHNyYzogbXNnLnNyYyxcblx0XHRcdFx0XHRsYXN0TW9kaWY6IG5ldyBEYXRlKG1zZy50aW1lKS50b0xvY2FsZVN0cmluZygpLFxuXHRcdFx0XHRcdGRhdGE6IG1zZy5kYXRhXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXG5cdFx0XHRmdW5jdGlvbiBvblRhY3RpY1ZpZXdBZGRTaGFwZShtc2cpIHtcblx0XHRcdFx0aWYgKG1zZy5kYXRhID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGN0cmwuc2NvcGUuaWZhY2UucmVtb3ZlSXRlbShtc2cuaWQpXG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0Y3RybC5zY29wZS5pZmFjZS5hZGRJdGVtKG1zZy5pZCwgZ2V0SXRlbURhdGEobXNnKSlcblx0XHRcdFx0fVx0XG5cdFx0XHRcdHVwZGF0ZVNoYXBlTnVtYmVyKClcdFxuXHRcdFx0fVxuXG5cdFx0XHRjbGllbnQucmVnaXN0ZXIoJ21hcFZpZXdBZGRTaGFwZS4qLionLCB0cnVlLCBvblRhY3RpY1ZpZXdBZGRTaGFwZSlcblxuXHRcdFx0Y2xpZW50Lm9uQ2xvc2UgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y3RybC5zY29wZS5pZmFjZS5yZW1vdmVBbGxJdGVtcygpXG5cdFx0XHR9XG5cblxuXG5cdFx0XHR0aGlzLmRpc3Bvc2UgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ1tUYWN0aWNTaGFwZXNDb250cm9sXSBkaXNwb3NlICEhJylcblx0XHRcdFx0Y2xpZW50LnVucmVnaXN0ZXIoJ21hcFZpZXdBZGRTaGFwZS4qLionLCBvblRhY3RpY1ZpZXdBZGRTaGFwZSlcblx0XHRcdH1cblx0XHRcdFxuXHRcdH1cblxuXHR9KVxuXG59KSgpO1xuIl19
