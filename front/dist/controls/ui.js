
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
				.html(options.template)
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





//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjY29yZGlvbi5qcyIsImRhdGVwaWNrZXIuanMiLCJkZXBzLmpzIiwiZGlhbG9nLmpzIiwic2xpZGVyLmpzIiwic3Bpbm5lci5qcyIsInRhYi5qcyIsInRvb2xiYXIuanMiLCJ0cmVlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJ1aS5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ0FjY29yZGlvbkNvbnRyb2wnLCB7XG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcblxuXHRcdGVsdC5jaGlsZHJlbignZGl2JykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdHZhciBkaXYgPSAkKHRoaXMpXG5cdFx0XHR2YXIgdGl0bGUgPSBkaXYuYXR0cigndGl0bGUnKVxuXHRcdFx0ZGl2LmJlZm9yZSgkKCc8aDM+JykudGV4dCh0aXRsZSkpXG5cdFx0fSlcblx0XHRlbHQuYWNjb3JkaW9uKG9wdGlvbnMpXG5cdH1cbn0pO1xuXG5cbiIsIihmdW5jdGlvbigpIHtcblxuXHQkLmRhdGVwaWNrZXIuc2V0RGVmYXVsdHMoJC5kYXRlcGlja2VyLnJlZ2lvbmFsWydmciddKVxuXG5cblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ0RhdGVQaWNrZXJDb250cm9sJywge1xuXHRcdG9wdGlvbnM6IHtcblx0XHRcdHNob3dCdXR0b25QYW5lbDogZmFsc2Vcblx0XHR9LFxuXHRcdGV2ZW50czogJ2NoYW5nZScsXG5cdFx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xuXG5cdFx0XHRlbHQuZGF0ZXBpY2tlcihvcHRpb25zKVxuXG5cdFx0XHR2YXIgdmFsdWUgPSBlbHQudmFsKClcblx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0dmFyIG1zID0gRGF0ZS5wYXJzZSh2YWx1ZSlcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW0RhdGVQaWNrZXJDb250cm9sXSBtcycsIG1zKVxuXHRcdFx0XHR2YXIgZGF0ZSA9IG5ldyBEYXRlKG1zKVxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdbRGF0ZVBpY2tlckNvbnRyb2xdIGRhdGUnLCBkYXRlKVxuXHRcdFx0XHRlbHQuZGF0ZXBpY2tlcignc2V0RGF0ZScsIGRhdGUpXG5cdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c2V0VmFsdWU6IGZ1bmN0aW9uKGRhdGUpIHtcblx0XHRcdFx0XHRlbHQuZGF0ZXBpY2tlcignc2V0RGF0ZScsIGRhdGUpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGdldFZhbHVlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gZWx0LmRhdGVwaWNrZXIoJ2dldERhdGUnKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH0pXG59KSgpO1xuIiwiKGZ1bmN0aW9uKCkge1x0XG5cblx0JCQubG9hZFN0eWxlKCcvY29udHJvbHMvdWkuY3NzJylcbn0pKCk7IiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0RpYWxvZ0NvbnRyb2wnLCB7XG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcblxuXHRcdG9wdGlvbnMuYXV0b09wZW4gPSBmYWxzZVxuXHRcdG9wdGlvbnMuYXBwZW5kVG8gPSBlbHQucGFyZW50KClcblx0XHRvcHRpb25zLm1vZGFsID0gdHJ1ZVxuXG5cdFx0dGhpcy5vcGVuID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRlbHQuZGlhbG9nKCdvcGVuJylcblx0XHR9XG5cblx0XHR0aGlzLmNsb3NlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRlbHQuZGlhbG9nKCdjbG9zZScpXG5cdFx0fVxuXG5cdFx0dGhpcy5zZXRPcHRpb24gPSBmdW5jdGlvbihvcHRpb25OYW1lLCB2YWx1ZSkge1xuXHRcdFx0ZWx0LmRpYWxvZygnb3B0aW9uJywgb3B0aW9uTmFtZSwgdmFsdWUpXG5cdFx0fVxuXG5cblx0XHRmb3IodmFyIGJ0biBpbiBvcHRpb25zLmJ1dHRvbnMpIHtcblx0XHRcdHZhciBmbiA9IG9wdGlvbnMuYnV0dG9uc1tidG5dIFxuXHRcdFx0aWYgKHR5cGVvZiBmbiA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdG9wdGlvbnMuYnV0dG9uc1tidG5dID0gb3B0aW9ucy5idXR0b25zW2J0bl0uYmluZChpZmFjZSlcblx0XHRcdH1cblx0XHR9XG5cblx0XHRlbHQuZGlhbG9nKG9wdGlvbnMpXG5cblx0fVxufSk7XG5cblxuIiwiXG5cbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdTbGlkZXJDb250cm9sJywge1xuXG5cdG9wdGlvbnM6IHtcblx0XHRtYXg6IDEwMCxcblx0XHRtaW46IDAsIFxuXHRcdG9yaWVudGF0aW9uOiAnaG9yaXpvbnRhbCcsXG5cdFx0cmFuZ2U6IGZhbHNlXHRcdFx0XG5cdH0sXG5cdGV2ZW50czogJ2NoYW5nZSxpbnB1dCcsXG5cblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xuXG5cblx0Ly9jb25zb2xlLmxvZygnW1NsaWRlckNvbnRyb2xdIHZhbHVlJywgZWx0LnZhbCgpKVxuXHRcdHZhciB2YWx1ZSA9IGVsdC52YWwoKVxuXG5cdFx0aWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG5cdFx0XHRvcHRpb25zLnZhbHVlcyA9IHZhbHVlXG5cdFx0XHRvcHRpb25zLnJhbmdlID0gdHJ1ZVxuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcblx0XHRcdG9wdGlvbnMudmFsdWUgPSB2YWx1ZVxuXHRcdH1cblxuXHRcdC8vY29uc29sZS5sb2coJ1tTbGlkZXJDb250cm9sXSBvcHRpb25zJywgb3B0aW9ucylcblxuXHRcdG9wdGlvbnMuY2hhbmdlID0gZnVuY3Rpb24oZXYsIHVpKSB7XG5cdFx0XHRlbHQudHJpZ2dlcignY2hhbmdlJywgW3VpLnZhbHVlcyB8fCB1aS52YWx1ZV0pXG5cdFx0fVxuXG5cdFx0b3B0aW9ucy5zbGlkZSA9IGZ1bmN0aW9uKGV2LCB1aSkge1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnW1NsaWRlckNvbnRyb2xdIHNsaWRlJywgdWkudmFsdWVzIHx8IHVpLnZhbHVlKVxuXHRcdFx0ZWx0LnRyaWdnZXIoJ2lucHV0JywgW3VpLnZhbHVlcyB8fCB1aS52YWx1ZV0pXG5cdFx0fVxuXG5cdFx0ZWx0LnNsaWRlcihvcHRpb25zKVxuXG5cdFx0dGhpcy5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnW1NsaWRlckNvbnRyb2xdIGdldFZhbHVlJylcblx0XHRcdHJldHVybiBlbHQuc2xpZGVyKChvcHRpb25zLnJhbmdlKSA/ICd2YWx1ZXMnIDogJ3ZhbHVlJykgXG5cdFx0fVxuXG5cdFx0dGhpcy5zZXRWYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbU2xpZGVyQ29udHJvbF0gc2V0VmFsdWUnKVxuXHRcdFx0ZWx0LnNsaWRlcigob3B0aW9ucy5yYW5nZSkgPyAndmFsdWVzJyA6ICd2YWx1ZScsIHZhbHVlKVxuXHRcdH1cblxuXG5cdH1cblxufSk7XG5cblxuIiwiXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnU3Bpbm5lckNvbnRyb2wnLCB7XG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQpIHtcblxuXHRcdGVsdC5zcGlubmVyKHtcblx0XHRcdHN0b3A6IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW1NwaW5uZXJDb250cm9sXSBjaGFuZ2UnKVxuXHRcdFx0fVxuXHRcdH0pXG5cdH0sXG5cdGV2ZW50czogJ3NwaW5zdG9wJ1xufSk7XG5cblxuIiwiXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnVGFiQ29udHJvbCcsIHtcblx0ZXZlbnRzOiAnYWN0aXZhdGUnLFxuXHRpZmFjZTogJ2FkZFRhYih0aXRsZSwgb3B0aW9ucyk7Z2V0U2VsZWN0ZWRUYWJJbmRleCgpO3JlbW92ZVRhYih0YWJJbmRleCk7b24oZXZlbnQsIGNhbGxiYWNrKTtzZXRBY3RpdmUodGFiSW5kZXgpJyxcblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xuXG5cdFx0dmFyIGV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIyKClcblxuXHRcdHZhciB1bCA9ICQoJzx1bD4nKS5wcmVwZW5kVG8oZWx0KVxuXG5cdFx0ZWx0LmNoaWxkcmVuKCdkaXYnKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHRpdGxlID0gJCh0aGlzKS5hdHRyKCd0aXRsZScpXG5cdFx0XHR2YXIgaWQgPSAkKHRoaXMpLnVuaXF1ZUlkKCkuYXR0cignaWQnKVxuXHRcdFx0dmFyIGxpID0gJCgnPGxpPicpXG5cdFx0XHRcdC5hdHRyKCd0aXRsZScsIHRpdGxlKVxuXHRcdFx0XHQuYXBwZW5kKCQoJzxhPicsIHtocmVmOiAnIycgKyBpZH0pLnRleHQodGl0bGUpKVxuXHRcdFx0XHQuYXBwZW5kVG8odWwpXG5cdFx0XHRpZiAoJCh0aGlzKS5hdHRyKCdkYXRhLXJlbW92YWJsZScpICE9IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRsaS5hcHBlbmQoJCgnPHNwYW4+Jywge2NsYXNzOiAndWktaWNvbiB1aS1pY29uLWNsb3NlJ30pKVxuXHRcdFx0fVxuXHRcdH0pXG5cblx0XHRlbHQuY3NzKHtkaXNwbGF5OiAnZmxleCcsICdmbGV4LWRpcmVjdGlvbic6ICdjb2x1bW4nfSlcblx0XHRcblx0XHRlbHQudGFicyh7XG5cdFx0XHRhY3RpdmF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2FjdGl2YXRlJywgZ2V0U2VsZWN0ZWRUYWJJbmRleCgpKVxuXHRcdFx0XHRldmVudHMuZW1pdCgnYWN0aXZhdGUnKVxuXHRcdFx0fVxuXHRcdH0pXG5cdFx0Lm9uKCdjbGljaycsICdzcGFuLnVpLWljb24tY2xvc2UnLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBwYW5lbElkID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpLnJlbW92ZSgpLmF0dHIoJ2FyaWEtY29udHJvbHMnKVxuXHRcdFx0Ly9jb25zb2xlLmxvZygncGFuZWxJZCcsIHBhbmVsSWQpXG5cdFx0XHQkKCcjJyArIHBhbmVsSWQpLnJlbW92ZSgpXG5cdFx0XHRlbHQudGFicygncmVmcmVzaCcpXG5cdFx0fSlcblxuXHRcdGZ1bmN0aW9uIGdldENvdW50KCkge1xuXHRcdFx0cmV0dXJuIHVsLmNoaWxkcmVuKCdsaScpLmxlbmd0aFxuXHRcdH1cblxuXHRcdHRoaXMuYWRkVGFiID0gZnVuY3Rpb24odGl0bGUsIG9wdGlvbnMpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdhZGRUYWInLCBnZXRDb3VudCgpKVxuXHRcdFx0dmFyIGlkeCA9IGdldENvdW50KClcblx0XHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG5cdFx0XHR2YXIgdGFiID0gJCgnPGRpdj4nKVxuXHRcdFx0XHQuaHRtbChvcHRpb25zLnRlbXBsYXRlKVxuXHRcdFx0XHQuY3NzKCdmbGV4JywgJzEnKVxuXHRcdFx0XHQuYXR0cigndGl0bGUnLCB0aXRsZSlcblx0XHRcdFx0LmFwcGVuZFRvKGVsdClcblx0XHRcdHZhciBpZCA9IHRhYi51bmlxdWVJZCgpLmF0dHIoJ2lkJylcblx0XHRcdHZhciBsaSA9ICQoJzxsaT4nKVxuXHRcdFx0XHQuYXR0cigndGl0bGUnLCB0aXRsZSlcblx0XHRcdFx0LmFwcGVuZCgkKCc8YT4nLCB7aHJlZjogJyMnICsgaWR9KS50ZXh0KHRpdGxlKSlcblx0XHRcdFx0LmFwcGVuZFRvKHVsKVxuXHRcdFx0aWYgKG9wdGlvbnMucmVtb3ZhYmxlID09PSB0cnVlKSB7XG5cdFx0XHRcdGxpLmFwcGVuZCgkKCc8c3Bhbj4nLCB7Y2xhc3M6ICd1aS1pY29uIHVpLWljb24tY2xvc2UnfSkpXG5cdFx0XHR9XHRcdFx0XG5cblx0XHRcdGVsdC50YWJzKCdyZWZyZXNoJylcblx0XHRcdHJldHVybiBpZHhcblx0XHR9XG5cblx0XHR0aGlzLmdldFRhYkNvdW50ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdWwuY2hpbGRyZW4oYGxpYCkubGVuZ3RoXG5cdFx0fVxuXG5cdFx0dGhpcy5nZXRUYWJQYW5lbEJ5VGl0bGUgPSBmdW5jdGlvbiAodGl0bGUpIHtcblxuXHRcdFx0cmV0dXJuIGVsdC5jaGlsZHJlbihgZGl2W3RpdGxlPSR7dGl0bGV9XWApXG5cblx0XHR9XG5cblx0XHR0aGlzLmdldFRhYkluZGV4QnlUaXRsZSA9IGZ1bmN0aW9uICh0aXRsZSkge1xuXG5cdFx0XHRyZXR1cm4gdWwuY2hpbGRyZW4oYGxpW3RpdGxlPSR7dGl0bGV9XWApLmluZGV4KClcblxuXHRcdH1cblxuXHRcdHRoaXMuZ2V0VGl0bGVCeUluZGV4ID0gZnVuY3Rpb24oaW5kZXgpIHtcblx0XHRcdHJldHVybiB1bC5jaGlsZHJlbignbGknKS5lcShpbmRleCkuYXR0cigndGl0bGUnKVxuXHRcdH1cblxuXHRcdHRoaXMuZ2V0U2VsZWN0ZWRUYWJJbmRleCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGluZGV4ID0gdWwuY2hpbGRyZW4oJ2xpLnVpLXN0YXRlLWFjdGl2ZScpLmluZGV4KClcblx0XHRcdHJldHVybiBpbmRleFxuXHRcdH1cblxuXHRcdHRoaXMucmVtb3ZlVGFiID0gZnVuY3Rpb24odGFiSW5kZXgpIHtcblx0XHRcdHZhciBsaSA9IHVsLmNoaWxkcmVuKCdsaScpLmVxKHRhYkluZGV4KVxuXHRcdFx0dmFyIHBhbmVsSWQgPSBsaS5yZW1vdmUoKS5hdHRyKCdhcmlhLWNvbnRyb2xzJylcblx0XHRcdCQoJyMnICsgcGFuZWxJZCkucmVtb3ZlKClcblx0XHRcdGVsdC50YWJzKCdyZWZyZXNoJylcblx0XHR9XG5cblx0XHR0aGlzLm9uID0gZXZlbnRzLm9uLmJpbmQoZXZlbnRzKVxuXG5cdFx0dGhpcy5zZXRBY3RpdmUgPSBmdW5jdGlvbih0YWJJbmRleCkge1xuXHRcdFx0ZWx0LnRhYnMoJ29wdGlvbicsICdhY3RpdmUnLCB0YWJJbmRleClcblx0XHR9XG5cblx0XHR0aGlzLmdldEFjdGl2ZSA9IGZ1bmN0aW9uKHRhYkluZGV4KSB7XG5cdFx0XHRyZXR1cm4gZWx0LnRhYnMoJ29wdGlvbicsICdhY3RpdmUnKVxuXHRcdH1cdFx0XG5cblx0fVxufSk7XG5cblxuXG4iLCJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdUb29sYmFyQ29udHJvbCcsIHtcblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xuXG5cdFx0ZWx0LmNvbnRyb2xncm91cCgpXG5cblx0fVxufSk7XG5cblxuXG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnVHJlZUNvbnRyb2wnLCB7XG5cblx0ZGVwczogWydUcmVlQ3RybFNlcnZpY2UnXSwgXG5cdG9wdGlvbnM6IHtcblx0XHRjaGVja2JveDogZmFsc2Vcblx0fSxcblx0ZXZlbnRzOiAnYWN0aXZhdGUsY29udGV4dE1lbnVBY3Rpb24nLFxuXHRpZmFjZTogJ2dldEFjdGl2ZU5vZGUoKTtnZXRSb290Tm9kZSgpO29uKGV2ZW50LCBjYWxsYmFjayk7bW92ZVVwKG5vZGUpO21vdmVEb3duKG5vZGUpJyxcblxuXHRcblx0bGliOiAndWknLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XG5cblx0XHR2YXIgZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxuXG5cblx0XHRvcHRpb25zLmFjdGl2YXRlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRldmVudHMuZW1pdCgnYWN0aXZhdGUnKVxuXHRcdH1cblxuXHRcdGlmICghQXJyYXkuaXNBcnJheShvcHRpb25zLmV4dGVuc2lvbnMpKSB7XG5cdFx0XHRvcHRpb25zLmV4dGVuc2lvbnMgPSBbXVxuXHRcdH1cblxuXHRcdGlmIChvcHRpb25zLmNvbnRleHRNZW51KSB7XG5cdFx0XHRpZiAob3B0aW9ucy5leHRlbnNpb25zLmluZGV4T2YoJ2NvbnRleHRNZW51JykgPCAwKSB7XG5cdFx0XHRcdG9wdGlvbnMuZXh0ZW5zaW9ucy5wdXNoKCdjb250ZXh0TWVudScpXG5cdFx0XHR9XG5cblx0XHRcdG9wdGlvbnMuY29udGV4dE1lbnUuYWN0aW9ucyA9IGZ1bmN0aW9uKG5vZGUsIGFjdGlvbikge1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ1tUcmVlQ29udHJvbF0gY29udGV4dE1lbnVBY3Rpb24nLCBub2RlLCBhY3Rpb24pXG5cdFx0XHRcdFx0ZXZlbnRzLmVtaXQoJ2NvbnRleHRNZW51QWN0aW9uJywgZ2V0QWN0aXZlTm9kZSgpLCBhY3Rpb24pXG5cdFx0XHRcdH1cblxuXHRcdH1cblxuXHRcdGVsdC5mYW5jeXRyZWUob3B0aW9ucylcblxuXHRcdGZ1bmN0aW9uIGdldEFjdGl2ZU5vZGUoKSB7XG5cdFx0XHRyZXR1cm4gZWx0LmZhbmN5dHJlZSgnZ2V0QWN0aXZlTm9kZScpXG5cdFx0fVxuXG5cdFx0dGhpcy5nZXRBY3RpdmVOb2RlID0gZ2V0QWN0aXZlTm9kZVxuXG5cdFx0dGhpcy5nZXRSb290Tm9kZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGVsdC5mYW5jeXRyZWUoJ2dldFJvb3ROb2RlJylcblx0XHR9XG5cblx0XHR0aGlzLm1vdmVEb3duID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dmFyIG5leHQgPSBub2RlLmdldE5leHRTaWJsaW5nKClcblx0XHRcdGlmIChuZXh0ICE9IG51bGwpIHtcblx0XHRcdFx0bm9kZS5tb3ZlVG8obmV4dCwgJ2FmdGVyJylcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLm1vdmVVcCA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRcdHZhciBwcmV2ID0gbm9kZS5nZXRQcmV2U2libGluZygpXG5cdFx0XHRpZiAocHJldiAhPSBudWxsKSB7XG5cdFx0XHRcdG5vZGUubW92ZVRvKHByZXYsICdiZWZvcmUnKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMub24gPSBldmVudHMub24uYmluZChldmVudHMpXG5cblx0fVxufSk7XG5cblxuXG5cbiJdfQ==
