(function() {	

	$$.loadStyle('/controls/map.css')
})();

(function() {
	 
	let shapes = {}


	function isObject(o) {
		return (typeof o == 'object' && !Array.isArray(o))
	}



	function getTemplate() {
		return `
			<div class="map"></div>
		`
	}


	$$.registerControlEx('MapViewControl', {
		deps: ['WebSocketService', 'LeafletService'],
		events: 'objectClicked,objectContextMenu,objectUpdated',
		iface: 	'updateShape(id, data);removeShape(id);on(event, callback);getShapeInfo(id)',
		
	lib: 'map',
init:  function(elt, options, client, L) {
			var map
			var actions = new EventEmitter2()
			var events = new EventEmitter2()
			var lastZoom
			var defaultIcon =  new L.Icon.Default;
			var pluginsInstance = {}

			var layers = {}
			var ctx = {
				elt: elt,
				actions: actions,
				events: events,
				layers: layers,
				processMenuItemConfig: processMenuItemConfig,
				addPanel: addPanel,
				disableHandlers: disableHandlers,
				enableHandlers: enableHandlers,
				getIconMarker: getIconMarker,
				updateShapeModel: updateShapeModel,
				getShapeData: getShapeData,
				reset: reset,
				updateShape: updateShape,
				removeShape: removeShape
			}

			elt.append(getTemplate())


			this.dispose = function() {
				console.log('[MapViewControl] dispose !!')
				for(var k in pluginsInstance) {
					var i = pluginsInstance[k]
					if (typeof i == 'object' && typeof i.dispose == 'function') {
						i.dispose()
					}
				}
			}


			function getIconMarker(name, data) {
				//console.log('[MapViewControl] getIconMarker', name, data)
				if (typeof name == 'string') {
					var o = $$.getObject('map.icon', name)
					if (o && o.status === 'ok') {
						var args = [data].concat(o.deps)
						var icon = o.fn.apply(null, args)
						if (icon instanceof L.Icon) {
							return icon
						}
						else {
							console.warn(`icon of type '${name}' doee not return an Icon object`)
							return defaultIcon
						}				
					}
					else {
						console.warn(`icon of type '${name}' is not implemented, use defaultIcon`)
					}			
				}

				return defaultIcon
			}		

			function reset() {
				console.log('[MapViewControl] reset')

				for(var layerName in layers) {
					layers[layerName].clearLayers()
				}
			}

			function getShapeDesc(name) {
				if (shapes[name] == undefined) {
					var o = $$.getObject('map.shape', name)

					shapes[name] = null
					if (o.status == 'ok') {
						shapes[name] = o.obj = o.fn(ctx)
					}

				}
				return shapes[name]
			}		

			function addPanel(className) {
				console.log('[MapViewControl] addPanel', className)
				var panel = $('<div>').addClass(className)
				elt.append(panel)
				map.invalidateSize() // force map width update
				return panel
			}

			function handleLayersVisibility() {
				var zoom = map.getZoom()
				for(var layerName in layers) {
					handleLayerVisibility(zoom, layers[layerName])
				}
				lastZoom = zoom
			}

			function handleLayerVisibility(zoom, layer) {
				var minZoom = layer.minZoom || 0
				var maxZoom = layer.maxZoom || 100
				//console.log('[MapViewControl] handleLayerVisibility', layer.fullId, minZoom)
	/*			if (typeof minZoom != 'number') {
					return
				}*/

				if ((zoom < minZoom || zoom > maxZoom) && map.hasLayer(layer)) {
					map.removeLayer(layer)				
				}
				else if ((zoom >= minZoom && zoom <= maxZoom) && !map.hasLayer(layer)) {
					map.addLayer(layer)				
				}
			}

			function reOrderLayers() {
				//console.log('reOrderLayers')
				for(var layerName in layers) {
					var layer = layers[layerName]
					if (map.hasLayer(layer)) {
						layer.bringToFront() // call only when layer is added to map
					}				
				}
			}

			function onZoomStart() {
				client.suspend()

			}

			function onZoomEnd() {
				client.resume()
				handleLayersVisibility()
				sessionStorage.setItem('zoom', map.getZoom())
			}

			function onOverlayAdd() {
				reOrderLayers()
			}

			function configure(config) {
				//console.log('configure', config)
				let mapConfig = config.map

				if (isObject(mapConfig)) {

					let contextmenuConfig = config.contextmenuItems

					if (Array.isArray(contextmenuConfig)) {
						mapConfig.contextmenu = true
						mapConfig.contextmenuItems = processMenuItemConfig(contextmenuConfig)
					}				

					mapConfig.closePopupOnClick = false

					console.log('[MapViewControl] add map')
					var zoom = sessionStorage.getItem('zoom')
					if (zoom) {
						mapConfig.zoom = zoom
					}	
					var center = sessionStorage.getItem('center')	
					if (center) {
						mapConfig.center = JSON.parse(center)
					}		
					map = L.map(elt.find('.map').get(0), mapConfig)

					ctx.map = map
					lastZoom = map.getZoom()

					map.on('zoomstart', onZoomStart)
					map.on('zoomend', onZoomEnd)
					map.on('overlayadd', onOverlayAdd)
					map.on('movestart', function() {
						//console.log('movestart')
						client.resume()
					})
					map.on('moveend', function() {
						sessionStorage.setItem('center', JSON.stringify(map.getCenter()))
					})

				}

				configureTileLayer(config.tileLayer)
		
				configureControls(config.controls)

				configurePlugins(config.plugins)

			}

			function processMenuItemConfig(contextmenuConfig) {
				let config = [].concat(contextmenuConfig)
				config.forEach((item) => {
					let topic = item.topic
					if (typeof topic == 'string') {
						item.callback = (ev) => {
							//console.log('callback', topic)
							client.emit(topic, ev.relatedTarget || ev.latlng)
						}
						delete item.topic
					}

					let action = item.action
					if (typeof action == 'string') {
						item.callback = (ev) => {
							actions.emit(action, ev.relatedTarget || ev.latlng)
						}
						delete item.action
					}
				})
				return config
			}

			function configureTileLayer(tileLayerConfig) {
				if (isObject(tileLayerConfig) ) {
					let urlTemplate = tileLayerConfig.urlTemplate
					if (typeof urlTemplate != 'string') {
						console.warn('[MapViewControl] missing urlTemplate in tileLayer config')
					}
					else {
						console.log('[MapViewControl] add tileLayer')
						L.tileLayer(urlTemplate, tileLayerConfig).addTo(map)					
					}
				}			
			}

			function configureControls(controlsConfig) {
				if (isObject(controlsConfig) ) {
					let scaleConfig = controlsConfig.scale

					if (isObject(scaleConfig)) {
						console.log('[MapViewControl] add scale control')
						L.control.scale(scaleConfig).addTo(map)
					}

					let coordinatesConfig = controlsConfig.coordinates
					if (isObject(coordinatesConfig)) {
						console.log('[MapViewControl] add coordinates control')
						L.control.coordinates(coordinatesConfig).addTo(map)
					}



		            let graticuleConfig = controlsConfig.graticule
					if (isObject(graticuleConfig)) {
				        var zoomInterval = [
				            {start: 2, end: 2, interval: 40},
				            {start: 3, end: 3, interval: 20},
				            {start: 4, end: 4, interval: 10},
				            {start: 5, end: 7, interval: 5},
				            {start: 8, end: 10, interval: 1},
				            {start: 11, end: 20, interval: 0.5}
				        ]
				        var options = $.extend({zoomInterval: zoomInterval}, graticuleConfig)		
				            			
						console.log('[MapViewControl] add graticule control')
						L.latlngGraticule(options).addTo(map)
					}	            


					configureLayers(controlsConfig.layers)
					
				}			
			}

			function configureLayers(layersConfig) {
				if (isObject(layersConfig)) {
					let conf = {}
					for(let layerName in layersConfig) {
						var layerConfig = layersConfig[layerName]
						var minZoom = layerConfig.minZoom
						var layer
						if (layerConfig.cluster === true || typeof layerConfig.cluster == 'object') {

							var options = {}
							if (typeof layerConfig.cluster == 'object') {
								options = layerConfig.cluster
							}
							layer = L.markerClusterGroup(options)
						}
						else {
							layer = new L.FeatureGroup()
						}
						layer.minZoom = layerConfig.minZoom
						layer.maxZoom = layerConfig.maxZoom
						layer.fullId = layerName
						
						layers[layerName] = layer
						console.log(`[MapViewControl] add layer '${layerName}' with config:`, layerConfig)

						let label = layerConfig.label
						let visible = layerConfig.visible
						if (typeof layer.minZoom == 'number' || typeof layer.maxZoom == 'number') {
							handleLayerVisibility(map.getZoom(), layer)
						}
						else {
							if (visible === true) {
								map.addLayer(layer)
							}
							if (typeof label == 'string') {
								conf[label] = layer
							}						
						}
						
					}

					if (Object.keys(conf).length != 0) {
						L.control.layers({}, conf).addTo(map)
					}
					

				}			
			}

			function configurePlugins(pluginsConfig) {
				if (isObject(pluginsConfig)) {
					for(let pluginsName in pluginsConfig) {
						let o = $$.getObject('map.plugin', pluginsName)
						if (o && o.status == 'ok') {
							var options = pluginsConfig[pluginsName]
							var args = [ctx, options].concat(o.deps)
							console.log(`[MapViewControl] init plugin '${pluginsName}'`)
							pluginsInstance[pluginsName] = o.fn.apply(null, args)
						}
						else {
							console.warn(`[MapViewControl] plugin '${pluginsName}' is not registered`)
						}
					}

				}
			}


			function findObject(layer, id) {
				//console.log('findObject', id)
				var ret = null

				layer.eachLayer((layer) => {
					if (layer.fullId == id) {
						ret = layer
					}
				})	
				return ret
			}

			function findInfo(id) {
				var split = id.split('.')
				if (split.length != 2) {
					console.warn(`[MapViewControl] wrong id: '${id}'`)
					return
				}
				var layerName = split[0]
				var layer = layers[layerName]
				return {
					layer: layer,
					obj: layer && findObject(layer, id),
					layerName: layerName

				}
			}

			function onObjectClicked() {
				//console.log('click', this.fullId)
				client.resume()
				events.emit('objectClicked', this)
			}

			function onObjectContextMenu() {
				//console.log('contextmenu', this.fullId)

				client.resume()
				events.emit('objectContextMenu', this)
			}

			function removeShape(id) {
				console.log('[MapViewControl] removeShape', id)
				//var layer = findOwnerLayer(id)
				var info = findInfo(id)
				if (info == undefined) {
					return
				}

				//console.log('info', info)

				var {obj, layer, layerName} = info


				if (layer == undefined || obj == null) {
					console.warn(`[MapViewControl.removeShape] shape '${id}' does not exist`)
					return
				}

				obj.removeFrom(layer)
					//console.log(`[MapViewControl] remove shape '${id}'`)	
			}

			function getShapeInfo(id) {
				if (typeof id != 'string') {
					return
				}
				var info = findInfo(id)
				if (info == undefined) {
					return
				}
				if (typeof info.obj == 'object') {
					return info.obj.userData
				}

			}

			function updateShape(id, data) {
				if (typeof id != 'string' || typeof data !='object') {
					console.warn(`[MapViewControl] updateShape(id:string, data:object) called with wrong parameters`)
					return
				}
				var info = findInfo(id)
				if (info == undefined) {
					return
				}



				//console.log('info', info)

				var {obj, layer, layerName} = info

				if (layer == undefined) {
					console.warn(`[MapViewControl.updateShape] layer '${layerName}' does not exist`)
					return
				}				

				if (typeof data.shape == 'string') {
					if (obj != null && obj.userData.shape != data.shape) { // if shape change type, remove older and create new one
						obj.removeFrom(layer)
						obj = null
					}					
				}


				if (obj != null) {
					//console.log(`[ShapeDecoder] update shape '${msg.id}'`)
					
					updateShapeView(obj, data)
					events.emit('objectUpdated', obj)
				}
				else {

					if (typeof data.shape != 'string') {
						console.warn(`[MapViewControl.updateShape] missing or wrong parameter 'shape'`)
						return
					}

					obj = createShape(data)
					if (obj && obj != null) {
						obj.fullId = id
						obj.userData.id = id
						obj.addTo(layer)
						//console.log(`[ShapeDecoder] add shape '${msg.id}'`)						
					}

				}
			
				return obj
			}


			function createShape(data) {
				console.log('[MapViewControl] createShape', data)
				var ret = null
				var desc = getShapeDesc(data.shape)
				//console.log('desc', desc)
				if (typeof desc == 'object' && desc != null && typeof desc.create == 'function') {
					if (desc.createSchema && !$$.checkType(data, desc.createSchema)) {
						console.warn(`[MapViewControl] create ${data.shape}, missing or wrong parameters`, data, 'schema: ', desc.createSchema)
						return null
					}					
					ret = desc.create(data)
					if (ret != null) {
						ret.userData = data
						ret.on('mousedown', function() {
							client.suspend()
						})
						ret.on('click', onObjectClicked)
						ret.on('contextmenu', onObjectContextMenu)
					}
				}
				else {
					console.warn(`[MapViewControl.createShape] shape '${data.shape}' is not implemented`)
					return
				}
				return ret
			}

			function updateShapeView(layer, data) {
				//console.log('[MapViewControl] updateShapeView', data)
				var shape = layer.userData.shape
				var desc = getShapeDesc(shape)
				//console.log('desc', desc)
				if (typeof desc == 'object' && typeof desc.update == 'function') {
					if (desc.updateSchema && !$$.checkType(data, desc.updateSchema)) {
						console.warn(`[MapViewControl] update ${shape}, missing or wrong parameters`, data, 'schema: ', desc.updateSchema)
						return
					}
				
					desc.update(layer, data)
					$.extend(layer.userData, data)
				}

			}

			function updateShapeModel(layer) {
				var desc = getShapeDesc(layer.userData.shape)
				var data = {}
				if (typeof desc == 'object' && typeof desc.getData == 'function') {
					desc.getData(layer, data)
				}
				$.extend(layer.userData, data)
			}


			function getShapeData(layer, type) {

				var desc = getShapeDesc(type)
				var data = {shape: type}
				if (typeof desc == 'object' && typeof desc.getData == 'function') {
					desc.getData(layer, data)
				}
				return data
			}


			function disableHandlers() {
				map._handlers.forEach(function(handler) {
					handler.disable()
				})			
			}

			function enableHandlers() {
				map._handlers.forEach(function(handler) {
					handler.enable()
				})			
			}


			configure(options)

			this.updateShape = updateShape
			this.removeShape = removeShape
			this.on = events.on.bind(events)
			this.getShapeInfo = getShapeInfo


		}
	})

})();


(function() {
	$$.registerObject('map.icon', 'ais', function(data) {

		var color = data.color || 'green'

		var template =  `
			<svg width="40" height="40" style="border: 1px solid back;">
				<g transform="translate(20, 20)" stroke="${color}" fill="${color}">
					<circle r="3"></circle>
					<rect x="-7" y="-7" width="15" height="15" fill=${color} fill-opacity="0.3"></rect>
					<line y2="-30"></line>
				</g>
			</svg>
		`

		return L.divIcon({
			className: 'aisMarker',
			iconSize: [40, 40],
			iconAnchor: [20, 20],
			html: template
		})		
	})

})();
(function() {

	$$.registerObject('map.icon', 'font', function(data) {

		var data = $.extend({
			className: 'fa fa-home',
			fontSize: 10,
			color: 'green'
		}, data)

		var fontSize = data.fontSize

		var template = `
			<i class="${data.className}" style="color: ${data.color}; font-size: ${fontSize}px"></i>
		`
		return L.divIcon({
			className: 'fontMarker',
			iconSize: [fontSize, fontSize],
			iconAnchor: [fontSize/2, fontSize/2],
			html: template
		})		
	})

})();

(function() {

	var dataSchema = {
		$size: 'number',
		$name: 'string',
		sidc: 'string'
	}

	$$.registerObject('map.icon', 'milsymbol', ['MilSymbolService'], function(data, ms) {

		//console.log('data', data)

		if (!$$.checkType(data, dataSchema)) {
			console.warn('[TacticViewControl] create milsymbol marker, missing or wrong parameters', data, 'schema: ', dataSchema)
			return null
		}

		var symbol = new ms.Symbol(data.sidc, {
			size: data.size || 20,
			uniqueDesignation: data.name
		})

		var anchor = symbol.getAnchor()

		return L.icon({
			iconUrl: symbol.toDataURL(),
			iconAnchor: [anchor.x, anchor.y],
		})		
	})

})();
(function(){


	$$.registerObject('map.plugin', 'CenterMap', function(mapView) {


		let centerVeh = null


		function onCenterMap(pos) {
			console.log('centerMap', pos)
			mapView.map.panTo(pos)
			centerVeh = null
		}

/*		mapView.actions.on('centerOnVehicule', (marker) => {
			console.log('centerOnVehicule', marker.fullId)
			mapView.map.panTo(marker.getLatLng())
			centerVeh = marker.fullId
		})
		
		mapView.events.on('objectUpdated', (obj) => {
			//console.log('aisReport', msg)

		})	*/

		mapView.actions.on('centerMap', onCenterMap)

		return {
			dispose: function() {
				console.log('[TacticViewCenterMap] dispose')
				mapView.events.off('objectContextMenu', onObjectContextMenu)
				mapView.actions.off('centerMap', onCenterMap)
			}
		}
	})
	
	
})();
(function () {


	$$.registerObject('map.plugin', 'CircularMenu', function(mapView, options) {

		var controlContainer = mapView.elt.find('.leaflet-control-container')

		var ctrl = $$.viewController(controlContainer, {
			template: `<div class="menu" bn-control="CircularMenuControl" bn-options="config" bn-event="menuSelected: onMenuSelected"></div>`,
			data: {config: options},
			events: {
				onMenuSelected: function(item) {
					console.log('onMenuSelected', item)
					if (item && typeof item.action == 'string') {
						mapView.actions.emit(item.action)
					}			
				}
			}
		})


	})
})();

(function () {


	$$.registerObject('map.plugin', 'ObjectCircularMenu', ['WebSocketService'], function(mapView, options, client) {
		//console.log('CircularMenu', mapView)

		//console.log('[TacticViewObjectCircularMenu] options:', options)

		options.hasTrigger = false

		var controlContainer = mapView.elt.find('.leaflet-control-container')

		var ctrl = $$.viewController(controlContainer, {
			template: `<div class="menu" bn-control="CircularMenuControl" bn-options="config" 
				bn-event="menuClosed: onMenuClosed, menuSelected: onMenuSelected" bn-iface="iface"></div>`,
			data: {
				config: options
			},
			events: {
				onMenuClosed: function() {
					//console.log('onMenuClosed')
					mapView.enableHandlers()
				},
				onMenuSelected: function(menuInfo) {
					//console.log('onMenuSelected', menuInfo, selObj.fullId, selObj.privateData)

					selObj.userData.options.color = menuInfo.color


					client.sendTo(selObj.creator, 'mapViewShapeEdited', selObj.userData)					
				}
			}
		})


		var ctrlIf = ctrl.scope.iface
		var selObj

		function onObjectContextMenu(obj) {
			selObj = obj
			if (obj instanceof L.CircleMarker) {

				var color = selObj.options.color
				//console.log('onInit', color)
				var idx = options.menus.findIndex(function(menu) {
					return menu.color == color
				})
				//console.log('idx', idx)
				ctrlIf.select(idx)

				var pos = obj.getLatLng()
				//console.log('pos', pos)
				var pt = mapView.map.latLngToContainerPoint(pos)
				//console.log('pt', pt)	
				ctrlIf.showMenu(pt.x, pt.y)
				mapView.disableHandlers()				
			}


		}

		mapView.events.on('objectContextMenu', onObjectContextMenu)

		return {
			dispose: function() {
				console.log('[TacticViewObjectCircularMenu] dispose')
				mapView.events.off('objectContextMenu', onObjectContextMenu)
			}
		}

/*		ctrlIf.on('menuClosed', function() {
			//console.log('menuClosed')
			mapView.enableHandlers()
		})

		ctrlIf.on('menuSelected', function(menuInfo) {
			console.log('menuSelected', menuInfo, selObj.fullId, selObj.privateData)

			selObj.userData.options.color = menuInfo.color


			client.sendTo(selObj.creator, 'mapViewShapeEdited', selObj.userData)

			
		})*/

	})
})();

(function(){

	$$.registerObject('map.plugin', 'PanelInfo', function(mapView, options) {


		var panelInfo = mapView.addPanel('panelInfo')
		var map = mapView.map

		var selMarker = null

		function getInfoTemplate(label, value, name) {
			return `<div>
						<strong>${label}</strong>
						<span bn-text="${name}">${value}</span>
					</div>`
		}

		function updateInfo(obj) {
			var pos = obj.getLatLng()
			var tooltip = obj.getTooltip()
			//console.log('tooltip', tooltip)
			panelInfo.updateTemplate(ctx, {
				lat: pos.lat.toFixed(5),
				lng: pos.lng.toFixed(5),
				label: obj.userData.label || obj.fullId
			})
		}

		panelInfo.append(getInfoTemplate('Zoom Level', map.getZoom(), 'zoomLevel'))
		panelInfo.append(getInfoTemplate('Label', '', 'label'))
		panelInfo.append(getInfoTemplate('Latitude', 0, 'lat'))
		panelInfo.append(getInfoTemplate('Longitude', 0, 'lng'))
		var ctx = panelInfo.processTemplate()


		map.on('zoomend', () => {
			panelInfo.updateTemplate(ctx, {zoomLevel: map.getZoom()})
		})

		mapView.events.on('objectClicked', function(obj) {
			console.log('[panelInfo] objectClicked', obj.fullId)
			if (obj instanceof L.Marker || obj instanceof L.CircleMarker) {
				updateInfo(obj)
				selMarker = obj
			}
			
		})

		mapView.events.on('objectUpdated', function(obj) {
			//console.log('[panelInfo] objectUpdated', obj.fullId)
			if (obj == selMarker) {
				updateInfo(obj)
			}
		})


	})

})();
(function() {


	$$.registerObject('map.plugin', 'ShapeDecoder', ['WebSocketService'], function(mapView, options, client) {


		var topics = Object.keys(mapView.layers).map(function(layer){
			return `mapViewAddShape.${layer}.*`
		})


		function onAddShape(msg) {
			//console.log('onTacticViewAddShape', msg)
			if (msg.id == undefined) {
				console.warn('Missing layer or id')
				return
			}

			if (msg.data == undefined) { // no payload, means remove object
				mapView.removeShape(msg.id)
			}
			else {
				var obj = mapView.updateShape(msg.id, msg.data)
				obj.creator = msg.src
			}

		}

		client.register(topics, true, onAddShape)

		return {
			dispose: function() {
				console.log('[ShapeDecoder] dispose')
				client.unregister(topics, onAddShape)
			}
		}

	})

})();

(function() {



	$$.registerObject('map.plugin', 'ShapeEditor', ['WebSocketService'], function(mapView, options, client) {

		let map = mapView.map
		let featureGroupName

		if (options.edit != undefined) {
			featureGroupName = options.edit.featureGroup
			if (typeof featureGroupName == 'string') {
				let featureGroup = mapView.layers[featureGroupName]
				if (featureGroup == undefined) {
					console.warn(`layer '${featureGroupName}' is not defined`)
				}
				else {
					options.edit.featureGroup = featureGroup
				}
			}
		}

		var drawControl = new L.Control.Draw(options)
		map.addControl(drawControl)

		map.on('draw:created', (e)  => {
			var layer = e.layer
			var type = e.layerType
			console.log('draw:created', type)



			var data = mapView.getShapeData(layer, type)
			
			//console.log('data', data)

			client.emit('mapViewShapeCreated.' + type, data)
			
		})	

		map.on('draw:edited', (e) => {
			//console.log('draw:edited', e)
			e.layers.eachLayer((layer) => {
				console.log(`object with id '${layer.fullId}' was edited`)
				mapView.updateShapeModel(layer)
				client.sendTo(layer.creator, 'mapViewShapeEdited', layer.userData)

			})
		})	


		map.on('draw:deleted', (e) => {
			//console.log('draw:edited', e)
			e.layers.eachLayer((layer) => {
				console.log(`object with id '${layer.fullId}' was deleted`)				
				client.sendTo(layer.creator, 'mapViewShapeDeleted', layer.userData)
			})
		})	
		
	})

})();

(function() {


	$$.registerObject('map.shape', 'circle', function(mapView) {

		return {
			createSchema: {
				latlng: {
					lat: 'number', 
					lng: 'number'
				},
				radius: 'number',
				$options: {
					$color: 'string'
				}
			},
			updateSchema: {
				$latlng: {
					lat: 'number', 
					lng: 'number'
				},
				$radius: 'number',
				$options: {
					$color: 'string'
				}
			},			
			create: function(data) {
				return L.circle(data.latlng, data.radius, data.options)
			},
			update: function(layer, data) {
			
				if (data.latlng) {
					layer.setLatLng(data.latlng)
				}	
				
				if (data.radius) {
					layer.setRadius(data.radius)
				}
				if (data.options) {
					layer.setStyle(data.options)
				}
				
			},
			getData: function(layer, data) {
				data.radius = layer.getRadius()
				data.latlng = layer.getLatLng()	
			}
		}
	})
})();

(function() {



	$$.registerObject('map.shape', 'circleMarker', function(mapView) {

		return {
			createSchema: {
				latlng: {
					lat: 'number', 
					lng: 'number'
				},
				$options: {
					$color: 'string'
				}
			},

			updateSchema: {
				$latlng: {
					lat: 'number', 
					lng: 'number'
				},
				$options: {
					$color: 'string'
				}
			},			
			create: function(data) {
				
				return L.circleMarker(data.latlng, data.options)
			},
			update: function(layer, data) {
			
				if (data.latlng) {
					layer.setLatLng(data.latlng)
				}	
				
				if (data.options) {
					layer.setStyle(data.options)
				}
				
			}

		}
	})
})();

(function() {


	function processContent(data) {
		var content = data.popupContent
		if (!Array.isArray(content)) {
			content = [content]
		}
		var div = $('<div>')
			.css('display', 'flex')
			.css('flex-direction', 'column')

		content.forEach(function(item) {
			//console.log('item', item)
			var divItem = $('<div>')
				.css('display', 'flex')
				.css('justify-content', 'space-between')
		
			if (typeof item == 'string') {
				divItem.html(item).processTemplate(data.props)
			}

			if (typeof item == 'object' &&
				 typeof item.label == 'string' &&
				 typeof item.prop == 'string') {

				var template = `<span style="margin-right: 10px">${item.label}</span><span bn-text="${item.prop}"></span>`
				divItem.html(template).processTemplate(data.props)
			}

			div.append(divItem)
		})

		return div.get(0)
	}



	$$.registerObject('map.shape', 'marker', function(mapView) {

		return {
			createSchema: {
				latlng: {
					lat: 'number', 
					lng: 'number'
				},
				$rotationAngle: 'number',
				$icon: {
					type: 'string'
				},
				$options: {
				},
				$popupContent: ['string', {label: 'string', prop: 'string'}]
			},

			updateSchema: {
				$latlng: {
					lat: 'number', 
					lng: 'number'
				},
				$rotationAngle: 'number',
				$icon: {
					type: 'string'
				},
				$options: {
				},
				$popupContent: ['string', {label: 'string', prop: 'string'}]
			},

			create: function(data) {

				var options = data.options || {}
				if (data.icon) {
					options.icon = mapView.getIconMarker(data.icon.type, data.icon)
				}
				if (data.rotationAngle) {
					options.rotationAngle = data.rotationAngle
				}

				var marker = L.marker(data.latlng, options)							
				
				if (data.popupContent) {
					let popup = L.popup({autoClose: false, closeButton: true, className: 'toto', autoPan: false})
					popup.setContent(processContent(data))
					marker.bindPopup(popup)
				}
																	
				return marker
			},

			update: function(layer, data) {
	

				if (data.latlng) {
					layer.setLatLng(data.latlng)
				}
				if (data.icon) {
					layer.setIcon(mapView.getIconMarker(data.icon.type, data.icon))
				}
				if (data.rotationAngle) {
					layer.setRotationAngle(data.rotationAngle)
				}	

				if (data.popupContent) {
					layer.setPopupContent(processContent(data))
				}	

			},
			getData: function(layer, data) {
				data.latlng = layer.getLatLng()
			}

		} 
	})
})();

(function() {

	var createSchema = {
		latlngs: [{
			lat: 'number', 
			lng: 'number'
		}],
		$options: {
			$color: 'string'
		}
	}

	var updateSchema = {
		$latlngs: [{
			lat: 'number', 
			lng: 'number'
		}],
		$options: {
			$color: 'string'
		}
	}

	$$.registerObject('map.shape', 'polygon', function(mapView) {

		return {
			create: function(data) {
				if (!$$.checkType(data, createSchema)) {
					console.warn('[TacticViewControl] create polygon, missing or wrong parameters', data, 'schema: ', createSchema)
					return null
				}
				return L.polygon(data.latlngs, data.options)
			},
			update: function(layer, data) {
				if (!$$.checkType(data, createSchema)) {
					console.warn('[TacticViewControl] create polygon, missing or wrong parameters', data, 'schema: ', createSchema)
					return null
				}
				if (data.latlngs) {
					layer.setLatLngs(data.latlngs)
				}
				if (data.options) {
					layer.setStyle(data.options)
				}
				return true
			},
			getData: function(layer, data) {
				data.latlngs = layer.getLatLngs()[0]
			}

		}
	})
})();

(function() {



	$$.registerObject('map.shape', 'polyline', function(mapView) {

		return {
			createSchema: {
				latlngs: [{
					lat: 'number', 
					lng: 'number'
				}],
				$options: {
					$color: 'string'
				}
			},

			updateSchema: {
				$latlngs: [{
					lat: 'number', 
					lng: 'number'
				}],
				$options: {
					$color: 'string'
				}
			},

			create: function(data) {
				return L.polyline(data.latlngs, data.options)
			},
			update: function(layer, data) {

				if (data.latlngs) {
					layer.setLatLngs(data.latlngs)
				}
				if (data.options) {
					layer.setStyle(data.options)
				}
			},
			getData: function(layer, data) {
				data.latlngs = layer.getLatLngs()
			}

		}
	})
})();

(function() {



	$$.registerObject('map.shape', 'rectangle', function(mapView) {

		return {
			createSchema: {
				northWest: {
					lat: 'number', 
					lng: 'number'
				},
				southEast: {
					lat: 'number', 
					lng: 'number'
				},		radius: 'number',
				$options: {
					$color: 'string'
				}
			},

			updateSchema: {
				$northWest: {
					lat: 'number', 
					lng: 'number'
				},
				$southEast: {
					lat: 'number', 
					lng: 'number'
				},		radius: 'number',
				$options: {
					$color: 'string'
				}
			},

			create: function(data) {
			
				let bounds = L.latLngBounds(data.northWest, data.southEast)
				return L.rectangle(bounds, data.options)
			},
			update: function(layer, data) {
				
				let bounds = L.latLngBounds(data.northWest, data.southEast)
				layer.setBounds(bounds)
				layer.setStyle(data.options)
			},			
			getData: function(layer, data) {
				let bounds = layer.getBounds()
				data.northWest =  bounds.getNorthWest()
				data.southEast =  bounds.getSouthEast()
			}
		}
	})
})();

(function() {

	$$.registerObject('map.shape', 'sector', function(mapView) {

		return {
			createSchema: {
				latlng: {
					lat: 'number', 
					lng: 'number'
				},
				radius: 'number',
				direction: 'number',
				size: 'number',
				$options: {
					$color: 'string'
				}
			},
			updateSchema: {
				$latlng: {
					lat: 'number', 
					lng: 'number'
				},
				$radius: 'number',
				$direction: 'number',
				$size: 'number',
				$options: {
					$color: 'string'
				}
			},			
			create: function(data) {
				var options = $.extend({radius: data.radius}, data.options)
				var sector = L.semiCircle(data.latlng, options)
				sector.setDirection(data.direction, data.size)
				return sector
			},
			update: function(layer, data) {
				if (data.latlng) {
					layer.setLatLng(data.latlng)
				}
				if (data.radius) {
					layer.setRadius(data.radius)
				}
				if (data.direction && data.size) {
					layer.setDirection(data.direction, data.size)
				}
				if (data.options) {
					layer.setStyle(data.options)
				}
			}

		}
	})
})();

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlcHMuanMiLCJtYXAuanMiLCJtYXJrZXJzL2Fpcy5qcyIsIm1hcmtlcnMvZm9udC5qcyIsIm1hcmtlcnMvbWlsc3ltYm9sLmpzIiwicGx1Z2lucy9jZW50ZXJtYXAuanMiLCJwbHVnaW5zL2NpcmN1bGFybWVudS5qcyIsInBsdWdpbnMvb2JqZWN0Y2lyY3VsYXJtZW51LmpzIiwicGx1Z2lucy9wYW5lbGluZm8uanMiLCJwbHVnaW5zL3NoYXBlZGVjb2Rlci5qcyIsInBsdWdpbnMvc2hhcGVlZGl0b3IuanMiLCJzaGFwZXMvY2lyY2xlLmpzIiwic2hhcGVzL2NpcmNsZU1hcmtlci5qcyIsInNoYXBlcy9tYXJrZXIuanMiLCJzaGFwZXMvcG9seWdvbi5qcyIsInNoYXBlcy9wb2x5bGluZS5qcyIsInNoYXBlcy9yZWN0YW5nbGUuanMiLCJzaGFwZXMvc2VjdG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1x0XG5cblx0JCQubG9hZFN0eWxlKCcvY29udHJvbHMvbWFwLmNzcycpXG59KSgpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXHQgXG5cdGxldCBzaGFwZXMgPSB7fVxuXG5cblx0ZnVuY3Rpb24gaXNPYmplY3Qobykge1xuXHRcdHJldHVybiAodHlwZW9mIG8gPT0gJ29iamVjdCcgJiYgIUFycmF5LmlzQXJyYXkobykpXG5cdH1cblxuXG5cblx0ZnVuY3Rpb24gZ2V0VGVtcGxhdGUoKSB7XG5cdFx0cmV0dXJuIGBcblx0XHRcdDxkaXYgY2xhc3M9XCJtYXBcIj48L2Rpdj5cblx0XHRgXG5cdH1cblxuXG5cdCQkLnJlZ2lzdGVyQ29udHJvbEV4KCdNYXBWaWV3Q29udHJvbCcsIHtcblx0XHRkZXBzOiBbJ1dlYlNvY2tldFNlcnZpY2UnLCAnTGVhZmxldFNlcnZpY2UnXSxcblx0XHRldmVudHM6ICdvYmplY3RDbGlja2VkLG9iamVjdENvbnRleHRNZW51LG9iamVjdFVwZGF0ZWQnLFxuXHRcdGlmYWNlOiBcdCd1cGRhdGVTaGFwZShpZCwgZGF0YSk7cmVtb3ZlU2hhcGUoaWQpO29uKGV2ZW50LCBjYWxsYmFjayk7Z2V0U2hhcGVJbmZvKGlkKScsXG5cdFx0XG5cdGxpYjogJ21hcCcsXG5pbml0OiAgZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBjbGllbnQsIEwpIHtcblx0XHRcdHZhciBtYXBcblx0XHRcdHZhciBhY3Rpb25zID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxuXHRcdFx0dmFyIGV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIyKClcblx0XHRcdHZhciBsYXN0Wm9vbVxuXHRcdFx0dmFyIGRlZmF1bHRJY29uID0gIG5ldyBMLkljb24uRGVmYXVsdDtcblx0XHRcdHZhciBwbHVnaW5zSW5zdGFuY2UgPSB7fVxuXG5cdFx0XHR2YXIgbGF5ZXJzID0ge31cblx0XHRcdHZhciBjdHggPSB7XG5cdFx0XHRcdGVsdDogZWx0LFxuXHRcdFx0XHRhY3Rpb25zOiBhY3Rpb25zLFxuXHRcdFx0XHRldmVudHM6IGV2ZW50cyxcblx0XHRcdFx0bGF5ZXJzOiBsYXllcnMsXG5cdFx0XHRcdHByb2Nlc3NNZW51SXRlbUNvbmZpZzogcHJvY2Vzc01lbnVJdGVtQ29uZmlnLFxuXHRcdFx0XHRhZGRQYW5lbDogYWRkUGFuZWwsXG5cdFx0XHRcdGRpc2FibGVIYW5kbGVyczogZGlzYWJsZUhhbmRsZXJzLFxuXHRcdFx0XHRlbmFibGVIYW5kbGVyczogZW5hYmxlSGFuZGxlcnMsXG5cdFx0XHRcdGdldEljb25NYXJrZXI6IGdldEljb25NYXJrZXIsXG5cdFx0XHRcdHVwZGF0ZVNoYXBlTW9kZWw6IHVwZGF0ZVNoYXBlTW9kZWwsXG5cdFx0XHRcdGdldFNoYXBlRGF0YTogZ2V0U2hhcGVEYXRhLFxuXHRcdFx0XHRyZXNldDogcmVzZXQsXG5cdFx0XHRcdHVwZGF0ZVNoYXBlOiB1cGRhdGVTaGFwZSxcblx0XHRcdFx0cmVtb3ZlU2hhcGU6IHJlbW92ZVNoYXBlXG5cdFx0XHR9XG5cblx0XHRcdGVsdC5hcHBlbmQoZ2V0VGVtcGxhdGUoKSlcblxuXG5cdFx0XHR0aGlzLmRpc3Bvc2UgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ1tNYXBWaWV3Q29udHJvbF0gZGlzcG9zZSAhIScpXG5cdFx0XHRcdGZvcih2YXIgayBpbiBwbHVnaW5zSW5zdGFuY2UpIHtcblx0XHRcdFx0XHR2YXIgaSA9IHBsdWdpbnNJbnN0YW5jZVtrXVxuXHRcdFx0XHRcdGlmICh0eXBlb2YgaSA9PSAnb2JqZWN0JyAmJiB0eXBlb2YgaS5kaXNwb3NlID09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdGkuZGlzcG9zZSgpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblxuXHRcdFx0ZnVuY3Rpb24gZ2V0SWNvbk1hcmtlcihuYW1lLCBkYXRhKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ1tNYXBWaWV3Q29udHJvbF0gZ2V0SWNvbk1hcmtlcicsIG5hbWUsIGRhdGEpXG5cdFx0XHRcdGlmICh0eXBlb2YgbmFtZSA9PSAnc3RyaW5nJykge1xuXHRcdFx0XHRcdHZhciBvID0gJCQuZ2V0T2JqZWN0KCdtYXAuaWNvbicsIG5hbWUpXG5cdFx0XHRcdFx0aWYgKG8gJiYgby5zdGF0dXMgPT09ICdvaycpIHtcblx0XHRcdFx0XHRcdHZhciBhcmdzID0gW2RhdGFdLmNvbmNhdChvLmRlcHMpXG5cdFx0XHRcdFx0XHR2YXIgaWNvbiA9IG8uZm4uYXBwbHkobnVsbCwgYXJncylcblx0XHRcdFx0XHRcdGlmIChpY29uIGluc3RhbmNlb2YgTC5JY29uKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBpY29uXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKGBpY29uIG9mIHR5cGUgJyR7bmFtZX0nIGRvZWUgbm90IHJldHVybiBhbiBJY29uIG9iamVjdGApXG5cdFx0XHRcdFx0XHRcdHJldHVybiBkZWZhdWx0SWNvblxuXHRcdFx0XHRcdFx0fVx0XHRcdFx0XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKGBpY29uIG9mIHR5cGUgJyR7bmFtZX0nIGlzIG5vdCBpbXBsZW1lbnRlZCwgdXNlIGRlZmF1bHRJY29uYClcblx0XHRcdFx0XHR9XHRcdFx0XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gZGVmYXVsdEljb25cblx0XHRcdH1cdFx0XG5cblx0XHRcdGZ1bmN0aW9uIHJlc2V0KCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnW01hcFZpZXdDb250cm9sXSByZXNldCcpXG5cblx0XHRcdFx0Zm9yKHZhciBsYXllck5hbWUgaW4gbGF5ZXJzKSB7XG5cdFx0XHRcdFx0bGF5ZXJzW2xheWVyTmFtZV0uY2xlYXJMYXllcnMoKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIGdldFNoYXBlRGVzYyhuYW1lKSB7XG5cdFx0XHRcdGlmIChzaGFwZXNbbmFtZV0gPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0dmFyIG8gPSAkJC5nZXRPYmplY3QoJ21hcC5zaGFwZScsIG5hbWUpXG5cblx0XHRcdFx0XHRzaGFwZXNbbmFtZV0gPSBudWxsXG5cdFx0XHRcdFx0aWYgKG8uc3RhdHVzID09ICdvaycpIHtcblx0XHRcdFx0XHRcdHNoYXBlc1tuYW1lXSA9IG8ub2JqID0gby5mbihjdHgpXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHNoYXBlc1tuYW1lXVxuXHRcdFx0fVx0XHRcblxuXHRcdFx0ZnVuY3Rpb24gYWRkUGFuZWwoY2xhc3NOYW1lKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdbTWFwVmlld0NvbnRyb2xdIGFkZFBhbmVsJywgY2xhc3NOYW1lKVxuXHRcdFx0XHR2YXIgcGFuZWwgPSAkKCc8ZGl2PicpLmFkZENsYXNzKGNsYXNzTmFtZSlcblx0XHRcdFx0ZWx0LmFwcGVuZChwYW5lbClcblx0XHRcdFx0bWFwLmludmFsaWRhdGVTaXplKCkgLy8gZm9yY2UgbWFwIHdpZHRoIHVwZGF0ZVxuXHRcdFx0XHRyZXR1cm4gcGFuZWxcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gaGFuZGxlTGF5ZXJzVmlzaWJpbGl0eSgpIHtcblx0XHRcdFx0dmFyIHpvb20gPSBtYXAuZ2V0Wm9vbSgpXG5cdFx0XHRcdGZvcih2YXIgbGF5ZXJOYW1lIGluIGxheWVycykge1xuXHRcdFx0XHRcdGhhbmRsZUxheWVyVmlzaWJpbGl0eSh6b29tLCBsYXllcnNbbGF5ZXJOYW1lXSlcblx0XHRcdFx0fVxuXHRcdFx0XHRsYXN0Wm9vbSA9IHpvb21cblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gaGFuZGxlTGF5ZXJWaXNpYmlsaXR5KHpvb20sIGxheWVyKSB7XG5cdFx0XHRcdHZhciBtaW5ab29tID0gbGF5ZXIubWluWm9vbSB8fCAwXG5cdFx0XHRcdHZhciBtYXhab29tID0gbGF5ZXIubWF4Wm9vbSB8fCAxMDBcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW01hcFZpZXdDb250cm9sXSBoYW5kbGVMYXllclZpc2liaWxpdHknLCBsYXllci5mdWxsSWQsIG1pblpvb20pXG5cdC8qXHRcdFx0aWYgKHR5cGVvZiBtaW5ab29tICE9ICdudW1iZXInKSB7XG5cdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdH0qL1xuXG5cdFx0XHRcdGlmICgoem9vbSA8IG1pblpvb20gfHwgem9vbSA+IG1heFpvb20pICYmIG1hcC5oYXNMYXllcihsYXllcikpIHtcblx0XHRcdFx0XHRtYXAucmVtb3ZlTGF5ZXIobGF5ZXIpXHRcdFx0XHRcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmICgoem9vbSA+PSBtaW5ab29tICYmIHpvb20gPD0gbWF4Wm9vbSkgJiYgIW1hcC5oYXNMYXllcihsYXllcikpIHtcblx0XHRcdFx0XHRtYXAuYWRkTGF5ZXIobGF5ZXIpXHRcdFx0XHRcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiByZU9yZGVyTGF5ZXJzKCkge1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdyZU9yZGVyTGF5ZXJzJylcblx0XHRcdFx0Zm9yKHZhciBsYXllck5hbWUgaW4gbGF5ZXJzKSB7XG5cdFx0XHRcdFx0dmFyIGxheWVyID0gbGF5ZXJzW2xheWVyTmFtZV1cblx0XHRcdFx0XHRpZiAobWFwLmhhc0xheWVyKGxheWVyKSkge1xuXHRcdFx0XHRcdFx0bGF5ZXIuYnJpbmdUb0Zyb250KCkgLy8gY2FsbCBvbmx5IHdoZW4gbGF5ZXIgaXMgYWRkZWQgdG8gbWFwXG5cdFx0XHRcdFx0fVx0XHRcdFx0XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gb25ab29tU3RhcnQoKSB7XG5cdFx0XHRcdGNsaWVudC5zdXNwZW5kKClcblxuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBvblpvb21FbmQoKSB7XG5cdFx0XHRcdGNsaWVudC5yZXN1bWUoKVxuXHRcdFx0XHRoYW5kbGVMYXllcnNWaXNpYmlsaXR5KClcblx0XHRcdFx0c2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSgnem9vbScsIG1hcC5nZXRab29tKCkpXG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIG9uT3ZlcmxheUFkZCgpIHtcblx0XHRcdFx0cmVPcmRlckxheWVycygpXG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIGNvbmZpZ3VyZShjb25maWcpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnY29uZmlndXJlJywgY29uZmlnKVxuXHRcdFx0XHRsZXQgbWFwQ29uZmlnID0gY29uZmlnLm1hcFxuXG5cdFx0XHRcdGlmIChpc09iamVjdChtYXBDb25maWcpKSB7XG5cblx0XHRcdFx0XHRsZXQgY29udGV4dG1lbnVDb25maWcgPSBjb25maWcuY29udGV4dG1lbnVJdGVtc1xuXG5cdFx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoY29udGV4dG1lbnVDb25maWcpKSB7XG5cdFx0XHRcdFx0XHRtYXBDb25maWcuY29udGV4dG1lbnUgPSB0cnVlXG5cdFx0XHRcdFx0XHRtYXBDb25maWcuY29udGV4dG1lbnVJdGVtcyA9IHByb2Nlc3NNZW51SXRlbUNvbmZpZyhjb250ZXh0bWVudUNvbmZpZylcblx0XHRcdFx0XHR9XHRcdFx0XHRcblxuXHRcdFx0XHRcdG1hcENvbmZpZy5jbG9zZVBvcHVwT25DbGljayA9IGZhbHNlXG5cblx0XHRcdFx0XHRjb25zb2xlLmxvZygnW01hcFZpZXdDb250cm9sXSBhZGQgbWFwJylcblx0XHRcdFx0XHR2YXIgem9vbSA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ3pvb20nKVxuXHRcdFx0XHRcdGlmICh6b29tKSB7XG5cdFx0XHRcdFx0XHRtYXBDb25maWcuem9vbSA9IHpvb21cblx0XHRcdFx0XHR9XHRcblx0XHRcdFx0XHR2YXIgY2VudGVyID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbSgnY2VudGVyJylcdFxuXHRcdFx0XHRcdGlmIChjZW50ZXIpIHtcblx0XHRcdFx0XHRcdG1hcENvbmZpZy5jZW50ZXIgPSBKU09OLnBhcnNlKGNlbnRlcilcblx0XHRcdFx0XHR9XHRcdFxuXHRcdFx0XHRcdG1hcCA9IEwubWFwKGVsdC5maW5kKCcubWFwJykuZ2V0KDApLCBtYXBDb25maWcpXG5cblx0XHRcdFx0XHRjdHgubWFwID0gbWFwXG5cdFx0XHRcdFx0bGFzdFpvb20gPSBtYXAuZ2V0Wm9vbSgpXG5cblx0XHRcdFx0XHRtYXAub24oJ3pvb21zdGFydCcsIG9uWm9vbVN0YXJ0KVxuXHRcdFx0XHRcdG1hcC5vbignem9vbWVuZCcsIG9uWm9vbUVuZClcblx0XHRcdFx0XHRtYXAub24oJ292ZXJsYXlhZGQnLCBvbk92ZXJsYXlBZGQpXG5cdFx0XHRcdFx0bWFwLm9uKCdtb3Zlc3RhcnQnLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ21vdmVzdGFydCcpXG5cdFx0XHRcdFx0XHRjbGllbnQucmVzdW1lKClcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdG1hcC5vbignbW92ZWVuZCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0c2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSgnY2VudGVyJywgSlNPTi5zdHJpbmdpZnkobWFwLmdldENlbnRlcigpKSlcblx0XHRcdFx0XHR9KVxuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25maWd1cmVUaWxlTGF5ZXIoY29uZmlnLnRpbGVMYXllcilcblx0XHRcblx0XHRcdFx0Y29uZmlndXJlQ29udHJvbHMoY29uZmlnLmNvbnRyb2xzKVxuXG5cdFx0XHRcdGNvbmZpZ3VyZVBsdWdpbnMoY29uZmlnLnBsdWdpbnMpXG5cblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gcHJvY2Vzc01lbnVJdGVtQ29uZmlnKGNvbnRleHRtZW51Q29uZmlnKSB7XG5cdFx0XHRcdGxldCBjb25maWcgPSBbXS5jb25jYXQoY29udGV4dG1lbnVDb25maWcpXG5cdFx0XHRcdGNvbmZpZy5mb3JFYWNoKChpdGVtKSA9PiB7XG5cdFx0XHRcdFx0bGV0IHRvcGljID0gaXRlbS50b3BpY1xuXHRcdFx0XHRcdGlmICh0eXBlb2YgdG9waWMgPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHRcdGl0ZW0uY2FsbGJhY2sgPSAoZXYpID0+IHtcblx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnY2FsbGJhY2snLCB0b3BpYylcblx0XHRcdFx0XHRcdFx0Y2xpZW50LmVtaXQodG9waWMsIGV2LnJlbGF0ZWRUYXJnZXQgfHwgZXYubGF0bG5nKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZGVsZXRlIGl0ZW0udG9waWNcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRsZXQgYWN0aW9uID0gaXRlbS5hY3Rpb25cblx0XHRcdFx0XHRpZiAodHlwZW9mIGFjdGlvbiA9PSAnc3RyaW5nJykge1xuXHRcdFx0XHRcdFx0aXRlbS5jYWxsYmFjayA9IChldikgPT4ge1xuXHRcdFx0XHRcdFx0XHRhY3Rpb25zLmVtaXQoYWN0aW9uLCBldi5yZWxhdGVkVGFyZ2V0IHx8IGV2LmxhdGxuZylcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGRlbGV0ZSBpdGVtLmFjdGlvblxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdFx0cmV0dXJuIGNvbmZpZ1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBjb25maWd1cmVUaWxlTGF5ZXIodGlsZUxheWVyQ29uZmlnKSB7XG5cdFx0XHRcdGlmIChpc09iamVjdCh0aWxlTGF5ZXJDb25maWcpICkge1xuXHRcdFx0XHRcdGxldCB1cmxUZW1wbGF0ZSA9IHRpbGVMYXllckNvbmZpZy51cmxUZW1wbGF0ZVxuXHRcdFx0XHRcdGlmICh0eXBlb2YgdXJsVGVtcGxhdGUgIT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUud2FybignW01hcFZpZXdDb250cm9sXSBtaXNzaW5nIHVybFRlbXBsYXRlIGluIHRpbGVMYXllciBjb25maWcnKVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdbTWFwVmlld0NvbnRyb2xdIGFkZCB0aWxlTGF5ZXInKVxuXHRcdFx0XHRcdFx0TC50aWxlTGF5ZXIodXJsVGVtcGxhdGUsIHRpbGVMYXllckNvbmZpZykuYWRkVG8obWFwKVx0XHRcdFx0XHRcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cdFx0XHRcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gY29uZmlndXJlQ29udHJvbHMoY29udHJvbHNDb25maWcpIHtcblx0XHRcdFx0aWYgKGlzT2JqZWN0KGNvbnRyb2xzQ29uZmlnKSApIHtcblx0XHRcdFx0XHRsZXQgc2NhbGVDb25maWcgPSBjb250cm9sc0NvbmZpZy5zY2FsZVxuXG5cdFx0XHRcdFx0aWYgKGlzT2JqZWN0KHNjYWxlQ29uZmlnKSkge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ1tNYXBWaWV3Q29udHJvbF0gYWRkIHNjYWxlIGNvbnRyb2wnKVxuXHRcdFx0XHRcdFx0TC5jb250cm9sLnNjYWxlKHNjYWxlQ29uZmlnKS5hZGRUbyhtYXApXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0bGV0IGNvb3JkaW5hdGVzQ29uZmlnID0gY29udHJvbHNDb25maWcuY29vcmRpbmF0ZXNcblx0XHRcdFx0XHRpZiAoaXNPYmplY3QoY29vcmRpbmF0ZXNDb25maWcpKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnW01hcFZpZXdDb250cm9sXSBhZGQgY29vcmRpbmF0ZXMgY29udHJvbCcpXG5cdFx0XHRcdFx0XHRMLmNvbnRyb2wuY29vcmRpbmF0ZXMoY29vcmRpbmF0ZXNDb25maWcpLmFkZFRvKG1hcClcblx0XHRcdFx0XHR9XG5cblxuXG5cdFx0ICAgICAgICAgICAgbGV0IGdyYXRpY3VsZUNvbmZpZyA9IGNvbnRyb2xzQ29uZmlnLmdyYXRpY3VsZVxuXHRcdFx0XHRcdGlmIChpc09iamVjdChncmF0aWN1bGVDb25maWcpKSB7XG5cdFx0XHRcdCAgICAgICAgdmFyIHpvb21JbnRlcnZhbCA9IFtcblx0XHRcdFx0ICAgICAgICAgICAge3N0YXJ0OiAyLCBlbmQ6IDIsIGludGVydmFsOiA0MH0sXG5cdFx0XHRcdCAgICAgICAgICAgIHtzdGFydDogMywgZW5kOiAzLCBpbnRlcnZhbDogMjB9LFxuXHRcdFx0XHQgICAgICAgICAgICB7c3RhcnQ6IDQsIGVuZDogNCwgaW50ZXJ2YWw6IDEwfSxcblx0XHRcdFx0ICAgICAgICAgICAge3N0YXJ0OiA1LCBlbmQ6IDcsIGludGVydmFsOiA1fSxcblx0XHRcdFx0ICAgICAgICAgICAge3N0YXJ0OiA4LCBlbmQ6IDEwLCBpbnRlcnZhbDogMX0sXG5cdFx0XHRcdCAgICAgICAgICAgIHtzdGFydDogMTEsIGVuZDogMjAsIGludGVydmFsOiAwLjV9XG5cdFx0XHRcdCAgICAgICAgXVxuXHRcdFx0XHQgICAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoe3pvb21JbnRlcnZhbDogem9vbUludGVydmFsfSwgZ3JhdGljdWxlQ29uZmlnKVx0XHRcblx0XHRcdFx0ICAgICAgICAgICAgXHRcdFx0XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnW01hcFZpZXdDb250cm9sXSBhZGQgZ3JhdGljdWxlIGNvbnRyb2wnKVxuXHRcdFx0XHRcdFx0TC5sYXRsbmdHcmF0aWN1bGUob3B0aW9ucykuYWRkVG8obWFwKVxuXHRcdFx0XHRcdH1cdCAgICAgICAgICAgIFxuXG5cblx0XHRcdFx0XHRjb25maWd1cmVMYXllcnMoY29udHJvbHNDb25maWcubGF5ZXJzKVxuXHRcdFx0XHRcdFxuXHRcdFx0XHR9XHRcdFx0XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIGNvbmZpZ3VyZUxheWVycyhsYXllcnNDb25maWcpIHtcblx0XHRcdFx0aWYgKGlzT2JqZWN0KGxheWVyc0NvbmZpZykpIHtcblx0XHRcdFx0XHRsZXQgY29uZiA9IHt9XG5cdFx0XHRcdFx0Zm9yKGxldCBsYXllck5hbWUgaW4gbGF5ZXJzQ29uZmlnKSB7XG5cdFx0XHRcdFx0XHR2YXIgbGF5ZXJDb25maWcgPSBsYXllcnNDb25maWdbbGF5ZXJOYW1lXVxuXHRcdFx0XHRcdFx0dmFyIG1pblpvb20gPSBsYXllckNvbmZpZy5taW5ab29tXG5cdFx0XHRcdFx0XHR2YXIgbGF5ZXJcblx0XHRcdFx0XHRcdGlmIChsYXllckNvbmZpZy5jbHVzdGVyID09PSB0cnVlIHx8IHR5cGVvZiBsYXllckNvbmZpZy5jbHVzdGVyID09ICdvYmplY3QnKSB7XG5cblx0XHRcdFx0XHRcdFx0dmFyIG9wdGlvbnMgPSB7fVxuXHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIGxheWVyQ29uZmlnLmNsdXN0ZXIgPT0gJ29iamVjdCcpIHtcblx0XHRcdFx0XHRcdFx0XHRvcHRpb25zID0gbGF5ZXJDb25maWcuY2x1c3RlclxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGxheWVyID0gTC5tYXJrZXJDbHVzdGVyR3JvdXAob3B0aW9ucylcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRsYXllciA9IG5ldyBMLkZlYXR1cmVHcm91cCgpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRsYXllci5taW5ab29tID0gbGF5ZXJDb25maWcubWluWm9vbVxuXHRcdFx0XHRcdFx0bGF5ZXIubWF4Wm9vbSA9IGxheWVyQ29uZmlnLm1heFpvb21cblx0XHRcdFx0XHRcdGxheWVyLmZ1bGxJZCA9IGxheWVyTmFtZVxuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRsYXllcnNbbGF5ZXJOYW1lXSA9IGxheWVyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhgW01hcFZpZXdDb250cm9sXSBhZGQgbGF5ZXIgJyR7bGF5ZXJOYW1lfScgd2l0aCBjb25maWc6YCwgbGF5ZXJDb25maWcpXG5cblx0XHRcdFx0XHRcdGxldCBsYWJlbCA9IGxheWVyQ29uZmlnLmxhYmVsXG5cdFx0XHRcdFx0XHRsZXQgdmlzaWJsZSA9IGxheWVyQ29uZmlnLnZpc2libGVcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgbGF5ZXIubWluWm9vbSA9PSAnbnVtYmVyJyB8fCB0eXBlb2YgbGF5ZXIubWF4Wm9vbSA9PSAnbnVtYmVyJykge1xuXHRcdFx0XHRcdFx0XHRoYW5kbGVMYXllclZpc2liaWxpdHkobWFwLmdldFpvb20oKSwgbGF5ZXIpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdFx0aWYgKHZpc2libGUgPT09IHRydWUpIHtcblx0XHRcdFx0XHRcdFx0XHRtYXAuYWRkTGF5ZXIobGF5ZXIpXG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBsYWJlbCA9PSAnc3RyaW5nJykge1xuXHRcdFx0XHRcdFx0XHRcdGNvbmZbbGFiZWxdID0gbGF5ZXJcblx0XHRcdFx0XHRcdFx0fVx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKE9iamVjdC5rZXlzKGNvbmYpLmxlbmd0aCAhPSAwKSB7XG5cdFx0XHRcdFx0XHRMLmNvbnRyb2wubGF5ZXJzKHt9LCBjb25mKS5hZGRUbyhtYXApXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFxuXG5cdFx0XHRcdH1cdFx0XHRcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gY29uZmlndXJlUGx1Z2lucyhwbHVnaW5zQ29uZmlnKSB7XG5cdFx0XHRcdGlmIChpc09iamVjdChwbHVnaW5zQ29uZmlnKSkge1xuXHRcdFx0XHRcdGZvcihsZXQgcGx1Z2luc05hbWUgaW4gcGx1Z2luc0NvbmZpZykge1xuXHRcdFx0XHRcdFx0bGV0IG8gPSAkJC5nZXRPYmplY3QoJ21hcC5wbHVnaW4nLCBwbHVnaW5zTmFtZSlcblx0XHRcdFx0XHRcdGlmIChvICYmIG8uc3RhdHVzID09ICdvaycpIHtcblx0XHRcdFx0XHRcdFx0dmFyIG9wdGlvbnMgPSBwbHVnaW5zQ29uZmlnW3BsdWdpbnNOYW1lXVxuXHRcdFx0XHRcdFx0XHR2YXIgYXJncyA9IFtjdHgsIG9wdGlvbnNdLmNvbmNhdChvLmRlcHMpXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGBbTWFwVmlld0NvbnRyb2xdIGluaXQgcGx1Z2luICcke3BsdWdpbnNOYW1lfSdgKVxuXHRcdFx0XHRcdFx0XHRwbHVnaW5zSW5zdGFuY2VbcGx1Z2luc05hbWVdID0gby5mbi5hcHBseShudWxsLCBhcmdzKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUud2FybihgW01hcFZpZXdDb250cm9sXSBwbHVnaW4gJyR7cGx1Z2luc05hbWV9JyBpcyBub3QgcmVnaXN0ZXJlZGApXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXG5cdFx0XHRmdW5jdGlvbiBmaW5kT2JqZWN0KGxheWVyLCBpZCkge1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdmaW5kT2JqZWN0JywgaWQpXG5cdFx0XHRcdHZhciByZXQgPSBudWxsXG5cblx0XHRcdFx0bGF5ZXIuZWFjaExheWVyKChsYXllcikgPT4ge1xuXHRcdFx0XHRcdGlmIChsYXllci5mdWxsSWQgPT0gaWQpIHtcblx0XHRcdFx0XHRcdHJldCA9IGxheWVyXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KVx0XG5cdFx0XHRcdHJldHVybiByZXRcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gZmluZEluZm8oaWQpIHtcblx0XHRcdFx0dmFyIHNwbGl0ID0gaWQuc3BsaXQoJy4nKVxuXHRcdFx0XHRpZiAoc3BsaXQubGVuZ3RoICE9IDIpIHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFtNYXBWaWV3Q29udHJvbF0gd3JvbmcgaWQ6ICcke2lkfSdgKVxuXHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBsYXllck5hbWUgPSBzcGxpdFswXVxuXHRcdFx0XHR2YXIgbGF5ZXIgPSBsYXllcnNbbGF5ZXJOYW1lXVxuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGxheWVyOiBsYXllcixcblx0XHRcdFx0XHRvYmo6IGxheWVyICYmIGZpbmRPYmplY3QobGF5ZXIsIGlkKSxcblx0XHRcdFx0XHRsYXllck5hbWU6IGxheWVyTmFtZVxuXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gb25PYmplY3RDbGlja2VkKCkge1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdjbGljaycsIHRoaXMuZnVsbElkKVxuXHRcdFx0XHRjbGllbnQucmVzdW1lKClcblx0XHRcdFx0ZXZlbnRzLmVtaXQoJ29iamVjdENsaWNrZWQnLCB0aGlzKVxuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBvbk9iamVjdENvbnRleHRNZW51KCkge1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdjb250ZXh0bWVudScsIHRoaXMuZnVsbElkKVxuXG5cdFx0XHRcdGNsaWVudC5yZXN1bWUoKVxuXHRcdFx0XHRldmVudHMuZW1pdCgnb2JqZWN0Q29udGV4dE1lbnUnLCB0aGlzKVxuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiByZW1vdmVTaGFwZShpZCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnW01hcFZpZXdDb250cm9sXSByZW1vdmVTaGFwZScsIGlkKVxuXHRcdFx0XHQvL3ZhciBsYXllciA9IGZpbmRPd25lckxheWVyKGlkKVxuXHRcdFx0XHR2YXIgaW5mbyA9IGZpbmRJbmZvKGlkKVxuXHRcdFx0XHRpZiAoaW5mbyA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2luZm8nLCBpbmZvKVxuXG5cdFx0XHRcdHZhciB7b2JqLCBsYXllciwgbGF5ZXJOYW1lfSA9IGluZm9cblxuXG5cdFx0XHRcdGlmIChsYXllciA9PSB1bmRlZmluZWQgfHwgb2JqID09IG51bGwpIHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFtNYXBWaWV3Q29udHJvbC5yZW1vdmVTaGFwZV0gc2hhcGUgJyR7aWR9JyBkb2VzIG5vdCBleGlzdGApXG5cdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRvYmoucmVtb3ZlRnJvbShsYXllcilcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGBbTWFwVmlld0NvbnRyb2xdIHJlbW92ZSBzaGFwZSAnJHtpZH0nYClcdFxuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBnZXRTaGFwZUluZm8oaWQpIHtcblx0XHRcdFx0aWYgKHR5cGVvZiBpZCAhPSAnc3RyaW5nJykge1xuXHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBpbmZvID0gZmluZEluZm8oaWQpXG5cdFx0XHRcdGlmIChpbmZvID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdHJldHVyblxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0eXBlb2YgaW5mby5vYmogPT0gJ29iamVjdCcpIHtcblx0XHRcdFx0XHRyZXR1cm4gaW5mby5vYmoudXNlckRhdGFcblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIHVwZGF0ZVNoYXBlKGlkLCBkYXRhKSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgaWQgIT0gJ3N0cmluZycgfHwgdHlwZW9mIGRhdGEgIT0nb2JqZWN0Jykge1xuXHRcdFx0XHRcdGNvbnNvbGUud2FybihgW01hcFZpZXdDb250cm9sXSB1cGRhdGVTaGFwZShpZDpzdHJpbmcsIGRhdGE6b2JqZWN0KSBjYWxsZWQgd2l0aCB3cm9uZyBwYXJhbWV0ZXJzYClcblx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgaW5mbyA9IGZpbmRJbmZvKGlkKVxuXHRcdFx0XHRpZiAoaW5mbyA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0fVxuXG5cblxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdpbmZvJywgaW5mbylcblxuXHRcdFx0XHR2YXIge29iaiwgbGF5ZXIsIGxheWVyTmFtZX0gPSBpbmZvXG5cblx0XHRcdFx0aWYgKGxheWVyID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGNvbnNvbGUud2FybihgW01hcFZpZXdDb250cm9sLnVwZGF0ZVNoYXBlXSBsYXllciAnJHtsYXllck5hbWV9JyBkb2VzIG5vdCBleGlzdGApXG5cdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdH1cdFx0XHRcdFxuXG5cdFx0XHRcdGlmICh0eXBlb2YgZGF0YS5zaGFwZSA9PSAnc3RyaW5nJykge1xuXHRcdFx0XHRcdGlmIChvYmogIT0gbnVsbCAmJiBvYmoudXNlckRhdGEuc2hhcGUgIT0gZGF0YS5zaGFwZSkgeyAvLyBpZiBzaGFwZSBjaGFuZ2UgdHlwZSwgcmVtb3ZlIG9sZGVyIGFuZCBjcmVhdGUgbmV3IG9uZVxuXHRcdFx0XHRcdFx0b2JqLnJlbW92ZUZyb20obGF5ZXIpXG5cdFx0XHRcdFx0XHRvYmogPSBudWxsXG5cdFx0XHRcdFx0fVx0XHRcdFx0XHRcblx0XHRcdFx0fVxuXG5cblx0XHRcdFx0aWYgKG9iaiAhPSBudWxsKSB7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhgW1NoYXBlRGVjb2Rlcl0gdXBkYXRlIHNoYXBlICcke21zZy5pZH0nYClcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR1cGRhdGVTaGFwZVZpZXcob2JqLCBkYXRhKVxuXHRcdFx0XHRcdGV2ZW50cy5lbWl0KCdvYmplY3RVcGRhdGVkJywgb2JqKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBkYXRhLnNoYXBlICE9ICdzdHJpbmcnKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFtNYXBWaWV3Q29udHJvbC51cGRhdGVTaGFwZV0gbWlzc2luZyBvciB3cm9uZyBwYXJhbWV0ZXIgJ3NoYXBlJ2ApXG5cdFx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRvYmogPSBjcmVhdGVTaGFwZShkYXRhKVxuXHRcdFx0XHRcdGlmIChvYmogJiYgb2JqICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdG9iai5mdWxsSWQgPSBpZFxuXHRcdFx0XHRcdFx0b2JqLnVzZXJEYXRhLmlkID0gaWRcblx0XHRcdFx0XHRcdG9iai5hZGRUbyhsYXllcilcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coYFtTaGFwZURlY29kZXJdIGFkZCBzaGFwZSAnJHttc2cuaWR9J2ApXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblx0XHRcdFxuXHRcdFx0XHRyZXR1cm4gb2JqXG5cdFx0XHR9XG5cblxuXHRcdFx0ZnVuY3Rpb24gY3JlYXRlU2hhcGUoZGF0YSkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnW01hcFZpZXdDb250cm9sXSBjcmVhdGVTaGFwZScsIGRhdGEpXG5cdFx0XHRcdHZhciByZXQgPSBudWxsXG5cdFx0XHRcdHZhciBkZXNjID0gZ2V0U2hhcGVEZXNjKGRhdGEuc2hhcGUpXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2Rlc2MnLCBkZXNjKVxuXHRcdFx0XHRpZiAodHlwZW9mIGRlc2MgPT0gJ29iamVjdCcgJiYgZGVzYyAhPSBudWxsICYmIHR5cGVvZiBkZXNjLmNyZWF0ZSA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0aWYgKGRlc2MuY3JlYXRlU2NoZW1hICYmICEkJC5jaGVja1R5cGUoZGF0YSwgZGVzYy5jcmVhdGVTY2hlbWEpKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFtNYXBWaWV3Q29udHJvbF0gY3JlYXRlICR7ZGF0YS5zaGFwZX0sIG1pc3Npbmcgb3Igd3JvbmcgcGFyYW1ldGVyc2AsIGRhdGEsICdzY2hlbWE6ICcsIGRlc2MuY3JlYXRlU2NoZW1hKVxuXHRcdFx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdFx0XHR9XHRcdFx0XHRcdFxuXHRcdFx0XHRcdHJldCA9IGRlc2MuY3JlYXRlKGRhdGEpXG5cdFx0XHRcdFx0aWYgKHJldCAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRyZXQudXNlckRhdGEgPSBkYXRhXG5cdFx0XHRcdFx0XHRyZXQub24oJ21vdXNlZG93bicsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRjbGllbnQuc3VzcGVuZCgpXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0cmV0Lm9uKCdjbGljaycsIG9uT2JqZWN0Q2xpY2tlZClcblx0XHRcdFx0XHRcdHJldC5vbignY29udGV4dG1lbnUnLCBvbk9iamVjdENvbnRleHRNZW51KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oYFtNYXBWaWV3Q29udHJvbC5jcmVhdGVTaGFwZV0gc2hhcGUgJyR7ZGF0YS5zaGFwZX0nIGlzIG5vdCBpbXBsZW1lbnRlZGApXG5cdFx0XHRcdFx0cmV0dXJuXG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHJldFxuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiB1cGRhdGVTaGFwZVZpZXcobGF5ZXIsIGRhdGEpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnW01hcFZpZXdDb250cm9sXSB1cGRhdGVTaGFwZVZpZXcnLCBkYXRhKVxuXHRcdFx0XHR2YXIgc2hhcGUgPSBsYXllci51c2VyRGF0YS5zaGFwZVxuXHRcdFx0XHR2YXIgZGVzYyA9IGdldFNoYXBlRGVzYyhzaGFwZSlcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZGVzYycsIGRlc2MpXG5cdFx0XHRcdGlmICh0eXBlb2YgZGVzYyA9PSAnb2JqZWN0JyAmJiB0eXBlb2YgZGVzYy51cGRhdGUgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGlmIChkZXNjLnVwZGF0ZVNjaGVtYSAmJiAhJCQuY2hlY2tUeXBlKGRhdGEsIGRlc2MudXBkYXRlU2NoZW1hKSkge1xuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKGBbTWFwVmlld0NvbnRyb2xdIHVwZGF0ZSAke3NoYXBlfSwgbWlzc2luZyBvciB3cm9uZyBwYXJhbWV0ZXJzYCwgZGF0YSwgJ3NjaGVtYTogJywgZGVzYy51cGRhdGVTY2hlbWEpXG5cdFx0XHRcdFx0XHRyZXR1cm5cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRcdGRlc2MudXBkYXRlKGxheWVyLCBkYXRhKVxuXHRcdFx0XHRcdCQuZXh0ZW5kKGxheWVyLnVzZXJEYXRhLCBkYXRhKVxuXHRcdFx0XHR9XG5cblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gdXBkYXRlU2hhcGVNb2RlbChsYXllcikge1xuXHRcdFx0XHR2YXIgZGVzYyA9IGdldFNoYXBlRGVzYyhsYXllci51c2VyRGF0YS5zaGFwZSlcblx0XHRcdFx0dmFyIGRhdGEgPSB7fVxuXHRcdFx0XHRpZiAodHlwZW9mIGRlc2MgPT0gJ29iamVjdCcgJiYgdHlwZW9mIGRlc2MuZ2V0RGF0YSA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0ZGVzYy5nZXREYXRhKGxheWVyLCBkYXRhKVxuXHRcdFx0XHR9XG5cdFx0XHRcdCQuZXh0ZW5kKGxheWVyLnVzZXJEYXRhLCBkYXRhKVxuXHRcdFx0fVxuXG5cblx0XHRcdGZ1bmN0aW9uIGdldFNoYXBlRGF0YShsYXllciwgdHlwZSkge1xuXG5cdFx0XHRcdHZhciBkZXNjID0gZ2V0U2hhcGVEZXNjKHR5cGUpXG5cdFx0XHRcdHZhciBkYXRhID0ge3NoYXBlOiB0eXBlfVxuXHRcdFx0XHRpZiAodHlwZW9mIGRlc2MgPT0gJ29iamVjdCcgJiYgdHlwZW9mIGRlc2MuZ2V0RGF0YSA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0ZGVzYy5nZXREYXRhKGxheWVyLCBkYXRhKVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBkYXRhXG5cdFx0XHR9XG5cblxuXHRcdFx0ZnVuY3Rpb24gZGlzYWJsZUhhbmRsZXJzKCkge1xuXHRcdFx0XHRtYXAuX2hhbmRsZXJzLmZvckVhY2goZnVuY3Rpb24oaGFuZGxlcikge1xuXHRcdFx0XHRcdGhhbmRsZXIuZGlzYWJsZSgpXG5cdFx0XHRcdH0pXHRcdFx0XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIGVuYWJsZUhhbmRsZXJzKCkge1xuXHRcdFx0XHRtYXAuX2hhbmRsZXJzLmZvckVhY2goZnVuY3Rpb24oaGFuZGxlcikge1xuXHRcdFx0XHRcdGhhbmRsZXIuZW5hYmxlKClcblx0XHRcdFx0fSlcdFx0XHRcblx0XHRcdH1cblxuXG5cdFx0XHRjb25maWd1cmUob3B0aW9ucylcblxuXHRcdFx0dGhpcy51cGRhdGVTaGFwZSA9IHVwZGF0ZVNoYXBlXG5cdFx0XHR0aGlzLnJlbW92ZVNoYXBlID0gcmVtb3ZlU2hhcGVcblx0XHRcdHRoaXMub24gPSBldmVudHMub24uYmluZChldmVudHMpXG5cdFx0XHR0aGlzLmdldFNoYXBlSW5mbyA9IGdldFNoYXBlSW5mb1xuXG5cblx0XHR9XG5cdH0pXG5cbn0pKCk7XG5cbiIsIihmdW5jdGlvbigpIHtcblx0JCQucmVnaXN0ZXJPYmplY3QoJ21hcC5pY29uJywgJ2FpcycsIGZ1bmN0aW9uKGRhdGEpIHtcblxuXHRcdHZhciBjb2xvciA9IGRhdGEuY29sb3IgfHwgJ2dyZWVuJ1xuXG5cdFx0dmFyIHRlbXBsYXRlID0gIGBcblx0XHRcdDxzdmcgd2lkdGg9XCI0MFwiIGhlaWdodD1cIjQwXCIgc3R5bGU9XCJib3JkZXI6IDFweCBzb2xpZCBiYWNrO1wiPlxuXHRcdFx0XHQ8ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoMjAsIDIwKVwiIHN0cm9rZT1cIiR7Y29sb3J9XCIgZmlsbD1cIiR7Y29sb3J9XCI+XG5cdFx0XHRcdFx0PGNpcmNsZSByPVwiM1wiPjwvY2lyY2xlPlxuXHRcdFx0XHRcdDxyZWN0IHg9XCItN1wiIHk9XCItN1wiIHdpZHRoPVwiMTVcIiBoZWlnaHQ9XCIxNVwiIGZpbGw9JHtjb2xvcn0gZmlsbC1vcGFjaXR5PVwiMC4zXCI+PC9yZWN0PlxuXHRcdFx0XHRcdDxsaW5lIHkyPVwiLTMwXCI+PC9saW5lPlxuXHRcdFx0XHQ8L2c+XG5cdFx0XHQ8L3N2Zz5cblx0XHRgXG5cblx0XHRyZXR1cm4gTC5kaXZJY29uKHtcblx0XHRcdGNsYXNzTmFtZTogJ2Fpc01hcmtlcicsXG5cdFx0XHRpY29uU2l6ZTogWzQwLCA0MF0sXG5cdFx0XHRpY29uQW5jaG9yOiBbMjAsIDIwXSxcblx0XHRcdGh0bWw6IHRlbXBsYXRlXG5cdFx0fSlcdFx0XG5cdH0pXG5cbn0pKCk7IiwiKGZ1bmN0aW9uKCkge1xuXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdtYXAuaWNvbicsICdmb250JywgZnVuY3Rpb24oZGF0YSkge1xuXG5cdFx0dmFyIGRhdGEgPSAkLmV4dGVuZCh7XG5cdFx0XHRjbGFzc05hbWU6ICdmYSBmYS1ob21lJyxcblx0XHRcdGZvbnRTaXplOiAxMCxcblx0XHRcdGNvbG9yOiAnZ3JlZW4nXG5cdFx0fSwgZGF0YSlcblxuXHRcdHZhciBmb250U2l6ZSA9IGRhdGEuZm9udFNpemVcblxuXHRcdHZhciB0ZW1wbGF0ZSA9IGBcblx0XHRcdDxpIGNsYXNzPVwiJHtkYXRhLmNsYXNzTmFtZX1cIiBzdHlsZT1cImNvbG9yOiAke2RhdGEuY29sb3J9OyBmb250LXNpemU6ICR7Zm9udFNpemV9cHhcIj48L2k+XG5cdFx0YFxuXHRcdHJldHVybiBMLmRpdkljb24oe1xuXHRcdFx0Y2xhc3NOYW1lOiAnZm9udE1hcmtlcicsXG5cdFx0XHRpY29uU2l6ZTogW2ZvbnRTaXplLCBmb250U2l6ZV0sXG5cdFx0XHRpY29uQW5jaG9yOiBbZm9udFNpemUvMiwgZm9udFNpemUvMl0sXG5cdFx0XHRodG1sOiB0ZW1wbGF0ZVxuXHRcdH0pXHRcdFxuXHR9KVxuXG59KSgpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG5cdHZhciBkYXRhU2NoZW1hID0ge1xuXHRcdCRzaXplOiAnbnVtYmVyJyxcblx0XHQkbmFtZTogJ3N0cmluZycsXG5cdFx0c2lkYzogJ3N0cmluZydcblx0fVxuXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdtYXAuaWNvbicsICdtaWxzeW1ib2wnLCBbJ01pbFN5bWJvbFNlcnZpY2UnXSwgZnVuY3Rpb24oZGF0YSwgbXMpIHtcblxuXHRcdC8vY29uc29sZS5sb2coJ2RhdGEnLCBkYXRhKVxuXG5cdFx0aWYgKCEkJC5jaGVja1R5cGUoZGF0YSwgZGF0YVNjaGVtYSkpIHtcblx0XHRcdGNvbnNvbGUud2FybignW1RhY3RpY1ZpZXdDb250cm9sXSBjcmVhdGUgbWlsc3ltYm9sIG1hcmtlciwgbWlzc2luZyBvciB3cm9uZyBwYXJhbWV0ZXJzJywgZGF0YSwgJ3NjaGVtYTogJywgZGF0YVNjaGVtYSlcblx0XHRcdHJldHVybiBudWxsXG5cdFx0fVxuXG5cdFx0dmFyIHN5bWJvbCA9IG5ldyBtcy5TeW1ib2woZGF0YS5zaWRjLCB7XG5cdFx0XHRzaXplOiBkYXRhLnNpemUgfHwgMjAsXG5cdFx0XHR1bmlxdWVEZXNpZ25hdGlvbjogZGF0YS5uYW1lXG5cdFx0fSlcblxuXHRcdHZhciBhbmNob3IgPSBzeW1ib2wuZ2V0QW5jaG9yKClcblxuXHRcdHJldHVybiBMLmljb24oe1xuXHRcdFx0aWNvblVybDogc3ltYm9sLnRvRGF0YVVSTCgpLFxuXHRcdFx0aWNvbkFuY2hvcjogW2FuY2hvci54LCBhbmNob3IueV0sXG5cdFx0fSlcdFx0XG5cdH0pXG5cbn0pKCk7IiwiKGZ1bmN0aW9uKCl7XG5cblxuXHQkJC5yZWdpc3Rlck9iamVjdCgnbWFwLnBsdWdpbicsICdDZW50ZXJNYXAnLCBmdW5jdGlvbihtYXBWaWV3KSB7XG5cblxuXHRcdGxldCBjZW50ZXJWZWggPSBudWxsXG5cblxuXHRcdGZ1bmN0aW9uIG9uQ2VudGVyTWFwKHBvcykge1xuXHRcdFx0Y29uc29sZS5sb2coJ2NlbnRlck1hcCcsIHBvcylcblx0XHRcdG1hcFZpZXcubWFwLnBhblRvKHBvcylcblx0XHRcdGNlbnRlclZlaCA9IG51bGxcblx0XHR9XG5cbi8qXHRcdG1hcFZpZXcuYWN0aW9ucy5vbignY2VudGVyT25WZWhpY3VsZScsIChtYXJrZXIpID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKCdjZW50ZXJPblZlaGljdWxlJywgbWFya2VyLmZ1bGxJZClcblx0XHRcdG1hcFZpZXcubWFwLnBhblRvKG1hcmtlci5nZXRMYXRMbmcoKSlcblx0XHRcdGNlbnRlclZlaCA9IG1hcmtlci5mdWxsSWRcblx0XHR9KVxuXHRcdFxuXHRcdG1hcFZpZXcuZXZlbnRzLm9uKCdvYmplY3RVcGRhdGVkJywgKG9iaikgPT4ge1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnYWlzUmVwb3J0JywgbXNnKVxuXG5cdFx0fSlcdCovXG5cblx0XHRtYXBWaWV3LmFjdGlvbnMub24oJ2NlbnRlck1hcCcsIG9uQ2VudGVyTWFwKVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnW1RhY3RpY1ZpZXdDZW50ZXJNYXBdIGRpc3Bvc2UnKVxuXHRcdFx0XHRtYXBWaWV3LmV2ZW50cy5vZmYoJ29iamVjdENvbnRleHRNZW51Jywgb25PYmplY3RDb250ZXh0TWVudSlcblx0XHRcdFx0bWFwVmlldy5hY3Rpb25zLm9mZignY2VudGVyTWFwJywgb25DZW50ZXJNYXApXG5cdFx0XHR9XG5cdFx0fVxuXHR9KVxuXHRcblx0XG59KSgpOyIsIihmdW5jdGlvbiAoKSB7XG5cblxuXHQkJC5yZWdpc3Rlck9iamVjdCgnbWFwLnBsdWdpbicsICdDaXJjdWxhck1lbnUnLCBmdW5jdGlvbihtYXBWaWV3LCBvcHRpb25zKSB7XG5cblx0XHR2YXIgY29udHJvbENvbnRhaW5lciA9IG1hcFZpZXcuZWx0LmZpbmQoJy5sZWFmbGV0LWNvbnRyb2wtY29udGFpbmVyJylcblxuXHRcdHZhciBjdHJsID0gJCQudmlld0NvbnRyb2xsZXIoY29udHJvbENvbnRhaW5lciwge1xuXHRcdFx0dGVtcGxhdGU6IGA8ZGl2IGNsYXNzPVwibWVudVwiIGJuLWNvbnRyb2w9XCJDaXJjdWxhck1lbnVDb250cm9sXCIgYm4tb3B0aW9ucz1cImNvbmZpZ1wiIGJuLWV2ZW50PVwibWVudVNlbGVjdGVkOiBvbk1lbnVTZWxlY3RlZFwiPjwvZGl2PmAsXG5cdFx0XHRkYXRhOiB7Y29uZmlnOiBvcHRpb25zfSxcblx0XHRcdGV2ZW50czoge1xuXHRcdFx0XHRvbk1lbnVTZWxlY3RlZDogZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdvbk1lbnVTZWxlY3RlZCcsIGl0ZW0pXG5cdFx0XHRcdFx0aWYgKGl0ZW0gJiYgdHlwZW9mIGl0ZW0uYWN0aW9uID09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdFx0XHRtYXBWaWV3LmFjdGlvbnMuZW1pdChpdGVtLmFjdGlvbilcblx0XHRcdFx0XHR9XHRcdFx0XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KVxuXG5cblx0fSlcbn0pKCk7XG4iLCIoZnVuY3Rpb24gKCkge1xuXG5cblx0JCQucmVnaXN0ZXJPYmplY3QoJ21hcC5wbHVnaW4nLCAnT2JqZWN0Q2lyY3VsYXJNZW51JywgWydXZWJTb2NrZXRTZXJ2aWNlJ10sIGZ1bmN0aW9uKG1hcFZpZXcsIG9wdGlvbnMsIGNsaWVudCkge1xuXHRcdC8vY29uc29sZS5sb2coJ0NpcmN1bGFyTWVudScsIG1hcFZpZXcpXG5cblx0XHQvL2NvbnNvbGUubG9nKCdbVGFjdGljVmlld09iamVjdENpcmN1bGFyTWVudV0gb3B0aW9uczonLCBvcHRpb25zKVxuXG5cdFx0b3B0aW9ucy5oYXNUcmlnZ2VyID0gZmFsc2VcblxuXHRcdHZhciBjb250cm9sQ29udGFpbmVyID0gbWFwVmlldy5lbHQuZmluZCgnLmxlYWZsZXQtY29udHJvbC1jb250YWluZXInKVxuXG5cdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihjb250cm9sQ29udGFpbmVyLCB7XG5cdFx0XHR0ZW1wbGF0ZTogYDxkaXYgY2xhc3M9XCJtZW51XCIgYm4tY29udHJvbD1cIkNpcmN1bGFyTWVudUNvbnRyb2xcIiBibi1vcHRpb25zPVwiY29uZmlnXCIgXG5cdFx0XHRcdGJuLWV2ZW50PVwibWVudUNsb3NlZDogb25NZW51Q2xvc2VkLCBtZW51U2VsZWN0ZWQ6IG9uTWVudVNlbGVjdGVkXCIgYm4taWZhY2U9XCJpZmFjZVwiPjwvZGl2PmAsXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdGNvbmZpZzogb3B0aW9uc1xuXHRcdFx0fSxcblx0XHRcdGV2ZW50czoge1xuXHRcdFx0XHRvbk1lbnVDbG9zZWQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uTWVudUNsb3NlZCcpXG5cdFx0XHRcdFx0bWFwVmlldy5lbmFibGVIYW5kbGVycygpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdG9uTWVudVNlbGVjdGVkOiBmdW5jdGlvbihtZW51SW5mbykge1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uTWVudVNlbGVjdGVkJywgbWVudUluZm8sIHNlbE9iai5mdWxsSWQsIHNlbE9iai5wcml2YXRlRGF0YSlcblxuXHRcdFx0XHRcdHNlbE9iai51c2VyRGF0YS5vcHRpb25zLmNvbG9yID0gbWVudUluZm8uY29sb3JcblxuXG5cdFx0XHRcdFx0Y2xpZW50LnNlbmRUbyhzZWxPYmouY3JlYXRvciwgJ21hcFZpZXdTaGFwZUVkaXRlZCcsIHNlbE9iai51c2VyRGF0YSlcdFx0XHRcdFx0XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KVxuXG5cblx0XHR2YXIgY3RybElmID0gY3RybC5zY29wZS5pZmFjZVxuXHRcdHZhciBzZWxPYmpcblxuXHRcdGZ1bmN0aW9uIG9uT2JqZWN0Q29udGV4dE1lbnUob2JqKSB7XG5cdFx0XHRzZWxPYmogPSBvYmpcblx0XHRcdGlmIChvYmogaW5zdGFuY2VvZiBMLkNpcmNsZU1hcmtlcikge1xuXG5cdFx0XHRcdHZhciBjb2xvciA9IHNlbE9iai5vcHRpb25zLmNvbG9yXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ29uSW5pdCcsIGNvbG9yKVxuXHRcdFx0XHR2YXIgaWR4ID0gb3B0aW9ucy5tZW51cy5maW5kSW5kZXgoZnVuY3Rpb24obWVudSkge1xuXHRcdFx0XHRcdHJldHVybiBtZW51LmNvbG9yID09IGNvbG9yXG5cdFx0XHRcdH0pXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2lkeCcsIGlkeClcblx0XHRcdFx0Y3RybElmLnNlbGVjdChpZHgpXG5cblx0XHRcdFx0dmFyIHBvcyA9IG9iai5nZXRMYXRMbmcoKVxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdwb3MnLCBwb3MpXG5cdFx0XHRcdHZhciBwdCA9IG1hcFZpZXcubWFwLmxhdExuZ1RvQ29udGFpbmVyUG9pbnQocG9zKVxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdwdCcsIHB0KVx0XG5cdFx0XHRcdGN0cmxJZi5zaG93TWVudShwdC54LCBwdC55KVxuXHRcdFx0XHRtYXBWaWV3LmRpc2FibGVIYW5kbGVycygpXHRcdFx0XHRcblx0XHRcdH1cblxuXG5cdFx0fVxuXG5cdFx0bWFwVmlldy5ldmVudHMub24oJ29iamVjdENvbnRleHRNZW51Jywgb25PYmplY3RDb250ZXh0TWVudSlcblxuXHRcdHJldHVybiB7XG5cdFx0XHRkaXNwb3NlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ1tUYWN0aWNWaWV3T2JqZWN0Q2lyY3VsYXJNZW51XSBkaXNwb3NlJylcblx0XHRcdFx0bWFwVmlldy5ldmVudHMub2ZmKCdvYmplY3RDb250ZXh0TWVudScsIG9uT2JqZWN0Q29udGV4dE1lbnUpXG5cdFx0XHR9XG5cdFx0fVxuXG4vKlx0XHRjdHJsSWYub24oJ21lbnVDbG9zZWQnLCBmdW5jdGlvbigpIHtcblx0XHRcdC8vY29uc29sZS5sb2coJ21lbnVDbG9zZWQnKVxuXHRcdFx0bWFwVmlldy5lbmFibGVIYW5kbGVycygpXG5cdFx0fSlcblxuXHRcdGN0cmxJZi5vbignbWVudVNlbGVjdGVkJywgZnVuY3Rpb24obWVudUluZm8pIHtcblx0XHRcdGNvbnNvbGUubG9nKCdtZW51U2VsZWN0ZWQnLCBtZW51SW5mbywgc2VsT2JqLmZ1bGxJZCwgc2VsT2JqLnByaXZhdGVEYXRhKVxuXG5cdFx0XHRzZWxPYmoudXNlckRhdGEub3B0aW9ucy5jb2xvciA9IG1lbnVJbmZvLmNvbG9yXG5cblxuXHRcdFx0Y2xpZW50LnNlbmRUbyhzZWxPYmouY3JlYXRvciwgJ21hcFZpZXdTaGFwZUVkaXRlZCcsIHNlbE9iai51c2VyRGF0YSlcblxuXHRcdFx0XG5cdFx0fSkqL1xuXG5cdH0pXG59KSgpO1xuIiwiKGZ1bmN0aW9uKCl7XG5cblx0JCQucmVnaXN0ZXJPYmplY3QoJ21hcC5wbHVnaW4nLCAnUGFuZWxJbmZvJywgZnVuY3Rpb24obWFwVmlldywgb3B0aW9ucykge1xuXG5cblx0XHR2YXIgcGFuZWxJbmZvID0gbWFwVmlldy5hZGRQYW5lbCgncGFuZWxJbmZvJylcblx0XHR2YXIgbWFwID0gbWFwVmlldy5tYXBcblxuXHRcdHZhciBzZWxNYXJrZXIgPSBudWxsXG5cblx0XHRmdW5jdGlvbiBnZXRJbmZvVGVtcGxhdGUobGFiZWwsIHZhbHVlLCBuYW1lKSB7XG5cdFx0XHRyZXR1cm4gYDxkaXY+XG5cdFx0XHRcdFx0XHQ8c3Ryb25nPiR7bGFiZWx9PC9zdHJvbmc+XG5cdFx0XHRcdFx0XHQ8c3BhbiBibi10ZXh0PVwiJHtuYW1lfVwiPiR7dmFsdWV9PC9zcGFuPlxuXHRcdFx0XHRcdDwvZGl2PmBcblx0XHR9XG5cblx0XHRmdW5jdGlvbiB1cGRhdGVJbmZvKG9iaikge1xuXHRcdFx0dmFyIHBvcyA9IG9iai5nZXRMYXRMbmcoKVxuXHRcdFx0dmFyIHRvb2x0aXAgPSBvYmouZ2V0VG9vbHRpcCgpXG5cdFx0XHQvL2NvbnNvbGUubG9nKCd0b29sdGlwJywgdG9vbHRpcClcblx0XHRcdHBhbmVsSW5mby51cGRhdGVUZW1wbGF0ZShjdHgsIHtcblx0XHRcdFx0bGF0OiBwb3MubGF0LnRvRml4ZWQoNSksXG5cdFx0XHRcdGxuZzogcG9zLmxuZy50b0ZpeGVkKDUpLFxuXHRcdFx0XHRsYWJlbDogb2JqLnVzZXJEYXRhLmxhYmVsIHx8IG9iai5mdWxsSWRcblx0XHRcdH0pXG5cdFx0fVxuXG5cdFx0cGFuZWxJbmZvLmFwcGVuZChnZXRJbmZvVGVtcGxhdGUoJ1pvb20gTGV2ZWwnLCBtYXAuZ2V0Wm9vbSgpLCAnem9vbUxldmVsJykpXG5cdFx0cGFuZWxJbmZvLmFwcGVuZChnZXRJbmZvVGVtcGxhdGUoJ0xhYmVsJywgJycsICdsYWJlbCcpKVxuXHRcdHBhbmVsSW5mby5hcHBlbmQoZ2V0SW5mb1RlbXBsYXRlKCdMYXRpdHVkZScsIDAsICdsYXQnKSlcblx0XHRwYW5lbEluZm8uYXBwZW5kKGdldEluZm9UZW1wbGF0ZSgnTG9uZ2l0dWRlJywgMCwgJ2xuZycpKVxuXHRcdHZhciBjdHggPSBwYW5lbEluZm8ucHJvY2Vzc1RlbXBsYXRlKClcblxuXG5cdFx0bWFwLm9uKCd6b29tZW5kJywgKCkgPT4ge1xuXHRcdFx0cGFuZWxJbmZvLnVwZGF0ZVRlbXBsYXRlKGN0eCwge3pvb21MZXZlbDogbWFwLmdldFpvb20oKX0pXG5cdFx0fSlcblxuXHRcdG1hcFZpZXcuZXZlbnRzLm9uKCdvYmplY3RDbGlja2VkJywgZnVuY3Rpb24ob2JqKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnW3BhbmVsSW5mb10gb2JqZWN0Q2xpY2tlZCcsIG9iai5mdWxsSWQpXG5cdFx0XHRpZiAob2JqIGluc3RhbmNlb2YgTC5NYXJrZXIgfHwgb2JqIGluc3RhbmNlb2YgTC5DaXJjbGVNYXJrZXIpIHtcblx0XHRcdFx0dXBkYXRlSW5mbyhvYmopXG5cdFx0XHRcdHNlbE1hcmtlciA9IG9ialxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0fSlcblxuXHRcdG1hcFZpZXcuZXZlbnRzLm9uKCdvYmplY3RVcGRhdGVkJywgZnVuY3Rpb24ob2JqKSB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKCdbcGFuZWxJbmZvXSBvYmplY3RVcGRhdGVkJywgb2JqLmZ1bGxJZClcblx0XHRcdGlmIChvYmogPT0gc2VsTWFya2VyKSB7XG5cdFx0XHRcdHVwZGF0ZUluZm8ob2JqKVxuXHRcdFx0fVxuXHRcdH0pXG5cblxuXHR9KVxuXG59KSgpOyIsIihmdW5jdGlvbigpIHtcblxuXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdtYXAucGx1Z2luJywgJ1NoYXBlRGVjb2RlcicsIFsnV2ViU29ja2V0U2VydmljZSddLCBmdW5jdGlvbihtYXBWaWV3LCBvcHRpb25zLCBjbGllbnQpIHtcblxuXG5cdFx0dmFyIHRvcGljcyA9IE9iamVjdC5rZXlzKG1hcFZpZXcubGF5ZXJzKS5tYXAoZnVuY3Rpb24obGF5ZXIpe1xuXHRcdFx0cmV0dXJuIGBtYXBWaWV3QWRkU2hhcGUuJHtsYXllcn0uKmBcblx0XHR9KVxuXG5cblx0XHRmdW5jdGlvbiBvbkFkZFNoYXBlKG1zZykge1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnb25UYWN0aWNWaWV3QWRkU2hhcGUnLCBtc2cpXG5cdFx0XHRpZiAobXNnLmlkID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oJ01pc3NpbmcgbGF5ZXIgb3IgaWQnKVxuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH1cblxuXHRcdFx0aWYgKG1zZy5kYXRhID09IHVuZGVmaW5lZCkgeyAvLyBubyBwYXlsb2FkLCBtZWFucyByZW1vdmUgb2JqZWN0XG5cdFx0XHRcdG1hcFZpZXcucmVtb3ZlU2hhcGUobXNnLmlkKVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHZhciBvYmogPSBtYXBWaWV3LnVwZGF0ZVNoYXBlKG1zZy5pZCwgbXNnLmRhdGEpXG5cdFx0XHRcdG9iai5jcmVhdG9yID0gbXNnLnNyY1xuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0Y2xpZW50LnJlZ2lzdGVyKHRvcGljcywgdHJ1ZSwgb25BZGRTaGFwZSlcblxuXHRcdHJldHVybiB7XG5cdFx0XHRkaXNwb3NlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ1tTaGFwZURlY29kZXJdIGRpc3Bvc2UnKVxuXHRcdFx0XHRjbGllbnQudW5yZWdpc3Rlcih0b3BpY3MsIG9uQWRkU2hhcGUpXG5cdFx0XHR9XG5cdFx0fVxuXG5cdH0pXG5cbn0pKCk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cblxuXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdtYXAucGx1Z2luJywgJ1NoYXBlRWRpdG9yJywgWydXZWJTb2NrZXRTZXJ2aWNlJ10sIGZ1bmN0aW9uKG1hcFZpZXcsIG9wdGlvbnMsIGNsaWVudCkge1xuXG5cdFx0bGV0IG1hcCA9IG1hcFZpZXcubWFwXG5cdFx0bGV0IGZlYXR1cmVHcm91cE5hbWVcblxuXHRcdGlmIChvcHRpb25zLmVkaXQgIT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRmZWF0dXJlR3JvdXBOYW1lID0gb3B0aW9ucy5lZGl0LmZlYXR1cmVHcm91cFxuXHRcdFx0aWYgKHR5cGVvZiBmZWF0dXJlR3JvdXBOYW1lID09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdGxldCBmZWF0dXJlR3JvdXAgPSBtYXBWaWV3LmxheWVyc1tmZWF0dXJlR3JvdXBOYW1lXVxuXHRcdFx0XHRpZiAoZmVhdHVyZUdyb3VwID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGNvbnNvbGUud2FybihgbGF5ZXIgJyR7ZmVhdHVyZUdyb3VwTmFtZX0nIGlzIG5vdCBkZWZpbmVkYClcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRvcHRpb25zLmVkaXQuZmVhdHVyZUdyb3VwID0gZmVhdHVyZUdyb3VwXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHR2YXIgZHJhd0NvbnRyb2wgPSBuZXcgTC5Db250cm9sLkRyYXcob3B0aW9ucylcblx0XHRtYXAuYWRkQ29udHJvbChkcmF3Q29udHJvbClcblxuXHRcdG1hcC5vbignZHJhdzpjcmVhdGVkJywgKGUpICA9PiB7XG5cdFx0XHR2YXIgbGF5ZXIgPSBlLmxheWVyXG5cdFx0XHR2YXIgdHlwZSA9IGUubGF5ZXJUeXBlXG5cdFx0XHRjb25zb2xlLmxvZygnZHJhdzpjcmVhdGVkJywgdHlwZSlcblxuXG5cblx0XHRcdHZhciBkYXRhID0gbWFwVmlldy5nZXRTaGFwZURhdGEobGF5ZXIsIHR5cGUpXG5cdFx0XHRcblx0XHRcdC8vY29uc29sZS5sb2coJ2RhdGEnLCBkYXRhKVxuXG5cdFx0XHRjbGllbnQuZW1pdCgnbWFwVmlld1NoYXBlQ3JlYXRlZC4nICsgdHlwZSwgZGF0YSlcblx0XHRcdFxuXHRcdH0pXHRcblxuXHRcdG1hcC5vbignZHJhdzplZGl0ZWQnLCAoZSkgPT4ge1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnZHJhdzplZGl0ZWQnLCBlKVxuXHRcdFx0ZS5sYXllcnMuZWFjaExheWVyKChsYXllcikgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgb2JqZWN0IHdpdGggaWQgJyR7bGF5ZXIuZnVsbElkfScgd2FzIGVkaXRlZGApXG5cdFx0XHRcdG1hcFZpZXcudXBkYXRlU2hhcGVNb2RlbChsYXllcilcblx0XHRcdFx0Y2xpZW50LnNlbmRUbyhsYXllci5jcmVhdG9yLCAnbWFwVmlld1NoYXBlRWRpdGVkJywgbGF5ZXIudXNlckRhdGEpXG5cblx0XHRcdH0pXG5cdFx0fSlcdFxuXG5cblx0XHRtYXAub24oJ2RyYXc6ZGVsZXRlZCcsIChlKSA9PiB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKCdkcmF3OmVkaXRlZCcsIGUpXG5cdFx0XHRlLmxheWVycy5lYWNoTGF5ZXIoKGxheWVyKSA9PiB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBvYmplY3Qgd2l0aCBpZCAnJHtsYXllci5mdWxsSWR9JyB3YXMgZGVsZXRlZGApXHRcdFx0XHRcblx0XHRcdFx0Y2xpZW50LnNlbmRUbyhsYXllci5jcmVhdG9yLCAnbWFwVmlld1NoYXBlRGVsZXRlZCcsIGxheWVyLnVzZXJEYXRhKVxuXHRcdFx0fSlcblx0XHR9KVx0XG5cdFx0XG5cdH0pXG5cbn0pKCk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cblxuXHQkJC5yZWdpc3Rlck9iamVjdCgnbWFwLnNoYXBlJywgJ2NpcmNsZScsIGZ1bmN0aW9uKG1hcFZpZXcpIHtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRjcmVhdGVTY2hlbWE6IHtcblx0XHRcdFx0bGF0bG5nOiB7XG5cdFx0XHRcdFx0bGF0OiAnbnVtYmVyJywgXG5cdFx0XHRcdFx0bG5nOiAnbnVtYmVyJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRyYWRpdXM6ICdudW1iZXInLFxuXHRcdFx0XHQkb3B0aW9uczoge1xuXHRcdFx0XHRcdCRjb2xvcjogJ3N0cmluZydcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHVwZGF0ZVNjaGVtYToge1xuXHRcdFx0XHQkbGF0bG5nOiB7XG5cdFx0XHRcdFx0bGF0OiAnbnVtYmVyJywgXG5cdFx0XHRcdFx0bG5nOiAnbnVtYmVyJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHQkcmFkaXVzOiAnbnVtYmVyJyxcblx0XHRcdFx0JG9wdGlvbnM6IHtcblx0XHRcdFx0XHQkY29sb3I6ICdzdHJpbmcnXG5cdFx0XHRcdH1cblx0XHRcdH0sXHRcdFx0XG5cdFx0XHRjcmVhdGU6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0cmV0dXJuIEwuY2lyY2xlKGRhdGEubGF0bG5nLCBkYXRhLnJhZGl1cywgZGF0YS5vcHRpb25zKVxuXHRcdFx0fSxcblx0XHRcdHVwZGF0ZTogZnVuY3Rpb24obGF5ZXIsIGRhdGEpIHtcblx0XHRcdFxuXHRcdFx0XHRpZiAoZGF0YS5sYXRsbmcpIHtcblx0XHRcdFx0XHRsYXllci5zZXRMYXRMbmcoZGF0YS5sYXRsbmcpXG5cdFx0XHRcdH1cdFxuXHRcdFx0XHRcblx0XHRcdFx0aWYgKGRhdGEucmFkaXVzKSB7XG5cdFx0XHRcdFx0bGF5ZXIuc2V0UmFkaXVzKGRhdGEucmFkaXVzKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChkYXRhLm9wdGlvbnMpIHtcblx0XHRcdFx0XHRsYXllci5zZXRTdHlsZShkYXRhLm9wdGlvbnMpXG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHR9LFxuXHRcdFx0Z2V0RGF0YTogZnVuY3Rpb24obGF5ZXIsIGRhdGEpIHtcblx0XHRcdFx0ZGF0YS5yYWRpdXMgPSBsYXllci5nZXRSYWRpdXMoKVxuXHRcdFx0XHRkYXRhLmxhdGxuZyA9IGxheWVyLmdldExhdExuZygpXHRcblx0XHRcdH1cblx0XHR9XG5cdH0pXG59KSgpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG5cblxuXHQkJC5yZWdpc3Rlck9iamVjdCgnbWFwLnNoYXBlJywgJ2NpcmNsZU1hcmtlcicsIGZ1bmN0aW9uKG1hcFZpZXcpIHtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRjcmVhdGVTY2hlbWE6IHtcblx0XHRcdFx0bGF0bG5nOiB7XG5cdFx0XHRcdFx0bGF0OiAnbnVtYmVyJywgXG5cdFx0XHRcdFx0bG5nOiAnbnVtYmVyJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHQkb3B0aW9uczoge1xuXHRcdFx0XHRcdCRjb2xvcjogJ3N0cmluZydcblx0XHRcdFx0fVxuXHRcdFx0fSxcblxuXHRcdFx0dXBkYXRlU2NoZW1hOiB7XG5cdFx0XHRcdCRsYXRsbmc6IHtcblx0XHRcdFx0XHRsYXQ6ICdudW1iZXInLCBcblx0XHRcdFx0XHRsbmc6ICdudW1iZXInXG5cdFx0XHRcdH0sXG5cdFx0XHRcdCRvcHRpb25zOiB7XG5cdFx0XHRcdFx0JGNvbG9yOiAnc3RyaW5nJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFx0XHRcdFxuXHRcdFx0Y3JlYXRlOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRcdFxuXHRcdFx0XHRyZXR1cm4gTC5jaXJjbGVNYXJrZXIoZGF0YS5sYXRsbmcsIGRhdGEub3B0aW9ucylcblx0XHRcdH0sXG5cdFx0XHR1cGRhdGU6IGZ1bmN0aW9uKGxheWVyLCBkYXRhKSB7XG5cdFx0XHRcblx0XHRcdFx0aWYgKGRhdGEubGF0bG5nKSB7XG5cdFx0XHRcdFx0bGF5ZXIuc2V0TGF0TG5nKGRhdGEubGF0bG5nKVxuXHRcdFx0XHR9XHRcblx0XHRcdFx0XG5cdFx0XHRcdGlmIChkYXRhLm9wdGlvbnMpIHtcblx0XHRcdFx0XHRsYXllci5zZXRTdHlsZShkYXRhLm9wdGlvbnMpXG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHR9XG5cblx0XHR9XG5cdH0pXG59KSgpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG5cblx0ZnVuY3Rpb24gcHJvY2Vzc0NvbnRlbnQoZGF0YSkge1xuXHRcdHZhciBjb250ZW50ID0gZGF0YS5wb3B1cENvbnRlbnRcblx0XHRpZiAoIUFycmF5LmlzQXJyYXkoY29udGVudCkpIHtcblx0XHRcdGNvbnRlbnQgPSBbY29udGVudF1cblx0XHR9XG5cdFx0dmFyIGRpdiA9ICQoJzxkaXY+Jylcblx0XHRcdC5jc3MoJ2Rpc3BsYXknLCAnZmxleCcpXG5cdFx0XHQuY3NzKCdmbGV4LWRpcmVjdGlvbicsICdjb2x1bW4nKVxuXG5cdFx0Y29udGVudC5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdC8vY29uc29sZS5sb2coJ2l0ZW0nLCBpdGVtKVxuXHRcdFx0dmFyIGRpdkl0ZW0gPSAkKCc8ZGl2PicpXG5cdFx0XHRcdC5jc3MoJ2Rpc3BsYXknLCAnZmxleCcpXG5cdFx0XHRcdC5jc3MoJ2p1c3RpZnktY29udGVudCcsICdzcGFjZS1iZXR3ZWVuJylcblx0XHRcblx0XHRcdGlmICh0eXBlb2YgaXRlbSA9PSAnc3RyaW5nJykge1xuXHRcdFx0XHRkaXZJdGVtLmh0bWwoaXRlbSkucHJvY2Vzc1RlbXBsYXRlKGRhdGEucHJvcHMpXG5cdFx0XHR9XG5cblx0XHRcdGlmICh0eXBlb2YgaXRlbSA9PSAnb2JqZWN0JyAmJlxuXHRcdFx0XHQgdHlwZW9mIGl0ZW0ubGFiZWwgPT0gJ3N0cmluZycgJiZcblx0XHRcdFx0IHR5cGVvZiBpdGVtLnByb3AgPT0gJ3N0cmluZycpIHtcblxuXHRcdFx0XHR2YXIgdGVtcGxhdGUgPSBgPHNwYW4gc3R5bGU9XCJtYXJnaW4tcmlnaHQ6IDEwcHhcIj4ke2l0ZW0ubGFiZWx9PC9zcGFuPjxzcGFuIGJuLXRleHQ9XCIke2l0ZW0ucHJvcH1cIj48L3NwYW4+YFxuXHRcdFx0XHRkaXZJdGVtLmh0bWwodGVtcGxhdGUpLnByb2Nlc3NUZW1wbGF0ZShkYXRhLnByb3BzKVxuXHRcdFx0fVxuXG5cdFx0XHRkaXYuYXBwZW5kKGRpdkl0ZW0pXG5cdFx0fSlcblxuXHRcdHJldHVybiBkaXYuZ2V0KDApXG5cdH1cblxuXG5cblx0JCQucmVnaXN0ZXJPYmplY3QoJ21hcC5zaGFwZScsICdtYXJrZXInLCBmdW5jdGlvbihtYXBWaWV3KSB7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Y3JlYXRlU2NoZW1hOiB7XG5cdFx0XHRcdGxhdGxuZzoge1xuXHRcdFx0XHRcdGxhdDogJ251bWJlcicsIFxuXHRcdFx0XHRcdGxuZzogJ251bWJlcidcblx0XHRcdFx0fSxcblx0XHRcdFx0JHJvdGF0aW9uQW5nbGU6ICdudW1iZXInLFxuXHRcdFx0XHQkaWNvbjoge1xuXHRcdFx0XHRcdHR5cGU6ICdzdHJpbmcnXG5cdFx0XHRcdH0sXG5cdFx0XHRcdCRvcHRpb25zOiB7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdCRwb3B1cENvbnRlbnQ6IFsnc3RyaW5nJywge2xhYmVsOiAnc3RyaW5nJywgcHJvcDogJ3N0cmluZyd9XVxuXHRcdFx0fSxcblxuXHRcdFx0dXBkYXRlU2NoZW1hOiB7XG5cdFx0XHRcdCRsYXRsbmc6IHtcblx0XHRcdFx0XHRsYXQ6ICdudW1iZXInLCBcblx0XHRcdFx0XHRsbmc6ICdudW1iZXInXG5cdFx0XHRcdH0sXG5cdFx0XHRcdCRyb3RhdGlvbkFuZ2xlOiAnbnVtYmVyJyxcblx0XHRcdFx0JGljb246IHtcblx0XHRcdFx0XHR0eXBlOiAnc3RyaW5nJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHQkb3B0aW9uczoge1xuXHRcdFx0XHR9LFxuXHRcdFx0XHQkcG9wdXBDb250ZW50OiBbJ3N0cmluZycsIHtsYWJlbDogJ3N0cmluZycsIHByb3A6ICdzdHJpbmcnfV1cblx0XHRcdH0sXG5cblx0XHRcdGNyZWF0ZTogZnVuY3Rpb24oZGF0YSkge1xuXG5cdFx0XHRcdHZhciBvcHRpb25zID0gZGF0YS5vcHRpb25zIHx8IHt9XG5cdFx0XHRcdGlmIChkYXRhLmljb24pIHtcblx0XHRcdFx0XHRvcHRpb25zLmljb24gPSBtYXBWaWV3LmdldEljb25NYXJrZXIoZGF0YS5pY29uLnR5cGUsIGRhdGEuaWNvbilcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZGF0YS5yb3RhdGlvbkFuZ2xlKSB7XG5cdFx0XHRcdFx0b3B0aW9ucy5yb3RhdGlvbkFuZ2xlID0gZGF0YS5yb3RhdGlvbkFuZ2xlXG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgbWFya2VyID0gTC5tYXJrZXIoZGF0YS5sYXRsbmcsIG9wdGlvbnMpXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XG5cdFx0XHRcdGlmIChkYXRhLnBvcHVwQ29udGVudCkge1xuXHRcdFx0XHRcdGxldCBwb3B1cCA9IEwucG9wdXAoe2F1dG9DbG9zZTogZmFsc2UsIGNsb3NlQnV0dG9uOiB0cnVlLCBjbGFzc05hbWU6ICd0b3RvJywgYXV0b1BhbjogZmFsc2V9KVxuXHRcdFx0XHRcdHBvcHVwLnNldENvbnRlbnQocHJvY2Vzc0NvbnRlbnQoZGF0YSkpXG5cdFx0XHRcdFx0bWFya2VyLmJpbmRQb3B1cChwb3B1cClcblx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFxuXHRcdFx0XHRyZXR1cm4gbWFya2VyXG5cdFx0XHR9LFxuXG5cdFx0XHR1cGRhdGU6IGZ1bmN0aW9uKGxheWVyLCBkYXRhKSB7XG5cdFxuXG5cdFx0XHRcdGlmIChkYXRhLmxhdGxuZykge1xuXHRcdFx0XHRcdGxheWVyLnNldExhdExuZyhkYXRhLmxhdGxuZylcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZGF0YS5pY29uKSB7XG5cdFx0XHRcdFx0bGF5ZXIuc2V0SWNvbihtYXBWaWV3LmdldEljb25NYXJrZXIoZGF0YS5pY29uLnR5cGUsIGRhdGEuaWNvbikpXG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGRhdGEucm90YXRpb25BbmdsZSkge1xuXHRcdFx0XHRcdGxheWVyLnNldFJvdGF0aW9uQW5nbGUoZGF0YS5yb3RhdGlvbkFuZ2xlKVxuXHRcdFx0XHR9XHRcblxuXHRcdFx0XHRpZiAoZGF0YS5wb3B1cENvbnRlbnQpIHtcblx0XHRcdFx0XHRsYXllci5zZXRQb3B1cENvbnRlbnQocHJvY2Vzc0NvbnRlbnQoZGF0YSkpXG5cdFx0XHRcdH1cdFxuXG5cdFx0XHR9LFxuXHRcdFx0Z2V0RGF0YTogZnVuY3Rpb24obGF5ZXIsIGRhdGEpIHtcblx0XHRcdFx0ZGF0YS5sYXRsbmcgPSBsYXllci5nZXRMYXRMbmcoKVxuXHRcdFx0fVxuXG5cdFx0fSBcblx0fSlcbn0pKCk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cblx0dmFyIGNyZWF0ZVNjaGVtYSA9IHtcblx0XHRsYXRsbmdzOiBbe1xuXHRcdFx0bGF0OiAnbnVtYmVyJywgXG5cdFx0XHRsbmc6ICdudW1iZXInXG5cdFx0fV0sXG5cdFx0JG9wdGlvbnM6IHtcblx0XHRcdCRjb2xvcjogJ3N0cmluZydcblx0XHR9XG5cdH1cblxuXHR2YXIgdXBkYXRlU2NoZW1hID0ge1xuXHRcdCRsYXRsbmdzOiBbe1xuXHRcdFx0bGF0OiAnbnVtYmVyJywgXG5cdFx0XHRsbmc6ICdudW1iZXInXG5cdFx0fV0sXG5cdFx0JG9wdGlvbnM6IHtcblx0XHRcdCRjb2xvcjogJ3N0cmluZydcblx0XHR9XG5cdH1cblxuXHQkJC5yZWdpc3Rlck9iamVjdCgnbWFwLnNoYXBlJywgJ3BvbHlnb24nLCBmdW5jdGlvbihtYXBWaWV3KSB7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0Y3JlYXRlOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRcdGlmICghJCQuY2hlY2tUeXBlKGRhdGEsIGNyZWF0ZVNjaGVtYSkpIHtcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ1tUYWN0aWNWaWV3Q29udHJvbF0gY3JlYXRlIHBvbHlnb24sIG1pc3Npbmcgb3Igd3JvbmcgcGFyYW1ldGVycycsIGRhdGEsICdzY2hlbWE6ICcsIGNyZWF0ZVNjaGVtYSlcblx0XHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBMLnBvbHlnb24oZGF0YS5sYXRsbmdzLCBkYXRhLm9wdGlvbnMpXG5cdFx0XHR9LFxuXHRcdFx0dXBkYXRlOiBmdW5jdGlvbihsYXllciwgZGF0YSkge1xuXHRcdFx0XHRpZiAoISQkLmNoZWNrVHlwZShkYXRhLCBjcmVhdGVTY2hlbWEpKSB7XG5cdFx0XHRcdFx0Y29uc29sZS53YXJuKCdbVGFjdGljVmlld0NvbnRyb2xdIGNyZWF0ZSBwb2x5Z29uLCBtaXNzaW5nIG9yIHdyb25nIHBhcmFtZXRlcnMnLCBkYXRhLCAnc2NoZW1hOiAnLCBjcmVhdGVTY2hlbWEpXG5cdFx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZGF0YS5sYXRsbmdzKSB7XG5cdFx0XHRcdFx0bGF5ZXIuc2V0TGF0TG5ncyhkYXRhLmxhdGxuZ3MpXG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGRhdGEub3B0aW9ucykge1xuXHRcdFx0XHRcdGxheWVyLnNldFN0eWxlKGRhdGEub3B0aW9ucylcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGdldERhdGE6IGZ1bmN0aW9uKGxheWVyLCBkYXRhKSB7XG5cdFx0XHRcdGRhdGEubGF0bG5ncyA9IGxheWVyLmdldExhdExuZ3MoKVswXVxuXHRcdFx0fVxuXG5cdFx0fVxuXHR9KVxufSkoKTtcbiIsIihmdW5jdGlvbigpIHtcblxuXG5cblx0JCQucmVnaXN0ZXJPYmplY3QoJ21hcC5zaGFwZScsICdwb2x5bGluZScsIGZ1bmN0aW9uKG1hcFZpZXcpIHtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRjcmVhdGVTY2hlbWE6IHtcblx0XHRcdFx0bGF0bG5nczogW3tcblx0XHRcdFx0XHRsYXQ6ICdudW1iZXInLCBcblx0XHRcdFx0XHRsbmc6ICdudW1iZXInXG5cdFx0XHRcdH1dLFxuXHRcdFx0XHQkb3B0aW9uczoge1xuXHRcdFx0XHRcdCRjb2xvcjogJ3N0cmluZydcblx0XHRcdFx0fVxuXHRcdFx0fSxcblxuXHRcdFx0dXBkYXRlU2NoZW1hOiB7XG5cdFx0XHRcdCRsYXRsbmdzOiBbe1xuXHRcdFx0XHRcdGxhdDogJ251bWJlcicsIFxuXHRcdFx0XHRcdGxuZzogJ251bWJlcidcblx0XHRcdFx0fV0sXG5cdFx0XHRcdCRvcHRpb25zOiB7XG5cdFx0XHRcdFx0JGNvbG9yOiAnc3RyaW5nJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHRjcmVhdGU6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0cmV0dXJuIEwucG9seWxpbmUoZGF0YS5sYXRsbmdzLCBkYXRhLm9wdGlvbnMpXG5cdFx0XHR9LFxuXHRcdFx0dXBkYXRlOiBmdW5jdGlvbihsYXllciwgZGF0YSkge1xuXG5cdFx0XHRcdGlmIChkYXRhLmxhdGxuZ3MpIHtcblx0XHRcdFx0XHRsYXllci5zZXRMYXRMbmdzKGRhdGEubGF0bG5ncylcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZGF0YS5vcHRpb25zKSB7XG5cdFx0XHRcdFx0bGF5ZXIuc2V0U3R5bGUoZGF0YS5vcHRpb25zKVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0Z2V0RGF0YTogZnVuY3Rpb24obGF5ZXIsIGRhdGEpIHtcblx0XHRcdFx0ZGF0YS5sYXRsbmdzID0gbGF5ZXIuZ2V0TGF0TG5ncygpXG5cdFx0XHR9XG5cblx0XHR9XG5cdH0pXG59KSgpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG5cblxuXHQkJC5yZWdpc3Rlck9iamVjdCgnbWFwLnNoYXBlJywgJ3JlY3RhbmdsZScsIGZ1bmN0aW9uKG1hcFZpZXcpIHtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRjcmVhdGVTY2hlbWE6IHtcblx0XHRcdFx0bm9ydGhXZXN0OiB7XG5cdFx0XHRcdFx0bGF0OiAnbnVtYmVyJywgXG5cdFx0XHRcdFx0bG5nOiAnbnVtYmVyJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRzb3V0aEVhc3Q6IHtcblx0XHRcdFx0XHRsYXQ6ICdudW1iZXInLCBcblx0XHRcdFx0XHRsbmc6ICdudW1iZXInXG5cdFx0XHRcdH0sXHRcdHJhZGl1czogJ251bWJlcicsXG5cdFx0XHRcdCRvcHRpb25zOiB7XG5cdFx0XHRcdFx0JGNvbG9yOiAnc3RyaW5nJ1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXG5cdFx0XHR1cGRhdGVTY2hlbWE6IHtcblx0XHRcdFx0JG5vcnRoV2VzdDoge1xuXHRcdFx0XHRcdGxhdDogJ251bWJlcicsIFxuXHRcdFx0XHRcdGxuZzogJ251bWJlcidcblx0XHRcdFx0fSxcblx0XHRcdFx0JHNvdXRoRWFzdDoge1xuXHRcdFx0XHRcdGxhdDogJ251bWJlcicsIFxuXHRcdFx0XHRcdGxuZzogJ251bWJlcidcblx0XHRcdFx0fSxcdFx0cmFkaXVzOiAnbnVtYmVyJyxcblx0XHRcdFx0JG9wdGlvbnM6IHtcblx0XHRcdFx0XHQkY29sb3I6ICdzdHJpbmcnXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cblx0XHRcdGNyZWF0ZTogZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0XG5cdFx0XHRcdGxldCBib3VuZHMgPSBMLmxhdExuZ0JvdW5kcyhkYXRhLm5vcnRoV2VzdCwgZGF0YS5zb3V0aEVhc3QpXG5cdFx0XHRcdHJldHVybiBMLnJlY3RhbmdsZShib3VuZHMsIGRhdGEub3B0aW9ucylcblx0XHRcdH0sXG5cdFx0XHR1cGRhdGU6IGZ1bmN0aW9uKGxheWVyLCBkYXRhKSB7XG5cdFx0XHRcdFxuXHRcdFx0XHRsZXQgYm91bmRzID0gTC5sYXRMbmdCb3VuZHMoZGF0YS5ub3J0aFdlc3QsIGRhdGEuc291dGhFYXN0KVxuXHRcdFx0XHRsYXllci5zZXRCb3VuZHMoYm91bmRzKVxuXHRcdFx0XHRsYXllci5zZXRTdHlsZShkYXRhLm9wdGlvbnMpXG5cdFx0XHR9LFx0XHRcdFxuXHRcdFx0Z2V0RGF0YTogZnVuY3Rpb24obGF5ZXIsIGRhdGEpIHtcblx0XHRcdFx0bGV0IGJvdW5kcyA9IGxheWVyLmdldEJvdW5kcygpXG5cdFx0XHRcdGRhdGEubm9ydGhXZXN0ID0gIGJvdW5kcy5nZXROb3J0aFdlc3QoKVxuXHRcdFx0XHRkYXRhLnNvdXRoRWFzdCA9ICBib3VuZHMuZ2V0U291dGhFYXN0KClcblx0XHRcdH1cblx0XHR9XG5cdH0pXG59KSgpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG5cdCQkLnJlZ2lzdGVyT2JqZWN0KCdtYXAuc2hhcGUnLCAnc2VjdG9yJywgZnVuY3Rpb24obWFwVmlldykge1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGNyZWF0ZVNjaGVtYToge1xuXHRcdFx0XHRsYXRsbmc6IHtcblx0XHRcdFx0XHRsYXQ6ICdudW1iZXInLCBcblx0XHRcdFx0XHRsbmc6ICdudW1iZXInXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHJhZGl1czogJ251bWJlcicsXG5cdFx0XHRcdGRpcmVjdGlvbjogJ251bWJlcicsXG5cdFx0XHRcdHNpemU6ICdudW1iZXInLFxuXHRcdFx0XHQkb3B0aW9uczoge1xuXHRcdFx0XHRcdCRjb2xvcjogJ3N0cmluZydcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdHVwZGF0ZVNjaGVtYToge1xuXHRcdFx0XHQkbGF0bG5nOiB7XG5cdFx0XHRcdFx0bGF0OiAnbnVtYmVyJywgXG5cdFx0XHRcdFx0bG5nOiAnbnVtYmVyJ1xuXHRcdFx0XHR9LFxuXHRcdFx0XHQkcmFkaXVzOiAnbnVtYmVyJyxcblx0XHRcdFx0JGRpcmVjdGlvbjogJ251bWJlcicsXG5cdFx0XHRcdCRzaXplOiAnbnVtYmVyJyxcblx0XHRcdFx0JG9wdGlvbnM6IHtcblx0XHRcdFx0XHQkY29sb3I6ICdzdHJpbmcnXG5cdFx0XHRcdH1cblx0XHRcdH0sXHRcdFx0XG5cdFx0XHRjcmVhdGU6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0dmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7cmFkaXVzOiBkYXRhLnJhZGl1c30sIGRhdGEub3B0aW9ucylcblx0XHRcdFx0dmFyIHNlY3RvciA9IEwuc2VtaUNpcmNsZShkYXRhLmxhdGxuZywgb3B0aW9ucylcblx0XHRcdFx0c2VjdG9yLnNldERpcmVjdGlvbihkYXRhLmRpcmVjdGlvbiwgZGF0YS5zaXplKVxuXHRcdFx0XHRyZXR1cm4gc2VjdG9yXG5cdFx0XHR9LFxuXHRcdFx0dXBkYXRlOiBmdW5jdGlvbihsYXllciwgZGF0YSkge1xuXHRcdFx0XHRpZiAoZGF0YS5sYXRsbmcpIHtcblx0XHRcdFx0XHRsYXllci5zZXRMYXRMbmcoZGF0YS5sYXRsbmcpXG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGRhdGEucmFkaXVzKSB7XG5cdFx0XHRcdFx0bGF5ZXIuc2V0UmFkaXVzKGRhdGEucmFkaXVzKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChkYXRhLmRpcmVjdGlvbiAmJiBkYXRhLnNpemUpIHtcblx0XHRcdFx0XHRsYXllci5zZXREaXJlY3Rpb24oZGF0YS5kaXJlY3Rpb24sIGRhdGEuc2l6ZSlcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZGF0YS5vcHRpb25zKSB7XG5cdFx0XHRcdFx0bGF5ZXIuc2V0U3R5bGUoZGF0YS5vcHRpb25zKVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHR9XG5cdH0pXG59KSgpO1xuIl19
