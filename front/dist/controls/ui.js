
$$.registerControlEx('AccordionControl', {
	
	lib: 'ui',
init: function(elt, options) {

		elt.children('div').each(function() {
			var div = $(this)
			var title = div.attr('title')
			div.before($('<h3>').text(title))
		})
		elt.accordion(options)
	}
});



(function() {

	$.datepicker.setDefaults($.datepicker.regional['fr'])


	$$.registerControlEx('DatePickerControl', {
		options: {
			showButtonPanel: false
		},
		events: 'change',
		
	lib: 'ui',
init: function(elt, options) {

			elt.datepicker(options)

			var value = elt.val()
			if (typeof value == 'string') {
				var ms = Date.parse(value)
				//console.log('[DatePickerControl] ms', ms)
				var date = new Date(ms)
				//console.log('[DatePickerControl] date', date)
				elt.datepicker('setDate', date)
			}
				
			return {
				setValue: function(date) {
					elt.datepicker('setDate', date)
				},
				getValue: function() {
					return elt.datepicker('getDate')
				}
			}
		}

	})
})();

(function() {	

	$$.loadStyle('/controls/ui.css')
})();
$$.registerControlEx('DialogControl', {
	
	lib: 'ui',
init: function(elt, options) {

		options.autoOpen = false
		options.appendTo = elt.parent()
		options.modal = true

		this.open = function() {
			elt.dialog('open')
		}

		this.close = function() {
			elt.dialog('close')
		}

		this.setOption = function(optionName, value) {
			elt.dialog('option', optionName, value)
		}


		for(var btn in options.buttons) {
			var fn = options.buttons[btn] 
			if (typeof fn == 'function') {
				options.buttons[btn] = options.buttons[btn].bind(iface)
			}
		}

		elt.dialog(options)

	}
});





$$.registerControlEx('SliderControl', {

	options: {
		max: 100,
		min: 0, 
		orientation: 'horizontal',
		range: false			
	},
	events: 'change,input',

	
	lib: 'ui',
init: function(elt, options) {


	//console.log('[SliderControl] value', elt.val())
		var value = elt.val()

		if (Array.isArray(value)) {
			options.values = value
			options.range = true
		}

		if (typeof value == 'string') {
			options.value = value
		}

		//console.log('[SliderControl] options', options)

		options.change = function(ev, ui) {
			elt.trigger('change', [ui.values || ui.value])
		}

		options.slide = function(ev, ui) {
			//console.log('[SliderControl] slide', ui.values || ui.value)
			elt.trigger('input', [ui.values || ui.value])
		}

		elt.slider(options)

		this.getValue = function() {
			//console.log('[SliderControl] getValue')
			return elt.slider((options.range) ? 'values' : 'value') 
		}

		this.setValue = function(value) {
			//console.log('[SliderControl] setValue')
			elt.slider((options.range) ? 'values' : 'value', value)
		}


	}

});




$$.registerControlEx('SpinnerControl', {
	
	lib: 'ui',
init: function(elt) {

		elt.spinner({
			stop: function () {
				//console.log('[SpinnerControl] change')
			}
		})
	},
	events: 'spinstop'
});




$$.registerControlEx('TabControl', {
	events: 'activate',
	iface: 'addTab(title, options);getSelectedTabIndex();removeTab(tabIndex);on(event, callback);setActive(tabIndex)',
	
	lib: 'ui',
init: function(elt) {

		var events = new EventEmitter2()

		var ul = $('<ul>').prependTo(elt)

		elt.children('div').each(function() {
			var title = $(this).attr('title')
			var id = $(this).uniqueId().attr('id')
			var li = $('<li>').append($('<a>', {href: '#' + id}).text(title)).appendTo(ul)
			if ($(this).attr('data-removable') != undefined) {
				li.append($('<span>', {class: 'ui-icon ui-icon-close'}))
			}
		})
		
		elt.tabs({
			activate: function() {
				//console.log('activate', getSelectedTabIndex())
				events.emit('activate')
			}
		})
		.on('click', 'span.ui-icon-close', function() {
			var panelId = $(this).closest('li').remove().attr('aria-controls')
			//console.log('panelId', panelId)
			$('#' + panelId).remove()
			elt.tabs('refresh')
		})

		this.addTab = function(title, options) {
			options = options || {}
			var tab = $('<div>').html(options.template).appendTo(elt)
			var id = tab.uniqueId().attr('id')
			var li = $('<li>').append($('<a>', {href: '#' + id}).text(title)).appendTo(ul)
			if (options.removable === true) {
				li.append($('<span>', {class: 'ui-icon ui-icon-close'}))
			}			

			elt.tabs('refresh')
		}

		this.getSelectedTabIndex = function() {
			var index = ul.children('li.ui-state-active').index()
			return index
		}

		this.removeTab = function(tabIndex) {
			var li = ul.children('li').eq(tabIndex)
			var panelId = li.remove().attr('aria-controls')
			$('#' + panelId).remove()
			elt.tabs('refresh')
		}

		this.on = events.on.bind(events)

		this.setActive = function(tabIndex) {
			elt.tabs('option', 'active', tabIndex)
		}

	}
});





$$.registerControlEx('ToolbarControl', {
	
	lib: 'ui',
init: function(elt) {

		elt.controlgroup()

	}
});




$$.registerControlEx('TreeControl', {

	deps: ['TreeCtrlService'], 
	options: {
		checkbox: false
	},
	events: 'activate,contextMenuAction',
	iface: 'getActiveNode();getRootNode();on(event, callback);moveUp(node);moveDown(node)',

	
	lib: 'ui',
init: function(elt, options) {

		var events = new EventEmitter2()


		options.activate = function() {
			events.emit('activate')
		}

		if (!Array.isArray(options.extensions)) {
			options.extensions = []
		}

		if (options.contextMenu) {
			if (options.extensions.indexOf('contextMenu') < 0) {
				options.extensions.push('contextMenu')
			}

			options.contextMenu.actions = function(node, action) {
					//console.log('[TreeControl] contextMenuAction', node, action)
					events.emit('contextMenuAction', getActiveNode(), action)
				}

		}

		elt.fancytree(options)

		function getActiveNode() {
			return elt.fancytree('getActiveNode')
		}

		this.getActiveNode = getActiveNode

		this.getRootNode = function() {
			return elt.fancytree('getRootNode')
		}

		this.moveDown = function(node) {
			var next = node.getNextSibling()
			if (next != null) {
				node.moveTo(next, 'after')
			}
		}

		this.moveUp = function(node) {
			var prev = node.getPrevSibling()
			if (prev != null) {
				node.moveTo(prev, 'before')
			}
		}

		this.on = events.on.bind(events)

	}
});





//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjY29yZGlvbi5qcyIsImRhdGVwaWNrZXIuanMiLCJkZXBzLmpzIiwiZGlhbG9nLmpzIiwic2xpZGVyLmpzIiwic3Bpbm5lci5qcyIsInRhYi5qcyIsInRvb2xiYXIuanMiLCJ0cmVlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoidWkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ0FjY29yZGlvbkNvbnRyb2wnLCB7XHJcblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHRcdGVsdC5jaGlsZHJlbignZGl2JykuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIGRpdiA9ICQodGhpcylcclxuXHRcdFx0dmFyIHRpdGxlID0gZGl2LmF0dHIoJ3RpdGxlJylcclxuXHRcdFx0ZGl2LmJlZm9yZSgkKCc8aDM+JykudGV4dCh0aXRsZSkpXHJcblx0XHR9KVxyXG5cdFx0ZWx0LmFjY29yZGlvbihvcHRpb25zKVxyXG5cdH1cclxufSk7XHJcblxyXG5cclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkLmRhdGVwaWNrZXIuc2V0RGVmYXVsdHMoJC5kYXRlcGlja2VyLnJlZ2lvbmFsWydmciddKVxyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ0RhdGVQaWNrZXJDb250cm9sJywge1xyXG5cdFx0b3B0aW9uczoge1xyXG5cdFx0XHRzaG93QnV0dG9uUGFuZWw6IGZhbHNlXHJcblx0XHR9LFxyXG5cdFx0ZXZlbnRzOiAnY2hhbmdlJyxcclxuXHRcdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcclxuXHJcblx0XHRcdGVsdC5kYXRlcGlja2VyKG9wdGlvbnMpXHJcblxyXG5cdFx0XHR2YXIgdmFsdWUgPSBlbHQudmFsKClcclxuXHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdHZhciBtcyA9IERhdGUucGFyc2UodmFsdWUpXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW0RhdGVQaWNrZXJDb250cm9sXSBtcycsIG1zKVxyXG5cdFx0XHRcdHZhciBkYXRlID0gbmV3IERhdGUobXMpXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW0RhdGVQaWNrZXJDb250cm9sXSBkYXRlJywgZGF0ZSlcclxuXHRcdFx0XHRlbHQuZGF0ZXBpY2tlcignc2V0RGF0ZScsIGRhdGUpXHJcblx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRzZXRWYWx1ZTogZnVuY3Rpb24oZGF0ZSkge1xyXG5cdFx0XHRcdFx0ZWx0LmRhdGVwaWNrZXIoJ3NldERhdGUnLCBkYXRlKVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0Z2V0VmFsdWU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGVsdC5kYXRlcGlja2VyKCdnZXREYXRlJylcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0fSlcclxufSkoKTtcclxuIiwiKGZ1bmN0aW9uKCkge1x0XHJcblxyXG5cdCQkLmxvYWRTdHlsZSgnL2NvbnRyb2xzL3VpLmNzcycpXHJcbn0pKCk7IiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0RpYWxvZ0NvbnRyb2wnLCB7XHJcblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHRcdG9wdGlvbnMuYXV0b09wZW4gPSBmYWxzZVxyXG5cdFx0b3B0aW9ucy5hcHBlbmRUbyA9IGVsdC5wYXJlbnQoKVxyXG5cdFx0b3B0aW9ucy5tb2RhbCA9IHRydWVcclxuXHJcblx0XHR0aGlzLm9wZW4gPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0ZWx0LmRpYWxvZygnb3BlbicpXHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5jbG9zZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRlbHQuZGlhbG9nKCdjbG9zZScpXHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5zZXRPcHRpb24gPSBmdW5jdGlvbihvcHRpb25OYW1lLCB2YWx1ZSkge1xyXG5cdFx0XHRlbHQuZGlhbG9nKCdvcHRpb24nLCBvcHRpb25OYW1lLCB2YWx1ZSlcclxuXHRcdH1cclxuXHJcblxyXG5cdFx0Zm9yKHZhciBidG4gaW4gb3B0aW9ucy5idXR0b25zKSB7XHJcblx0XHRcdHZhciBmbiA9IG9wdGlvbnMuYnV0dG9uc1tidG5dIFxyXG5cdFx0XHRpZiAodHlwZW9mIGZuID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRvcHRpb25zLmJ1dHRvbnNbYnRuXSA9IG9wdGlvbnMuYnV0dG9uc1tidG5dLmJpbmQoaWZhY2UpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRlbHQuZGlhbG9nKG9wdGlvbnMpXHJcblxyXG5cdH1cclxufSk7XHJcblxyXG5cclxuIiwiXHJcblxyXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnU2xpZGVyQ29udHJvbCcsIHtcclxuXHJcblx0b3B0aW9uczoge1xyXG5cdFx0bWF4OiAxMDAsXHJcblx0XHRtaW46IDAsIFxyXG5cdFx0b3JpZW50YXRpb246ICdob3Jpem9udGFsJyxcclxuXHRcdHJhbmdlOiBmYWxzZVx0XHRcdFxyXG5cdH0sXHJcblx0ZXZlbnRzOiAnY2hhbmdlLGlucHV0JyxcclxuXHJcblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHJcblx0Ly9jb25zb2xlLmxvZygnW1NsaWRlckNvbnRyb2xdIHZhbHVlJywgZWx0LnZhbCgpKVxyXG5cdFx0dmFyIHZhbHVlID0gZWx0LnZhbCgpXHJcblxyXG5cdFx0aWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcblx0XHRcdG9wdGlvbnMudmFsdWVzID0gdmFsdWVcclxuXHRcdFx0b3B0aW9ucy5yYW5nZSA9IHRydWVcclxuXHRcdH1cclxuXHJcblx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdG9wdGlvbnMudmFsdWUgPSB2YWx1ZVxyXG5cdFx0fVxyXG5cclxuXHRcdC8vY29uc29sZS5sb2coJ1tTbGlkZXJDb250cm9sXSBvcHRpb25zJywgb3B0aW9ucylcclxuXHJcblx0XHRvcHRpb25zLmNoYW5nZSA9IGZ1bmN0aW9uKGV2LCB1aSkge1xyXG5cdFx0XHRlbHQudHJpZ2dlcignY2hhbmdlJywgW3VpLnZhbHVlcyB8fCB1aS52YWx1ZV0pXHJcblx0XHR9XHJcblxyXG5cdFx0b3B0aW9ucy5zbGlkZSA9IGZ1bmN0aW9uKGV2LCB1aSkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbU2xpZGVyQ29udHJvbF0gc2xpZGUnLCB1aS52YWx1ZXMgfHwgdWkudmFsdWUpXHJcblx0XHRcdGVsdC50cmlnZ2VyKCdpbnB1dCcsIFt1aS52YWx1ZXMgfHwgdWkudmFsdWVdKVxyXG5cdFx0fVxyXG5cclxuXHRcdGVsdC5zbGlkZXIob3B0aW9ucylcclxuXHJcblx0XHR0aGlzLmdldFZhbHVlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ1tTbGlkZXJDb250cm9sXSBnZXRWYWx1ZScpXHJcblx0XHRcdHJldHVybiBlbHQuc2xpZGVyKChvcHRpb25zLnJhbmdlKSA/ICd2YWx1ZXMnIDogJ3ZhbHVlJykgXHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5zZXRWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ1tTbGlkZXJDb250cm9sXSBzZXRWYWx1ZScpXHJcblx0XHRcdGVsdC5zbGlkZXIoKG9wdGlvbnMucmFuZ2UpID8gJ3ZhbHVlcycgOiAndmFsdWUnLCB2YWx1ZSlcclxuXHRcdH1cclxuXHJcblxyXG5cdH1cclxuXHJcbn0pO1xyXG5cclxuXHJcbiIsIlxyXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnU3Bpbm5lckNvbnRyb2wnLCB7XHJcblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xyXG5cclxuXHRcdGVsdC5zcGlubmVyKHtcclxuXHRcdFx0c3RvcDogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1tTcGlubmVyQ29udHJvbF0gY2hhbmdlJylcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHR9LFxyXG5cdGV2ZW50czogJ3NwaW5zdG9wJ1xyXG59KTtcclxuXHJcblxyXG4iLCJcclxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ1RhYkNvbnRyb2wnLCB7XHJcblx0ZXZlbnRzOiAnYWN0aXZhdGUnLFxyXG5cdGlmYWNlOiAnYWRkVGFiKHRpdGxlLCBvcHRpb25zKTtnZXRTZWxlY3RlZFRhYkluZGV4KCk7cmVtb3ZlVGFiKHRhYkluZGV4KTtvbihldmVudCwgY2FsbGJhY2spO3NldEFjdGl2ZSh0YWJJbmRleCknLFxyXG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQpIHtcclxuXHJcblx0XHR2YXIgZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxyXG5cclxuXHRcdHZhciB1bCA9ICQoJzx1bD4nKS5wcmVwZW5kVG8oZWx0KVxyXG5cclxuXHRcdGVsdC5jaGlsZHJlbignZGl2JykuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIHRpdGxlID0gJCh0aGlzKS5hdHRyKCd0aXRsZScpXHJcblx0XHRcdHZhciBpZCA9ICQodGhpcykudW5pcXVlSWQoKS5hdHRyKCdpZCcpXHJcblx0XHRcdHZhciBsaSA9ICQoJzxsaT4nKS5hcHBlbmQoJCgnPGE+Jywge2hyZWY6ICcjJyArIGlkfSkudGV4dCh0aXRsZSkpLmFwcGVuZFRvKHVsKVxyXG5cdFx0XHRpZiAoJCh0aGlzKS5hdHRyKCdkYXRhLXJlbW92YWJsZScpICE9IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdGxpLmFwcGVuZCgkKCc8c3Bhbj4nLCB7Y2xhc3M6ICd1aS1pY29uIHVpLWljb24tY2xvc2UnfSkpXHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblx0XHRcclxuXHRcdGVsdC50YWJzKHtcclxuXHRcdFx0YWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2FjdGl2YXRlJywgZ2V0U2VsZWN0ZWRUYWJJbmRleCgpKVxyXG5cdFx0XHRcdGV2ZW50cy5lbWl0KCdhY3RpdmF0ZScpXHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblx0XHQub24oJ2NsaWNrJywgJ3NwYW4udWktaWNvbi1jbG9zZScsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgcGFuZWxJZCA9ICQodGhpcykuY2xvc2VzdCgnbGknKS5yZW1vdmUoKS5hdHRyKCdhcmlhLWNvbnRyb2xzJylcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygncGFuZWxJZCcsIHBhbmVsSWQpXHJcblx0XHRcdCQoJyMnICsgcGFuZWxJZCkucmVtb3ZlKClcclxuXHRcdFx0ZWx0LnRhYnMoJ3JlZnJlc2gnKVxyXG5cdFx0fSlcclxuXHJcblx0XHR0aGlzLmFkZFRhYiA9IGZ1bmN0aW9uKHRpdGxlLCBvcHRpb25zKSB7XHJcblx0XHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcblx0XHRcdHZhciB0YWIgPSAkKCc8ZGl2PicpLmh0bWwob3B0aW9ucy50ZW1wbGF0ZSkuYXBwZW5kVG8oZWx0KVxyXG5cdFx0XHR2YXIgaWQgPSB0YWIudW5pcXVlSWQoKS5hdHRyKCdpZCcpXHJcblx0XHRcdHZhciBsaSA9ICQoJzxsaT4nKS5hcHBlbmQoJCgnPGE+Jywge2hyZWY6ICcjJyArIGlkfSkudGV4dCh0aXRsZSkpLmFwcGVuZFRvKHVsKVxyXG5cdFx0XHRpZiAob3B0aW9ucy5yZW1vdmFibGUgPT09IHRydWUpIHtcclxuXHRcdFx0XHRsaS5hcHBlbmQoJCgnPHNwYW4+Jywge2NsYXNzOiAndWktaWNvbiB1aS1pY29uLWNsb3NlJ30pKVxyXG5cdFx0XHR9XHRcdFx0XHJcblxyXG5cdFx0XHRlbHQudGFicygncmVmcmVzaCcpXHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5nZXRTZWxlY3RlZFRhYkluZGV4ID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBpbmRleCA9IHVsLmNoaWxkcmVuKCdsaS51aS1zdGF0ZS1hY3RpdmUnKS5pbmRleCgpXHJcblx0XHRcdHJldHVybiBpbmRleFxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMucmVtb3ZlVGFiID0gZnVuY3Rpb24odGFiSW5kZXgpIHtcclxuXHRcdFx0dmFyIGxpID0gdWwuY2hpbGRyZW4oJ2xpJykuZXEodGFiSW5kZXgpXHJcblx0XHRcdHZhciBwYW5lbElkID0gbGkucmVtb3ZlKCkuYXR0cignYXJpYS1jb250cm9scycpXHJcblx0XHRcdCQoJyMnICsgcGFuZWxJZCkucmVtb3ZlKClcclxuXHRcdFx0ZWx0LnRhYnMoJ3JlZnJlc2gnKVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMub24gPSBldmVudHMub24uYmluZChldmVudHMpXHJcblxyXG5cdFx0dGhpcy5zZXRBY3RpdmUgPSBmdW5jdGlvbih0YWJJbmRleCkge1xyXG5cdFx0XHRlbHQudGFicygnb3B0aW9uJywgJ2FjdGl2ZScsIHRhYkluZGV4KVxyXG5cdFx0fVxyXG5cclxuXHR9XHJcbn0pO1xyXG5cclxuXHJcblxyXG4iLCJcclxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ1Rvb2xiYXJDb250cm9sJywge1xyXG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQpIHtcclxuXHJcblx0XHRlbHQuY29udHJvbGdyb3VwKClcclxuXHJcblx0fVxyXG59KTtcclxuXHJcblxyXG5cclxuIiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ1RyZWVDb250cm9sJywge1xyXG5cclxuXHRkZXBzOiBbJ1RyZWVDdHJsU2VydmljZSddLCBcclxuXHRvcHRpb25zOiB7XHJcblx0XHRjaGVja2JveDogZmFsc2VcclxuXHR9LFxyXG5cdGV2ZW50czogJ2FjdGl2YXRlLGNvbnRleHRNZW51QWN0aW9uJyxcclxuXHRpZmFjZTogJ2dldEFjdGl2ZU5vZGUoKTtnZXRSb290Tm9kZSgpO29uKGV2ZW50LCBjYWxsYmFjayk7bW92ZVVwKG5vZGUpO21vdmVEb3duKG5vZGUpJyxcclxuXHJcblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xyXG5cclxuXHRcdHZhciBldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyMigpXHJcblxyXG5cclxuXHRcdG9wdGlvbnMuYWN0aXZhdGUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0ZXZlbnRzLmVtaXQoJ2FjdGl2YXRlJylcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIUFycmF5LmlzQXJyYXkob3B0aW9ucy5leHRlbnNpb25zKSkge1xyXG5cdFx0XHRvcHRpb25zLmV4dGVuc2lvbnMgPSBbXVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChvcHRpb25zLmNvbnRleHRNZW51KSB7XHJcblx0XHRcdGlmIChvcHRpb25zLmV4dGVuc2lvbnMuaW5kZXhPZignY29udGV4dE1lbnUnKSA8IDApIHtcclxuXHRcdFx0XHRvcHRpb25zLmV4dGVuc2lvbnMucHVzaCgnY29udGV4dE1lbnUnKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRvcHRpb25zLmNvbnRleHRNZW51LmFjdGlvbnMgPSBmdW5jdGlvbihub2RlLCBhY3Rpb24pIHtcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ1tUcmVlQ29udHJvbF0gY29udGV4dE1lbnVBY3Rpb24nLCBub2RlLCBhY3Rpb24pXHJcblx0XHRcdFx0XHRldmVudHMuZW1pdCgnY29udGV4dE1lbnVBY3Rpb24nLCBnZXRBY3RpdmVOb2RlKCksIGFjdGlvbilcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0fVxyXG5cclxuXHRcdGVsdC5mYW5jeXRyZWUob3B0aW9ucylcclxuXHJcblx0XHRmdW5jdGlvbiBnZXRBY3RpdmVOb2RlKCkge1xyXG5cdFx0XHRyZXR1cm4gZWx0LmZhbmN5dHJlZSgnZ2V0QWN0aXZlTm9kZScpXHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5nZXRBY3RpdmVOb2RlID0gZ2V0QWN0aXZlTm9kZVxyXG5cclxuXHRcdHRoaXMuZ2V0Um9vdE5vZGUgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0cmV0dXJuIGVsdC5mYW5jeXRyZWUoJ2dldFJvb3ROb2RlJylcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLm1vdmVEb3duID0gZnVuY3Rpb24obm9kZSkge1xyXG5cdFx0XHR2YXIgbmV4dCA9IG5vZGUuZ2V0TmV4dFNpYmxpbmcoKVxyXG5cdFx0XHRpZiAobmV4dCAhPSBudWxsKSB7XHJcblx0XHRcdFx0bm9kZS5tb3ZlVG8obmV4dCwgJ2FmdGVyJylcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMubW92ZVVwID0gZnVuY3Rpb24obm9kZSkge1xyXG5cdFx0XHR2YXIgcHJldiA9IG5vZGUuZ2V0UHJldlNpYmxpbmcoKVxyXG5cdFx0XHRpZiAocHJldiAhPSBudWxsKSB7XHJcblx0XHRcdFx0bm9kZS5tb3ZlVG8ocHJldiwgJ2JlZm9yZScpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLm9uID0gZXZlbnRzLm9uLmJpbmQoZXZlbnRzKVxyXG5cclxuXHR9XHJcbn0pO1xyXG5cclxuXHJcblxyXG5cclxuIl19
