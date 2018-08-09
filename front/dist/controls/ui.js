
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





//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjY29yZGlvbi5qcyIsImRhdGVwaWNrZXIuanMiLCJkZXBzLmpzIiwiZGlhbG9nLmpzIiwic2xpZGVyLmpzIiwic3Bpbm5lci5qcyIsInRhYi5qcyIsInRvb2xiYXIuanMiLCJ0cmVlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoidWkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdBY2NvcmRpb25Db250cm9sJywge1xuXHRcblx0bGliOiAndWknLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XG5cblx0XHRlbHQuY2hpbGRyZW4oJ2RpdicpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgZGl2ID0gJCh0aGlzKVxuXHRcdFx0dmFyIHRpdGxlID0gZGl2LmF0dHIoJ3RpdGxlJylcblx0XHRcdGRpdi5iZWZvcmUoJCgnPGgzPicpLnRleHQodGl0bGUpKVxuXHRcdH0pXG5cdFx0ZWx0LmFjY29yZGlvbihvcHRpb25zKVxuXHR9XG59KTtcblxuXG4iLCIoZnVuY3Rpb24oKSB7XG5cblx0JC5kYXRlcGlja2VyLnNldERlZmF1bHRzKCQuZGF0ZXBpY2tlci5yZWdpb25hbFsnZnInXSlcblxuXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdEYXRlUGlja2VyQ29udHJvbCcsIHtcblx0XHRvcHRpb25zOiB7XG5cdFx0XHRzaG93QnV0dG9uUGFuZWw6IGZhbHNlXG5cdFx0fSxcblx0XHRldmVudHM6ICdjaGFuZ2UnLFxuXHRcdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcblxuXHRcdFx0ZWx0LmRhdGVwaWNrZXIob3B0aW9ucylcblxuXHRcdFx0dmFyIHZhbHVlID0gZWx0LnZhbCgpXG5cdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdHZhciBtcyA9IERhdGUucGFyc2UodmFsdWUpXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1tEYXRlUGlja2VyQ29udHJvbF0gbXMnLCBtcylcblx0XHRcdFx0dmFyIGRhdGUgPSBuZXcgRGF0ZShtcylcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW0RhdGVQaWNrZXJDb250cm9sXSBkYXRlJywgZGF0ZSlcblx0XHRcdFx0ZWx0LmRhdGVwaWNrZXIoJ3NldERhdGUnLCBkYXRlKVxuXHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHNldFZhbHVlOiBmdW5jdGlvbihkYXRlKSB7XG5cdFx0XHRcdFx0ZWx0LmRhdGVwaWNrZXIoJ3NldERhdGUnLCBkYXRlKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRnZXRWYWx1ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGVsdC5kYXRlcGlja2VyKCdnZXREYXRlJylcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHR9KVxufSkoKTtcbiIsIihmdW5jdGlvbigpIHtcdFxuXG5cdCQkLmxvYWRTdHlsZSgnL2NvbnRyb2xzL3VpLmNzcycpXG59KSgpOyIsIiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdEaWFsb2dDb250cm9sJywge1xuXHRcblx0bGliOiAndWknLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XG5cblx0XHRvcHRpb25zLmF1dG9PcGVuID0gZmFsc2Vcblx0XHRvcHRpb25zLmFwcGVuZFRvID0gZWx0LnBhcmVudCgpXG5cdFx0b3B0aW9ucy5tb2RhbCA9IHRydWVcblxuXHRcdHRoaXMub3BlbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWx0LmRpYWxvZygnb3BlbicpXG5cdFx0fVxuXG5cdFx0dGhpcy5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0ZWx0LmRpYWxvZygnY2xvc2UnKVxuXHRcdH1cblxuXHRcdHRoaXMuc2V0T3B0aW9uID0gZnVuY3Rpb24ob3B0aW9uTmFtZSwgdmFsdWUpIHtcblx0XHRcdGVsdC5kaWFsb2coJ29wdGlvbicsIG9wdGlvbk5hbWUsIHZhbHVlKVxuXHRcdH1cblxuXG5cdFx0Zm9yKHZhciBidG4gaW4gb3B0aW9ucy5idXR0b25zKSB7XG5cdFx0XHR2YXIgZm4gPSBvcHRpb25zLmJ1dHRvbnNbYnRuXSBcblx0XHRcdGlmICh0eXBlb2YgZm4gPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRvcHRpb25zLmJ1dHRvbnNbYnRuXSA9IG9wdGlvbnMuYnV0dG9uc1tidG5dLmJpbmQoaWZhY2UpXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZWx0LmRpYWxvZyhvcHRpb25zKVxuXG5cdH1cbn0pO1xuXG5cbiIsIlxuXG4kJC5yZWdpc3RlckNvbnRyb2xFeCgnU2xpZGVyQ29udHJvbCcsIHtcblxuXHRvcHRpb25zOiB7XG5cdFx0bWF4OiAxMDAsXG5cdFx0bWluOiAwLCBcblx0XHRvcmllbnRhdGlvbjogJ2hvcml6b250YWwnLFxuXHRcdHJhbmdlOiBmYWxzZVx0XHRcdFxuXHR9LFxuXHRldmVudHM6ICdjaGFuZ2UsaW5wdXQnLFxuXG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMpIHtcblxuXG5cdC8vY29uc29sZS5sb2coJ1tTbGlkZXJDb250cm9sXSB2YWx1ZScsIGVsdC52YWwoKSlcblx0XHR2YXIgdmFsdWUgPSBlbHQudmFsKClcblxuXHRcdGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuXHRcdFx0b3B0aW9ucy52YWx1ZXMgPSB2YWx1ZVxuXHRcdFx0b3B0aW9ucy5yYW5nZSA9IHRydWVcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XG5cdFx0XHRvcHRpb25zLnZhbHVlID0gdmFsdWVcblx0XHR9XG5cblx0XHQvL2NvbnNvbGUubG9nKCdbU2xpZGVyQ29udHJvbF0gb3B0aW9ucycsIG9wdGlvbnMpXG5cblx0XHRvcHRpb25zLmNoYW5nZSA9IGZ1bmN0aW9uKGV2LCB1aSkge1xuXHRcdFx0ZWx0LnRyaWdnZXIoJ2NoYW5nZScsIFt1aS52YWx1ZXMgfHwgdWkudmFsdWVdKVxuXHRcdH1cblxuXHRcdG9wdGlvbnMuc2xpZGUgPSBmdW5jdGlvbihldiwgdWkpIHtcblx0XHRcdC8vY29uc29sZS5sb2coJ1tTbGlkZXJDb250cm9sXSBzbGlkZScsIHVpLnZhbHVlcyB8fCB1aS52YWx1ZSlcblx0XHRcdGVsdC50cmlnZ2VyKCdpbnB1dCcsIFt1aS52YWx1ZXMgfHwgdWkudmFsdWVdKVxuXHRcdH1cblxuXHRcdGVsdC5zbGlkZXIob3B0aW9ucylcblxuXHRcdHRoaXMuZ2V0VmFsdWUgPSBmdW5jdGlvbigpIHtcblx0XHRcdC8vY29uc29sZS5sb2coJ1tTbGlkZXJDb250cm9sXSBnZXRWYWx1ZScpXG5cdFx0XHRyZXR1cm4gZWx0LnNsaWRlcigob3B0aW9ucy5yYW5nZSkgPyAndmFsdWVzJyA6ICd2YWx1ZScpIFxuXHRcdH1cblxuXHRcdHRoaXMuc2V0VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnW1NsaWRlckNvbnRyb2xdIHNldFZhbHVlJylcblx0XHRcdGVsdC5zbGlkZXIoKG9wdGlvbnMucmFuZ2UpID8gJ3ZhbHVlcycgOiAndmFsdWUnLCB2YWx1ZSlcblx0XHR9XG5cblxuXHR9XG5cbn0pO1xuXG5cbiIsIlxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ1NwaW5uZXJDb250cm9sJywge1xuXHRcblx0bGliOiAndWknLFxuaW5pdDogZnVuY3Rpb24oZWx0KSB7XG5cblx0XHRlbHQuc3Bpbm5lcih7XG5cdFx0XHRzdG9wOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1tTcGlubmVyQ29udHJvbF0gY2hhbmdlJylcblx0XHRcdH1cblx0XHR9KVxuXHR9LFxuXHRldmVudHM6ICdzcGluc3RvcCdcbn0pO1xuXG5cbiIsIlxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ1RhYkNvbnRyb2wnLCB7XG5cdGV2ZW50czogJ2FjdGl2YXRlJyxcblx0aWZhY2U6ICdhZGRUYWIodGl0bGUsIG9wdGlvbnMpO2dldFNlbGVjdGVkVGFiSW5kZXgoKTtyZW1vdmVUYWIodGFiSW5kZXgpO29uKGV2ZW50LCBjYWxsYmFjayk7c2V0QWN0aXZlKHRhYkluZGV4KScsXG5cdFxuXHRsaWI6ICd1aScsXG5pbml0OiBmdW5jdGlvbihlbHQpIHtcblxuXHRcdHZhciBldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyMigpXG5cblx0XHR2YXIgdWwgPSAkKCc8dWw+JykucHJlcGVuZFRvKGVsdClcblxuXHRcdGVsdC5jaGlsZHJlbignZGl2JykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRcdHZhciB0aXRsZSA9ICQodGhpcykuYXR0cigndGl0bGUnKVxuXHRcdFx0dmFyIGlkID0gJCh0aGlzKS51bmlxdWVJZCgpLmF0dHIoJ2lkJylcblx0XHRcdHZhciBsaSA9ICQoJzxsaT4nKS5hcHBlbmQoJCgnPGE+Jywge2hyZWY6ICcjJyArIGlkfSkudGV4dCh0aXRsZSkpLmFwcGVuZFRvKHVsKVxuXHRcdFx0aWYgKCQodGhpcykuYXR0cignZGF0YS1yZW1vdmFibGUnKSAhPSB1bmRlZmluZWQpIHtcblx0XHRcdFx0bGkuYXBwZW5kKCQoJzxzcGFuPicsIHtjbGFzczogJ3VpLWljb24gdWktaWNvbi1jbG9zZSd9KSlcblx0XHRcdH1cblx0XHR9KVxuXHRcdFxuXHRcdGVsdC50YWJzKHtcblx0XHRcdGFjdGl2YXRlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnYWN0aXZhdGUnLCBnZXRTZWxlY3RlZFRhYkluZGV4KCkpXG5cdFx0XHRcdGV2ZW50cy5lbWl0KCdhY3RpdmF0ZScpXG5cdFx0XHR9XG5cdFx0fSlcblx0XHQub24oJ2NsaWNrJywgJ3NwYW4udWktaWNvbi1jbG9zZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHBhbmVsSWQgPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpJykucmVtb3ZlKCkuYXR0cignYXJpYS1jb250cm9scycpXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdwYW5lbElkJywgcGFuZWxJZClcblx0XHRcdCQoJyMnICsgcGFuZWxJZCkucmVtb3ZlKClcblx0XHRcdGVsdC50YWJzKCdyZWZyZXNoJylcblx0XHR9KVxuXG5cdFx0dGhpcy5hZGRUYWIgPSBmdW5jdGlvbih0aXRsZSwgb3B0aW9ucykge1xuXHRcdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge31cblx0XHRcdHZhciB0YWIgPSAkKCc8ZGl2PicpLmh0bWwob3B0aW9ucy50ZW1wbGF0ZSkuYXBwZW5kVG8oZWx0KVxuXHRcdFx0dmFyIGlkID0gdGFiLnVuaXF1ZUlkKCkuYXR0cignaWQnKVxuXHRcdFx0dmFyIGxpID0gJCgnPGxpPicpLmFwcGVuZCgkKCc8YT4nLCB7aHJlZjogJyMnICsgaWR9KS50ZXh0KHRpdGxlKSkuYXBwZW5kVG8odWwpXG5cdFx0XHRpZiAob3B0aW9ucy5yZW1vdmFibGUgPT09IHRydWUpIHtcblx0XHRcdFx0bGkuYXBwZW5kKCQoJzxzcGFuPicsIHtjbGFzczogJ3VpLWljb24gdWktaWNvbi1jbG9zZSd9KSlcblx0XHRcdH1cdFx0XHRcblxuXHRcdFx0ZWx0LnRhYnMoJ3JlZnJlc2gnKVxuXHRcdH1cblxuXHRcdHRoaXMuZ2V0U2VsZWN0ZWRUYWJJbmRleCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGluZGV4ID0gdWwuY2hpbGRyZW4oJ2xpLnVpLXN0YXRlLWFjdGl2ZScpLmluZGV4KClcblx0XHRcdHJldHVybiBpbmRleFxuXHRcdH1cblxuXHRcdHRoaXMucmVtb3ZlVGFiID0gZnVuY3Rpb24odGFiSW5kZXgpIHtcblx0XHRcdHZhciBsaSA9IHVsLmNoaWxkcmVuKCdsaScpLmVxKHRhYkluZGV4KVxuXHRcdFx0dmFyIHBhbmVsSWQgPSBsaS5yZW1vdmUoKS5hdHRyKCdhcmlhLWNvbnRyb2xzJylcblx0XHRcdCQoJyMnICsgcGFuZWxJZCkucmVtb3ZlKClcblx0XHRcdGVsdC50YWJzKCdyZWZyZXNoJylcblx0XHR9XG5cblx0XHR0aGlzLm9uID0gZXZlbnRzLm9uLmJpbmQoZXZlbnRzKVxuXG5cdFx0dGhpcy5zZXRBY3RpdmUgPSBmdW5jdGlvbih0YWJJbmRleCkge1xuXHRcdFx0ZWx0LnRhYnMoJ29wdGlvbicsICdhY3RpdmUnLCB0YWJJbmRleClcblx0XHR9XG5cblx0fVxufSk7XG5cblxuXG4iLCJcbiQkLnJlZ2lzdGVyQ29udHJvbEV4KCdUb29sYmFyQ29udHJvbCcsIHtcblx0XG5cdGxpYjogJ3VpJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCkge1xuXG5cdFx0ZWx0LmNvbnRyb2xncm91cCgpXG5cblx0fVxufSk7XG5cblxuXG4iLCIkJC5yZWdpc3RlckNvbnRyb2xFeCgnVHJlZUNvbnRyb2wnLCB7XG5cblx0ZGVwczogWydUcmVlQ3RybFNlcnZpY2UnXSwgXG5cdG9wdGlvbnM6IHtcblx0XHRjaGVja2JveDogZmFsc2Vcblx0fSxcblx0ZXZlbnRzOiAnYWN0aXZhdGUsY29udGV4dE1lbnVBY3Rpb24nLFxuXHRpZmFjZTogJ2dldEFjdGl2ZU5vZGUoKTtnZXRSb290Tm9kZSgpO29uKGV2ZW50LCBjYWxsYmFjayk7bW92ZVVwKG5vZGUpO21vdmVEb3duKG5vZGUpJyxcblxuXHRcblx0bGliOiAndWknLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zKSB7XG5cblx0XHR2YXIgZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxuXG5cblx0XHRvcHRpb25zLmFjdGl2YXRlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRldmVudHMuZW1pdCgnYWN0aXZhdGUnKVxuXHRcdH1cblxuXHRcdGlmICghQXJyYXkuaXNBcnJheShvcHRpb25zLmV4dGVuc2lvbnMpKSB7XG5cdFx0XHRvcHRpb25zLmV4dGVuc2lvbnMgPSBbXVxuXHRcdH1cblxuXHRcdGlmIChvcHRpb25zLmNvbnRleHRNZW51KSB7XG5cdFx0XHRpZiAob3B0aW9ucy5leHRlbnNpb25zLmluZGV4T2YoJ2NvbnRleHRNZW51JykgPCAwKSB7XG5cdFx0XHRcdG9wdGlvbnMuZXh0ZW5zaW9ucy5wdXNoKCdjb250ZXh0TWVudScpXG5cdFx0XHR9XG5cblx0XHRcdG9wdGlvbnMuY29udGV4dE1lbnUuYWN0aW9ucyA9IGZ1bmN0aW9uKG5vZGUsIGFjdGlvbikge1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ1tUcmVlQ29udHJvbF0gY29udGV4dE1lbnVBY3Rpb24nLCBub2RlLCBhY3Rpb24pXG5cdFx0XHRcdFx0ZXZlbnRzLmVtaXQoJ2NvbnRleHRNZW51QWN0aW9uJywgZ2V0QWN0aXZlTm9kZSgpLCBhY3Rpb24pXG5cdFx0XHRcdH1cblxuXHRcdH1cblxuXHRcdGVsdC5mYW5jeXRyZWUob3B0aW9ucylcblxuXHRcdGZ1bmN0aW9uIGdldEFjdGl2ZU5vZGUoKSB7XG5cdFx0XHRyZXR1cm4gZWx0LmZhbmN5dHJlZSgnZ2V0QWN0aXZlTm9kZScpXG5cdFx0fVxuXG5cdFx0dGhpcy5nZXRBY3RpdmVOb2RlID0gZ2V0QWN0aXZlTm9kZVxuXG5cdFx0dGhpcy5nZXRSb290Tm9kZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGVsdC5mYW5jeXRyZWUoJ2dldFJvb3ROb2RlJylcblx0XHR9XG5cblx0XHR0aGlzLm1vdmVEb3duID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dmFyIG5leHQgPSBub2RlLmdldE5leHRTaWJsaW5nKClcblx0XHRcdGlmIChuZXh0ICE9IG51bGwpIHtcblx0XHRcdFx0bm9kZS5tb3ZlVG8obmV4dCwgJ2FmdGVyJylcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLm1vdmVVcCA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRcdHZhciBwcmV2ID0gbm9kZS5nZXRQcmV2U2libGluZygpXG5cdFx0XHRpZiAocHJldiAhPSBudWxsKSB7XG5cdFx0XHRcdG5vZGUubW92ZVRvKHByZXYsICdiZWZvcmUnKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMub24gPSBldmVudHMub24uYmluZChldmVudHMpXG5cblx0fVxufSk7XG5cblxuXG5cbiJdfQ==
