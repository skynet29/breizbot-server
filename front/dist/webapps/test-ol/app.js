$$.configReady(function(config) {

	$$.startApp('MainControl')
})
$$.registerControl('MainControl', ['OpenLayerService', 'MilSymbolService'], function(elt, ol, ms) {

	var curAction = null

	function setAction(action) {
		if (curAction != null) {
			map.removeInteraction(curAction)
		}
		if (action != null) {
			map.addInteraction(action)
		}
		
		curAction = action
	}

	var ctrl = $$.viewController(elt, {
		template: "<div class=\"bn-flex-1 bn-no-overflow bn-flex-col\">\n	<div id=\"map\" class=\"bn-flex-1 bn-no-overflow\"></div>\n	<div id=\"scale-line\" class=\"scale-line\"></div>\n	<div>\n		<button bn-event=\"click: onClear\">Clear</button>\n		<button bn-event=\"click: onSelect\">Select</button>\n		<button bn-event=\"click: onDrawPolygon\">Polygon</button>\n		<button bn-event=\"click: onDrawCircle\">Circle</button>\n		<button bn-event=\"click: onModify\">Modify</button>\n		<button bn-event=\"click: onNone\">None</button>\n		<button bn-event=\"click: onDump\">Dump</button>\n\n	</div>\n	<div>\n		<h2 bn-text=\"title\"></h2>\n		<div bn-html=\"summary\"></div>	\n	</div>\n	\n</div>",
		events: {
			onClear: function() {
				console.log('onClear')
				source.clear()
			},
			onSelect: function() {
				setAction(select)
			},
			onDrawPolygon: function() {
				setAction(drawPolygon)
			},
			onDrawCircle: function() {
				setAction(drawCircle)
			},		
			onNone: function() {
				setAction(null)
			},
			onModify: function() {
				setAction(modify)
			},
			onDump() {
				var features = source.getFeatures()
				console.log('length', features.length)
				features.forEach(function(feature) {
					console.log('geometryType', feature.getGeometry().getType())
					var center = feature.getGeometry().getCenter()
					var lonlat = ol.proj.toLonLat(center)
					console.log('coordinates', lonlat)
					console.log('radius', feature.getGeometry().getRadius())
				})
			}			
		}
	})

	var source = new ol.source.Vector({
		url: '/data/result.json',
		format: new ol.format.GeoJSON()
	})

	var vectorLayer = new ol.layer.Vector({
			  title: 'Earthquakes',

			 source: source,
			 style: milSymbolStyle
			}) 

	var circleStyle = new ol.style.Style({
			    image: new ol.style.Circle({
			      radius: 3,
			      fill: new ol.style.Fill({color: 'red'}),
			       stroke: new ol.style.Stroke({ color: 'green', width: 1 })
			    })
			  })

	function milSymbolStyle(feature, resolution) {
		var zoom = map.getView().getZoom()

		if (zoom < 8) {
			return circleStyle
		}

		var props = feature.getProperties()
		//console.log('milSymbolStyle', zoom, props.uuid)
		var symbol = new ms.Symbol(props.sidc, {
			size: 20,
			uniqueDesignation: props.uuid
		})

		var anchor = symbol.getAnchor()
		var size = symbol.getSize()

		return new ol.style.Style({
          image: new ol.style.Icon(({
            scale: 1,
            anchor: [anchor.x, anchor.y],
            anchorXUnits: 'pixels',
            anchorYUnits: 'pixels',
            imgSize: [Math.floor(size.width), Math.floor(size.height)],
            img: symbol.asCanvas()
          }))
		})		
	}



/*
	var source = new ol.source.Vector()

	var vectorLayer = new ol.layer.Vector({
		source: source,
        style: new ol.style.Style({
        	fill: new ol.style.Fill({color: 'green'})
        })	
    })*/

	var tileLayer = new ol.layer.Tile({
		source: new ol.source.OSM()
	})



     var drawPolygon = new ol.interaction.Draw({
        source: source,
        type: 'Polygon'
      })

     drawPolygon.on('drawend', function() {
     	console.log('drawend')
     })

     var drawCircle = new ol.interaction.Draw({
        source: source,
        type: 'Circle',

      })     

     var modify = new ol.interaction.Modify({
        source: source
      })

	var select = new ol.interaction.Select({
		    style: new ol.style.Style({
		      image: new ol.style.Circle({
		        radius: 5,
		        fill: new ol.style.Fill({
		          color: '#FF0000'
		        }),
		        stroke: new ol.style.Stroke({
		          color: '#000000'
		        })
		      })
		    })
		  })


      var map = new ol.Map({
        target: 'map',
        layers: [tileLayer, vectorLayer],

        view: new ol.View({
          center: ol.proj.fromLonLat([-4.53417, 48.3583]),
          zoom: 9
        }),

/*		controls: ol.control.defaults().extend([
		  	new ol.control.ScaleLine()
  
		])*/

		controls: ol.control.defaults().extend([
		  new ol.control.ScaleLine({className: 'ol-scale-line', target: document.getElementById('scale-line')})
		]),	

/*	   controls: ol.control.defaults({
	      attributionOptions: {
	        collapsible: false
	      }
	    })*/

/*		interactions: ol.interaction.defaults().extend([
		  new ol.interaction.Select({
		    style: new ol.style.Style({
		      image: new ol.style.Circle({
		        radius: 5,
		        fill: new ol.style.Fill({
		          color: '#FF0000'
		        }),
		        stroke: new ol.style.Stroke({
		          color: '#000000'
		        })
		      })
		    })
		  })
		]),	 */ 

/*		interactions: ol.interaction.defaults().extend([draw])  
*/
      })
/*      map.addInteraction(draw)
      map.addInteraction(select)*/

      map.on('click', function(ev) {
      		console.log('click', ev)
      		map.forEachFeatureAtPixel(ev.pixel, function(feature) {
      			var props = feature.getProperties()
      			//console.log('props', props.summary)
      			ctrl.setData({title: props.uuid})
      			map.updateSize()
      			return true
      		}) 
      })

})
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJCQuY29uZmlnUmVhZHkoZnVuY3Rpb24oY29uZmlnKSB7XG5cblx0JCQuc3RhcnRBcHAoJ01haW5Db250cm9sJylcbn0pIiwiJCQucmVnaXN0ZXJDb250cm9sKCdNYWluQ29udHJvbCcsIFsnT3BlbkxheWVyU2VydmljZScsICdNaWxTeW1ib2xTZXJ2aWNlJ10sIGZ1bmN0aW9uKGVsdCwgb2wsIG1zKSB7XG5cblx0dmFyIGN1ckFjdGlvbiA9IG51bGxcblxuXHRmdW5jdGlvbiBzZXRBY3Rpb24oYWN0aW9uKSB7XG5cdFx0aWYgKGN1ckFjdGlvbiAhPSBudWxsKSB7XG5cdFx0XHRtYXAucmVtb3ZlSW50ZXJhY3Rpb24oY3VyQWN0aW9uKVxuXHRcdH1cblx0XHRpZiAoYWN0aW9uICE9IG51bGwpIHtcblx0XHRcdG1hcC5hZGRJbnRlcmFjdGlvbihhY3Rpb24pXG5cdFx0fVxuXHRcdFxuXHRcdGN1ckFjdGlvbiA9IGFjdGlvblxuXHR9XG5cblx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcblx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LTEgYm4tbm8tb3ZlcmZsb3cgYm4tZmxleC1jb2xcXFwiPlxcblx0PGRpdiBpZD1cXFwibWFwXFxcIiBjbGFzcz1cXFwiYm4tZmxleC0xIGJuLW5vLW92ZXJmbG93XFxcIj48L2Rpdj5cXG5cdDxkaXYgaWQ9XFxcInNjYWxlLWxpbmVcXFwiIGNsYXNzPVxcXCJzY2FsZS1saW5lXFxcIj48L2Rpdj5cXG5cdDxkaXY+XFxuXHRcdDxidXR0b24gYm4tZXZlbnQ9XFxcImNsaWNrOiBvbkNsZWFyXFxcIj5DbGVhcjwvYnV0dG9uPlxcblx0XHQ8YnV0dG9uIGJuLWV2ZW50PVxcXCJjbGljazogb25TZWxlY3RcXFwiPlNlbGVjdDwvYnV0dG9uPlxcblx0XHQ8YnV0dG9uIGJuLWV2ZW50PVxcXCJjbGljazogb25EcmF3UG9seWdvblxcXCI+UG9seWdvbjwvYnV0dG9uPlxcblx0XHQ8YnV0dG9uIGJuLWV2ZW50PVxcXCJjbGljazogb25EcmF3Q2lyY2xlXFxcIj5DaXJjbGU8L2J1dHRvbj5cXG5cdFx0PGJ1dHRvbiBibi1ldmVudD1cXFwiY2xpY2s6IG9uTW9kaWZ5XFxcIj5Nb2RpZnk8L2J1dHRvbj5cXG5cdFx0PGJ1dHRvbiBibi1ldmVudD1cXFwiY2xpY2s6IG9uTm9uZVxcXCI+Tm9uZTwvYnV0dG9uPlxcblx0XHQ8YnV0dG9uIGJuLWV2ZW50PVxcXCJjbGljazogb25EdW1wXFxcIj5EdW1wPC9idXR0b24+XFxuXFxuXHQ8L2Rpdj5cXG5cdDxkaXY+XFxuXHRcdDxoMiBibi10ZXh0PVxcXCJ0aXRsZVxcXCI+PC9oMj5cXG5cdFx0PGRpdiBibi1odG1sPVxcXCJzdW1tYXJ5XFxcIj48L2Rpdj5cdFxcblx0PC9kaXY+XFxuXHRcXG48L2Rpdj5cIixcblx0XHRldmVudHM6IHtcblx0XHRcdG9uQ2xlYXI6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnb25DbGVhcicpXG5cdFx0XHRcdHNvdXJjZS5jbGVhcigpXG5cdFx0XHR9LFxuXHRcdFx0b25TZWxlY3Q6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzZXRBY3Rpb24oc2VsZWN0KVxuXHRcdFx0fSxcblx0XHRcdG9uRHJhd1BvbHlnb246IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzZXRBY3Rpb24oZHJhd1BvbHlnb24pXG5cdFx0XHR9LFxuXHRcdFx0b25EcmF3Q2lyY2xlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0c2V0QWN0aW9uKGRyYXdDaXJjbGUpXG5cdFx0XHR9LFx0XHRcblx0XHRcdG9uTm9uZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHNldEFjdGlvbihudWxsKVxuXHRcdFx0fSxcblx0XHRcdG9uTW9kaWZ5OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0c2V0QWN0aW9uKG1vZGlmeSlcblx0XHRcdH0sXG5cdFx0XHRvbkR1bXAoKSB7XG5cdFx0XHRcdHZhciBmZWF0dXJlcyA9IHNvdXJjZS5nZXRGZWF0dXJlcygpXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdsZW5ndGgnLCBmZWF0dXJlcy5sZW5ndGgpXG5cdFx0XHRcdGZlYXR1cmVzLmZvckVhY2goZnVuY3Rpb24oZmVhdHVyZSkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdnZW9tZXRyeVR5cGUnLCBmZWF0dXJlLmdldEdlb21ldHJ5KCkuZ2V0VHlwZSgpKVxuXHRcdFx0XHRcdHZhciBjZW50ZXIgPSBmZWF0dXJlLmdldEdlb21ldHJ5KCkuZ2V0Q2VudGVyKClcblx0XHRcdFx0XHR2YXIgbG9ubGF0ID0gb2wucHJvai50b0xvbkxhdChjZW50ZXIpXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ2Nvb3JkaW5hdGVzJywgbG9ubGF0KVxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyYWRpdXMnLCBmZWF0dXJlLmdldEdlb21ldHJ5KCkuZ2V0UmFkaXVzKCkpXG5cdFx0XHRcdH0pXG5cdFx0XHR9XHRcdFx0XG5cdFx0fVxuXHR9KVxuXG5cdHZhciBzb3VyY2UgPSBuZXcgb2wuc291cmNlLlZlY3Rvcih7XG5cdFx0dXJsOiAnL2RhdGEvcmVzdWx0Lmpzb24nLFxuXHRcdGZvcm1hdDogbmV3IG9sLmZvcm1hdC5HZW9KU09OKClcblx0fSlcblxuXHR2YXIgdmVjdG9yTGF5ZXIgPSBuZXcgb2wubGF5ZXIuVmVjdG9yKHtcblx0XHRcdCAgdGl0bGU6ICdFYXJ0aHF1YWtlcycsXG5cblx0XHRcdCBzb3VyY2U6IHNvdXJjZSxcblx0XHRcdCBzdHlsZTogbWlsU3ltYm9sU3R5bGVcblx0XHRcdH0pIFxuXG5cdHZhciBjaXJjbGVTdHlsZSA9IG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0XHQgICAgaW1hZ2U6IG5ldyBvbC5zdHlsZS5DaXJjbGUoe1xuXHRcdFx0ICAgICAgcmFkaXVzOiAzLFxuXHRcdFx0ICAgICAgZmlsbDogbmV3IG9sLnN0eWxlLkZpbGwoe2NvbG9yOiAncmVkJ30pLFxuXHRcdFx0ICAgICAgIHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7IGNvbG9yOiAnZ3JlZW4nLCB3aWR0aDogMSB9KVxuXHRcdFx0ICAgIH0pXG5cdFx0XHQgIH0pXG5cblx0ZnVuY3Rpb24gbWlsU3ltYm9sU3R5bGUoZmVhdHVyZSwgcmVzb2x1dGlvbikge1xuXHRcdHZhciB6b29tID0gbWFwLmdldFZpZXcoKS5nZXRab29tKClcblxuXHRcdGlmICh6b29tIDwgOCkge1xuXHRcdFx0cmV0dXJuIGNpcmNsZVN0eWxlXG5cdFx0fVxuXG5cdFx0dmFyIHByb3BzID0gZmVhdHVyZS5nZXRQcm9wZXJ0aWVzKClcblx0XHQvL2NvbnNvbGUubG9nKCdtaWxTeW1ib2xTdHlsZScsIHpvb20sIHByb3BzLnV1aWQpXG5cdFx0dmFyIHN5bWJvbCA9IG5ldyBtcy5TeW1ib2wocHJvcHMuc2lkYywge1xuXHRcdFx0c2l6ZTogMjAsXG5cdFx0XHR1bmlxdWVEZXNpZ25hdGlvbjogcHJvcHMudXVpZFxuXHRcdH0pXG5cblx0XHR2YXIgYW5jaG9yID0gc3ltYm9sLmdldEFuY2hvcigpXG5cdFx0dmFyIHNpemUgPSBzeW1ib2wuZ2V0U2l6ZSgpXG5cblx0XHRyZXR1cm4gbmV3IG9sLnN0eWxlLlN0eWxlKHtcbiAgICAgICAgICBpbWFnZTogbmV3IG9sLnN0eWxlLkljb24oKHtcbiAgICAgICAgICAgIHNjYWxlOiAxLFxuICAgICAgICAgICAgYW5jaG9yOiBbYW5jaG9yLngsIGFuY2hvci55XSxcbiAgICAgICAgICAgIGFuY2hvclhVbml0czogJ3BpeGVscycsXG4gICAgICAgICAgICBhbmNob3JZVW5pdHM6ICdwaXhlbHMnLFxuICAgICAgICAgICAgaW1nU2l6ZTogW01hdGguZmxvb3Ioc2l6ZS53aWR0aCksIE1hdGguZmxvb3Ioc2l6ZS5oZWlnaHQpXSxcbiAgICAgICAgICAgIGltZzogc3ltYm9sLmFzQ2FudmFzKClcbiAgICAgICAgICB9KSlcblx0XHR9KVx0XHRcblx0fVxuXG5cblxuLypcblx0dmFyIHNvdXJjZSA9IG5ldyBvbC5zb3VyY2UuVmVjdG9yKClcblxuXHR2YXIgdmVjdG9yTGF5ZXIgPSBuZXcgb2wubGF5ZXIuVmVjdG9yKHtcblx0XHRzb3VyY2U6IHNvdXJjZSxcbiAgICAgICAgc3R5bGU6IG5ldyBvbC5zdHlsZS5TdHlsZSh7XG4gICAgICAgIFx0ZmlsbDogbmV3IG9sLnN0eWxlLkZpbGwoe2NvbG9yOiAnZ3JlZW4nfSlcbiAgICAgICAgfSlcdFxuICAgIH0pKi9cblxuXHR2YXIgdGlsZUxheWVyID0gbmV3IG9sLmxheWVyLlRpbGUoe1xuXHRcdHNvdXJjZTogbmV3IG9sLnNvdXJjZS5PU00oKVxuXHR9KVxuXG5cblxuICAgICB2YXIgZHJhd1BvbHlnb24gPSBuZXcgb2wuaW50ZXJhY3Rpb24uRHJhdyh7XG4gICAgICAgIHNvdXJjZTogc291cmNlLFxuICAgICAgICB0eXBlOiAnUG9seWdvbidcbiAgICAgIH0pXG5cbiAgICAgZHJhd1BvbHlnb24ub24oJ2RyYXdlbmQnLCBmdW5jdGlvbigpIHtcbiAgICAgXHRjb25zb2xlLmxvZygnZHJhd2VuZCcpXG4gICAgIH0pXG5cbiAgICAgdmFyIGRyYXdDaXJjbGUgPSBuZXcgb2wuaW50ZXJhY3Rpb24uRHJhdyh7XG4gICAgICAgIHNvdXJjZTogc291cmNlLFxuICAgICAgICB0eXBlOiAnQ2lyY2xlJyxcblxuICAgICAgfSkgICAgIFxuXG4gICAgIHZhciBtb2RpZnkgPSBuZXcgb2wuaW50ZXJhY3Rpb24uTW9kaWZ5KHtcbiAgICAgICAgc291cmNlOiBzb3VyY2VcbiAgICAgIH0pXG5cblx0dmFyIHNlbGVjdCA9IG5ldyBvbC5pbnRlcmFjdGlvbi5TZWxlY3Qoe1xuXHRcdCAgICBzdHlsZTogbmV3IG9sLnN0eWxlLlN0eWxlKHtcblx0XHQgICAgICBpbWFnZTogbmV3IG9sLnN0eWxlLkNpcmNsZSh7XG5cdFx0ICAgICAgICByYWRpdXM6IDUsXG5cdFx0ICAgICAgICBmaWxsOiBuZXcgb2wuc3R5bGUuRmlsbCh7XG5cdFx0ICAgICAgICAgIGNvbG9yOiAnI0ZGMDAwMCdcblx0XHQgICAgICAgIH0pLFxuXHRcdCAgICAgICAgc3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcblx0XHQgICAgICAgICAgY29sb3I6ICcjMDAwMDAwJ1xuXHRcdCAgICAgICAgfSlcblx0XHQgICAgICB9KVxuXHRcdCAgICB9KVxuXHRcdCAgfSlcblxuXG4gICAgICB2YXIgbWFwID0gbmV3IG9sLk1hcCh7XG4gICAgICAgIHRhcmdldDogJ21hcCcsXG4gICAgICAgIGxheWVyczogW3RpbGVMYXllciwgdmVjdG9yTGF5ZXJdLFxuXG4gICAgICAgIHZpZXc6IG5ldyBvbC5WaWV3KHtcbiAgICAgICAgICBjZW50ZXI6IG9sLnByb2ouZnJvbUxvbkxhdChbLTQuNTM0MTcsIDQ4LjM1ODNdKSxcbiAgICAgICAgICB6b29tOiA5XG4gICAgICAgIH0pLFxuXG4vKlx0XHRjb250cm9sczogb2wuY29udHJvbC5kZWZhdWx0cygpLmV4dGVuZChbXG5cdFx0ICBcdG5ldyBvbC5jb250cm9sLlNjYWxlTGluZSgpXG4gIFxuXHRcdF0pKi9cblxuXHRcdGNvbnRyb2xzOiBvbC5jb250cm9sLmRlZmF1bHRzKCkuZXh0ZW5kKFtcblx0XHQgIG5ldyBvbC5jb250cm9sLlNjYWxlTGluZSh7Y2xhc3NOYW1lOiAnb2wtc2NhbGUtbGluZScsIHRhcmdldDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NjYWxlLWxpbmUnKX0pXG5cdFx0XSksXHRcblxuLypcdCAgIGNvbnRyb2xzOiBvbC5jb250cm9sLmRlZmF1bHRzKHtcblx0ICAgICAgYXR0cmlidXRpb25PcHRpb25zOiB7XG5cdCAgICAgICAgY29sbGFwc2libGU6IGZhbHNlXG5cdCAgICAgIH1cblx0ICAgIH0pKi9cblxuLypcdFx0aW50ZXJhY3Rpb25zOiBvbC5pbnRlcmFjdGlvbi5kZWZhdWx0cygpLmV4dGVuZChbXG5cdFx0ICBuZXcgb2wuaW50ZXJhY3Rpb24uU2VsZWN0KHtcblx0XHQgICAgc3R5bGU6IG5ldyBvbC5zdHlsZS5TdHlsZSh7XG5cdFx0ICAgICAgaW1hZ2U6IG5ldyBvbC5zdHlsZS5DaXJjbGUoe1xuXHRcdCAgICAgICAgcmFkaXVzOiA1LFxuXHRcdCAgICAgICAgZmlsbDogbmV3IG9sLnN0eWxlLkZpbGwoe1xuXHRcdCAgICAgICAgICBjb2xvcjogJyNGRjAwMDAnXG5cdFx0ICAgICAgICB9KSxcblx0XHQgICAgICAgIHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG5cdFx0ICAgICAgICAgIGNvbG9yOiAnIzAwMDAwMCdcblx0XHQgICAgICAgIH0pXG5cdFx0ICAgICAgfSlcblx0XHQgICAgfSlcblx0XHQgIH0pXG5cdFx0XSksXHQgKi8gXG5cbi8qXHRcdGludGVyYWN0aW9uczogb2wuaW50ZXJhY3Rpb24uZGVmYXVsdHMoKS5leHRlbmQoW2RyYXddKSAgXG4qL1xuICAgICAgfSlcbi8qICAgICAgbWFwLmFkZEludGVyYWN0aW9uKGRyYXcpXG4gICAgICBtYXAuYWRkSW50ZXJhY3Rpb24oc2VsZWN0KSovXG5cbiAgICAgIG1hcC5vbignY2xpY2snLCBmdW5jdGlvbihldikge1xuICAgICAgXHRcdGNvbnNvbGUubG9nKCdjbGljaycsIGV2KVxuICAgICAgXHRcdG1hcC5mb3JFYWNoRmVhdHVyZUF0UGl4ZWwoZXYucGl4ZWwsIGZ1bmN0aW9uKGZlYXR1cmUpIHtcbiAgICAgIFx0XHRcdHZhciBwcm9wcyA9IGZlYXR1cmUuZ2V0UHJvcGVydGllcygpXG4gICAgICBcdFx0XHQvL2NvbnNvbGUubG9nKCdwcm9wcycsIHByb3BzLnN1bW1hcnkpXG4gICAgICBcdFx0XHRjdHJsLnNldERhdGEoe3RpdGxlOiBwcm9wcy51dWlkfSlcbiAgICAgIFx0XHRcdG1hcC51cGRhdGVTaXplKClcbiAgICAgIFx0XHRcdHJldHVybiB0cnVlXG4gICAgICBcdFx0fSkgXG4gICAgICB9KVxuXG59KSJdfQ==
