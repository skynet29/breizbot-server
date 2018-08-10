
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
			var li = $('<li>')
				.attr('title', title)
				.append($('<a>', {href: '#' + id}).text(title))
				.appendTo(ul)
			if ($(this).attr('data-removable') != undefined) {
				li.append($('<span>', {class: 'ui-icon ui-icon-close'}))
			}
		})

		elt.css({display: 'flex', 'flex-direction': 'column'})
		
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

		function getCount() {
			return ul.children('li').length
		}

		this.addTab = function(title, options) {
			console.log('addTab', getCount())
			var idx = getCount()
			options = options || {}
			var tab = $('<div>')
				.append(options.template)
				.css('flex', '1')
				.attr('title', title)
				.appendTo(elt)
			var id = tab.uniqueId().attr('id')
			var li = $('<li>')
				.attr('title', title)
				.append($('<a>', {href: '#' + id}).text(title))
				.appendTo(ul)
			if (options.removable === true) {
				li.append($('<span>', {class: 'ui-icon ui-icon-close'}))
			}			

			elt.tabs('refresh')
			return idx
		}

		this.getTabCount = function() {
			return ul.children(`li`).length
		}

		this.getTabPanelByTitle = function (title) {

			return elt.children(`div[title=${title}]`)

		}

		this.getTabIndexByTitle = function (title) {

			return ul.children(`li[title=${title}]`).index()

		}

		this.getTitleByIndex = function(index) {
			return ul.children('li').eq(index).attr('title')
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

		this.getActive = function(tabIndex) {
			return elt.tabs('option', 'active')
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





//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjY29yZGlvbi5qcyIsImRhdGVwaWNrZXIuanMiLCJkZXBzLmpzIiwiZGlhbG9nLmpzIiwic2xpZGVyLmpzIiwic3Bpbm5lci5qcyIsInRhYi5qcyIsInRvb2xiYXIuanMiLCJ0cmVlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJ1aS5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ0FjY29yZGlvbkNvbnRyb2wnLCB7XG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcblxuXHRcdGVsdC5jaGlsZHJlbignZGl2JykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdHZhciBkaXYgPSAkKHRoaXMpXG5cdFx0XHR2YXIgdGl0bGUgPSBkaXYuYXR0cigndGl0bGUnKVxuXHRcdFx0ZGl2LmJlZm9yZSgkKCc8aDM+JykudGV4dCh0aXRsZSkpXG5cdFx0fSlcblx0XHRlbHQuYWNjb3JkaW9uKG9wdGlvbnMpXG5cdH1cbn0pO1xuXG5cbiIsIihmdW5jdGlvbigpIHtcblxuXHQkLmRhdGVwaWNrZXIuc2V0RGVmYXVsdHMoJC5kYXRlcGlja2VyLnJlZ2lvbmFsWydmciddKVxuXG5cblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ0RhdGVQaWNrZXJDb250cm9sJywge1xuXHRcdG9wdGlvbnM6IHtcblx0XHRcdHNob3dCdXR0b25QYW5lbDogZmFsc2Vcblx0XHR9LFxuXHRcdGV2ZW50czogJ2NoYW5nZScsXG5cdFx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xuXG5cdFx0XHRlbHQuZGF0ZXBpY2tlcihvcHRpb25zKVxuXG5cdFx0XHR2YXIgdmFsdWUgPSBlbHQudmFsKClcblx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0dmFyIG1zID0gRGF0ZS5wYXJzZSh2YWx1ZSlcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW0RhdGVQaWNrZXJDb250cm9sXSBtcycsIG1zKVxuXHRcdFx0XHR2YXIgZGF0ZSA9IG5ldyBEYXRlKG1zKVxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbRGF0ZVBpY2tlckNvbnRyb2xdIGRhdGUnLCBkYXRlKVxuXHRcdFx0XHRlbHQuZGF0ZXBpY2tlcignc2V0RGF0ZScsIGRhdGUpXG5cdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c2V0VmFsdWU6IGZ1bmN0aW9uKGRhdGUpIHtcblx0XHRcdFx0XHRlbHQuZGF0ZXBpY2tlcignc2V0RGF0ZScsIGRhdGUpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGdldFZhbHVlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gZWx0LmRhdGVwaWNrZXIoJ2dldERhdGUnKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH0pXG59KSgpO1xuIiwiKGZ1bmN0aW9uKCkge1x0XG5cblx0JCQubG9hZFN0eWxlKCcvY29udHJvbHMvdWkuY3NzJylcbn0pKCk7IiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0RpYWxvZ0NvbnRyb2wnLCB7XG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcblxuXHRcdG9wdGlvbnMuYXV0b09wZW4gPSBmYWxzZVxuXHRcdG9wdGlvbnMuYXBwZW5kVG8gPSBlbHQucGFyZW50KClcblx0XHRvcHRpb25zLm1vZGFsID0gdHJ1ZVxuXG5cdFx0dGhpcy5vcGVuID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRlbHQuZGlhbG9nKCdvcGVuJylcblx0XHR9XG5cblx0XHR0aGlzLmNsb3NlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRlbHQuZGlhbG9nKCdjbG9zZScpXG5cdFx0fVxuXG5cdFx0dGhpcy5zZXRPcHRpb24gPSBmdW5jdGlvbihvcHRpb25OYW1lLCB2YWx1ZSkge1xuXHRcdFx0ZWx0LmRpYWxvZygnb3B0aW9uJywgb3B0aW9uTmFtZSwgdmFsdWUpXG5cdFx0fVxuXG5cblx0XHRmb3IodmFyIGJ0biBpbiBvcHRpb25zLmJ1dHRvbnMpIHtcblx0XHRcdHZhciBmbiA9IG9wdGlvbnMuYnV0dG9uc1tidG5dIFxuXHRcdFx0aWYgKHR5cGVvZiBmbiA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdG9wdGlvbnMuYnV0dG9uc1tidG5dID0gb3B0aW9ucy5idXR0b25zW2J0bl0uYmluZChpZmFjZSlcblx0XHRcdH1cblx0XHR9XG5cblx0XHRlbHQuZGlhbG9nKG9wdGlvbnMpXG5cblx0fVxufSk7XG5cblxuIiwiXG5cbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdTbGlkZXJDb250cm9sJywge1xuXG5cdG9wdGlvbnM6IHtcblx0XHRtYXg6IDEwMCxcblx0XHRtaW46IDAsIFxuXHRcdG9yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcsXG5cdFx0cmFuZ2U6IGZhbHNlXHRcdFx0XG5cdH0sXG5cdGV2ZW50czogJ2NoYW5nZSxpbnB1dCcsXG5cblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xuXG5cblx0Ly9jb25zb2xlLmxvZygnW1NsaWRlckNvbnRyb2xdIHZhbHVlJywgZWx0LnZhbCgpKVxuXHRcdHZhciB2YWx1ZSA9IGVsdC52YWwoKVxuXG5cdFx0aWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG5cdFx0XHRvcHRpb25zLnZhbHVlcyA9IHZhbHVlXG5cdFx0XHRvcHRpb25zLnJhbmdlID0gdHJ1ZVxuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcblx0XHRcdG9wdGlvbnMudmFsdWUgPSB2YWx1ZVxuXHRcdH1cblxuXHRcdC8vY29uc29sZS5sb2coJ1tTbGlkZXJDb250cm9sXSBvcHRpb25zJywgb3B0aW9ucylcblxuXHRcdG9wdGlvbnMuY2hhbmdlID0gZnVuY3Rpb24oZXYsIHVpKSB7XG5cdFx0XHRlbHQudHJpZ2dlcignY2hhbmdlJywgW3VpLnZhbHVlcyB8fCB1aS52YWx1ZV0pXG5cdFx0fVxuXG5cdFx0b3B0aW9ucy5zbGlkZSA9IGZ1bmN0aW9uKGV2LCB1aSkge1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnW1NsaWRlckNvbnRyb2xdIHNsaWRlJywgdWkudmFsdWVzIHx8IHVpLnZhbHVlKVxuXHRcdFx0ZWx0LnRyaWdnZXIoJ2lucHV0JywgW3VpLnZhbHVlcyB8fCB1aS52YWx1ZV0pXG5cdFx0fVxuXG5cdFx0ZWx0LnNsaWRlcihvcHRpb25zKVxuXG5cdFx0dGhpcy5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnW1NsaWRlckNvbnRyb2xdIGdldFZhbHVlJylcblx0XHRcdHJldHVybiBlbHQuc2xpZGVyKChvcHRpb25zLnJhbmdlKSA/ICd2YWx1ZXMnIDogJ3ZhbHVlJykgXG5cdFx0fVxuXG5cdFx0dGhpcy5zZXRWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbU2xpZGVyQ29udHJvbF0gc2V0VmFsdWUnKVxuXHRcdFx0ZWx0LnNsaWRlcigob3B0aW9ucy5yYW5nZSkgPyAndmFsdWVzJyA6ICd2YWx1ZScsIHZhbHVlKVxuXHRcdH1cblxuXG5cdH1cblxufSk7XG5cblxuIiwiXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnU3Bpbm5lckNvbnRyb2wnLCB7XG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQpIHtcblxuXHRcdGVsdC5zcGlubmVyKHtcblx0XHRcdHN0b3A6IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW1NwaW5uZXJDb250cm9sXSBjaGFuZ2UnKVxuXHRcdFx0fVxuXHRcdH0pXG5cdH0sXG5cdGV2ZW50czogJ3NwaW5zdG9wJ1xufSk7XG5cblxuIiwiXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnVGFiQ29udHJvbCcsIHtcblx0ZXZlbnRzOiAnYWN0aXZhdGUnLFxuXHRpZmFjZTogJ2FkZFRhYih0aXRsZSwgb3B0aW9ucyk7Z2V0U2VsZWN0ZWRUYWJJbmRleCgpO3JlbW92ZVRhYih0YWJJbmRleCk7b24oZXZlbnQsIGNhbGxiYWNrKTtzZXRBY3RpdmUodGFiSW5kZXgpJyxcblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xuXG5cdFx0dmFyIGV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIyKClcblxuXHRcdHZhciB1bCA9ICQoJzx1bD4nKS5wcmVwZW5kVG8oZWx0KVxuXG5cdFx0ZWx0LmNoaWxkcmVuKCdkaXYnKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHRpdGxlID0gJCh0aGlzKS5hdHRyKCd0aXRsZScpXG5cdFx0XHR2YXIgaWQgPSAkKHRoaXMpLnVuaXF1ZUlkKCkuYXR0cignaWQnKVxuXHRcdFx0dmFyIGxpID0gJCgnPGxpPicpXG5cdFx0XHRcdC5hdHRyKCd0aXRsZScsIHRpdGxlKVxuXHRcdFx0XHQuYXBwZW5kKCQoJzxhPicsIHtocmVmOiAnIycgKyBpZH0pLnRleHQodGl0bGUpKVxuXHRcdFx0XHQuYXBwZW5kVG8odWwpXG5cdFx0XHRpZiAoJCh0aGlzKS5hdHRyKCdkYXRhLXJlbW92YWJsZScpICE9IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRsaS5hcHBlbmQoJCgnPHNwYW4+Jywge2NsYXNzOiAndWktaWNvbiB1aS1pY29uLWNsb3NlJ30pKVxuXHRcdFx0fVxuXHRcdH0pXG5cblx0XHRlbHQuY3NzKHtkaXNwbGF5OiAnZmxleCcsICdmbGV4LWRpcmVjdGlvbic6ICdjb2x1bW4nfSlcblx0XHRcblx0XHRlbHQudGFicyh7XG5cdFx0XHRhY3RpdmF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2FjdGl2YXRlJywgZ2V0U2VsZWN0ZWRUYWJJbmRleCgpKVxuXHRcdFx0XHRldmVudHMuZW1pdCgnYWN0aXZhdGUnKVxuXHRcdFx0fVxuXHRcdH0pXG5cdFx0Lm9uKCdjbGljaycsICdzcGFuLnVpLWljb24tY2xvc2UnLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBwYW5lbElkID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpLnJlbW92ZSgpLmF0dHIoJ2FyaWEtY29udHJvbHMnKVxuXHRcdFx0Ly9jb25zb2xlLmxvZygncGFuZWxJZCcsIHBhbmVsSWQpXG5cdFx0XHQkKCcjJyArIHBhbmVsSWQpLnJlbW92ZSgpXG5cdFx0XHRlbHQudGFicygncmVmcmVzaCcpXG5cdFx0fSlcblxuXHRcdGZ1bmN0aW9uIGdldENvdW50KCkge1xuXHRcdFx0cmV0dXJuIHVsLmNoaWxkcmVuKCdsaScpLmxlbmd0aFxuXHRcdH1cblxuXHRcdHRoaXMuYWRkVGFiID0gZnVuY3Rpb24odGl0bGUsIG9wdGlvbnMpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdhZGRUYWInLCBnZXRDb3VudCgpKVxuXHRcdFx0dmFyIGlkeCA9IGdldENvdW50KClcblx0XHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG5cdFx0XHR2YXIgdGFiID0gJCgnPGRpdj4nKVxuXHRcdFx0XHQuYXBwZW5kKG9wdGlvbnMudGVtcGxhdGUpXG5cdFx0XHRcdC5jc3MoJ2ZsZXgnLCAnMScpXG5cdFx0XHRcdC5hdHRyKCd0aXRsZScsIHRpdGxlKVxuXHRcdFx0XHQuYXBwZW5kVG8oZWx0KVxuXHRcdFx0dmFyIGlkID0gdGFiLnVuaXF1ZUlkKCkuYXR0cignaWQnKVxuXHRcdFx0dmFyIGxpID0gJCgnPGxpPicpXG5cdFx0XHRcdC5hdHRyKCd0aXRsZScsIHRpdGxlKVxuXHRcdFx0XHQuYXBwZW5kKCQoJzxhPicsIHtocmVmOiAnIycgKyBpZH0pLnRleHQodGl0bGUpKVxuXHRcdFx0XHQuYXBwZW5kVG8odWwpXG5cdFx0XHRpZiAob3B0aW9ucy5yZW1vdmFibGUgPT09IHRydWUpIHtcblx0XHRcdFx0bGkuYXBwZW5kKCQoJzxzcGFuPicsIHtjbGFzczogJ3VpLWljb24gdWktaWNvbi1jbG9zZSd9KSlcblx0XHRcdH1cdFx0XHRcblxuXHRcdFx0ZWx0LnRhYnMoJ3JlZnJlc2gnKVxuXHRcdFx0cmV0dXJuIGlkeFxuXHRcdH1cblxuXHRcdHRoaXMuZ2V0VGFiQ291bnQgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB1bC5jaGlsZHJlbihgbGlgKS5sZW5ndGhcblx0XHR9XG5cblx0XHR0aGlzLmdldFRhYlBhbmVsQnlUaXRsZSA9IGZ1bmN0aW9uICh0aXRsZSkge1xuXG5cdFx0XHRyZXR1cm4gZWx0LmNoaWxkcmVuKGBkaXZbdGl0bGU9JHt0aXRsZX1dYClcblxuXHRcdH1cblxuXHRcdHRoaXMuZ2V0VGFiSW5kZXhCeVRpdGxlID0gZnVuY3Rpb24gKHRpdGxlKSB7XG5cblx0XHRcdHJldHVybiB1bC5jaGlsZHJlbihgbGlbdGl0bGU9JHt0aXRsZX1dYCkuaW5kZXgoKVxuXG5cdFx0fVxuXG5cdFx0dGhpcy5nZXRUaXRsZUJ5SW5kZXggPSBmdW5jdGlvbihpbmRleCkge1xuXHRcdFx0cmV0dXJuIHVsLmNoaWxkcmVuKCdsaScpLmVxKGluZGV4KS5hdHRyKCd0aXRsZScpXG5cdFx0fVxuXG5cdFx0dGhpcy5nZXRTZWxlY3RlZFRhYkluZGV4ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgaW5kZXggPSB1bC5jaGlsZHJlbignbGkudWktc3RhdGUtYWN0aXZlJykuaW5kZXgoKVxuXHRcdFx0cmV0dXJuIGluZGV4XG5cdFx0fVxuXG5cdFx0dGhpcy5yZW1vdmVUYWIgPSBmdW5jdGlvbih0YWJJbmRleCkge1xuXHRcdFx0dmFyIGxpID0gdWwuY2hpbGRyZW4oJ2xpJykuZXEodGFiSW5kZXgpXG5cdFx0XHR2YXIgcGFuZWxJZCA9IGxpLnJlbW92ZSgpLmF0dHIoJ2FyaWEtY29udHJvbHMnKVxuXHRcdFx0JCgnIycgKyBwYW5lbElkKS5yZW1vdmUoKVxuXHRcdFx0ZWx0LnRhYnMoJ3JlZnJlc2gnKVxuXHRcdH1cblxuXHRcdHRoaXMub24gPSBldmVudHMub24uYmluZChldmVudHMpXG5cblx0XHR0aGlzLnNldEFjdGl2ZSA9IGZ1bmN0aW9uKHRhYkluZGV4KSB7XG5cdFx0XHRlbHQudGFicygnb3B0aW9uJywgJ2FjdGl2ZScsIHRhYkluZGV4KVxuXHRcdH1cblxuXHRcdHRoaXMuZ2V0QWN0aXZlID0gZnVuY3Rpb24odGFiSW5kZXgpIHtcblx0XHRcdHJldHVybiBlbHQudGFicygnb3B0aW9uJywgJ2FjdGl2ZScpXG5cdFx0fVx0XHRcblxuXHR9XG59KTtcblxuXG5cbiIsIlxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ1Rvb2xiYXJDb250cm9sJywge1xuXHRcblx0bGliOiAndWknLFxuaW5pdDogZnVuY3Rpb24oZWx0KSB7XG5cblx0XHRlbHQuY29udHJvbGdyb3VwKClcblxuXHR9XG59KTtcblxuXG5cbiIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdUcmVlQ29udHJvbCcsIHtcblxuXHRkZXBzOiBbJ1RyZWVDdHJsU2VydmljZSddLCBcblx0b3B0aW9uczoge1xuXHRcdGNoZWNrYm94OiBmYWxzZVxuXHR9LFxuXHRldmVudHM6ICdhY3RpdmF0ZSxjb250ZXh0TWVudUFjdGlvbicsXG5cdGlmYWNlOiAnZ2V0QWN0aXZlTm9kZSgpO2dldFJvb3ROb2RlKCk7b24oZXZlbnQsIGNhbGxiYWNrKTttb3ZlVXAobm9kZSk7bW92ZURvd24obm9kZSknLFxuXG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcblxuXHRcdHZhciBldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyMigpXG5cblxuXHRcdG9wdGlvbnMuYWN0aXZhdGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdGV2ZW50cy5lbWl0KCdhY3RpdmF0ZScpXG5cdFx0fVxuXG5cdFx0aWYgKCFBcnJheS5pc0FycmF5KG9wdGlvbnMuZXh0ZW5zaW9ucykpIHtcblx0XHRcdG9wdGlvbnMuZXh0ZW5zaW9ucyA9IFtdXG5cdFx0fVxuXG5cdFx0aWYgKG9wdGlvbnMuY29udGV4dE1lbnUpIHtcblx0XHRcdGlmIChvcHRpb25zLmV4dGVuc2lvbnMuaW5kZXhPZignY29udGV4dE1lbnUnKSA8IDApIHtcblx0XHRcdFx0b3B0aW9ucy5leHRlbnNpb25zLnB1c2goJ2NvbnRleHRNZW51Jylcblx0XHRcdH1cblxuXHRcdFx0b3B0aW9ucy5jb250ZXh0TWVudS5hY3Rpb25zID0gZnVuY3Rpb24obm9kZSwgYWN0aW9uKSB7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW1RyZWVDb250cm9sXSBjb250ZXh0TWVudUFjdGlvbicsIG5vZGUsIGFjdGlvbilcblx0XHRcdFx0XHRldmVudHMuZW1pdCgnY29udGV4dE1lbnVBY3Rpb24nLCBnZXRBY3RpdmVOb2RlKCksIGFjdGlvbilcblx0XHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0ZWx0LmZhbmN5dHJlZShvcHRpb25zKVxuXG5cdFx0ZnVuY3Rpb24gZ2V0QWN0aXZlTm9kZSgpIHtcblx0XHRcdHJldHVybiBlbHQuZmFuY3l0cmVlKCdnZXRBY3RpdmVOb2RlJylcblx0XHR9XG5cblx0XHR0aGlzLmdldEFjdGl2ZU5vZGUgPSBnZXRBY3RpdmVOb2RlXG5cblx0XHR0aGlzLmdldFJvb3ROb2RlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gZWx0LmZhbmN5dHJlZSgnZ2V0Um9vdE5vZGUnKVxuXHRcdH1cblxuXHRcdHRoaXMubW92ZURvd24gPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0XHR2YXIgbmV4dCA9IG5vZGUuZ2V0TmV4dFNpYmxpbmcoKVxuXHRcdFx0aWYgKG5leHQgIT0gbnVsbCkge1xuXHRcdFx0XHRub2RlLm1vdmVUbyhuZXh0LCAnYWZ0ZXInKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMubW92ZVVwID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dmFyIHByZXYgPSBub2RlLmdldFByZXZTaWJsaW5nKClcblx0XHRcdGlmIChwcmV2ICE9IG51bGwpIHtcblx0XHRcdFx0bm9kZS5tb3ZlVG8ocHJldiwgJ2JlZm9yZScpXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5vbiA9IGV2ZW50cy5vbi5iaW5kKGV2ZW50cylcblxuXHR9XG59KTtcblxuXG5cblxuIl19
