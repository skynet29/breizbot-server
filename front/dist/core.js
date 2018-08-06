(function(){

	
	window.$$ = {}

})();

(function(){

var curRoute
	


$$.startApp = function(mainControlName, config) {
	$$.viewController('body', {
		template: `<div bn-control="${mainControlName}" class="mainPanel" bn-options="config"></div>`,
		data: {config}
	})
}

function processRoute() {
	var prevRoute = curRoute
	var href = location.href
	var idx = href.indexOf('#')
	curRoute = (idx !== -1)  ? href.substr(idx+1) : '/'
	//console.log('[Core] newRoute', curRoute, prevRoute)


	$(window).trigger('routeChange', {curRoute:curRoute, prevRoute: prevRoute})

}	

$$.configReady = function(onConfigReady) {


	$(function() {

		var appName = location.pathname.split('/')[2]

		console.log(`[Core] App '${appName}' started :)`)
		console.log('[Core] jQuery version', $.fn.jquery)
		console.log('[Core] jQuery UI version', $.ui.version)

		


		$(window).on('popstate', function(evt) {
			//console.log('[popstate] state', evt.state)
			processRoute()
		})


		$.getJSON(`/api/app/config/${appName}`)
		.then(function(config) {

			console.log('config', config)

			var options = {
				userName: config.$userName,
				appName
			}


			$$.configureService('WebSocketService', options)
		
			
			
			try {
				$('body').processControls() // process HeaderControl
				
				onConfigReady(config)
			}
			catch(e) {
				var html = `
					<div class="w3-container">
						<p class="w3-text-red">${e}</p>
					</div>
				`
				$('body').html(html)
			}
			
			
			processRoute()
		})
		.catch((jqxhr) => {
			console.log('jqxhr', jqxhr)
			//var text = JSON.stringify(jqxhr.responseJSON, null, 4)
			var text = jqxhr.responseText
			var html = `
				<div class="w3-container">
					<p class="w3-text-red">${text}</p>
					<a href="/disconnect" class="w3-btn w3-blue">Logout</a>
				</div>
			`
			$('body').html(html)
		})				
			
	})
	

}

	
})();

$$.dialogController = function(title, options) {
	var div = $('<div>', {title: title})

	var ctrl = $$.viewController(div, options)

	var dlgOptions = $.extend({
		autoOpen: false,
		modal: true,
		width: 'auto',		
	}, options.options)

	//console.log('dlgOptions', dlgOptions)

	div.dialog(dlgOptions)

	ctrl.show = function() {
		div.dialog('open')
	}

	ctrl.hide = function() {
		div.dialog('close')
	}

	ctrl.setOption = function(optionName, value) {
		div.dialog('option', optionName, value)
	}

	return ctrl
};


$$.formDialogController = function(title, options) {
	var div = $('<div>', {title: title})
	var form = $('<form>')
		.appendTo(div)
		.on('submit', function(ev) {
			ev.preventDefault()
			div.dialog('close')
			if (typeof options.onApply == 'function') {
				options.onApply.call(ctrl, ctrl.elt.getFormData())
			}				
		})
	var submitBtn = $('<input>', {type: 'submit', hidden: true}).appendTo(form)

	var ctrl = $$.viewController(form, options)
	div.dialog({
		autoOpen: false,
		modal: true,
		width: 'auto',
		close: function() {
			//$(this).dialog('destroy')
		},
		buttons: {
			'Cancel': function() {
				$(this).dialog('close')
			},
			'Apply': function() {					
				submitBtn.click()
			}
		}
	})
	ctrl.show = function(data, onApply) {
		if (typeof ctrl.beforeShow == 'function') {
			ctrl.beforeShow()
		}
		options.onApply = onApply
		ctrl.elt.setFormData(data)
		div.dialog('open')
	}

	return ctrl
};

(function(){



class ViewController {
    constructor(elt, options) {
    	//console.log('ViewController', options)
    	if (typeof elt == 'string') {
    		elt = $(elt)
    	}

    	options = $.extend({}, options)
        this.elt = elt

        this.elt.on('data:update', (ev, name, value, excludeElt) => {
        	//console.log('[ViewController] data:change', name, value)
        	this.setData(name, value, excludeElt)
        })

        if (typeof options.template == 'string') {
        	this.elt = $(options.template).appendTo(elt)
        }
        this.model = $.extend({}, options.data)
        this.rules = $.extend({}, options.rules)
        this.watches = $.extend({}, options.watches)

        // generate automatic rules for computed data (aka function)
        for(var k in this.model) {
        	var data = this.model[k]
        	if (typeof data == 'function') {
        		var funcText = data.toString()
        		//console.log('funcText', funcText)
        		var rules = []
        		funcText.replace(/this.([a-zA-Z0-9_-]{1,})/g, function(match, captureOne) {
        			//console.log('captureOne', captureOne)
        			rules.push(captureOne)
        		})
        		this.rules[k] = rules.toString()
        	}
        }

        //console.log('rules', this.rules)
        this.dirList = this.elt.processUI(this.model)


        //this.elt.processUI(this.model)
        if (typeof options.events == 'object') {
            this.elt.processEvents(options.events)
        }

        this.scope = this.elt.processBindings()
        //console.log('scope', this.scope)
       
        var init = options.init
        if (typeof init == 'function') {
        	init.call(this)
        }
    } 

    setData(arg1, arg2, excludeElt) {
        //console.log('[ViewController] setData', arg1, arg2)
        var data = arg1
        if (typeof arg1 == 'string') {
        	data = {}
        	data[arg1] = arg2
        }
        //console.log('[ViewController] setData', data)
        $.extend(this.model, data)
        //console.log('model', this.model)
        this.update(Object.keys(data), excludeElt)
    }

    update(fieldsName, excludeElt) {
    	//console.log('[ViewController] update', fieldsName)
    	if (typeof fieldsName == 'string') {
    		fieldsName = fieldsName.split(',')
    	}


    	if (Array.isArray(fieldsName)) {
    		var fieldsSet = {}
    		fieldsName.forEach((field) => {

    			var watch = this.watches[field]
    			if (typeof watch == 'function') {
    				watch.call(null, this.model[field])
    			}
    			fieldsSet[field] = 1

    			for(var rule in this.rules) {
    				if (this.rules[rule].split(',').indexOf(field) != -1) {
    					fieldsSet[rule] = 1
    				}
    			}
    		})


    		this.elt.updateTemplate(this.dirList, this.model, Object.keys(fieldsSet), excludeElt)
    	}

    }
}


    $$.viewController = function (elt, options) {
        return new ViewController(elt, options)
    }

})();
(function(){



$$.registerControl = function(name, arg1, arg2) {
	$$.registerObject('controls', name, arg1, arg2)
}

$$.registerControlEx = function(name, options) {
	if (!$$.checkType(options, {
		$deps: ['string'],
		$iface: 'string',
		$events: 'string',
		init: 'function'
	})) {
		console.error(`[Core] registerControlEx: bad options`, options)
		return
	}


	var deps = options.deps || []


	$$.registerObject('controls', name, deps, options)
}



$$.createControl = function(controlName, elt) {
	elt.addClass(controlName)
	elt.addClass('CustomControl').uniqueId()	
	var ctrl = $$.getObject('controls', controlName)
		
	if (ctrl != undefined) {
		//console.log('createControl', controlName, ctrl)
		if (ctrl.status ===  'ok') {
			
			var iface = {}

			
			if (typeof ctrl.fn == 'function') {
				var args = [elt].concat(ctrl.deps)
				var defaultOptions = $.extend(true, {}, elt.data('$options'))
				console.log(`[Core] instance control '${controlName}'`)
				ctrl.fn.apply(iface, args)	
				iface.options = defaultOptions
							
			}
			else if (typeof ctrl.fn == 'object') {
				var init = ctrl.fn.init
				var props = ctrl.fn.props || {}
				var defaultOptions = $.extend({}, ctrl.fn.options, elt.data('$options'))

				var options = {}

				for(var o in defaultOptions) {
					options[o] = (elt.data(o) != undefined) ? elt.data(o) : defaultOptions[o]
				}

				for(var p in props) {
					options[p] = (elt.data(p) != undefined) ? elt.data(p) : props[p].val
				}

				//console.log('Computed Options', options)

				if (typeof init == 'function') {

					var args = [elt, options].concat(ctrl.deps)
					console.log(`[Core] instance control '${controlName}' with options`, options)
					init.apply(iface, args)
					iface.options = options
					iface.events = ctrl.fn.events

					if (Object.keys(props).length != 0) {
						iface.setProp = function(name, value) {
							//console.log(`[Core] setData`, name, value)
							var setter = props[name] && props[name].set
							if (typeof setter == 'string') {
								var setter = iface[setter]
							}
							if (typeof setter == 'function') {
								setter.call(null, value)
							}
							
							iface.options[name] = value
						}

						iface.props = function() {
							var ret = {}
							for(var k in props) {
								ret[k] = iface.options[k]

								var getter = props[k].get
								if (typeof getter == 'string') {
									getter = iface[getter]											
								}
								if (typeof getter == 'function') {
									ret[k] = getter.call(null)
								}
							}
							return ret
						}							
					}
				}
				else {
					console.warn(`[Core] control '${controlName}' missing init function`)
				}

			}

			iface.name = controlName
			elt.get(0).ctrl = iface
			
			return iface				
		}


	}
	else {
		throw(`[Core] control '${controlName}' is not registered`)
	}
}

$$.getRegisteredControls = function() {
	var controls = $$.getObjectDomain('controls')
	return Object.keys(controls).filter((name) => !name.startsWith('$'))
}

$$.getRegisteredControlsEx = function() {
	var controls = $$.getObjectDomain('controls')
	var libs = {}
	for(var k in controls) {
		var info = controls[k].fn
		var libName = info.lib
		if (typeof libName == 'string') {
			if (libs[libName] == undefined) {
				libs[libName] = []
			}
			libs[libName].push(k)

		}
	}
	return libs
}

$$.getControlInfo = function(controlName) {
	var controls = $$.getObjectDomain('controls')
	var info = controls[controlName]

	if (info == undefined) {
		console.log(`control '${controlName}' is not registered`)
		return
	}
	info = info.fn

	var ret = $$.extract(info, 'deps,options,lib')

	if (typeof info.events == 'string') {
		ret.events = info.events.split(',')
	}

	var props = {}
	for(var k in info.props) {
		props[k] = info.props[k].val
	}
	if (Object.keys(props).length != 0) {
		ret.props = props
	}
	if (typeof info.iface == 'string') {
		ret.iface = info.iface.split(';')
	}
	return ret
	//return controls[controlName].fn
}


$$.getControlsTree = function(showWhat) {
	showWhat = showWhat || ''
	var showOptions = showWhat.split(',')
	var tree = []
	$('.CustomControl').each(function() {
		var iface = $(this).interface()

		var item = {name:iface.name, elt: $(this), parent: null}
		item.id = $(this).attr('id')

		if (typeof iface.events == 'string' &&
			((showOptions.indexOf('events') >= 0 || showWhat === 'all'))) {
			item.events = iface.events.split(',')
		}			

		tree.push(item)

		if (showOptions.indexOf('iface') >= 0 || showWhat === 'all') {

			var func = []
			for(var k in iface) {
				if (typeof iface[k] == 'function' && k != 'props' && k != 'setProp') {
					func.push(k)
				}
			}
			if (func.length != 0) {
				item.iface = func
			}				
		}



		if (typeof iface.props == 'function' && 
			((showOptions.indexOf('props') >= 0 || showWhat === 'all'))) {
			item.props = iface.props()
		}

		if (typeof iface.getValue == 'function' &&
			((showOptions.indexOf('value') >= 0 || showWhat === 'all'))) {
			item.value = iface.getValue()
		}

		if (typeof iface.options == 'object' && Object.keys(iface.options).length != 0 &&
			((showOptions.indexOf('options') >= 0 || showWhat === 'all'))) {
			item.options = iface.options
		}	

					
		//console.log('name', name)
		item.childs = []


		var parents = $(this).parents('.CustomControl')
		//console.log('parents', parents)
		if (parents.length != 0) {
			var parent = parents.eq(0)
			item.parent = parent
			tree.forEach(function(i) {
				if (i.elt.get(0) == parent.get(0)) {
					i.childs.push(item)
				}
			})
			

		}
	})
	//console.log('tree', tree)

	var ret = []
	tree.forEach(function(i) {
		if (i.parent == null) {
			ret.push(i)
		}
		if (i.childs.length == 0) {
			delete i.childs
		}
		delete i.parent
		delete i.elt
	})

	return JSON.stringify(ret, null, 4)

}

})();

(function(){

var registeredObjects = {
	services: {}
}

var {services} = registeredObjects

function isDepsOk(deps) {
	return deps.reduce(function(prev, cur) {

		return prev && (cur != undefined)
	}, true)		
}

$$.getObjectDomain = function(domain) {
	return registeredObjects[domain]
}

$$.registerObject = function(domain, name, arg1, arg2) {
	var deps = []
	var fn = arg1
	if (Array.isArray(arg1)) {
		deps = arg1
		fn = arg2
	}
	if (typeof domain != 'string' || typeof name != 'string' || typeof fn == 'undefined' || !Array.isArray(deps)) {
		throw('[Core] registerObject called with bad arguments')
	} 
	console.log(`[Core] register object '${domain}:${name}' with deps`, deps)
	if (registeredObjects[domain] == undefined) {
		registeredObjects[domain] = {}
	}
	registeredObjects[domain][name] = {deps: deps, fn :fn, status: 'notloaded'}
}	

$$.getObject = function(domain, name) {
	//console.log(`[Core] getObject ${domain}:${name}`)
	var domain = registeredObjects[domain]
	var ret = domain && domain[name]
	if (ret && ret.status == 'notloaded') {
		ret.deps = $$.getServices(ret.deps)
		ret.status = isDepsOk(ret.deps) ? 'ok' : 'ko'
	}
	return ret
}

$$.getServices = function(deps) {
	//console.log('[Core] getServices', deps)
	return deps.map(function(depName) {
		var srv = services[depName]
		if (srv) {
			if (srv.status == 'notloaded') {
				var deps2 = $$.getServices(srv.deps)
				var config = srv.config || {}
				console.log(`[Core] instance service '${depName}' with config`, config)
				var args = [config].concat(deps2)
				srv.obj = srv.fn.apply(null, args)
				srv.status = 'ready'
			}
			return srv.obj				
		}
		else {
			//srv.status = 'notregistered'
			throw(`[Core] service '${depName}' is not registered`)
		}

	})
}



$$.configureService = function(name, config) {
	console.log('[Core] configureService', name, config)
	if (typeof name != 'string' || typeof config != 'object') {
		console.warn('[Core] configureService called with bad arguments')
		return
	} 	

	var srv = services[name]
	if (srv) {
		srv.config = config
	}
	else {
		throw(`[configureService] service '${name}' is not registered`)
	}

}

$$.registerService = function(name, arg1, arg2) {
	$$.registerObject('services', name, arg1, arg2)
}

$$.getRegisteredServices = function() {
	var ret = []
	for(var k in services) {
		var info = services[k]
		ret.push({name: k, status: info.status})
	}
	return ret
}


})();
(function() {

	$.fn.processBindings = function() {

		var data = {}

		this.bnFind('bn-bind', true, function(elt, varName) {
			//console.log('bn-text', varName)
			data[varName] = elt
		})
		this.bnFind('bn-iface', true, function(elt, varName) {
			//console.log('bn-text', varName)
			data[varName] = elt.interface()
		})
		return data
	
	}

})();
(function() {
	


	$.fn.getParentInterface = function(parentCtrlName) {
		var parent = this.parent()
		if (!parent.hasClass(parentCtrlName)) {
			return
		}
		return parent.interface()		
	}

	$.fn.processControls = function( data) {

		data = data || {}

		this.bnFilter('[bn-control]').each(function() {
			var elt = $(this)

			var controlName = elt.attr('bn-control')
			elt.removeAttr('bn-control')
			//console.log('controlName', controlName)



			$$.createControl(controlName, elt)
		})

		return this

	}	

	$.fn.interface = function() {
		return (this.length == 0) ? null : this.get(0).ctrl
	}

	$.fn.dispose = function() {
		console.log('[Core] dispose')
		this.find('.CustomControl').each(function() {		
			var iface = $(this).interface()
			if (typeof iface == 'object' && typeof iface.dispose == 'function') {
				iface.dispose()
			}
			delete $(this).get(0).ctrl
		})
		return this
	}

})();
(function() {

	$.fn.processEvents = function(data) {
		//console.log('processEvents', data)
		if (typeof data != 'object') {
			console.error(`[core] processEvents called with bad parameter 'data' (must be an object):`, data)
			return
		}
		this.bnFindEx('bn-event', true, function(elt, attrName, varName) {
			//console.log('bn-event', attrName, varName)
			var f = attrName.split('.')
			var eventName = f[0]
			var selector = f[1]

			var fn = data[varName]
			if (typeof fn == 'function') {
				var iface = elt.interface()
				if (iface && typeof iface.on == 'function') {
					iface.on(eventName, fn.bind(iface))
					return
				}

				var useNativeEvents = ['mouseenter', 'mouseleave'].indexOf(eventName) != -1

				if (selector != undefined) {

					if (useNativeEvents) {
						elt.get(0).addEventListener(eventName, function(ev) {
							var target = $(ev.target)
							if (target.hasClass(selector)) {
								fn.call(ev.target, ev)
							}

						})					
					}
					else {
						elt.on(eventName, '.' + selector, fn)
					}

				}
				else {
					if (useNativeEvents) {
						elt.get(0).addEventListener(eventName, function(ev) {
								fn.call(ev.target, ev)
						
						})
					}
					else {
						elt.on(eventName, fn)
					}
				}				
			}
			else {
				console.warn(`[Core] processEvents: variable '${varName}' is not a function defined in data`, data)
			}		
		})
		return this
	
	}

})();
(function() {

	$.fn.getValue = function() {
		var type = this.attr('type')
		if (this.get(0).tagName == 'INPUT' && type == 'checkbox') {
			return this.prop('checked')
		}
		var iface = this.interface()
		if (iface && typeof iface.getValue == 'function') {
			return iface.getValue()
		}
		var ret = this.val()

		if (type == 'number' || type == 'range') {
			ret = parseFloat(ret)
		}
		return ret
	}


	$.fn.setValue = function(value) {
		if (this.get(0).tagName == 'INPUT' && this.attr('type') == 'checkbox') {
			this.prop('checked', value)
			return
		}

		var iface = this.interface()
		if (iface && typeof iface.setValue == 'function') {
			iface.setValue(value)
		}
		else {
			this.val(value)
		}
	}



	$.fn.getFormData = function() {
		var ret = {}
		this.find('[name]').each(function() {
			var elt = $(this)
			var name = elt.attr('name')
			ret[name] = elt.getValue()

		})

		return ret
	}

	$.fn.setFormData = function(data) {

		//console.log('setFormData', data)
		if (this.get(0).tagName == "FORM") {
			this.get(0).reset()
		}

		for(var name in data) {
			var value = data[name]
			console.log('for', name, value)
			var elt = this.find(`[name=${name}]`)
			console.log('elt', elt.length)
			if (elt.length) {
				elt.setValue(value)				
			}

		
		}

		return this
	}

	$.fn.processFormData = function(data) {
		if (data == undefined) {
			return this
		}

		if (typeof data != 'object') {
			console.error(`[core] processFormData called with bad parameter 'data' (must be an object):`, data)
			return this
		}

		this.bnFind('bn-form', true, function(elt, varName) {
			//console.log('bn-text', varName)
			var value = data[varName]
			if (typeof value == 'object') {
				elt.setFormData(value)
			}
			else {
				console.warn(`[Core] processFormData: variable '${varName}' is not an object defined in data`, data)
			}
			
		})
		return this
	
	}


})();
(function() {


	$.fn.processContextMenu = function(data) {
		if (data == undefined) {
			return this
		}

		if (typeof data != 'object') {
			console.error(`[core] processContextMenu called with bad parameter 'data' (must be an object):`, data)
			return this
		}

		this.bnFind('bn-menu', true, function(elt, varName) {
			//console.log('bn-text', varName)
			var value = data[varName]
			if (typeof value == 'object') {
				var id = elt.uniqueId().attr('id')
				console.log('[processContextMenu] id', id)
				$.contextMenu({
					selector: '#' + id,
					callback: function(key) {
						//console.log('[processContextMenu] callback', key)
						elt.trigger('menuChange', [key])
					},
					items: value
				})
			}
			else {
				console.warn(`[Core] processContextMenu: variable '${varName}' is not an object defined in data`, data)
			}
			
		})
		return this
	
	}


})();
(function() {

	function splitAttr(attrValue, cbk) {
		attrValue.split(',').forEach(function(item) {
			var list = item.split(':')
			if (list.length == 2) {
				var name = list[0].trim()
				var value = list[1].trim()
				cbk(name, value)
			}
			else {
				console.error(`[Core] splitAttr(${attrName}) 'attrValue' not correct:`, item)
			}
		})		
	}

	function getVarValue(varName, data) {
		//console.log('getVarValue', varName, data)
		var ret = data
		for(let f of varName.split('.')) {
			
			if (typeof ret == 'object' && f in ret) {
				ret = ret[f]
			}
			else {
				//console.warn(`[Core] getVarValue: attribut '${varName}' is not in object:`, data)
				return undefined
			}
			
			//console.log('f', f, 'ret', ret)
		}
		//console.log('ret', ret)
		return ret
	}

	function getValue(ctx, varName, fn) {

		//console.log('[Core] getValue', varName, ctx)

		var not = false
		if (varName.startsWith('!')) {
			varName = varName.substr(1)
			not = true
		}			

		var prefixName = varName.split('.')[0]
		//console.log('[Core] prefixName', prefixName)
		if (ctx.varsToUpdate && ctx.varsToUpdate.indexOf(prefixName) < 0) {
			return
		}

		var func = ctx.data[varName]
		var value

		if (typeof func == 'function') {
			value = func.call(ctx.data)
		}
		else {
			value = getVarValue(varName, ctx.data)
		}

		if (value == undefined) {
			//console.warn(`[Core] processTemplate: variable '${varName}' is not defined in object data:`, data)
			return
		}
		//console.log('value', value)
		if (typeof value == 'boolean' && not) {
			value = !value
		}
		fn(value)
	}

	function bnIf(ctx) {
		getValue(ctx, ctx.dirValue, function(value) {
			if (value === false) {
				ctx.elt.remove()
			}
		})		
	}

	function bnShow(ctx) {
		getValue(ctx, ctx.dirValue, function(value) {
			if (typeof value == 'boolean') {
				ctx.elt.bnVisible(value)
			}				
			else {
				console.warn(`[Core] bn-show: variable '${varName}' is not an boolean`, data)
			}
		})		
	}


	function bnEach(ctx) {
		var f = ctx.dirValue.split(' ')
		if (f.length != 3 || f[1] != 'of') {
			console.error('[Core] bn-each called with bad arguments:', dirValue)
			return
		}
		var iter = f[0]
		var varName = f[2]
		//console.log('bn-each iter', iter,  ctx.template)
		
		getValue(ctx, varName, function(value) {
			if (Array.isArray(value)) {

				ctx.elt.empty()
				
				value.forEach(function(item) {
					var itemData = $.extend({}, ctx.data)
					itemData[iter] = item
					//var $item = $(ctx.template)
					var $item = ctx.template.clone()
					$item.processUI(itemData)
					ctx.elt.append($item)
				})
			}	
			else {
				console.warn(`[Core] bn-each: variable '${varName}' is not an array`, data)
			}			
		})
	}

	function bnText(ctx) {
		//console.log('[Core] bnText', ctx)
		getValue(ctx, ctx.dirValue, function(value) {
			ctx.elt.text(value)
		})
	}
	

	function bnForm(ctx) {
		//console.log('[Core] bnText', ctx)
		getValue(ctx, ctx.dirValue, function(value) {
			ctx.elt.setFormData(value)
		})
	}
	

	function bnHtml(ctx) {
		getValue(ctx, ctx.dirValue, function(value) {
			ctx.elt.html(value)
		})
	}

	function bnCombo(ctx) {
		getValue(ctx, ctx.dirValue, function(value) {
			ctx.elt.initCombo(value)
		})
	}

	function bnOptions(ctx) {
		getValue(ctx, ctx.dirValue, function(value) {
			ctx.elt.data('$options', value)
		})
	}


	function bnVal(ctx) {
		getValue(ctx, ctx.dirValue, function(value) {
			ctx.elt.setValue(value)
		})
	}


	function bnProp(ctx) {
		splitAttr(ctx.dirValue, function(propName, varName) {
			getValue(ctx, varName, function(value) {
				if (typeof value == 'boolean') {
					ctx.elt.prop(propName, value)
				}				
				else {
					console.warn(`[Core] bn-prop: variable '${varName}' is not an boolean`, data)
				}
			})	
		})
	}

	function bnAttr(ctx) {
		splitAttr(ctx.dirValue, function(attrName, varName) {
			getValue(ctx, varName, function(value) {
				ctx.elt.attr(attrName, value)
			})
		})
	}

	function bnStyle(ctx) {
		splitAttr(ctx.dirValue, function(attrName, varName) {
			getValue(ctx, varName, function(value) {
				ctx.elt.css(attrName, value)
			})
		})
	}


	function bnData(ctx) {
		splitAttr(ctx.dirValue, function(attrName, varName) {
			getValue(ctx, varName, function(value) {
				ctx.elt.setProp(attrName, value)
			})
		})
	}


	function bnClass(ctx) {
		splitAttr(ctx.dirValue, function(propName, varName) {
			getValue(ctx, varName, function(value) {
				if (typeof value == 'boolean') {
					if (value) {
						ctx.elt.addClass(propName)
					}
					else {
						ctx.elt.removeClass(propName)
					}				
				}	
				else {
					console.warn(`[Core] bn-class: variable '${varName}' is not an boolean`, data)
				}
			})	
		})
	}	


	var dirMap = {
		'bn-each': bnEach,			
		'bn-if': bnIf,
		'bn-text': bnText,	
		'bn-html': bnHtml,
		'bn-options': bnOptions,			
		'bn-list': bnCombo,			
		'bn-val': bnVal,	
		'bn-prop': bnProp,
		'bn-attr': bnAttr,	
		'bn-data': bnData,			
		'bn-class': bnClass,
		'bn-show': bnShow,
		'bn-style': bnStyle,
		'bn-form': bnForm
	}

	$.fn.setProp = function(attrName, value) {
		var iface = this.interface()
		if (iface && iface.setProp) {
			iface.setProp(attrName, value)
		}
		else {
			this.data(attrName, value)
		}

		return this
	}



	$.fn.processTemplate = function(data) {
		//console.log('[Core] processTemplate')
		var that = this

		var dirList = []

		for(let k in dirMap) {
			this.bnFind(k, true, function(elt, dirValue) {
				var template
				if (k == 'bn-each') {
					template = elt.children().remove().clone()//.get(0).outerHTML
					//console.log('template', template)
				}
				if (k == 'bn-val') {
					elt.data('$val', dirValue)
					var updateEvent = elt.attr('bn-update')
					if (updateEvent != undefined) {
						elt.removeAttr('bn-update')
						elt.on(updateEvent, function(ev, ui) {
							//console.log('ui', ui)

							var value = (ui &&  ui.value) ||  $(this).getValue()
							//console.log('value', value)
							that.trigger('data:update', [dirValue, value, elt])
						})
					}
				}

				dirList.push({directive: k, elt: elt, dirValue: dirValue, template: template})
			})
		}

		if (data) {
			this.updateTemplate(dirList, data)
		}
				
		return dirList

	}	

	$.fn.updateTemplate = function(dirList, data, varsToUpdate, excludeElt) {
		//console.log('[core] updateTemplate', data, varsToUpdate)

			//console.log('data', data)
		varsToUpdate = varsToUpdate || Object.keys(data)
		//console.log('varsToUpdate', varsToUpdate)

		dirList.forEach(function(dirItem) {
			var fn = dirMap[dirItem.directive]
			if (typeof fn == 'function' && dirItem.elt != excludeElt) {
				dirItem.data = data;
				dirItem.varsToUpdate = varsToUpdate;
				fn(dirItem)
			}
		})			
		

		
		return this

	}	


})();
(function() {

	$.fn.processUI = function(data) {
		//console.log('processUI', data, this.html())
		var dirList = this.processTemplate(data)
		this.processControls(data)
		//.processFormData(data)
		.processContextMenu(data)
		return dirList
	}

})();
(function() {

	$.fn.bnFilter = function(selector) {
		return this.find(selector).add(this.filter(selector))
	}

	$.fn.bnFind = function(attrName, removeAttr, cbk) {
		this.bnFilter(`[${attrName}]`).each(function() {
			var elt = $(this)
			var attrValue = elt.attr(attrName)
			if (removeAttr) {
				elt.removeAttr(attrName)
			}		
			cbk(elt, attrValue)
		})
	}

	$.fn.bnFindEx = function(attrName, removeAttr, cbk) {
		this.bnFind(attrName, removeAttr, function(elt, attrValue) {
			attrValue.split(',').forEach(function(item) {
				var list = item.split(':')
				if (list.length == 2) {
					var name = list[0].trim()
					var value = list[1].trim()
					cbk(elt, name, value)
				}
				else {
					console.error(`[Core] bnFindEx(${attrName}) 'attrValue' not correct:`, item)
				}
			})
		})
	}

	$.fn.bnVisible = function(isVisible) {
		if (isVisible) {
			this.show()
		}
		else {
			this.hide()
		}
		return this	
	}

	$.fn.initCombo = function(values) {
		this
		.empty()
		.append(values.map(function(value) {
			return `<option value=${value}>${value}</option>`
		}))

		return this
	}


})();

$$.showAlert = function(text, title, callback) {
	title = title || 'Information'
	$('<div>', {title: title})
		.append($('<p>').html(text))
		.dialog({
			classes: {
				'ui-dialog-titlebar-close': 'no-close'
			},
			//width: 'auto',
			minWidth: 200,
			maxHeight: 400,
			modal: true,
			close: function() {
				$(this).dialog('destroy')
			},
			buttons: [
				{
					text: 'Close',
					click: function() {
						$(this).dialog('close')
						if (typeof callback == 'function') {
							callback()
						}
					}
				}
			]
		})
};	


$$.showConfirm = function(text, title, callback) {
	title = title || 'Information'
	$('<div>', {title: title})
		.append($('<p>').html(text))
		.dialog({

			modal: true,

			close: function() {
				$(this).dialog('destroy')
			},
			buttons: [
				{
					text: 'Cancel',
					//class: 'w3-button w3-red bn-no-corner',
					click: function() {
						$(this).dialog('close')

					}
				},
				{
					text: 'OK',
					//class: 'w3-button w3-blue bn-no-corner',
					click: function() {
						$(this).dialog('close')
						if (typeof callback == 'function') {
							callback()
						}
					}
				}					
			]
		})
};
	


$$.showPicture = function(title, pictureUrl) {
	$('<div>', {title: title})
		.append($('<div>', {class: 'bn-flex-col bn-align-center'})
			.append($('<img>', {src: pictureUrl}))
		)
		.dialog({

			modal: true,
			width: 'auto',
			maxHeight: 600,
			maxWidth: 600,
			//position: {my: 'center center', at: 'center center'},

			close: function() {
				$(this).dialog('destroy')
			}

		})
};




$$.showPrompt = function(label, title, callback, options) {
	title = title || 'Information'
	options = $.extend({type: 'text'}, options)
	//console.log('options', options)

	var div = $('<div>', {title: title})
		.append($('<form>')
			.append($('<p>').text(label))
			.append($('<input>', {class: 'value'}).attr(options).prop('required', true).css('width', '100%'))
			.append($('<input>', {type: 'submit'}).hide())
			.on('submit', function(ev) {
				ev.preventDefault()
				div.dialog('close')
				if (typeof callback == 'function') {
					var val = div.find('.value').val()
					callback(val)
				}				
			})
		)
		.dialog({
			classes: {
				'ui-dialog-titlebar-close': 'no-close'
			},
			modal: true,
			close: function() {
				$(this).dialog('destroy')
			},
			buttons: [
				{
					text: 'Cancel',
					click: function() {
						$(this).dialog('close')
					}
				},
				{
					text: 'Apply',
					click: function() {
						$(this).find('[type=submit]').click()
					}
				}
			]
		})
};


(function(){

	
	function isObject(a) {
		return (typeof a == 'object') && !Array.isArray(a)
	}

	$$.checkType = function(value, type, isOptional) {
		//console.log('checkType',value, type, isOptional)
		if (typeof value == 'undefined' && isOptional === true) {
			return true
		}

		if (typeof type == 'string') {
			return typeof value == type
		}

		if (Array.isArray(value)) {
			if (!Array.isArray(type)) {
				return false
			}

			if (type.length == 0) {
				return true // no item type checking
			}
			for(let i of value) {
				var ret = false
				for(let t of type) {
					ret |= $$.checkType(i, t)
				}
				if (!ret) {
					return false
				}
			}

			return true
		}

		if (isObject(type)) {
			if (!isObject(value)) {
				return false
			}
			for(let f in type) {

				//console.log('f', f, 'value', value)
				var newType = type[f]

				var isOptional = false
				if (f.startsWith('$')) {
					f = f.substr(1)
					isOptional = true
				}
				if (!$$.checkType(value[f], newType, isOptional)) {
					return false
				}

			}

			return true
		}
		return false
	}	


})();

$$.dataURLtoBlob = function(dataURL) {
  // Decode the dataURL
  var split = dataURL.split(/[:,;]/)
  var mimeType = split[1]
  var encodage = split[2]
  if (encodage != 'base64') {
  	return
  }
  var data = split[3]

  console.log('mimeType', mimeType)
  console.log('encodage', encodage)
  //console.log('data', data)

  var binary = atob(data)
 // Create 8-bit unsigned array
  var array = []
  for(var i = 0; i < binary.length; i++) {
  	array.push(binary.charCodeAt(i))
  }

  // Return our Blob object
	return new Blob([ new Uint8Array(array) ], {mimeType})
};

$$.extract = function(obj, values) {
	if (typeof values == 'string') {
		values = values.split(',')
	}
	if (!Array.isArray(values) && typeof values == 'object') {
		values = Object.keys(values)
	}
	var ret = {}
	for(var k in obj) {
		if (values.indexOf(k) >= 0) {
			ret[k] = obj[k]
		}
	}
	return ret
};

$$.isImage = function(fileName) {
	return (/\.(gif|jpg|jpeg|png)$/i).test(fileName)
};

$$.loadStyle = function(styleFilePath, callback) {	
	//console.log('[Core] loadStyle', styleFilePath)

	$(function() {
		var cssOk = $('head').find(`link[href="${styleFilePath}"]`).length
		if (cssOk != 1) {
			console.log(`[Core] loading '${styleFilePath}' dependancy`)
			$('<link>', {href: styleFilePath, rel: 'stylesheet'})
			.on('load', function() {
				console.log(`[Core] '${styleFilePath}' loaded`)
				if (typeof callback == 'function') {
					callback()
				}
			})
			.appendTo($('head'))
		}
	})
};

$$.obj2Array = function(obj) {
	var ret = []
	for(var key in obj) {
		ret.push({key: key, value: obj[key]})
	}
	return ret
};

(function() {

var inputFile = $('<input>', {type: 'file'}).on('change', function() {
	var onApply = $(this).data('onApply')
	var fileName = this.files[0]
	if (typeof onApply == 'function') {
		onApply(fileName)
	}
})

$$.openFileDialog = function(onApply) {
	inputFile.data('onApply', onApply)
	inputFile.click()
}

})();


$$.readFileAsDataURL = function(fileName, onRead) {
	var fileReader = new FileReader()

	fileReader.onload = function() {
		if (typeof onRead == 'function') {
			onRead(fileReader.result)
		}
	}
	fileReader.readAsDataURL(fileName)
};

$$.readTextFile = function(fileName, onRead) {
	var fileReader = new FileReader()

	fileReader.onload = function() {
		if (typeof onRead == 'function') {
			onRead(fileReader.result)
		}
	}
	fileReader.readAsText(fileName)
};

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiYm9vdC9pbmRleC5qcyIsImNvbnRyb2xsZXJzL2RpYWxvZ0NvbnRyb2xsZXIuanMiLCJjb250cm9sbGVycy9mb3JtRGlhbG9nQ29udHJvbGxlci5qcyIsImNvbnRyb2xsZXJzL3ZpZXcuanMiLCJjb3JlL2NvbnRyb2xzLmpzIiwiY29yZS9vYmplY3RzQW5kU2VydmljZXMuanMiLCJwbHVnaW5zL2JpbmRpbmcuanMiLCJwbHVnaW5zL2NvbnRyb2wuanMiLCJwbHVnaW5zL2V2ZW50LmpzIiwicGx1Z2lucy9mb3JtLmpzIiwicGx1Z2lucy9tZW51LmpzIiwicGx1Z2lucy90ZW1wbGF0ZS5qcyIsInBsdWdpbnMvdWkuanMiLCJwbHVnaW5zL3V0aWwuanMiLCJ1aS9zaG93QWxlcnQuanMiLCJ1aS9zaG93Q29uZmlybS5qcyIsInVpL3Nob3dQaWN0dXJlLmpzIiwidWkvc2hvd1Byb21wdC5qcyIsInV0aWwvY2hlY2tUeXBlLmpzIiwidXRpbC9kYXRhVVJMdG9CbG9iLmpzIiwidXRpbC9leHRyYWN0LmpzIiwidXRpbC9pc0ltYWdlLmpzIiwidXRpbC9sb2FkU3R5bGUuanMiLCJ1dGlsL29iajJBcnJheS5qcyIsInV0aWwvb3BlbkZpbGVEaWFsb2cuanMiLCJ1dGlsL3JlYWRGaWxlQXNEYXRhVVJMLmpzIiwidXRpbC9yZWFkVGV4dEZpbGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjb3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7XHJcblxyXG5cdFxyXG5cdHdpbmRvdy4kJCA9IHt9XHJcblxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKXtcclxuXHJcbnZhciBjdXJSb3V0ZVxyXG5cdFxyXG5cclxuXHJcbiQkLnN0YXJ0QXBwID0gZnVuY3Rpb24obWFpbkNvbnRyb2xOYW1lLCBjb25maWcpIHtcclxuXHQkJC52aWV3Q29udHJvbGxlcignYm9keScsIHtcclxuXHRcdHRlbXBsYXRlOiBgPGRpdiBibi1jb250cm9sPVwiJHttYWluQ29udHJvbE5hbWV9XCIgY2xhc3M9XCJtYWluUGFuZWxcIiBibi1vcHRpb25zPVwiY29uZmlnXCI+PC9kaXY+YCxcclxuXHRcdGRhdGE6IHtjb25maWd9XHJcblx0fSlcclxufVxyXG5cclxuZnVuY3Rpb24gcHJvY2Vzc1JvdXRlKCkge1xyXG5cdHZhciBwcmV2Um91dGUgPSBjdXJSb3V0ZVxyXG5cdHZhciBocmVmID0gbG9jYXRpb24uaHJlZlxyXG5cdHZhciBpZHggPSBocmVmLmluZGV4T2YoJyMnKVxyXG5cdGN1clJvdXRlID0gKGlkeCAhPT0gLTEpICA/IGhyZWYuc3Vic3RyKGlkeCsxKSA6ICcvJ1xyXG5cdC8vY29uc29sZS5sb2coJ1tDb3JlXSBuZXdSb3V0ZScsIGN1clJvdXRlLCBwcmV2Um91dGUpXHJcblxyXG5cclxuXHQkKHdpbmRvdykudHJpZ2dlcigncm91dGVDaGFuZ2UnLCB7Y3VyUm91dGU6Y3VyUm91dGUsIHByZXZSb3V0ZTogcHJldlJvdXRlfSlcclxuXHJcbn1cdFxyXG5cclxuJCQuY29uZmlnUmVhZHkgPSBmdW5jdGlvbihvbkNvbmZpZ1JlYWR5KSB7XHJcblxyXG5cclxuXHQkKGZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdHZhciBhcHBOYW1lID0gbG9jYXRpb24ucGF0aG5hbWUuc3BsaXQoJy8nKVsyXVxyXG5cclxuXHRcdGNvbnNvbGUubG9nKGBbQ29yZV0gQXBwICcke2FwcE5hbWV9JyBzdGFydGVkIDopYClcclxuXHRcdGNvbnNvbGUubG9nKCdbQ29yZV0galF1ZXJ5IHZlcnNpb24nLCAkLmZuLmpxdWVyeSlcclxuXHRcdGNvbnNvbGUubG9nKCdbQ29yZV0galF1ZXJ5IFVJIHZlcnNpb24nLCAkLnVpLnZlcnNpb24pXHJcblxyXG5cdFx0XHJcblxyXG5cclxuXHRcdCQod2luZG93KS5vbigncG9wc3RhdGUnLCBmdW5jdGlvbihldnQpIHtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnW3BvcHN0YXRlXSBzdGF0ZScsIGV2dC5zdGF0ZSlcclxuXHRcdFx0cHJvY2Vzc1JvdXRlKClcclxuXHRcdH0pXHJcblxyXG5cclxuXHRcdCQuZ2V0SlNPTihgL2FwaS9hcHAvY29uZmlnLyR7YXBwTmFtZX1gKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24oY29uZmlnKSB7XHJcblxyXG5cdFx0XHRjb25zb2xlLmxvZygnY29uZmlnJywgY29uZmlnKVxyXG5cclxuXHRcdFx0dmFyIG9wdGlvbnMgPSB7XHJcblx0XHRcdFx0dXNlck5hbWU6IGNvbmZpZy4kdXNlck5hbWUsXHJcblx0XHRcdFx0YXBwTmFtZVxyXG5cdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0JCQuY29uZmlndXJlU2VydmljZSgnV2ViU29ja2V0U2VydmljZScsIG9wdGlvbnMpXHJcblx0XHRcclxuXHRcdFx0XHJcblx0XHRcdFxyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdCQoJ2JvZHknKS5wcm9jZXNzQ29udHJvbHMoKSAvLyBwcm9jZXNzIEhlYWRlckNvbnRyb2xcclxuXHRcdFx0XHRcclxuXHRcdFx0XHRvbkNvbmZpZ1JlYWR5KGNvbmZpZylcclxuXHRcdFx0fVxyXG5cdFx0XHRjYXRjaChlKSB7XHJcblx0XHRcdFx0dmFyIGh0bWwgPSBgXHJcblx0XHRcdFx0XHQ8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCI+XHJcblx0XHRcdFx0XHRcdDxwIGNsYXNzPVwidzMtdGV4dC1yZWRcIj4ke2V9PC9wPlxyXG5cdFx0XHRcdFx0PC9kaXY+XHJcblx0XHRcdFx0YFxyXG5cdFx0XHRcdCQoJ2JvZHknKS5odG1sKGh0bWwpXHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdFxyXG5cdFx0XHRwcm9jZXNzUm91dGUoKVxyXG5cdFx0fSlcclxuXHRcdC5jYXRjaCgoanF4aHIpID0+IHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ2pxeGhyJywganF4aHIpXHJcblx0XHRcdC8vdmFyIHRleHQgPSBKU09OLnN0cmluZ2lmeShqcXhoci5yZXNwb25zZUpTT04sIG51bGwsIDQpXHJcblx0XHRcdHZhciB0ZXh0ID0ganF4aHIucmVzcG9uc2VUZXh0XHJcblx0XHRcdHZhciBodG1sID0gYFxyXG5cdFx0XHRcdDxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIj5cclxuXHRcdFx0XHRcdDxwIGNsYXNzPVwidzMtdGV4dC1yZWRcIj4ke3RleHR9PC9wPlxyXG5cdFx0XHRcdFx0PGEgaHJlZj1cIi9kaXNjb25uZWN0XCIgY2xhc3M9XCJ3My1idG4gdzMtYmx1ZVwiPkxvZ291dDwvYT5cclxuXHRcdFx0XHQ8L2Rpdj5cclxuXHRcdFx0YFxyXG5cdFx0XHQkKCdib2R5JykuaHRtbChodG1sKVxyXG5cdFx0fSlcdFx0XHRcdFxyXG5cdFx0XHRcclxuXHR9KVxyXG5cdFxyXG5cclxufVxyXG5cclxuXHRcclxufSkoKTtcclxuIiwiJCQuZGlhbG9nQ29udHJvbGxlciA9IGZ1bmN0aW9uKHRpdGxlLCBvcHRpb25zKSB7XHJcblx0dmFyIGRpdiA9ICQoJzxkaXY+Jywge3RpdGxlOiB0aXRsZX0pXHJcblxyXG5cdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZGl2LCBvcHRpb25zKVxyXG5cclxuXHR2YXIgZGxnT3B0aW9ucyA9ICQuZXh0ZW5kKHtcclxuXHRcdGF1dG9PcGVuOiBmYWxzZSxcclxuXHRcdG1vZGFsOiB0cnVlLFxyXG5cdFx0d2lkdGg6ICdhdXRvJyxcdFx0XHJcblx0fSwgb3B0aW9ucy5vcHRpb25zKVxyXG5cclxuXHQvL2NvbnNvbGUubG9nKCdkbGdPcHRpb25zJywgZGxnT3B0aW9ucylcclxuXHJcblx0ZGl2LmRpYWxvZyhkbGdPcHRpb25zKVxyXG5cclxuXHRjdHJsLnNob3cgPSBmdW5jdGlvbigpIHtcclxuXHRcdGRpdi5kaWFsb2coJ29wZW4nKVxyXG5cdH1cclxuXHJcblx0Y3RybC5oaWRlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRkaXYuZGlhbG9nKCdjbG9zZScpXHJcblx0fVxyXG5cclxuXHRjdHJsLnNldE9wdGlvbiA9IGZ1bmN0aW9uKG9wdGlvbk5hbWUsIHZhbHVlKSB7XHJcblx0XHRkaXYuZGlhbG9nKCdvcHRpb24nLCBvcHRpb25OYW1lLCB2YWx1ZSlcclxuXHR9XHJcblxyXG5cdHJldHVybiBjdHJsXHJcbn07XHJcblxyXG4iLCIkJC5mb3JtRGlhbG9nQ29udHJvbGxlciA9IGZ1bmN0aW9uKHRpdGxlLCBvcHRpb25zKSB7XHJcblx0dmFyIGRpdiA9ICQoJzxkaXY+Jywge3RpdGxlOiB0aXRsZX0pXHJcblx0dmFyIGZvcm0gPSAkKCc8Zm9ybT4nKVxyXG5cdFx0LmFwcGVuZFRvKGRpdilcclxuXHRcdC5vbignc3VibWl0JywgZnVuY3Rpb24oZXYpIHtcclxuXHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxyXG5cdFx0XHRkaXYuZGlhbG9nKCdjbG9zZScpXHJcblx0XHRcdGlmICh0eXBlb2Ygb3B0aW9ucy5vbkFwcGx5ID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRvcHRpb25zLm9uQXBwbHkuY2FsbChjdHJsLCBjdHJsLmVsdC5nZXRGb3JtRGF0YSgpKVxyXG5cdFx0XHR9XHRcdFx0XHRcclxuXHRcdH0pXHJcblx0dmFyIHN1Ym1pdEJ0biA9ICQoJzxpbnB1dD4nLCB7dHlwZTogJ3N1Ym1pdCcsIGhpZGRlbjogdHJ1ZX0pLmFwcGVuZFRvKGZvcm0pXHJcblxyXG5cdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoZm9ybSwgb3B0aW9ucylcclxuXHRkaXYuZGlhbG9nKHtcclxuXHRcdGF1dG9PcGVuOiBmYWxzZSxcclxuXHRcdG1vZGFsOiB0cnVlLFxyXG5cdFx0d2lkdGg6ICdhdXRvJyxcclxuXHRcdGNsb3NlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0Ly8kKHRoaXMpLmRpYWxvZygnZGVzdHJveScpXHJcblx0XHR9LFxyXG5cdFx0YnV0dG9uczoge1xyXG5cdFx0XHQnQ2FuY2VsJzogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0fSxcclxuXHRcdFx0J0FwcGx5JzogZnVuY3Rpb24oKSB7XHRcdFx0XHRcdFxyXG5cdFx0XHRcdHN1Ym1pdEJ0bi5jbGljaygpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9KVxyXG5cdGN0cmwuc2hvdyA9IGZ1bmN0aW9uKGRhdGEsIG9uQXBwbHkpIHtcclxuXHRcdGlmICh0eXBlb2YgY3RybC5iZWZvcmVTaG93ID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0Y3RybC5iZWZvcmVTaG93KClcclxuXHRcdH1cclxuXHRcdG9wdGlvbnMub25BcHBseSA9IG9uQXBwbHlcclxuXHRcdGN0cmwuZWx0LnNldEZvcm1EYXRhKGRhdGEpXHJcblx0XHRkaXYuZGlhbG9nKCdvcGVuJylcclxuXHR9XHJcblxyXG5cdHJldHVybiBjdHJsXHJcbn07XHJcbiIsIihmdW5jdGlvbigpe1xyXG5cclxuXHJcblxyXG5jbGFzcyBWaWV3Q29udHJvbGxlciB7XHJcbiAgICBjb25zdHJ1Y3RvcihlbHQsIG9wdGlvbnMpIHtcclxuICAgIFx0Ly9jb25zb2xlLmxvZygnVmlld0NvbnRyb2xsZXInLCBvcHRpb25zKVxyXG4gICAgXHRpZiAodHlwZW9mIGVsdCA9PSAnc3RyaW5nJykge1xyXG4gICAgXHRcdGVsdCA9ICQoZWx0KVxyXG4gICAgXHR9XHJcblxyXG4gICAgXHRvcHRpb25zID0gJC5leHRlbmQoe30sIG9wdGlvbnMpXHJcbiAgICAgICAgdGhpcy5lbHQgPSBlbHRcclxuXHJcbiAgICAgICAgdGhpcy5lbHQub24oJ2RhdGE6dXBkYXRlJywgKGV2LCBuYW1lLCB2YWx1ZSwgZXhjbHVkZUVsdCkgPT4ge1xyXG4gICAgICAgIFx0Ly9jb25zb2xlLmxvZygnW1ZpZXdDb250cm9sbGVyXSBkYXRhOmNoYW5nZScsIG5hbWUsIHZhbHVlKVxyXG4gICAgICAgIFx0dGhpcy5zZXREYXRhKG5hbWUsIHZhbHVlLCBleGNsdWRlRWx0KVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy50ZW1wbGF0ZSA9PSAnc3RyaW5nJykge1xyXG4gICAgICAgIFx0dGhpcy5lbHQgPSAkKG9wdGlvbnMudGVtcGxhdGUpLmFwcGVuZFRvKGVsdClcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5tb2RlbCA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zLmRhdGEpXHJcbiAgICAgICAgdGhpcy5ydWxlcyA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zLnJ1bGVzKVxyXG4gICAgICAgIHRoaXMud2F0Y2hlcyA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zLndhdGNoZXMpXHJcblxyXG4gICAgICAgIC8vIGdlbmVyYXRlIGF1dG9tYXRpYyBydWxlcyBmb3IgY29tcHV0ZWQgZGF0YSAoYWthIGZ1bmN0aW9uKVxyXG4gICAgICAgIGZvcih2YXIgayBpbiB0aGlzLm1vZGVsKSB7XHJcbiAgICAgICAgXHR2YXIgZGF0YSA9IHRoaXMubW9kZWxba11cclxuICAgICAgICBcdGlmICh0eXBlb2YgZGF0YSA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgXHRcdHZhciBmdW5jVGV4dCA9IGRhdGEudG9TdHJpbmcoKVxyXG4gICAgICAgIFx0XHQvL2NvbnNvbGUubG9nKCdmdW5jVGV4dCcsIGZ1bmNUZXh0KVxyXG4gICAgICAgIFx0XHR2YXIgcnVsZXMgPSBbXVxyXG4gICAgICAgIFx0XHRmdW5jVGV4dC5yZXBsYWNlKC90aGlzLihbYS16QS1aMC05Xy1dezEsfSkvZywgZnVuY3Rpb24obWF0Y2gsIGNhcHR1cmVPbmUpIHtcclxuICAgICAgICBcdFx0XHQvL2NvbnNvbGUubG9nKCdjYXB0dXJlT25lJywgY2FwdHVyZU9uZSlcclxuICAgICAgICBcdFx0XHRydWxlcy5wdXNoKGNhcHR1cmVPbmUpXHJcbiAgICAgICAgXHRcdH0pXHJcbiAgICAgICAgXHRcdHRoaXMucnVsZXNba10gPSBydWxlcy50b1N0cmluZygpXHJcbiAgICAgICAgXHR9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL2NvbnNvbGUubG9nKCdydWxlcycsIHRoaXMucnVsZXMpXHJcbiAgICAgICAgdGhpcy5kaXJMaXN0ID0gdGhpcy5lbHQucHJvY2Vzc1VJKHRoaXMubW9kZWwpXHJcblxyXG5cclxuICAgICAgICAvL3RoaXMuZWx0LnByb2Nlc3NVSSh0aGlzLm1vZGVsKVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5ldmVudHMgPT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhpcy5lbHQucHJvY2Vzc0V2ZW50cyhvcHRpb25zLmV2ZW50cylcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2NvcGUgPSB0aGlzLmVsdC5wcm9jZXNzQmluZGluZ3MoKVxyXG4gICAgICAgIC8vY29uc29sZS5sb2coJ3Njb3BlJywgdGhpcy5zY29wZSlcclxuICAgICAgIFxyXG4gICAgICAgIHZhciBpbml0ID0gb3B0aW9ucy5pbml0XHJcbiAgICAgICAgaWYgKHR5cGVvZiBpbml0ID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBcdGluaXQuY2FsbCh0aGlzKVxyXG4gICAgICAgIH1cclxuICAgIH0gXHJcblxyXG4gICAgc2V0RGF0YShhcmcxLCBhcmcyLCBleGNsdWRlRWx0KSB7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnW1ZpZXdDb250cm9sbGVyXSBzZXREYXRhJywgYXJnMSwgYXJnMilcclxuICAgICAgICB2YXIgZGF0YSA9IGFyZzFcclxuICAgICAgICBpZiAodHlwZW9mIGFyZzEgPT0gJ3N0cmluZycpIHtcclxuICAgICAgICBcdGRhdGEgPSB7fVxyXG4gICAgICAgIFx0ZGF0YVthcmcxXSA9IGFyZzJcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnW1ZpZXdDb250cm9sbGVyXSBzZXREYXRhJywgZGF0YSlcclxuICAgICAgICAkLmV4dGVuZCh0aGlzLm1vZGVsLCBkYXRhKVxyXG4gICAgICAgIC8vY29uc29sZS5sb2coJ21vZGVsJywgdGhpcy5tb2RlbClcclxuICAgICAgICB0aGlzLnVwZGF0ZShPYmplY3Qua2V5cyhkYXRhKSwgZXhjbHVkZUVsdClcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGUoZmllbGRzTmFtZSwgZXhjbHVkZUVsdCkge1xyXG4gICAgXHQvL2NvbnNvbGUubG9nKCdbVmlld0NvbnRyb2xsZXJdIHVwZGF0ZScsIGZpZWxkc05hbWUpXHJcbiAgICBcdGlmICh0eXBlb2YgZmllbGRzTmFtZSA9PSAnc3RyaW5nJykge1xyXG4gICAgXHRcdGZpZWxkc05hbWUgPSBmaWVsZHNOYW1lLnNwbGl0KCcsJylcclxuICAgIFx0fVxyXG5cclxuXHJcbiAgICBcdGlmIChBcnJheS5pc0FycmF5KGZpZWxkc05hbWUpKSB7XHJcbiAgICBcdFx0dmFyIGZpZWxkc1NldCA9IHt9XHJcbiAgICBcdFx0ZmllbGRzTmFtZS5mb3JFYWNoKChmaWVsZCkgPT4ge1xyXG5cclxuICAgIFx0XHRcdHZhciB3YXRjaCA9IHRoaXMud2F0Y2hlc1tmaWVsZF1cclxuICAgIFx0XHRcdGlmICh0eXBlb2Ygd2F0Y2ggPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgXHRcdFx0XHR3YXRjaC5jYWxsKG51bGwsIHRoaXMubW9kZWxbZmllbGRdKVxyXG4gICAgXHRcdFx0fVxyXG4gICAgXHRcdFx0ZmllbGRzU2V0W2ZpZWxkXSA9IDFcclxuXHJcbiAgICBcdFx0XHRmb3IodmFyIHJ1bGUgaW4gdGhpcy5ydWxlcykge1xyXG4gICAgXHRcdFx0XHRpZiAodGhpcy5ydWxlc1tydWxlXS5zcGxpdCgnLCcpLmluZGV4T2YoZmllbGQpICE9IC0xKSB7XHJcbiAgICBcdFx0XHRcdFx0ZmllbGRzU2V0W3J1bGVdID0gMVxyXG4gICAgXHRcdFx0XHR9XHJcbiAgICBcdFx0XHR9XHJcbiAgICBcdFx0fSlcclxuXHJcblxyXG4gICAgXHRcdHRoaXMuZWx0LnVwZGF0ZVRlbXBsYXRlKHRoaXMuZGlyTGlzdCwgdGhpcy5tb2RlbCwgT2JqZWN0LmtleXMoZmllbGRzU2V0KSwgZXhjbHVkZUVsdClcclxuICAgIFx0fVxyXG5cclxuICAgIH1cclxufVxyXG5cclxuXHJcbiAgICAkJC52aWV3Q29udHJvbGxlciA9IGZ1bmN0aW9uIChlbHQsIG9wdGlvbnMpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFZpZXdDb250cm9sbGVyKGVsdCwgb3B0aW9ucylcclxuICAgIH1cclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCl7XHJcblxyXG5cclxuXHJcbiQkLnJlZ2lzdGVyQ29udHJvbCA9IGZ1bmN0aW9uKG5hbWUsIGFyZzEsIGFyZzIpIHtcclxuXHQkJC5yZWdpc3Rlck9iamVjdCgnY29udHJvbHMnLCBuYW1lLCBhcmcxLCBhcmcyKVxyXG59XHJcblxyXG4kJC5yZWdpc3RlckNvbnRyb2xFeCA9IGZ1bmN0aW9uKG5hbWUsIG9wdGlvbnMpIHtcclxuXHRpZiAoISQkLmNoZWNrVHlwZShvcHRpb25zLCB7XHJcblx0XHQkZGVwczogWydzdHJpbmcnXSxcclxuXHRcdCRpZmFjZTogJ3N0cmluZycsXHJcblx0XHQkZXZlbnRzOiAnc3RyaW5nJyxcclxuXHRcdGluaXQ6ICdmdW5jdGlvbidcclxuXHR9KSkge1xyXG5cdFx0Y29uc29sZS5lcnJvcihgW0NvcmVdIHJlZ2lzdGVyQ29udHJvbEV4OiBiYWQgb3B0aW9uc2AsIG9wdGlvbnMpXHJcblx0XHRyZXR1cm5cclxuXHR9XHJcblxyXG5cclxuXHR2YXIgZGVwcyA9IG9wdGlvbnMuZGVwcyB8fCBbXVxyXG5cclxuXHJcblx0JCQucmVnaXN0ZXJPYmplY3QoJ2NvbnRyb2xzJywgbmFtZSwgZGVwcywgb3B0aW9ucylcclxufVxyXG5cclxuXHJcblxyXG4kJC5jcmVhdGVDb250cm9sID0gZnVuY3Rpb24oY29udHJvbE5hbWUsIGVsdCkge1xyXG5cdGVsdC5hZGRDbGFzcyhjb250cm9sTmFtZSlcclxuXHRlbHQuYWRkQ2xhc3MoJ0N1c3RvbUNvbnRyb2wnKS51bmlxdWVJZCgpXHRcclxuXHR2YXIgY3RybCA9ICQkLmdldE9iamVjdCgnY29udHJvbHMnLCBjb250cm9sTmFtZSlcclxuXHRcdFxyXG5cdGlmIChjdHJsICE9IHVuZGVmaW5lZCkge1xyXG5cdFx0Ly9jb25zb2xlLmxvZygnY3JlYXRlQ29udHJvbCcsIGNvbnRyb2xOYW1lLCBjdHJsKVxyXG5cdFx0aWYgKGN0cmwuc3RhdHVzID09PSAgJ29rJykge1xyXG5cdFx0XHRcclxuXHRcdFx0dmFyIGlmYWNlID0ge31cclxuXHJcblx0XHRcdFxyXG5cdFx0XHRpZiAodHlwZW9mIGN0cmwuZm4gPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdHZhciBhcmdzID0gW2VsdF0uY29uY2F0KGN0cmwuZGVwcylcclxuXHRcdFx0XHR2YXIgZGVmYXVsdE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZWx0LmRhdGEoJyRvcHRpb25zJykpXHJcblx0XHRcdFx0Y29uc29sZS5sb2coYFtDb3JlXSBpbnN0YW5jZSBjb250cm9sICcke2NvbnRyb2xOYW1lfSdgKVxyXG5cdFx0XHRcdGN0cmwuZm4uYXBwbHkoaWZhY2UsIGFyZ3MpXHRcclxuXHRcdFx0XHRpZmFjZS5vcHRpb25zID0gZGVmYXVsdE9wdGlvbnNcclxuXHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmICh0eXBlb2YgY3RybC5mbiA9PSAnb2JqZWN0Jykge1xyXG5cdFx0XHRcdHZhciBpbml0ID0gY3RybC5mbi5pbml0XHJcblx0XHRcdFx0dmFyIHByb3BzID0gY3RybC5mbi5wcm9wcyB8fCB7fVxyXG5cdFx0XHRcdHZhciBkZWZhdWx0T3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBjdHJsLmZuLm9wdGlvbnMsIGVsdC5kYXRhKCckb3B0aW9ucycpKVxyXG5cclxuXHRcdFx0XHR2YXIgb3B0aW9ucyA9IHt9XHJcblxyXG5cdFx0XHRcdGZvcih2YXIgbyBpbiBkZWZhdWx0T3B0aW9ucykge1xyXG5cdFx0XHRcdFx0b3B0aW9uc1tvXSA9IChlbHQuZGF0YShvKSAhPSB1bmRlZmluZWQpID8gZWx0LmRhdGEobykgOiBkZWZhdWx0T3B0aW9uc1tvXVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Zm9yKHZhciBwIGluIHByb3BzKSB7XHJcblx0XHRcdFx0XHRvcHRpb25zW3BdID0gKGVsdC5kYXRhKHApICE9IHVuZGVmaW5lZCkgPyBlbHQuZGF0YShwKSA6IHByb3BzW3BdLnZhbFxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnQ29tcHV0ZWQgT3B0aW9ucycsIG9wdGlvbnMpXHJcblxyXG5cdFx0XHRcdGlmICh0eXBlb2YgaW5pdCA9PSAnZnVuY3Rpb24nKSB7XHJcblxyXG5cdFx0XHRcdFx0dmFyIGFyZ3MgPSBbZWx0LCBvcHRpb25zXS5jb25jYXQoY3RybC5kZXBzKVxyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coYFtDb3JlXSBpbnN0YW5jZSBjb250cm9sICcke2NvbnRyb2xOYW1lfScgd2l0aCBvcHRpb25zYCwgb3B0aW9ucylcclxuXHRcdFx0XHRcdGluaXQuYXBwbHkoaWZhY2UsIGFyZ3MpXHJcblx0XHRcdFx0XHRpZmFjZS5vcHRpb25zID0gb3B0aW9uc1xyXG5cdFx0XHRcdFx0aWZhY2UuZXZlbnRzID0gY3RybC5mbi5ldmVudHNcclxuXHJcblx0XHRcdFx0XHRpZiAoT2JqZWN0LmtleXMocHJvcHMpLmxlbmd0aCAhPSAwKSB7XHJcblx0XHRcdFx0XHRcdGlmYWNlLnNldFByb3AgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xyXG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coYFtDb3JlXSBzZXREYXRhYCwgbmFtZSwgdmFsdWUpXHJcblx0XHRcdFx0XHRcdFx0dmFyIHNldHRlciA9IHByb3BzW25hbWVdICYmIHByb3BzW25hbWVdLnNldFxyXG5cdFx0XHRcdFx0XHRcdGlmICh0eXBlb2Ygc2V0dGVyID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR2YXIgc2V0dGVyID0gaWZhY2Vbc2V0dGVyXVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIHNldHRlciA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRzZXR0ZXIuY2FsbChudWxsLCB2YWx1ZSlcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdFx0aWZhY2Uub3B0aW9uc1tuYW1lXSA9IHZhbHVlXHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGlmYWNlLnByb3BzID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdFx0dmFyIHJldCA9IHt9XHJcblx0XHRcdFx0XHRcdFx0Zm9yKHZhciBrIGluIHByb3BzKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRyZXRba10gPSBpZmFjZS5vcHRpb25zW2tdXHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0dmFyIGdldHRlciA9IHByb3BzW2tdLmdldFxyXG5cdFx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBnZXR0ZXIgPT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0Z2V0dGVyID0gaWZhY2VbZ2V0dGVyXVx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRcdGlmICh0eXBlb2YgZ2V0dGVyID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0cmV0W2tdID0gZ2V0dGVyLmNhbGwobnVsbClcclxuXHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldFxyXG5cdFx0XHRcdFx0XHR9XHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBjb250cm9sICcke2NvbnRyb2xOYW1lfScgbWlzc2luZyBpbml0IGZ1bmN0aW9uYClcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZmFjZS5uYW1lID0gY29udHJvbE5hbWVcclxuXHRcdFx0ZWx0LmdldCgwKS5jdHJsID0gaWZhY2VcclxuXHRcdFx0XHJcblx0XHRcdHJldHVybiBpZmFjZVx0XHRcdFx0XHJcblx0XHR9XHJcblxyXG5cclxuXHR9XHJcblx0ZWxzZSB7XHJcblx0XHR0aHJvdyhgW0NvcmVdIGNvbnRyb2wgJyR7Y29udHJvbE5hbWV9JyBpcyBub3QgcmVnaXN0ZXJlZGApXHJcblx0fVxyXG59XHJcblxyXG4kJC5nZXRSZWdpc3RlcmVkQ29udHJvbHMgPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgY29udHJvbHMgPSAkJC5nZXRPYmplY3REb21haW4oJ2NvbnRyb2xzJylcclxuXHRyZXR1cm4gT2JqZWN0LmtleXMoY29udHJvbHMpLmZpbHRlcigobmFtZSkgPT4gIW5hbWUuc3RhcnRzV2l0aCgnJCcpKVxyXG59XHJcblxyXG4kJC5nZXRSZWdpc3RlcmVkQ29udHJvbHNFeCA9IGZ1bmN0aW9uKCkge1xyXG5cdHZhciBjb250cm9scyA9ICQkLmdldE9iamVjdERvbWFpbignY29udHJvbHMnKVxyXG5cdHZhciBsaWJzID0ge31cclxuXHRmb3IodmFyIGsgaW4gY29udHJvbHMpIHtcclxuXHRcdHZhciBpbmZvID0gY29udHJvbHNba10uZm5cclxuXHRcdHZhciBsaWJOYW1lID0gaW5mby5saWJcclxuXHRcdGlmICh0eXBlb2YgbGliTmFtZSA9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRpZiAobGlic1tsaWJOYW1lXSA9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRsaWJzW2xpYk5hbWVdID0gW11cclxuXHRcdFx0fVxyXG5cdFx0XHRsaWJzW2xpYk5hbWVdLnB1c2goaylcclxuXHJcblx0XHR9XHJcblx0fVxyXG5cdHJldHVybiBsaWJzXHJcbn1cclxuXHJcbiQkLmdldENvbnRyb2xJbmZvID0gZnVuY3Rpb24oY29udHJvbE5hbWUpIHtcclxuXHR2YXIgY29udHJvbHMgPSAkJC5nZXRPYmplY3REb21haW4oJ2NvbnRyb2xzJylcclxuXHR2YXIgaW5mbyA9IGNvbnRyb2xzW2NvbnRyb2xOYW1lXVxyXG5cclxuXHRpZiAoaW5mbyA9PSB1bmRlZmluZWQpIHtcclxuXHRcdGNvbnNvbGUubG9nKGBjb250cm9sICcke2NvbnRyb2xOYW1lfScgaXMgbm90IHJlZ2lzdGVyZWRgKVxyXG5cdFx0cmV0dXJuXHJcblx0fVxyXG5cdGluZm8gPSBpbmZvLmZuXHJcblxyXG5cdHZhciByZXQgPSAkJC5leHRyYWN0KGluZm8sICdkZXBzLG9wdGlvbnMsbGliJylcclxuXHJcblx0aWYgKHR5cGVvZiBpbmZvLmV2ZW50cyA9PSAnc3RyaW5nJykge1xyXG5cdFx0cmV0LmV2ZW50cyA9IGluZm8uZXZlbnRzLnNwbGl0KCcsJylcclxuXHR9XHJcblxyXG5cdHZhciBwcm9wcyA9IHt9XHJcblx0Zm9yKHZhciBrIGluIGluZm8ucHJvcHMpIHtcclxuXHRcdHByb3BzW2tdID0gaW5mby5wcm9wc1trXS52YWxcclxuXHR9XHJcblx0aWYgKE9iamVjdC5rZXlzKHByb3BzKS5sZW5ndGggIT0gMCkge1xyXG5cdFx0cmV0LnByb3BzID0gcHJvcHNcclxuXHR9XHJcblx0aWYgKHR5cGVvZiBpbmZvLmlmYWNlID09ICdzdHJpbmcnKSB7XHJcblx0XHRyZXQuaWZhY2UgPSBpbmZvLmlmYWNlLnNwbGl0KCc7JylcclxuXHR9XHJcblx0cmV0dXJuIHJldFxyXG5cdC8vcmV0dXJuIGNvbnRyb2xzW2NvbnRyb2xOYW1lXS5mblxyXG59XHJcblxyXG5cclxuJCQuZ2V0Q29udHJvbHNUcmVlID0gZnVuY3Rpb24oc2hvd1doYXQpIHtcclxuXHRzaG93V2hhdCA9IHNob3dXaGF0IHx8ICcnXHJcblx0dmFyIHNob3dPcHRpb25zID0gc2hvd1doYXQuc3BsaXQoJywnKVxyXG5cdHZhciB0cmVlID0gW11cclxuXHQkKCcuQ3VzdG9tQ29udHJvbCcpLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgaWZhY2UgPSAkKHRoaXMpLmludGVyZmFjZSgpXHJcblxyXG5cdFx0dmFyIGl0ZW0gPSB7bmFtZTppZmFjZS5uYW1lLCBlbHQ6ICQodGhpcyksIHBhcmVudDogbnVsbH1cclxuXHRcdGl0ZW0uaWQgPSAkKHRoaXMpLmF0dHIoJ2lkJylcclxuXHJcblx0XHRpZiAodHlwZW9mIGlmYWNlLmV2ZW50cyA9PSAnc3RyaW5nJyAmJlxyXG5cdFx0XHQoKHNob3dPcHRpb25zLmluZGV4T2YoJ2V2ZW50cycpID49IDAgfHwgc2hvd1doYXQgPT09ICdhbGwnKSkpIHtcclxuXHRcdFx0aXRlbS5ldmVudHMgPSBpZmFjZS5ldmVudHMuc3BsaXQoJywnKVxyXG5cdFx0fVx0XHRcdFxyXG5cclxuXHRcdHRyZWUucHVzaChpdGVtKVxyXG5cclxuXHRcdGlmIChzaG93T3B0aW9ucy5pbmRleE9mKCdpZmFjZScpID49IDAgfHwgc2hvd1doYXQgPT09ICdhbGwnKSB7XHJcblxyXG5cdFx0XHR2YXIgZnVuYyA9IFtdXHJcblx0XHRcdGZvcih2YXIgayBpbiBpZmFjZSkge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgaWZhY2Vba10gPT0gJ2Z1bmN0aW9uJyAmJiBrICE9ICdwcm9wcycgJiYgayAhPSAnc2V0UHJvcCcpIHtcclxuXHRcdFx0XHRcdGZ1bmMucHVzaChrKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoZnVuYy5sZW5ndGggIT0gMCkge1xyXG5cdFx0XHRcdGl0ZW0uaWZhY2UgPSBmdW5jXHJcblx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0fVxyXG5cclxuXHJcblxyXG5cdFx0aWYgKHR5cGVvZiBpZmFjZS5wcm9wcyA9PSAnZnVuY3Rpb24nICYmIFxyXG5cdFx0XHQoKHNob3dPcHRpb25zLmluZGV4T2YoJ3Byb3BzJykgPj0gMCB8fCBzaG93V2hhdCA9PT0gJ2FsbCcpKSkge1xyXG5cdFx0XHRpdGVtLnByb3BzID0gaWZhY2UucHJvcHMoKVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgaWZhY2UuZ2V0VmFsdWUgPT0gJ2Z1bmN0aW9uJyAmJlxyXG5cdFx0XHQoKHNob3dPcHRpb25zLmluZGV4T2YoJ3ZhbHVlJykgPj0gMCB8fCBzaG93V2hhdCA9PT0gJ2FsbCcpKSkge1xyXG5cdFx0XHRpdGVtLnZhbHVlID0gaWZhY2UuZ2V0VmFsdWUoKVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgaWZhY2Uub3B0aW9ucyA9PSAnb2JqZWN0JyAmJiBPYmplY3Qua2V5cyhpZmFjZS5vcHRpb25zKS5sZW5ndGggIT0gMCAmJlxyXG5cdFx0XHQoKHNob3dPcHRpb25zLmluZGV4T2YoJ29wdGlvbnMnKSA+PSAwIHx8IHNob3dXaGF0ID09PSAnYWxsJykpKSB7XHJcblx0XHRcdGl0ZW0ub3B0aW9ucyA9IGlmYWNlLm9wdGlvbnNcclxuXHRcdH1cdFxyXG5cclxuXHRcdFx0XHRcdFxyXG5cdFx0Ly9jb25zb2xlLmxvZygnbmFtZScsIG5hbWUpXHJcblx0XHRpdGVtLmNoaWxkcyA9IFtdXHJcblxyXG5cclxuXHRcdHZhciBwYXJlbnRzID0gJCh0aGlzKS5wYXJlbnRzKCcuQ3VzdG9tQ29udHJvbCcpXHJcblx0XHQvL2NvbnNvbGUubG9nKCdwYXJlbnRzJywgcGFyZW50cylcclxuXHRcdGlmIChwYXJlbnRzLmxlbmd0aCAhPSAwKSB7XHJcblx0XHRcdHZhciBwYXJlbnQgPSBwYXJlbnRzLmVxKDApXHJcblx0XHRcdGl0ZW0ucGFyZW50ID0gcGFyZW50XHJcblx0XHRcdHRyZWUuZm9yRWFjaChmdW5jdGlvbihpKSB7XHJcblx0XHRcdFx0aWYgKGkuZWx0LmdldCgwKSA9PSBwYXJlbnQuZ2V0KDApKSB7XHJcblx0XHRcdFx0XHRpLmNoaWxkcy5wdXNoKGl0ZW0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0XHRcclxuXHJcblx0XHR9XHJcblx0fSlcclxuXHQvL2NvbnNvbGUubG9nKCd0cmVlJywgdHJlZSlcclxuXHJcblx0dmFyIHJldCA9IFtdXHJcblx0dHJlZS5mb3JFYWNoKGZ1bmN0aW9uKGkpIHtcclxuXHRcdGlmIChpLnBhcmVudCA9PSBudWxsKSB7XHJcblx0XHRcdHJldC5wdXNoKGkpXHJcblx0XHR9XHJcblx0XHRpZiAoaS5jaGlsZHMubGVuZ3RoID09IDApIHtcclxuXHRcdFx0ZGVsZXRlIGkuY2hpbGRzXHJcblx0XHR9XHJcblx0XHRkZWxldGUgaS5wYXJlbnRcclxuXHRcdGRlbGV0ZSBpLmVsdFxyXG5cdH0pXHJcblxyXG5cdHJldHVybiBKU09OLnN0cmluZ2lmeShyZXQsIG51bGwsIDQpXHJcblxyXG59XHJcblxyXG59KSgpO1xyXG4iLCIoZnVuY3Rpb24oKXtcclxuXHJcbnZhciByZWdpc3RlcmVkT2JqZWN0cyA9IHtcclxuXHRzZXJ2aWNlczoge31cclxufVxyXG5cclxudmFyIHtzZXJ2aWNlc30gPSByZWdpc3RlcmVkT2JqZWN0c1xyXG5cclxuZnVuY3Rpb24gaXNEZXBzT2soZGVwcykge1xyXG5cdHJldHVybiBkZXBzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcclxuXHJcblx0XHRyZXR1cm4gcHJldiAmJiAoY3VyICE9IHVuZGVmaW5lZClcclxuXHR9LCB0cnVlKVx0XHRcclxufVxyXG5cclxuJCQuZ2V0T2JqZWN0RG9tYWluID0gZnVuY3Rpb24oZG9tYWluKSB7XHJcblx0cmV0dXJuIHJlZ2lzdGVyZWRPYmplY3RzW2RvbWFpbl1cclxufVxyXG5cclxuJCQucmVnaXN0ZXJPYmplY3QgPSBmdW5jdGlvbihkb21haW4sIG5hbWUsIGFyZzEsIGFyZzIpIHtcclxuXHR2YXIgZGVwcyA9IFtdXHJcblx0dmFyIGZuID0gYXJnMVxyXG5cdGlmIChBcnJheS5pc0FycmF5KGFyZzEpKSB7XHJcblx0XHRkZXBzID0gYXJnMVxyXG5cdFx0Zm4gPSBhcmcyXHJcblx0fVxyXG5cdGlmICh0eXBlb2YgZG9tYWluICE9ICdzdHJpbmcnIHx8IHR5cGVvZiBuYW1lICE9ICdzdHJpbmcnIHx8IHR5cGVvZiBmbiA9PSAndW5kZWZpbmVkJyB8fCAhQXJyYXkuaXNBcnJheShkZXBzKSkge1xyXG5cdFx0dGhyb3coJ1tDb3JlXSByZWdpc3Rlck9iamVjdCBjYWxsZWQgd2l0aCBiYWQgYXJndW1lbnRzJylcclxuXHR9IFxyXG5cdGNvbnNvbGUubG9nKGBbQ29yZV0gcmVnaXN0ZXIgb2JqZWN0ICcke2RvbWFpbn06JHtuYW1lfScgd2l0aCBkZXBzYCwgZGVwcylcclxuXHRpZiAocmVnaXN0ZXJlZE9iamVjdHNbZG9tYWluXSA9PSB1bmRlZmluZWQpIHtcclxuXHRcdHJlZ2lzdGVyZWRPYmplY3RzW2RvbWFpbl0gPSB7fVxyXG5cdH1cclxuXHRyZWdpc3RlcmVkT2JqZWN0c1tkb21haW5dW25hbWVdID0ge2RlcHM6IGRlcHMsIGZuIDpmbiwgc3RhdHVzOiAnbm90bG9hZGVkJ31cclxufVx0XHJcblxyXG4kJC5nZXRPYmplY3QgPSBmdW5jdGlvbihkb21haW4sIG5hbWUpIHtcclxuXHQvL2NvbnNvbGUubG9nKGBbQ29yZV0gZ2V0T2JqZWN0ICR7ZG9tYWlufToke25hbWV9YClcclxuXHR2YXIgZG9tYWluID0gcmVnaXN0ZXJlZE9iamVjdHNbZG9tYWluXVxyXG5cdHZhciByZXQgPSBkb21haW4gJiYgZG9tYWluW25hbWVdXHJcblx0aWYgKHJldCAmJiByZXQuc3RhdHVzID09ICdub3Rsb2FkZWQnKSB7XHJcblx0XHRyZXQuZGVwcyA9ICQkLmdldFNlcnZpY2VzKHJldC5kZXBzKVxyXG5cdFx0cmV0LnN0YXR1cyA9IGlzRGVwc09rKHJldC5kZXBzKSA/ICdvaycgOiAna28nXHJcblx0fVxyXG5cdHJldHVybiByZXRcclxufVxyXG5cclxuJCQuZ2V0U2VydmljZXMgPSBmdW5jdGlvbihkZXBzKSB7XHJcblx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIGdldFNlcnZpY2VzJywgZGVwcylcclxuXHRyZXR1cm4gZGVwcy5tYXAoZnVuY3Rpb24oZGVwTmFtZSkge1xyXG5cdFx0dmFyIHNydiA9IHNlcnZpY2VzW2RlcE5hbWVdXHJcblx0XHRpZiAoc3J2KSB7XHJcblx0XHRcdGlmIChzcnYuc3RhdHVzID09ICdub3Rsb2FkZWQnKSB7XHJcblx0XHRcdFx0dmFyIGRlcHMyID0gJCQuZ2V0U2VydmljZXMoc3J2LmRlcHMpXHJcblx0XHRcdFx0dmFyIGNvbmZpZyA9IHNydi5jb25maWcgfHwge31cclxuXHRcdFx0XHRjb25zb2xlLmxvZyhgW0NvcmVdIGluc3RhbmNlIHNlcnZpY2UgJyR7ZGVwTmFtZX0nIHdpdGggY29uZmlnYCwgY29uZmlnKVxyXG5cdFx0XHRcdHZhciBhcmdzID0gW2NvbmZpZ10uY29uY2F0KGRlcHMyKVxyXG5cdFx0XHRcdHNydi5vYmogPSBzcnYuZm4uYXBwbHkobnVsbCwgYXJncylcclxuXHRcdFx0XHRzcnYuc3RhdHVzID0gJ3JlYWR5J1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBzcnYub2JqXHRcdFx0XHRcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHQvL3Nydi5zdGF0dXMgPSAnbm90cmVnaXN0ZXJlZCdcclxuXHRcdFx0dGhyb3coYFtDb3JlXSBzZXJ2aWNlICcke2RlcE5hbWV9JyBpcyBub3QgcmVnaXN0ZXJlZGApXHJcblx0XHR9XHJcblxyXG5cdH0pXHJcbn1cclxuXHJcblxyXG5cclxuJCQuY29uZmlndXJlU2VydmljZSA9IGZ1bmN0aW9uKG5hbWUsIGNvbmZpZykge1xyXG5cdGNvbnNvbGUubG9nKCdbQ29yZV0gY29uZmlndXJlU2VydmljZScsIG5hbWUsIGNvbmZpZylcclxuXHRpZiAodHlwZW9mIG5hbWUgIT0gJ3N0cmluZycgfHwgdHlwZW9mIGNvbmZpZyAhPSAnb2JqZWN0Jykge1xyXG5cdFx0Y29uc29sZS53YXJuKCdbQ29yZV0gY29uZmlndXJlU2VydmljZSBjYWxsZWQgd2l0aCBiYWQgYXJndW1lbnRzJylcclxuXHRcdHJldHVyblxyXG5cdH0gXHRcclxuXHJcblx0dmFyIHNydiA9IHNlcnZpY2VzW25hbWVdXHJcblx0aWYgKHNydikge1xyXG5cdFx0c3J2LmNvbmZpZyA9IGNvbmZpZ1xyXG5cdH1cclxuXHRlbHNlIHtcclxuXHRcdHRocm93KGBbY29uZmlndXJlU2VydmljZV0gc2VydmljZSAnJHtuYW1lfScgaXMgbm90IHJlZ2lzdGVyZWRgKVxyXG5cdH1cclxuXHJcbn1cclxuXHJcbiQkLnJlZ2lzdGVyU2VydmljZSA9IGZ1bmN0aW9uKG5hbWUsIGFyZzEsIGFyZzIpIHtcclxuXHQkJC5yZWdpc3Rlck9iamVjdCgnc2VydmljZXMnLCBuYW1lLCBhcmcxLCBhcmcyKVxyXG59XHJcblxyXG4kJC5nZXRSZWdpc3RlcmVkU2VydmljZXMgPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgcmV0ID0gW11cclxuXHRmb3IodmFyIGsgaW4gc2VydmljZXMpIHtcclxuXHRcdHZhciBpbmZvID0gc2VydmljZXNba11cclxuXHRcdHJldC5wdXNoKHtuYW1lOiBrLCBzdGF0dXM6IGluZm8uc3RhdHVzfSlcclxuXHR9XHJcblx0cmV0dXJuIHJldFxyXG59XHJcblxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQuZm4ucHJvY2Vzc0JpbmRpbmdzID0gZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0dmFyIGRhdGEgPSB7fVxyXG5cclxuXHRcdHRoaXMuYm5GaW5kKCdibi1iaW5kJywgdHJ1ZSwgZnVuY3Rpb24oZWx0LCB2YXJOYW1lKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2JuLXRleHQnLCB2YXJOYW1lKVxyXG5cdFx0XHRkYXRhW3Zhck5hbWVdID0gZWx0XHJcblx0XHR9KVxyXG5cdFx0dGhpcy5ibkZpbmQoJ2JuLWlmYWNlJywgdHJ1ZSwgZnVuY3Rpb24oZWx0LCB2YXJOYW1lKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2JuLXRleHQnLCB2YXJOYW1lKVxyXG5cdFx0XHRkYXRhW3Zhck5hbWVdID0gZWx0LmludGVyZmFjZSgpXHJcblx0XHR9KVxyXG5cdFx0cmV0dXJuIGRhdGFcclxuXHRcclxuXHR9XHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHRcclxuXHJcblxyXG5cdCQuZm4uZ2V0UGFyZW50SW50ZXJmYWNlID0gZnVuY3Rpb24ocGFyZW50Q3RybE5hbWUpIHtcclxuXHRcdHZhciBwYXJlbnQgPSB0aGlzLnBhcmVudCgpXHJcblx0XHRpZiAoIXBhcmVudC5oYXNDbGFzcyhwYXJlbnRDdHJsTmFtZSkpIHtcclxuXHRcdFx0cmV0dXJuXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gcGFyZW50LmludGVyZmFjZSgpXHRcdFxyXG5cdH1cclxuXHJcblx0JC5mbi5wcm9jZXNzQ29udHJvbHMgPSBmdW5jdGlvbiggZGF0YSkge1xyXG5cclxuXHRcdGRhdGEgPSBkYXRhIHx8IHt9XHJcblxyXG5cdFx0dGhpcy5ibkZpbHRlcignW2JuLWNvbnRyb2xdJykuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIGVsdCA9ICQodGhpcylcclxuXHJcblx0XHRcdHZhciBjb250cm9sTmFtZSA9IGVsdC5hdHRyKCdibi1jb250cm9sJylcclxuXHRcdFx0ZWx0LnJlbW92ZUF0dHIoJ2JuLWNvbnRyb2wnKVxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdjb250cm9sTmFtZScsIGNvbnRyb2xOYW1lKVxyXG5cclxuXHJcblxyXG5cdFx0XHQkJC5jcmVhdGVDb250cm9sKGNvbnRyb2xOYW1lLCBlbHQpXHJcblx0XHR9KVxyXG5cclxuXHRcdHJldHVybiB0aGlzXHJcblxyXG5cdH1cdFxyXG5cclxuXHQkLmZuLmludGVyZmFjZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0cmV0dXJuICh0aGlzLmxlbmd0aCA9PSAwKSA/IG51bGwgOiB0aGlzLmdldCgwKS5jdHJsXHJcblx0fVxyXG5cclxuXHQkLmZuLmRpc3Bvc2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdGNvbnNvbGUubG9nKCdbQ29yZV0gZGlzcG9zZScpXHJcblx0XHR0aGlzLmZpbmQoJy5DdXN0b21Db250cm9sJykuZWFjaChmdW5jdGlvbigpIHtcdFx0XHJcblx0XHRcdHZhciBpZmFjZSA9ICQodGhpcykuaW50ZXJmYWNlKClcclxuXHRcdFx0aWYgKHR5cGVvZiBpZmFjZSA9PSAnb2JqZWN0JyAmJiB0eXBlb2YgaWZhY2UuZGlzcG9zZSA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0aWZhY2UuZGlzcG9zZSgpXHJcblx0XHRcdH1cclxuXHRcdFx0ZGVsZXRlICQodGhpcykuZ2V0KDApLmN0cmxcclxuXHRcdH0pXHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cdH1cclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHQkLmZuLnByb2Nlc3NFdmVudHMgPSBmdW5jdGlvbihkYXRhKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdwcm9jZXNzRXZlbnRzJywgZGF0YSlcclxuXHRcdGlmICh0eXBlb2YgZGF0YSAhPSAnb2JqZWN0Jykge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKGBbY29yZV0gcHJvY2Vzc0V2ZW50cyBjYWxsZWQgd2l0aCBiYWQgcGFyYW1ldGVyICdkYXRhJyAobXVzdCBiZSBhbiBvYmplY3QpOmAsIGRhdGEpXHJcblx0XHRcdHJldHVyblxyXG5cdFx0fVxyXG5cdFx0dGhpcy5ibkZpbmRFeCgnYm4tZXZlbnQnLCB0cnVlLCBmdW5jdGlvbihlbHQsIGF0dHJOYW1lLCB2YXJOYW1lKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2JuLWV2ZW50JywgYXR0ck5hbWUsIHZhck5hbWUpXHJcblx0XHRcdHZhciBmID0gYXR0ck5hbWUuc3BsaXQoJy4nKVxyXG5cdFx0XHR2YXIgZXZlbnROYW1lID0gZlswXVxyXG5cdFx0XHR2YXIgc2VsZWN0b3IgPSBmWzFdXHJcblxyXG5cdFx0XHR2YXIgZm4gPSBkYXRhW3Zhck5hbWVdXHJcblx0XHRcdGlmICh0eXBlb2YgZm4gPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdHZhciBpZmFjZSA9IGVsdC5pbnRlcmZhY2UoKVxyXG5cdFx0XHRcdGlmIChpZmFjZSAmJiB0eXBlb2YgaWZhY2Uub24gPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0aWZhY2Uub24oZXZlbnROYW1lLCBmbi5iaW5kKGlmYWNlKSlcclxuXHRcdFx0XHRcdHJldHVyblxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0dmFyIHVzZU5hdGl2ZUV2ZW50cyA9IFsnbW91c2VlbnRlcicsICdtb3VzZWxlYXZlJ10uaW5kZXhPZihldmVudE5hbWUpICE9IC0xXHJcblxyXG5cdFx0XHRcdGlmIChzZWxlY3RvciAhPSB1bmRlZmluZWQpIHtcclxuXHJcblx0XHRcdFx0XHRpZiAodXNlTmF0aXZlRXZlbnRzKSB7XHJcblx0XHRcdFx0XHRcdGVsdC5nZXQoMCkuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGZ1bmN0aW9uKGV2KSB7XHJcblx0XHRcdFx0XHRcdFx0dmFyIHRhcmdldCA9ICQoZXYudGFyZ2V0KVxyXG5cdFx0XHRcdFx0XHRcdGlmICh0YXJnZXQuaGFzQ2xhc3Moc2VsZWN0b3IpKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRmbi5jYWxsKGV2LnRhcmdldCwgZXYpXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0fSlcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0ZWx0Lm9uKGV2ZW50TmFtZSwgJy4nICsgc2VsZWN0b3IsIGZuKVxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRpZiAodXNlTmF0aXZlRXZlbnRzKSB7XHJcblx0XHRcdFx0XHRcdGVsdC5nZXQoMCkuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGZ1bmN0aW9uKGV2KSB7XHJcblx0XHRcdFx0XHRcdFx0XHRmbi5jYWxsKGV2LnRhcmdldCwgZXYpXHJcblx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdGVsdC5vbihldmVudE5hbWUsIGZuKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIHByb2Nlc3NFdmVudHM6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgYSBmdW5jdGlvbiBkZWZpbmVkIGluIGRhdGFgLCBkYXRhKVxyXG5cdFx0XHR9XHRcdFxyXG5cdFx0fSlcclxuXHRcdHJldHVybiB0aGlzXHJcblx0XHJcblx0fVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQuZm4uZ2V0VmFsdWUgPSBmdW5jdGlvbigpIHtcclxuXHRcdHZhciB0eXBlID0gdGhpcy5hdHRyKCd0eXBlJylcclxuXHRcdGlmICh0aGlzLmdldCgwKS50YWdOYW1lID09ICdJTlBVVCcgJiYgdHlwZSA9PSAnY2hlY2tib3gnKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLnByb3AoJ2NoZWNrZWQnKVxyXG5cdFx0fVxyXG5cdFx0dmFyIGlmYWNlID0gdGhpcy5pbnRlcmZhY2UoKVxyXG5cdFx0aWYgKGlmYWNlICYmIHR5cGVvZiBpZmFjZS5nZXRWYWx1ZSA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdHJldHVybiBpZmFjZS5nZXRWYWx1ZSgpXHJcblx0XHR9XHJcblx0XHR2YXIgcmV0ID0gdGhpcy52YWwoKVxyXG5cclxuXHRcdGlmICh0eXBlID09ICdudW1iZXInIHx8IHR5cGUgPT0gJ3JhbmdlJykge1xyXG5cdFx0XHRyZXQgPSBwYXJzZUZsb2F0KHJldClcclxuXHRcdH1cclxuXHRcdHJldHVybiByZXRcclxuXHR9XHJcblxyXG5cclxuXHQkLmZuLnNldFZhbHVlID0gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdGlmICh0aGlzLmdldCgwKS50YWdOYW1lID09ICdJTlBVVCcgJiYgdGhpcy5hdHRyKCd0eXBlJykgPT0gJ2NoZWNrYm94Jykge1xyXG5cdFx0XHR0aGlzLnByb3AoJ2NoZWNrZWQnLCB2YWx1ZSlcclxuXHRcdFx0cmV0dXJuXHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGlmYWNlID0gdGhpcy5pbnRlcmZhY2UoKVxyXG5cdFx0aWYgKGlmYWNlICYmIHR5cGVvZiBpZmFjZS5zZXRWYWx1ZSA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdGlmYWNlLnNldFZhbHVlKHZhbHVlKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRoaXMudmFsKHZhbHVlKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblxyXG5cclxuXHQkLmZuLmdldEZvcm1EYXRhID0gZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgcmV0ID0ge31cclxuXHRcdHRoaXMuZmluZCgnW25hbWVdJykuZWFjaChmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIGVsdCA9ICQodGhpcylcclxuXHRcdFx0dmFyIG5hbWUgPSBlbHQuYXR0cignbmFtZScpXHJcblx0XHRcdHJldFtuYW1lXSA9IGVsdC5nZXRWYWx1ZSgpXHJcblxyXG5cdFx0fSlcclxuXHJcblx0XHRyZXR1cm4gcmV0XHJcblx0fVxyXG5cclxuXHQkLmZuLnNldEZvcm1EYXRhID0gZnVuY3Rpb24oZGF0YSkge1xyXG5cclxuXHRcdC8vY29uc29sZS5sb2coJ3NldEZvcm1EYXRhJywgZGF0YSlcclxuXHRcdGlmICh0aGlzLmdldCgwKS50YWdOYW1lID09IFwiRk9STVwiKSB7XHJcblx0XHRcdHRoaXMuZ2V0KDApLnJlc2V0KClcclxuXHRcdH1cclxuXHJcblx0XHRmb3IodmFyIG5hbWUgaW4gZGF0YSkge1xyXG5cdFx0XHR2YXIgdmFsdWUgPSBkYXRhW25hbWVdXHJcblx0XHRcdGNvbnNvbGUubG9nKCdmb3InLCBuYW1lLCB2YWx1ZSlcclxuXHRcdFx0dmFyIGVsdCA9IHRoaXMuZmluZChgW25hbWU9JHtuYW1lfV1gKVxyXG5cdFx0XHRjb25zb2xlLmxvZygnZWx0JywgZWx0Lmxlbmd0aClcclxuXHRcdFx0aWYgKGVsdC5sZW5ndGgpIHtcclxuXHRcdFx0XHRlbHQuc2V0VmFsdWUodmFsdWUpXHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzXHJcblx0fVxyXG5cclxuXHQkLmZuLnByb2Nlc3NGb3JtRGF0YSA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdGlmIChkYXRhID09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0eXBlb2YgZGF0YSAhPSAnb2JqZWN0Jykge1xyXG5cdFx0XHRjb25zb2xlLmVycm9yKGBbY29yZV0gcHJvY2Vzc0Zvcm1EYXRhIGNhbGxlZCB3aXRoIGJhZCBwYXJhbWV0ZXIgJ2RhdGEnIChtdXN0IGJlIGFuIG9iamVjdCk6YCwgZGF0YSlcclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmJuRmluZCgnYm4tZm9ybScsIHRydWUsIGZ1bmN0aW9uKGVsdCwgdmFyTmFtZSkge1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdibi10ZXh0JywgdmFyTmFtZSlcclxuXHRcdFx0dmFyIHZhbHVlID0gZGF0YVt2YXJOYW1lXVxyXG5cdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdvYmplY3QnKSB7XHJcblx0XHRcdFx0ZWx0LnNldEZvcm1EYXRhKHZhbHVlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIHByb2Nlc3NGb3JtRGF0YTogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhbiBvYmplY3QgZGVmaW5lZCBpbiBkYXRhYCwgZGF0YSlcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdH0pXHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cdFxyXG5cdH1cclxuXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblxyXG5cdCQuZm4ucHJvY2Vzc0NvbnRleHRNZW51ID0gZnVuY3Rpb24oZGF0YSkge1xyXG5cdFx0aWYgKGRhdGEgPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHR5cGVvZiBkYXRhICE9ICdvYmplY3QnKSB7XHJcblx0XHRcdGNvbnNvbGUuZXJyb3IoYFtjb3JlXSBwcm9jZXNzQ29udGV4dE1lbnUgY2FsbGVkIHdpdGggYmFkIHBhcmFtZXRlciAnZGF0YScgKG11c3QgYmUgYW4gb2JqZWN0KTpgLCBkYXRhKVxyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuYm5GaW5kKCdibi1tZW51JywgdHJ1ZSwgZnVuY3Rpb24oZWx0LCB2YXJOYW1lKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coJ2JuLXRleHQnLCB2YXJOYW1lKVxyXG5cdFx0XHR2YXIgdmFsdWUgPSBkYXRhW3Zhck5hbWVdXHJcblx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcpIHtcclxuXHRcdFx0XHR2YXIgaWQgPSBlbHQudW5pcXVlSWQoKS5hdHRyKCdpZCcpXHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ1twcm9jZXNzQ29udGV4dE1lbnVdIGlkJywgaWQpXHJcblx0XHRcdFx0JC5jb250ZXh0TWVudSh7XHJcblx0XHRcdFx0XHRzZWxlY3RvcjogJyMnICsgaWQsXHJcblx0XHRcdFx0XHRjYWxsYmFjazogZnVuY3Rpb24oa2V5KSB7XHJcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ1twcm9jZXNzQ29udGV4dE1lbnVdIGNhbGxiYWNrJywga2V5KVxyXG5cdFx0XHRcdFx0XHRlbHQudHJpZ2dlcignbWVudUNoYW5nZScsIFtrZXldKVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGl0ZW1zOiB2YWx1ZVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gcHJvY2Vzc0NvbnRleHRNZW51OiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGFuIG9iamVjdCBkZWZpbmVkIGluIGRhdGFgLCBkYXRhKVxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0fSlcclxuXHRcdHJldHVybiB0aGlzXHJcblx0XHJcblx0fVxyXG5cclxuXHJcbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cclxuXHRmdW5jdGlvbiBzcGxpdEF0dHIoYXR0clZhbHVlLCBjYmspIHtcclxuXHRcdGF0dHJWYWx1ZS5zcGxpdCgnLCcpLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xyXG5cdFx0XHR2YXIgbGlzdCA9IGl0ZW0uc3BsaXQoJzonKVxyXG5cdFx0XHRpZiAobGlzdC5sZW5ndGggPT0gMikge1xyXG5cdFx0XHRcdHZhciBuYW1lID0gbGlzdFswXS50cmltKClcclxuXHRcdFx0XHR2YXIgdmFsdWUgPSBsaXN0WzFdLnRyaW0oKVxyXG5cdFx0XHRcdGNiayhuYW1lLCB2YWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRjb25zb2xlLmVycm9yKGBbQ29yZV0gc3BsaXRBdHRyKCR7YXR0ck5hbWV9KSAnYXR0clZhbHVlJyBub3QgY29ycmVjdDpgLCBpdGVtKVxyXG5cdFx0XHR9XHJcblx0XHR9KVx0XHRcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldFZhclZhbHVlKHZhck5hbWUsIGRhdGEpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ2dldFZhclZhbHVlJywgdmFyTmFtZSwgZGF0YSlcclxuXHRcdHZhciByZXQgPSBkYXRhXHJcblx0XHRmb3IobGV0IGYgb2YgdmFyTmFtZS5zcGxpdCgnLicpKSB7XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAodHlwZW9mIHJldCA9PSAnb2JqZWN0JyAmJiBmIGluIHJldCkge1xyXG5cdFx0XHRcdHJldCA9IHJldFtmXVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdC8vY29uc29sZS53YXJuKGBbQ29yZV0gZ2V0VmFyVmFsdWU6IGF0dHJpYnV0ICcke3Zhck5hbWV9JyBpcyBub3QgaW4gb2JqZWN0OmAsIGRhdGEpXHJcblx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZFxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHQvL2NvbnNvbGUubG9nKCdmJywgZiwgJ3JldCcsIHJldClcclxuXHRcdH1cclxuXHRcdC8vY29uc29sZS5sb2coJ3JldCcsIHJldClcclxuXHRcdHJldHVybiByZXRcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldFZhbHVlKGN0eCwgdmFyTmFtZSwgZm4pIHtcclxuXHJcblx0XHQvL2NvbnNvbGUubG9nKCdbQ29yZV0gZ2V0VmFsdWUnLCB2YXJOYW1lLCBjdHgpXHJcblxyXG5cdFx0dmFyIG5vdCA9IGZhbHNlXHJcblx0XHRpZiAodmFyTmFtZS5zdGFydHNXaXRoKCchJykpIHtcclxuXHRcdFx0dmFyTmFtZSA9IHZhck5hbWUuc3Vic3RyKDEpXHJcblx0XHRcdG5vdCA9IHRydWVcclxuXHRcdH1cdFx0XHRcclxuXHJcblx0XHR2YXIgcHJlZml4TmFtZSA9IHZhck5hbWUuc3BsaXQoJy4nKVswXVxyXG5cdFx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIHByZWZpeE5hbWUnLCBwcmVmaXhOYW1lKVxyXG5cdFx0aWYgKGN0eC52YXJzVG9VcGRhdGUgJiYgY3R4LnZhcnNUb1VwZGF0ZS5pbmRleE9mKHByZWZpeE5hbWUpIDwgMCkge1xyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHJcblx0XHR2YXIgZnVuYyA9IGN0eC5kYXRhW3Zhck5hbWVdXHJcblx0XHR2YXIgdmFsdWVcclxuXHJcblx0XHRpZiAodHlwZW9mIGZ1bmMgPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHR2YWx1ZSA9IGZ1bmMuY2FsbChjdHguZGF0YSlcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR2YWx1ZSA9IGdldFZhclZhbHVlKHZhck5hbWUsIGN0eC5kYXRhKVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh2YWx1ZSA9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0Ly9jb25zb2xlLndhcm4oYFtDb3JlXSBwcm9jZXNzVGVtcGxhdGU6IHZhcmlhYmxlICcke3Zhck5hbWV9JyBpcyBub3QgZGVmaW5lZCBpbiBvYmplY3QgZGF0YTpgLCBkYXRhKVxyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHRcdC8vY29uc29sZS5sb2coJ3ZhbHVlJywgdmFsdWUpXHJcblx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJyAmJiBub3QpIHtcclxuXHRcdFx0dmFsdWUgPSAhdmFsdWVcclxuXHRcdH1cclxuXHRcdGZuKHZhbHVlKVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYm5JZihjdHgpIHtcclxuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRpZiAodmFsdWUgPT09IGZhbHNlKSB7XHJcblx0XHRcdFx0Y3R4LmVsdC5yZW1vdmUoKVxyXG5cdFx0XHR9XHJcblx0XHR9KVx0XHRcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGJuU2hvdyhjdHgpIHtcclxuXHRcdGdldFZhbHVlKGN0eCwgY3R4LmRpclZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdib29sZWFuJykge1xyXG5cdFx0XHRcdGN0eC5lbHQuYm5WaXNpYmxlKHZhbHVlKVxyXG5cdFx0XHR9XHRcdFx0XHRcclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gYm4tc2hvdzogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhbiBib29sZWFuYCwgZGF0YSlcclxuXHRcdFx0fVxyXG5cdFx0fSlcdFx0XHJcblx0fVxyXG5cclxuXHJcblx0ZnVuY3Rpb24gYm5FYWNoKGN0eCkge1xyXG5cdFx0dmFyIGYgPSBjdHguZGlyVmFsdWUuc3BsaXQoJyAnKVxyXG5cdFx0aWYgKGYubGVuZ3RoICE9IDMgfHwgZlsxXSAhPSAnb2YnKSB7XHJcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1tDb3JlXSBibi1lYWNoIGNhbGxlZCB3aXRoIGJhZCBhcmd1bWVudHM6JywgZGlyVmFsdWUpXHJcblx0XHRcdHJldHVyblxyXG5cdFx0fVxyXG5cdFx0dmFyIGl0ZXIgPSBmWzBdXHJcblx0XHR2YXIgdmFyTmFtZSA9IGZbMl1cclxuXHRcdC8vY29uc29sZS5sb2coJ2JuLWVhY2ggaXRlcicsIGl0ZXIsICBjdHgudGVtcGxhdGUpXHJcblx0XHRcclxuXHRcdGdldFZhbHVlKGN0eCwgdmFyTmFtZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcblxyXG5cdFx0XHRcdGN0eC5lbHQuZW1wdHkoKVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHZhbHVlLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xyXG5cdFx0XHRcdFx0dmFyIGl0ZW1EYXRhID0gJC5leHRlbmQoe30sIGN0eC5kYXRhKVxyXG5cdFx0XHRcdFx0aXRlbURhdGFbaXRlcl0gPSBpdGVtXHJcblx0XHRcdFx0XHQvL3ZhciAkaXRlbSA9ICQoY3R4LnRlbXBsYXRlKVxyXG5cdFx0XHRcdFx0dmFyICRpdGVtID0gY3R4LnRlbXBsYXRlLmNsb25lKClcclxuXHRcdFx0XHRcdCRpdGVtLnByb2Nlc3NVSShpdGVtRGF0YSlcclxuXHRcdFx0XHRcdGN0eC5lbHQuYXBwZW5kKCRpdGVtKVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH1cdFxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRjb25zb2xlLndhcm4oYFtDb3JlXSBibi1lYWNoOiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGFuIGFycmF5YCwgZGF0YSlcclxuXHRcdFx0fVx0XHRcdFxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGJuVGV4dChjdHgpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ1tDb3JlXSBiblRleHQnLCBjdHgpXHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Y3R4LmVsdC50ZXh0KHZhbHVlKVxyXG5cdFx0fSlcclxuXHR9XHJcblx0XHJcblxyXG5cdGZ1bmN0aW9uIGJuRm9ybShjdHgpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ1tDb3JlXSBiblRleHQnLCBjdHgpXHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Y3R4LmVsdC5zZXRGb3JtRGF0YSh2YWx1ZSlcclxuXHRcdH0pXHJcblx0fVxyXG5cdFxyXG5cclxuXHRmdW5jdGlvbiBibkh0bWwoY3R4KSB7XHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Y3R4LmVsdC5odG1sKHZhbHVlKVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGJuQ29tYm8oY3R4KSB7XHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Y3R4LmVsdC5pbml0Q29tYm8odmFsdWUpXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYm5PcHRpb25zKGN0eCkge1xyXG5cdFx0Z2V0VmFsdWUoY3R4LCBjdHguZGlyVmFsdWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGN0eC5lbHQuZGF0YSgnJG9wdGlvbnMnLCB2YWx1ZSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHJcblx0ZnVuY3Rpb24gYm5WYWwoY3R4KSB7XHJcblx0XHRnZXRWYWx1ZShjdHgsIGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0Y3R4LmVsdC5zZXRWYWx1ZSh2YWx1ZSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHJcblx0ZnVuY3Rpb24gYm5Qcm9wKGN0eCkge1xyXG5cdFx0c3BsaXRBdHRyKGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24ocHJvcE5hbWUsIHZhck5hbWUpIHtcclxuXHRcdFx0Z2V0VmFsdWUoY3R4LCB2YXJOYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nKSB7XHJcblx0XHRcdFx0XHRjdHguZWx0LnByb3AocHJvcE5hbWUsIHZhbHVlKVxyXG5cdFx0XHRcdH1cdFx0XHRcdFxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbQ29yZV0gYm4tcHJvcDogdmFyaWFibGUgJyR7dmFyTmFtZX0nIGlzIG5vdCBhbiBib29sZWFuYCwgZGF0YSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHRcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBibkF0dHIoY3R4KSB7XHJcblx0XHRzcGxpdEF0dHIoY3R4LmRpclZhbHVlLCBmdW5jdGlvbihhdHRyTmFtZSwgdmFyTmFtZSkge1xyXG5cdFx0XHRnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0Y3R4LmVsdC5hdHRyKGF0dHJOYW1lLCB2YWx1ZSlcclxuXHRcdFx0fSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBiblN0eWxlKGN0eCkge1xyXG5cdFx0c3BsaXRBdHRyKGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24oYXR0ck5hbWUsIHZhck5hbWUpIHtcclxuXHRcdFx0Z2V0VmFsdWUoY3R4LCB2YXJOYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdGN0eC5lbHQuY3NzKGF0dHJOYW1lLCB2YWx1ZSlcclxuXHRcdFx0fSlcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHJcblx0ZnVuY3Rpb24gYm5EYXRhKGN0eCkge1xyXG5cdFx0c3BsaXRBdHRyKGN0eC5kaXJWYWx1ZSwgZnVuY3Rpb24oYXR0ck5hbWUsIHZhck5hbWUpIHtcclxuXHRcdFx0Z2V0VmFsdWUoY3R4LCB2YXJOYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdGN0eC5lbHQuc2V0UHJvcChhdHRyTmFtZSwgdmFsdWUpXHJcblx0XHRcdH0pXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblxyXG5cdGZ1bmN0aW9uIGJuQ2xhc3MoY3R4KSB7XHJcblx0XHRzcGxpdEF0dHIoY3R4LmRpclZhbHVlLCBmdW5jdGlvbihwcm9wTmFtZSwgdmFyTmFtZSkge1xyXG5cdFx0XHRnZXRWYWx1ZShjdHgsIHZhck5hbWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnYm9vbGVhbicpIHtcclxuXHRcdFx0XHRcdGlmICh2YWx1ZSkge1xyXG5cdFx0XHRcdFx0XHRjdHguZWx0LmFkZENsYXNzKHByb3BOYW1lKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdGN0eC5lbHQucmVtb3ZlQ2xhc3MocHJvcE5hbWUpXHJcblx0XHRcdFx0XHR9XHRcdFx0XHRcclxuXHRcdFx0XHR9XHRcclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUud2FybihgW0NvcmVdIGJuLWNsYXNzOiB2YXJpYWJsZSAnJHt2YXJOYW1lfScgaXMgbm90IGFuIGJvb2xlYW5gLCBkYXRhKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcdFxyXG5cdFx0fSlcclxuXHR9XHRcclxuXHJcblxyXG5cdHZhciBkaXJNYXAgPSB7XHJcblx0XHQnYm4tZWFjaCc6IGJuRWFjaCxcdFx0XHRcclxuXHRcdCdibi1pZic6IGJuSWYsXHJcblx0XHQnYm4tdGV4dCc6IGJuVGV4dCxcdFxyXG5cdFx0J2JuLWh0bWwnOiBibkh0bWwsXHJcblx0XHQnYm4tb3B0aW9ucyc6IGJuT3B0aW9ucyxcdFx0XHRcclxuXHRcdCdibi1saXN0JzogYm5Db21ibyxcdFx0XHRcclxuXHRcdCdibi12YWwnOiBiblZhbCxcdFxyXG5cdFx0J2JuLXByb3AnOiBiblByb3AsXHJcblx0XHQnYm4tYXR0cic6IGJuQXR0cixcdFxyXG5cdFx0J2JuLWRhdGEnOiBibkRhdGEsXHRcdFx0XHJcblx0XHQnYm4tY2xhc3MnOiBibkNsYXNzLFxyXG5cdFx0J2JuLXNob3cnOiBiblNob3csXHJcblx0XHQnYm4tc3R5bGUnOiBiblN0eWxlLFxyXG5cdFx0J2JuLWZvcm0nOiBibkZvcm1cclxuXHR9XHJcblxyXG5cdCQuZm4uc2V0UHJvcCA9IGZ1bmN0aW9uKGF0dHJOYW1lLCB2YWx1ZSkge1xyXG5cdFx0dmFyIGlmYWNlID0gdGhpcy5pbnRlcmZhY2UoKVxyXG5cdFx0aWYgKGlmYWNlICYmIGlmYWNlLnNldFByb3ApIHtcclxuXHRcdFx0aWZhY2Uuc2V0UHJvcChhdHRyTmFtZSwgdmFsdWUpXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dGhpcy5kYXRhKGF0dHJOYW1lLCB2YWx1ZSlcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cdH1cclxuXHJcblxyXG5cclxuXHQkLmZuLnByb2Nlc3NUZW1wbGF0ZSA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ1tDb3JlXSBwcm9jZXNzVGVtcGxhdGUnKVxyXG5cdFx0dmFyIHRoYXQgPSB0aGlzXHJcblxyXG5cdFx0dmFyIGRpckxpc3QgPSBbXVxyXG5cclxuXHRcdGZvcihsZXQgayBpbiBkaXJNYXApIHtcclxuXHRcdFx0dGhpcy5ibkZpbmQoaywgdHJ1ZSwgZnVuY3Rpb24oZWx0LCBkaXJWYWx1ZSkge1xyXG5cdFx0XHRcdHZhciB0ZW1wbGF0ZVxyXG5cdFx0XHRcdGlmIChrID09ICdibi1lYWNoJykge1xyXG5cdFx0XHRcdFx0dGVtcGxhdGUgPSBlbHQuY2hpbGRyZW4oKS5yZW1vdmUoKS5jbG9uZSgpLy8uZ2V0KDApLm91dGVySFRNTFxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygndGVtcGxhdGUnLCB0ZW1wbGF0ZSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGsgPT0gJ2JuLXZhbCcpIHtcclxuXHRcdFx0XHRcdGVsdC5kYXRhKCckdmFsJywgZGlyVmFsdWUpXHJcblx0XHRcdFx0XHR2YXIgdXBkYXRlRXZlbnQgPSBlbHQuYXR0cignYm4tdXBkYXRlJylcclxuXHRcdFx0XHRcdGlmICh1cGRhdGVFdmVudCAhPSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdFx0ZWx0LnJlbW92ZUF0dHIoJ2JuLXVwZGF0ZScpXHJcblx0XHRcdFx0XHRcdGVsdC5vbih1cGRhdGVFdmVudCwgZnVuY3Rpb24oZXYsIHVpKSB7XHJcblx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygndWknLCB1aSlcclxuXHJcblx0XHRcdFx0XHRcdFx0dmFyIHZhbHVlID0gKHVpICYmICB1aS52YWx1ZSkgfHwgICQodGhpcykuZ2V0VmFsdWUoKVxyXG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ3ZhbHVlJywgdmFsdWUpXHJcblx0XHRcdFx0XHRcdFx0dGhhdC50cmlnZ2VyKCdkYXRhOnVwZGF0ZScsIFtkaXJWYWx1ZSwgdmFsdWUsIGVsdF0pXHJcblx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRkaXJMaXN0LnB1c2goe2RpcmVjdGl2ZTogaywgZWx0OiBlbHQsIGRpclZhbHVlOiBkaXJWYWx1ZSwgdGVtcGxhdGU6IHRlbXBsYXRlfSlcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoZGF0YSkge1xyXG5cdFx0XHR0aGlzLnVwZGF0ZVRlbXBsYXRlKGRpckxpc3QsIGRhdGEpXHJcblx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRyZXR1cm4gZGlyTGlzdFxyXG5cclxuXHR9XHRcclxuXHJcblx0JC5mbi51cGRhdGVUZW1wbGF0ZSA9IGZ1bmN0aW9uKGRpckxpc3QsIGRhdGEsIHZhcnNUb1VwZGF0ZSwgZXhjbHVkZUVsdCkge1xyXG5cdFx0Ly9jb25zb2xlLmxvZygnW2NvcmVdIHVwZGF0ZVRlbXBsYXRlJywgZGF0YSwgdmFyc1RvVXBkYXRlKVxyXG5cclxuXHRcdFx0Ly9jb25zb2xlLmxvZygnZGF0YScsIGRhdGEpXHJcblx0XHR2YXJzVG9VcGRhdGUgPSB2YXJzVG9VcGRhdGUgfHwgT2JqZWN0LmtleXMoZGF0YSlcclxuXHRcdC8vY29uc29sZS5sb2coJ3ZhcnNUb1VwZGF0ZScsIHZhcnNUb1VwZGF0ZSlcclxuXHJcblx0XHRkaXJMaXN0LmZvckVhY2goZnVuY3Rpb24oZGlySXRlbSkge1xyXG5cdFx0XHR2YXIgZm4gPSBkaXJNYXBbZGlySXRlbS5kaXJlY3RpdmVdXHJcblx0XHRcdGlmICh0eXBlb2YgZm4gPT0gJ2Z1bmN0aW9uJyAmJiBkaXJJdGVtLmVsdCAhPSBleGNsdWRlRWx0KSB7XHJcblx0XHRcdFx0ZGlySXRlbS5kYXRhID0gZGF0YTtcclxuXHRcdFx0XHRkaXJJdGVtLnZhcnNUb1VwZGF0ZSA9IHZhcnNUb1VwZGF0ZTtcclxuXHRcdFx0XHRmbihkaXJJdGVtKVxyXG5cdFx0XHR9XHJcblx0XHR9KVx0XHRcdFxyXG5cdFx0XHJcblxyXG5cdFx0XHJcblx0XHRyZXR1cm4gdGhpc1xyXG5cclxuXHR9XHRcclxuXHJcblxyXG59KSgpOyIsIihmdW5jdGlvbigpIHtcclxuXHJcblx0JC5mbi5wcm9jZXNzVUkgPSBmdW5jdGlvbihkYXRhKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdwcm9jZXNzVUknLCBkYXRhLCB0aGlzLmh0bWwoKSlcclxuXHRcdHZhciBkaXJMaXN0ID0gdGhpcy5wcm9jZXNzVGVtcGxhdGUoZGF0YSlcclxuXHRcdHRoaXMucHJvY2Vzc0NvbnRyb2xzKGRhdGEpXHJcblx0XHQvLy5wcm9jZXNzRm9ybURhdGEoZGF0YSlcclxuXHRcdC5wcm9jZXNzQ29udGV4dE1lbnUoZGF0YSlcclxuXHRcdHJldHVybiBkaXJMaXN0XHJcblx0fVxyXG5cclxufSkoKTsiLCIoZnVuY3Rpb24oKSB7XHJcblxyXG5cdCQuZm4uYm5GaWx0ZXIgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xyXG5cdFx0cmV0dXJuIHRoaXMuZmluZChzZWxlY3RvcikuYWRkKHRoaXMuZmlsdGVyKHNlbGVjdG9yKSlcclxuXHR9XHJcblxyXG5cdCQuZm4uYm5GaW5kID0gZnVuY3Rpb24oYXR0ck5hbWUsIHJlbW92ZUF0dHIsIGNiaykge1xyXG5cdFx0dGhpcy5ibkZpbHRlcihgWyR7YXR0ck5hbWV9XWApLmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBlbHQgPSAkKHRoaXMpXHJcblx0XHRcdHZhciBhdHRyVmFsdWUgPSBlbHQuYXR0cihhdHRyTmFtZSlcclxuXHRcdFx0aWYgKHJlbW92ZUF0dHIpIHtcclxuXHRcdFx0XHRlbHQucmVtb3ZlQXR0cihhdHRyTmFtZSlcclxuXHRcdFx0fVx0XHRcclxuXHRcdFx0Y2JrKGVsdCwgYXR0clZhbHVlKVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdCQuZm4uYm5GaW5kRXggPSBmdW5jdGlvbihhdHRyTmFtZSwgcmVtb3ZlQXR0ciwgY2JrKSB7XHJcblx0XHR0aGlzLmJuRmluZChhdHRyTmFtZSwgcmVtb3ZlQXR0ciwgZnVuY3Rpb24oZWx0LCBhdHRyVmFsdWUpIHtcclxuXHRcdFx0YXR0clZhbHVlLnNwbGl0KCcsJykuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XHJcblx0XHRcdFx0dmFyIGxpc3QgPSBpdGVtLnNwbGl0KCc6JylcclxuXHRcdFx0XHRpZiAobGlzdC5sZW5ndGggPT0gMikge1xyXG5cdFx0XHRcdFx0dmFyIG5hbWUgPSBsaXN0WzBdLnRyaW0oKVxyXG5cdFx0XHRcdFx0dmFyIHZhbHVlID0gbGlzdFsxXS50cmltKClcclxuXHRcdFx0XHRcdGNiayhlbHQsIG5hbWUsIHZhbHVlKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoYFtDb3JlXSBibkZpbmRFeCgke2F0dHJOYW1lfSkgJ2F0dHJWYWx1ZScgbm90IGNvcnJlY3Q6YCwgaXRlbSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0JC5mbi5iblZpc2libGUgPSBmdW5jdGlvbihpc1Zpc2libGUpIHtcclxuXHRcdGlmIChpc1Zpc2libGUpIHtcclxuXHRcdFx0dGhpcy5zaG93KClcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR0aGlzLmhpZGUoKVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXNcdFxyXG5cdH1cclxuXHJcblx0JC5mbi5pbml0Q29tYm8gPSBmdW5jdGlvbih2YWx1ZXMpIHtcclxuXHRcdHRoaXNcclxuXHRcdC5lbXB0eSgpXHJcblx0XHQuYXBwZW5kKHZhbHVlcy5tYXAoZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0cmV0dXJuIGA8b3B0aW9uIHZhbHVlPSR7dmFsdWV9PiR7dmFsdWV9PC9vcHRpb24+YFxyXG5cdFx0fSkpXHJcblxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHR9XHJcblxyXG5cclxufSkoKTtcclxuIiwiJCQuc2hvd0FsZXJ0ID0gZnVuY3Rpb24odGV4dCwgdGl0bGUsIGNhbGxiYWNrKSB7XHJcblx0dGl0bGUgPSB0aXRsZSB8fCAnSW5mb3JtYXRpb24nXHJcblx0JCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcclxuXHRcdC5hcHBlbmQoJCgnPHA+JykuaHRtbCh0ZXh0KSlcclxuXHRcdC5kaWFsb2coe1xyXG5cdFx0XHRjbGFzc2VzOiB7XHJcblx0XHRcdFx0J3VpLWRpYWxvZy10aXRsZWJhci1jbG9zZSc6ICduby1jbG9zZSdcclxuXHRcdFx0fSxcclxuXHRcdFx0Ly93aWR0aDogJ2F1dG8nLFxyXG5cdFx0XHRtaW5XaWR0aDogMjAwLFxyXG5cdFx0XHRtYXhIZWlnaHQ6IDQwMCxcclxuXHRcdFx0bW9kYWw6IHRydWUsXHJcblx0XHRcdGNsb3NlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnZGVzdHJveScpXHJcblx0XHRcdH0sXHJcblx0XHRcdGJ1dHRvbnM6IFtcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHR0ZXh0OiAnQ2xvc2UnLFxyXG5cdFx0XHRcdFx0Y2xpY2s6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKVxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdFx0XHRjYWxsYmFjaygpXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdF1cclxuXHRcdH0pXHJcbn07XHRcclxuXHJcbiIsIiQkLnNob3dDb25maXJtID0gZnVuY3Rpb24odGV4dCwgdGl0bGUsIGNhbGxiYWNrKSB7XHJcblx0dGl0bGUgPSB0aXRsZSB8fCAnSW5mb3JtYXRpb24nXHJcblx0JCgnPGRpdj4nLCB7dGl0bGU6IHRpdGxlfSlcclxuXHRcdC5hcHBlbmQoJCgnPHA+JykuaHRtbCh0ZXh0KSlcclxuXHRcdC5kaWFsb2coe1xyXG5cclxuXHRcdFx0bW9kYWw6IHRydWUsXHJcblxyXG5cdFx0XHRjbG9zZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Rlc3Ryb3knKVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRidXR0b25zOiBbXHJcblx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0dGV4dDogJ0NhbmNlbCcsXHJcblx0XHRcdFx0XHQvL2NsYXNzOiAndzMtYnV0dG9uIHczLXJlZCBibi1uby1jb3JuZXInLFxyXG5cdFx0XHRcdFx0Y2xpY2s6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKVxyXG5cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdHRleHQ6ICdPSycsXHJcblx0XHRcdFx0XHQvL2NsYXNzOiAndzMtYnV0dG9uIHczLWJsdWUgYm4tbm8tY29ybmVyJyxcclxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdFx0Y2FsbGJhY2soKVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVx0XHRcdFx0XHRcclxuXHRcdFx0XVxyXG5cdFx0fSlcclxufTtcclxuXHRcclxuXHJcbiIsIiQkLnNob3dQaWN0dXJlID0gZnVuY3Rpb24odGl0bGUsIHBpY3R1cmVVcmwpIHtcclxuXHQkKCc8ZGl2PicsIHt0aXRsZTogdGl0bGV9KVxyXG5cdFx0LmFwcGVuZCgkKCc8ZGl2PicsIHtjbGFzczogJ2JuLWZsZXgtY29sIGJuLWFsaWduLWNlbnRlcid9KVxyXG5cdFx0XHQuYXBwZW5kKCQoJzxpbWc+Jywge3NyYzogcGljdHVyZVVybH0pKVxyXG5cdFx0KVxyXG5cdFx0LmRpYWxvZyh7XHJcblxyXG5cdFx0XHRtb2RhbDogdHJ1ZSxcclxuXHRcdFx0d2lkdGg6ICdhdXRvJyxcclxuXHRcdFx0bWF4SGVpZ2h0OiA2MDAsXHJcblx0XHRcdG1heFdpZHRoOiA2MDAsXHJcblx0XHRcdC8vcG9zaXRpb246IHtteTogJ2NlbnRlciBjZW50ZXInLCBhdDogJ2NlbnRlciBjZW50ZXInfSxcclxuXHJcblx0XHRcdGNsb3NlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnZGVzdHJveScpXHJcblx0XHRcdH1cclxuXHJcblx0XHR9KVxyXG59O1xyXG5cclxuXHJcblxyXG4iLCIkJC5zaG93UHJvbXB0ID0gZnVuY3Rpb24obGFiZWwsIHRpdGxlLCBjYWxsYmFjaywgb3B0aW9ucykge1xyXG5cdHRpdGxlID0gdGl0bGUgfHwgJ0luZm9ybWF0aW9uJ1xyXG5cdG9wdGlvbnMgPSAkLmV4dGVuZCh7dHlwZTogJ3RleHQnfSwgb3B0aW9ucylcclxuXHQvL2NvbnNvbGUubG9nKCdvcHRpb25zJywgb3B0aW9ucylcclxuXHJcblx0dmFyIGRpdiA9ICQoJzxkaXY+Jywge3RpdGxlOiB0aXRsZX0pXHJcblx0XHQuYXBwZW5kKCQoJzxmb3JtPicpXHJcblx0XHRcdC5hcHBlbmQoJCgnPHA+JykudGV4dChsYWJlbCkpXHJcblx0XHRcdC5hcHBlbmQoJCgnPGlucHV0PicsIHtjbGFzczogJ3ZhbHVlJ30pLmF0dHIob3B0aW9ucykucHJvcCgncmVxdWlyZWQnLCB0cnVlKS5jc3MoJ3dpZHRoJywgJzEwMCUnKSlcclxuXHRcdFx0LmFwcGVuZCgkKCc8aW5wdXQ+Jywge3R5cGU6ICdzdWJtaXQnfSkuaGlkZSgpKVxyXG5cdFx0XHQub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uKGV2KSB7XHJcblx0XHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxyXG5cdFx0XHRcdGRpdi5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdHZhciB2YWwgPSBkaXYuZmluZCgnLnZhbHVlJykudmFsKClcclxuXHRcdFx0XHRcdGNhbGxiYWNrKHZhbClcclxuXHRcdFx0XHR9XHRcdFx0XHRcclxuXHRcdFx0fSlcclxuXHRcdClcclxuXHRcdC5kaWFsb2coe1xyXG5cdFx0XHRjbGFzc2VzOiB7XHJcblx0XHRcdFx0J3VpLWRpYWxvZy10aXRsZWJhci1jbG9zZSc6ICduby1jbG9zZSdcclxuXHRcdFx0fSxcclxuXHRcdFx0bW9kYWw6IHRydWUsXHJcblx0XHRcdGNsb3NlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnZGVzdHJveScpXHJcblx0XHRcdH0sXHJcblx0XHRcdGJ1dHRvbnM6IFtcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHR0ZXh0OiAnQ2FuY2VsJyxcclxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJylcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdHRleHQ6ICdBcHBseScsXHJcblx0XHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdCQodGhpcykuZmluZCgnW3R5cGU9c3VibWl0XScpLmNsaWNrKClcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdF1cclxuXHRcdH0pXHJcbn07XHJcblxyXG4iLCIoZnVuY3Rpb24oKXtcclxuXHJcblx0XHJcblx0ZnVuY3Rpb24gaXNPYmplY3QoYSkge1xyXG5cdFx0cmV0dXJuICh0eXBlb2YgYSA9PSAnb2JqZWN0JykgJiYgIUFycmF5LmlzQXJyYXkoYSlcclxuXHR9XHJcblxyXG5cdCQkLmNoZWNrVHlwZSA9IGZ1bmN0aW9uKHZhbHVlLCB0eXBlLCBpc09wdGlvbmFsKSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdjaGVja1R5cGUnLHZhbHVlLCB0eXBlLCBpc09wdGlvbmFsKVxyXG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAndW5kZWZpbmVkJyAmJiBpc09wdGlvbmFsID09PSB0cnVlKSB7XHJcblx0XHRcdHJldHVybiB0cnVlXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHR5cGVvZiB0eXBlID09ICdzdHJpbmcnKSB7XHJcblx0XHRcdHJldHVybiB0eXBlb2YgdmFsdWUgPT0gdHlwZVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG5cdFx0XHRpZiAoIUFycmF5LmlzQXJyYXkodHlwZSkpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKHR5cGUubGVuZ3RoID09IDApIHtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZSAvLyBubyBpdGVtIHR5cGUgY2hlY2tpbmdcclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IobGV0IGkgb2YgdmFsdWUpIHtcclxuXHRcdFx0XHR2YXIgcmV0ID0gZmFsc2VcclxuXHRcdFx0XHRmb3IobGV0IHQgb2YgdHlwZSkge1xyXG5cdFx0XHRcdFx0cmV0IHw9ICQkLmNoZWNrVHlwZShpLCB0KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoIXJldCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChpc09iamVjdCh0eXBlKSkge1xyXG5cdFx0XHRpZiAoIWlzT2JqZWN0KHZhbHVlKSkge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0XHR9XHJcblx0XHRcdGZvcihsZXQgZiBpbiB0eXBlKSB7XHJcblxyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2YnLCBmLCAndmFsdWUnLCB2YWx1ZSlcclxuXHRcdFx0XHR2YXIgbmV3VHlwZSA9IHR5cGVbZl1cclxuXHJcblx0XHRcdFx0dmFyIGlzT3B0aW9uYWwgPSBmYWxzZVxyXG5cdFx0XHRcdGlmIChmLnN0YXJ0c1dpdGgoJyQnKSkge1xyXG5cdFx0XHRcdFx0ZiA9IGYuc3Vic3RyKDEpXHJcblx0XHRcdFx0XHRpc09wdGlvbmFsID0gdHJ1ZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoISQkLmNoZWNrVHlwZSh2YWx1ZVtmXSwgbmV3VHlwZSwgaXNPcHRpb25hbCkpIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiB0cnVlXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gZmFsc2VcclxuXHR9XHRcclxuXHJcblxyXG59KSgpO1xyXG4iLCIkJC5kYXRhVVJMdG9CbG9iID0gZnVuY3Rpb24oZGF0YVVSTCkge1xyXG4gIC8vIERlY29kZSB0aGUgZGF0YVVSTFxyXG4gIHZhciBzcGxpdCA9IGRhdGFVUkwuc3BsaXQoL1s6LDtdLylcclxuICB2YXIgbWltZVR5cGUgPSBzcGxpdFsxXVxyXG4gIHZhciBlbmNvZGFnZSA9IHNwbGl0WzJdXHJcbiAgaWYgKGVuY29kYWdlICE9ICdiYXNlNjQnKSB7XHJcbiAgXHRyZXR1cm5cclxuICB9XHJcbiAgdmFyIGRhdGEgPSBzcGxpdFszXVxyXG5cclxuICBjb25zb2xlLmxvZygnbWltZVR5cGUnLCBtaW1lVHlwZSlcclxuICBjb25zb2xlLmxvZygnZW5jb2RhZ2UnLCBlbmNvZGFnZSlcclxuICAvL2NvbnNvbGUubG9nKCdkYXRhJywgZGF0YSlcclxuXHJcbiAgdmFyIGJpbmFyeSA9IGF0b2IoZGF0YSlcclxuIC8vIENyZWF0ZSA4LWJpdCB1bnNpZ25lZCBhcnJheVxyXG4gIHZhciBhcnJheSA9IFtdXHJcbiAgZm9yKHZhciBpID0gMDsgaSA8IGJpbmFyeS5sZW5ndGg7IGkrKykge1xyXG4gIFx0YXJyYXkucHVzaChiaW5hcnkuY2hhckNvZGVBdChpKSlcclxuICB9XHJcblxyXG4gIC8vIFJldHVybiBvdXIgQmxvYiBvYmplY3RcclxuXHRyZXR1cm4gbmV3IEJsb2IoWyBuZXcgVWludDhBcnJheShhcnJheSkgXSwge21pbWVUeXBlfSlcclxufTtcclxuIiwiJCQuZXh0cmFjdCA9IGZ1bmN0aW9uKG9iaiwgdmFsdWVzKSB7XHJcblx0aWYgKHR5cGVvZiB2YWx1ZXMgPT0gJ3N0cmluZycpIHtcclxuXHRcdHZhbHVlcyA9IHZhbHVlcy5zcGxpdCgnLCcpXHJcblx0fVxyXG5cdGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZXMpICYmIHR5cGVvZiB2YWx1ZXMgPT0gJ29iamVjdCcpIHtcclxuXHRcdHZhbHVlcyA9IE9iamVjdC5rZXlzKHZhbHVlcylcclxuXHR9XHJcblx0dmFyIHJldCA9IHt9XHJcblx0Zm9yKHZhciBrIGluIG9iaikge1xyXG5cdFx0aWYgKHZhbHVlcy5pbmRleE9mKGspID49IDApIHtcclxuXHRcdFx0cmV0W2tdID0gb2JqW2tdXHJcblx0XHR9XHJcblx0fVxyXG5cdHJldHVybiByZXRcclxufTtcclxuIiwiJCQuaXNJbWFnZSA9IGZ1bmN0aW9uKGZpbGVOYW1lKSB7XHJcblx0cmV0dXJuICgvXFwuKGdpZnxqcGd8anBlZ3xwbmcpJC9pKS50ZXN0KGZpbGVOYW1lKVxyXG59O1xyXG4iLCIkJC5sb2FkU3R5bGUgPSBmdW5jdGlvbihzdHlsZUZpbGVQYXRoLCBjYWxsYmFjaykge1x0XHJcblx0Ly9jb25zb2xlLmxvZygnW0NvcmVdIGxvYWRTdHlsZScsIHN0eWxlRmlsZVBhdGgpXHJcblxyXG5cdCQoZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgY3NzT2sgPSAkKCdoZWFkJykuZmluZChgbGlua1tocmVmPVwiJHtzdHlsZUZpbGVQYXRofVwiXWApLmxlbmd0aFxyXG5cdFx0aWYgKGNzc09rICE9IDEpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coYFtDb3JlXSBsb2FkaW5nICcke3N0eWxlRmlsZVBhdGh9JyBkZXBlbmRhbmN5YClcclxuXHRcdFx0JCgnPGxpbms+Jywge2hyZWY6IHN0eWxlRmlsZVBhdGgsIHJlbDogJ3N0eWxlc2hlZXQnfSlcclxuXHRcdFx0Lm9uKCdsb2FkJywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coYFtDb3JlXSAnJHtzdHlsZUZpbGVQYXRofScgbG9hZGVkYClcclxuXHRcdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRcdGNhbGxiYWNrKClcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblx0XHRcdC5hcHBlbmRUbygkKCdoZWFkJykpXHJcblx0XHR9XHJcblx0fSlcclxufTtcclxuIiwiJCQub2JqMkFycmF5ID0gZnVuY3Rpb24ob2JqKSB7XHJcblx0dmFyIHJldCA9IFtdXHJcblx0Zm9yKHZhciBrZXkgaW4gb2JqKSB7XHJcblx0XHRyZXQucHVzaCh7a2V5OiBrZXksIHZhbHVlOiBvYmpba2V5XX0pXHJcblx0fVxyXG5cdHJldHVybiByZXRcclxufTtcclxuIiwiKGZ1bmN0aW9uKCkge1xyXG5cclxudmFyIGlucHV0RmlsZSA9ICQoJzxpbnB1dD4nLCB7dHlwZTogJ2ZpbGUnfSkub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xyXG5cdHZhciBvbkFwcGx5ID0gJCh0aGlzKS5kYXRhKCdvbkFwcGx5JylcclxuXHR2YXIgZmlsZU5hbWUgPSB0aGlzLmZpbGVzWzBdXHJcblx0aWYgKHR5cGVvZiBvbkFwcGx5ID09ICdmdW5jdGlvbicpIHtcclxuXHRcdG9uQXBwbHkoZmlsZU5hbWUpXHJcblx0fVxyXG59KVxyXG5cclxuJCQub3BlbkZpbGVEaWFsb2cgPSBmdW5jdGlvbihvbkFwcGx5KSB7XHJcblx0aW5wdXRGaWxlLmRhdGEoJ29uQXBwbHknLCBvbkFwcGx5KVxyXG5cdGlucHV0RmlsZS5jbGljaygpXHJcbn1cclxuXHJcbn0pKCk7XHJcblxyXG4iLCIkJC5yZWFkRmlsZUFzRGF0YVVSTCA9IGZ1bmN0aW9uKGZpbGVOYW1lLCBvblJlYWQpIHtcclxuXHR2YXIgZmlsZVJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcclxuXHJcblx0ZmlsZVJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuXHRcdGlmICh0eXBlb2Ygb25SZWFkID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0b25SZWFkKGZpbGVSZWFkZXIucmVzdWx0KVxyXG5cdFx0fVxyXG5cdH1cclxuXHRmaWxlUmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZU5hbWUpXHJcbn07XHJcbiIsIiQkLnJlYWRUZXh0RmlsZSA9IGZ1bmN0aW9uKGZpbGVOYW1lLCBvblJlYWQpIHtcclxuXHR2YXIgZmlsZVJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcclxuXHJcblx0ZmlsZVJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuXHRcdGlmICh0eXBlb2Ygb25SZWFkID09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0b25SZWFkKGZpbGVSZWFkZXIucmVzdWx0KVxyXG5cdFx0fVxyXG5cdH1cclxuXHRmaWxlUmVhZGVyLnJlYWRBc1RleHQoZmlsZU5hbWUpXHJcbn07XHJcbiJdfQ==
