
$$.registerControlEx('TabControl', {
	events: 'activate',
	iface: 'addTab(title, options);getSelectedTabIndex();removeTab(tabIndex);on(event, callback);setActive(tabIndex)',
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



