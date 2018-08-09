(function() {

	function polar2Cart(radius, angleDeg) {
		var angleRad = (angleDeg -90) * Math.PI/180
		return {
			x: radius * Math.cos(angleRad),
			y: radius * Math.sin(angleRad)
		}
	}



	function getArcPath(innerRadius, radius, startAngle, endAngle) {
		var p1 = polar2Cart(innerRadius, endAngle)
		var p2 = polar2Cart(innerRadius, startAngle)
		var p3 = polar2Cart(radius, startAngle)
		var p4 = polar2Cart(radius, endAngle)

		var largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

		var d = [
			'M', p1.x, p1.y,
			'A', innerRadius, innerRadius, 0, largeArcFlag, 0, p2.x, p2.y,
			'L', p3.x, p3.y,
			'A', radius, radius, 0, largeArcFlag, 1, p4.x, p4.y,
			'z'


		].join(' ')


		return d

	}


	$$.registerControlEx('CircularMenuControl', {
		deps: ['TweenMaxService'], 
		events: 'menuSelected,menuClosed',
		options: {
			hasTrigger: true,
			triggerRadius: 20,
			triggerPos: {left: 100, top: 100},
			innerRadius: 0,
			radius: 90,
			iconPos: 60,
			iconSize: 40,
			gap: 0
		},
		iface: 'showMenu(x, y);closeMenu();on(event, callback);select(idx)',

		
	lib: 'circular',
init: function(elt, options) {

			var events = new EventEmitter2()

			if (!Array.isArray(options.menus)) {
				console.warn(`mission field 'menus' in CircularMenuControl config`)
				return
			}
			var open = false

			var triggerLabel = $.extend({open: '\uf068', close:'\uf067'}, options.triggerLabel)

			var triggerRadius = options.triggerRadius
			var innerRadius = options.innerRadius
			var radius = options.radius
			var iconPos = options.iconPos
			var iconSize = options.iconSize
			var gap = options.gap

			var menus = options.menus
			if (menus.length < 3) {
				menus = menus.concat(new Array(3 - menus.length).fill({}))
			}
			//console.log('menus', menus)		

			var sectorAngle = 360 / menus.length - gap
			//console.log('sectorAngle', sectorAngle)
			var p = polar2Cart(iconPos, 0)
			var arcPath = getArcPath(innerRadius, radius, -sectorAngle/2, sectorAngle/2)
			//console.log('arcPath', arcPath)


			var width = triggerRadius * 2
			var height = triggerRadius * 2
			var x = triggerRadius
			var y = triggerRadius		


			elt.css('position', 'relative')


			var sectors = menus.map(function(info, idx) {
				//console.log('config', info, idx)
				var angle = (sectorAngle + gap)  * idx
				var info = $.extend({fill: 'white', color: 'black', text: ''}, info)
				return {
					transform1: `rotate(${angle})`,
					info: info,
					transform2: `translate(${p.x}, ${p.y}) rotate(${-angle})` 
				}
			})

			var ctrl = $$.viewController(elt, {
				template: "<svg bn-attr=\"width: width, height: height\" class=\"circularMenu\" style=\"position: absolute; z-index: 1000000; overflow: visible; cursor: context-menu\">\n	<g bn-attr=\"transform: transform1\">\n		<g class=\"items\" data-svg-origin=\"0 0\" bn-each=\"s of sectors\" bn-event=\"click.item: onItemClicked\">\n				<g class=\"item\" data-svg-origin=\"0 0\">\n					<g bn-attr=\"transform: s.transform1\">\n						<path bn-attr=\"d: arcPath, fill: s.info.fill\" class=\"sector\" stroke=\"black\"/>			\n						<g  bn-attr=\"transform: s.transform2\">\n\n							<text bn-attr=\"fill: s.info.color\" text-anchor=\"middle\" alignment-baseline=\"middle\" bn-text=\"s.info.text\"></text>			\n						</g>\n					</g>\n				</g>			\n		</g>\n		<g class=\"trigger\" bn-if=\"hasTrigger\" bn-event=\"click: onTriggerClick\">\n			<circle bn-attr=\"r: triggerRadius\" fill=\"red\" />\n			<text class=\"label\" text-anchor=\"middle\" alignment-baseline=\"middle\" bn-text=\"triggerLabel\"></text>\n		</g>\n		\n	</g>\n</svg>",
				data : {
					hasTrigger: options.hasTrigger,
					width: width,
					height: height,
					triggerRadius: triggerRadius,
					transform1: `translate(${x}, ${y})`,
					triggerLabel: triggerLabel.close,
					arcPath: arcPath,
					sectors: sectors
				},
				events: {
					onTriggerClick: function(ev) {
						//console.log('onTriggerClick')
					    ev.stopPropagation()
					    if (!open) {
					    	openMenu()
					    } 
					    else {
					    	closeMenu()
					    }				
					},
					onItemClicked: function(ev) {
						//console.log('onItemClicked')
						var idx = item.index(this)
						//console.log('click', idx)
						events.emit('menuSelected', options.menus[idx])				
					}

				}
			})

			var svg = ctrl.elt

			var item = svg.find('.item')
			var items = svg.find('.items')
			TweenLite.set(item, {scale:0, visibility:"visible"})


			$(document).on('click', closeMenu)

			if (options.hasTrigger) {
				show(options.triggerPos.left, options.triggerPos.top)
			}



			function show(x, y) {
				//console.log('show', left, top)
				var left = x - (width/2)
				var top = y - (height/2)

				svg.css({left: left + 'px', top: top+'px'}).show()
			}


			function showMenu(x, y) {
				show(x, y)
				openMenu()
			}


			function openMenu() {
				console.log('openMenu')

				if (!open) {
			        TweenMax.staggerTo(item, 0.7, {scale:1, ease:Elastic.easeOut}, 0.05);
			        ctrl.setData({triggerLabel: triggerLabel.open})
			      	open = true
		      	}
			}

			function closeMenu() {
				console.log('closeMenu')
				if (open) {
				    TweenMax.staggerTo(item, .3, {scale:0, ease:Back.easeIn}, 0.05, function() {
				    	//console.log('finished !!')
				    	if (!options.hasTrigger) {
				    		svg.hide()
				    		events.emit('menuClosed')
				    	}
				    });
				    ctrl.setData({triggerLabel: triggerLabel.close})
				    open = false
				}
			}

			this.select = function(idx) {
				items.find('.item.active').removeClass('active')
				if (idx >= 0) {
					item.eq(idx).addClass('active')
				}
			}

			this.on = events.on.bind(events)
			this.showMenu = showMenu
			this.closeMenu = closeMenu

	
		}

	})


})();
(function() {	

	$$.loadStyle('/controls/circular.css')
})();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNpcmN1bGFyLmpzIiwiZGVwcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xOQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJjaXJjdWxhci5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcblxuXHRmdW5jdGlvbiBwb2xhcjJDYXJ0KHJhZGl1cywgYW5nbGVEZWcpIHtcblx0XHR2YXIgYW5nbGVSYWQgPSAoYW5nbGVEZWcgLTkwKSAqIE1hdGguUEkvMTgwXG5cdFx0cmV0dXJuIHtcblx0XHRcdHg6IHJhZGl1cyAqIE1hdGguY29zKGFuZ2xlUmFkKSxcblx0XHRcdHk6IHJhZGl1cyAqIE1hdGguc2luKGFuZ2xlUmFkKVxuXHRcdH1cblx0fVxuXG5cblxuXHRmdW5jdGlvbiBnZXRBcmNQYXRoKGlubmVyUmFkaXVzLCByYWRpdXMsIHN0YXJ0QW5nbGUsIGVuZEFuZ2xlKSB7XG5cdFx0dmFyIHAxID0gcG9sYXIyQ2FydChpbm5lclJhZGl1cywgZW5kQW5nbGUpXG5cdFx0dmFyIHAyID0gcG9sYXIyQ2FydChpbm5lclJhZGl1cywgc3RhcnRBbmdsZSlcblx0XHR2YXIgcDMgPSBwb2xhcjJDYXJ0KHJhZGl1cywgc3RhcnRBbmdsZSlcblx0XHR2YXIgcDQgPSBwb2xhcjJDYXJ0KHJhZGl1cywgZW5kQW5nbGUpXG5cblx0XHR2YXIgbGFyZ2VBcmNGbGFnID0gZW5kQW5nbGUgLSBzdGFydEFuZ2xlIDw9IDE4MCA/ICcwJyA6ICcxJ1xuXG5cdFx0dmFyIGQgPSBbXG5cdFx0XHQnTScsIHAxLngsIHAxLnksXG5cdFx0XHQnQScsIGlubmVyUmFkaXVzLCBpbm5lclJhZGl1cywgMCwgbGFyZ2VBcmNGbGFnLCAwLCBwMi54LCBwMi55LFxuXHRcdFx0J0wnLCBwMy54LCBwMy55LFxuXHRcdFx0J0EnLCByYWRpdXMsIHJhZGl1cywgMCwgbGFyZ2VBcmNGbGFnLCAxLCBwNC54LCBwNC55LFxuXHRcdFx0J3onXG5cblxuXHRcdF0uam9pbignICcpXG5cblxuXHRcdHJldHVybiBkXG5cblx0fVxuXG5cblx0JCQucmVnaXN0ZXJDb250cm9sRXgoJ0NpcmN1bGFyTWVudUNvbnRyb2wnLCB7XG5cdFx0ZGVwczogWydUd2Vlbk1heFNlcnZpY2UnXSwgXG5cdFx0ZXZlbnRzOiAnbWVudVNlbGVjdGVkLG1lbnVDbG9zZWQnLFxuXHRcdG9wdGlvbnM6IHtcblx0XHRcdGhhc1RyaWdnZXI6IHRydWUsXG5cdFx0XHR0cmlnZ2VyUmFkaXVzOiAyMCxcblx0XHRcdHRyaWdnZXJQb3M6IHtsZWZ0OiAxMDAsIHRvcDogMTAwfSxcblx0XHRcdGlubmVyUmFkaXVzOiAwLFxuXHRcdFx0cmFkaXVzOiA5MCxcblx0XHRcdGljb25Qb3M6IDYwLFxuXHRcdFx0aWNvblNpemU6IDQwLFxuXHRcdFx0Z2FwOiAwXG5cdFx0fSxcblx0XHRpZmFjZTogJ3Nob3dNZW51KHgsIHkpO2Nsb3NlTWVudSgpO29uKGV2ZW50LCBjYWxsYmFjayk7c2VsZWN0KGlkeCknLFxuXG5cdFx0XG5cdGxpYjogJ2NpcmN1bGFyJyxcbmluaXQ6IGZ1bmN0aW9uKGVsdCwgb3B0aW9ucykge1xuXG5cdFx0XHR2YXIgZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcjIoKVxuXG5cdFx0XHRpZiAoIUFycmF5LmlzQXJyYXkob3B0aW9ucy5tZW51cykpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKGBtaXNzaW9uIGZpZWxkICdtZW51cycgaW4gQ2lyY3VsYXJNZW51Q29udHJvbCBjb25maWdgKVxuXHRcdFx0XHRyZXR1cm5cblx0XHRcdH1cblx0XHRcdHZhciBvcGVuID0gZmFsc2VcblxuXHRcdFx0dmFyIHRyaWdnZXJMYWJlbCA9ICQuZXh0ZW5kKHtvcGVuOiAnXFx1ZjA2OCcsIGNsb3NlOidcXHVmMDY3J30sIG9wdGlvbnMudHJpZ2dlckxhYmVsKVxuXG5cdFx0XHR2YXIgdHJpZ2dlclJhZGl1cyA9IG9wdGlvbnMudHJpZ2dlclJhZGl1c1xuXHRcdFx0dmFyIGlubmVyUmFkaXVzID0gb3B0aW9ucy5pbm5lclJhZGl1c1xuXHRcdFx0dmFyIHJhZGl1cyA9IG9wdGlvbnMucmFkaXVzXG5cdFx0XHR2YXIgaWNvblBvcyA9IG9wdGlvbnMuaWNvblBvc1xuXHRcdFx0dmFyIGljb25TaXplID0gb3B0aW9ucy5pY29uU2l6ZVxuXHRcdFx0dmFyIGdhcCA9IG9wdGlvbnMuZ2FwXG5cblx0XHRcdHZhciBtZW51cyA9IG9wdGlvbnMubWVudXNcblx0XHRcdGlmIChtZW51cy5sZW5ndGggPCAzKSB7XG5cdFx0XHRcdG1lbnVzID0gbWVudXMuY29uY2F0KG5ldyBBcnJheSgzIC0gbWVudXMubGVuZ3RoKS5maWxsKHt9KSlcblx0XHRcdH1cblx0XHRcdC8vY29uc29sZS5sb2coJ21lbnVzJywgbWVudXMpXHRcdFxuXG5cdFx0XHR2YXIgc2VjdG9yQW5nbGUgPSAzNjAgLyBtZW51cy5sZW5ndGggLSBnYXBcblx0XHRcdC8vY29uc29sZS5sb2coJ3NlY3RvckFuZ2xlJywgc2VjdG9yQW5nbGUpXG5cdFx0XHR2YXIgcCA9IHBvbGFyMkNhcnQoaWNvblBvcywgMClcblx0XHRcdHZhciBhcmNQYXRoID0gZ2V0QXJjUGF0aChpbm5lclJhZGl1cywgcmFkaXVzLCAtc2VjdG9yQW5nbGUvMiwgc2VjdG9yQW5nbGUvMilcblx0XHRcdC8vY29uc29sZS5sb2coJ2FyY1BhdGgnLCBhcmNQYXRoKVxuXG5cblx0XHRcdHZhciB3aWR0aCA9IHRyaWdnZXJSYWRpdXMgKiAyXG5cdFx0XHR2YXIgaGVpZ2h0ID0gdHJpZ2dlclJhZGl1cyAqIDJcblx0XHRcdHZhciB4ID0gdHJpZ2dlclJhZGl1c1xuXHRcdFx0dmFyIHkgPSB0cmlnZ2VyUmFkaXVzXHRcdFxuXG5cblx0XHRcdGVsdC5jc3MoJ3Bvc2l0aW9uJywgJ3JlbGF0aXZlJylcblxuXG5cdFx0XHR2YXIgc2VjdG9ycyA9IG1lbnVzLm1hcChmdW5jdGlvbihpbmZvLCBpZHgpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnY29uZmlnJywgaW5mbywgaWR4KVxuXHRcdFx0XHR2YXIgYW5nbGUgPSAoc2VjdG9yQW5nbGUgKyBnYXApICAqIGlkeFxuXHRcdFx0XHR2YXIgaW5mbyA9ICQuZXh0ZW5kKHtmaWxsOiAnd2hpdGUnLCBjb2xvcjogJ2JsYWNrJywgdGV4dDogJyd9LCBpbmZvKVxuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdHRyYW5zZm9ybTE6IGByb3RhdGUoJHthbmdsZX0pYCxcblx0XHRcdFx0XHRpbmZvOiBpbmZvLFxuXHRcdFx0XHRcdHRyYW5zZm9ybTI6IGB0cmFuc2xhdGUoJHtwLnh9LCAke3AueX0pIHJvdGF0ZSgkey1hbmdsZX0pYCBcblx0XHRcdFx0fVxuXHRcdFx0fSlcblxuXHRcdFx0dmFyIGN0cmwgPSAkJC52aWV3Q29udHJvbGxlcihlbHQsIHtcblx0XHRcdFx0dGVtcGxhdGU6IFwiPHN2ZyBibi1hdHRyPVxcXCJ3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0XFxcIiBjbGFzcz1cXFwiY2lyY3VsYXJNZW51XFxcIiBzdHlsZT1cXFwicG9zaXRpb246IGFic29sdXRlOyB6LWluZGV4OiAxMDAwMDAwOyBvdmVyZmxvdzogdmlzaWJsZTsgY3Vyc29yOiBjb250ZXh0LW1lbnVcXFwiPlxcblx0PGcgYm4tYXR0cj1cXFwidHJhbnNmb3JtOiB0cmFuc2Zvcm0xXFxcIj5cXG5cdFx0PGcgY2xhc3M9XFxcIml0ZW1zXFxcIiBkYXRhLXN2Zy1vcmlnaW49XFxcIjAgMFxcXCIgYm4tZWFjaD1cXFwicyBvZiBzZWN0b3JzXFxcIiBibi1ldmVudD1cXFwiY2xpY2suaXRlbTogb25JdGVtQ2xpY2tlZFxcXCI+XFxuXHRcdFx0XHQ8ZyBjbGFzcz1cXFwiaXRlbVxcXCIgZGF0YS1zdmctb3JpZ2luPVxcXCIwIDBcXFwiPlxcblx0XHRcdFx0XHQ8ZyBibi1hdHRyPVxcXCJ0cmFuc2Zvcm06IHMudHJhbnNmb3JtMVxcXCI+XFxuXHRcdFx0XHRcdFx0PHBhdGggYm4tYXR0cj1cXFwiZDogYXJjUGF0aCwgZmlsbDogcy5pbmZvLmZpbGxcXFwiIGNsYXNzPVxcXCJzZWN0b3JcXFwiIHN0cm9rZT1cXFwiYmxhY2tcXFwiLz5cdFx0XHRcXG5cdFx0XHRcdFx0XHQ8ZyAgYm4tYXR0cj1cXFwidHJhbnNmb3JtOiBzLnRyYW5zZm9ybTJcXFwiPlxcblxcblx0XHRcdFx0XHRcdFx0PHRleHQgYm4tYXR0cj1cXFwiZmlsbDogcy5pbmZvLmNvbG9yXFxcIiB0ZXh0LWFuY2hvcj1cXFwibWlkZGxlXFxcIiBhbGlnbm1lbnQtYmFzZWxpbmU9XFxcIm1pZGRsZVxcXCIgYm4tdGV4dD1cXFwicy5pbmZvLnRleHRcXFwiPjwvdGV4dD5cdFx0XHRcXG5cdFx0XHRcdFx0XHQ8L2c+XFxuXHRcdFx0XHRcdDwvZz5cXG5cdFx0XHRcdDwvZz5cdFx0XHRcXG5cdFx0PC9nPlxcblx0XHQ8ZyBjbGFzcz1cXFwidHJpZ2dlclxcXCIgYm4taWY9XFxcImhhc1RyaWdnZXJcXFwiIGJuLWV2ZW50PVxcXCJjbGljazogb25UcmlnZ2VyQ2xpY2tcXFwiPlxcblx0XHRcdDxjaXJjbGUgYm4tYXR0cj1cXFwicjogdHJpZ2dlclJhZGl1c1xcXCIgZmlsbD1cXFwicmVkXFxcIiAvPlxcblx0XHRcdDx0ZXh0IGNsYXNzPVxcXCJsYWJlbFxcXCIgdGV4dC1hbmNob3I9XFxcIm1pZGRsZVxcXCIgYWxpZ25tZW50LWJhc2VsaW5lPVxcXCJtaWRkbGVcXFwiIGJuLXRleHQ9XFxcInRyaWdnZXJMYWJlbFxcXCI+PC90ZXh0Plxcblx0XHQ8L2c+XFxuXHRcdFxcblx0PC9nPlxcbjwvc3ZnPlwiLFxuXHRcdFx0XHRkYXRhIDoge1xuXHRcdFx0XHRcdGhhc1RyaWdnZXI6IG9wdGlvbnMuaGFzVHJpZ2dlcixcblx0XHRcdFx0XHR3aWR0aDogd2lkdGgsXG5cdFx0XHRcdFx0aGVpZ2h0OiBoZWlnaHQsXG5cdFx0XHRcdFx0dHJpZ2dlclJhZGl1czogdHJpZ2dlclJhZGl1cyxcblx0XHRcdFx0XHR0cmFuc2Zvcm0xOiBgdHJhbnNsYXRlKCR7eH0sICR7eX0pYCxcblx0XHRcdFx0XHR0cmlnZ2VyTGFiZWw6IHRyaWdnZXJMYWJlbC5jbG9zZSxcblx0XHRcdFx0XHRhcmNQYXRoOiBhcmNQYXRoLFxuXHRcdFx0XHRcdHNlY3RvcnM6IHNlY3RvcnNcblx0XHRcdFx0fSxcblx0XHRcdFx0ZXZlbnRzOiB7XG5cdFx0XHRcdFx0b25UcmlnZ2VyQ2xpY2s6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvblRyaWdnZXJDbGljaycpXG5cdFx0XHRcdFx0ICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHRcdFx0ICAgIGlmICghb3Blbikge1xuXHRcdFx0XHRcdCAgICBcdG9wZW5NZW51KClcblx0XHRcdFx0XHQgICAgfSBcblx0XHRcdFx0XHQgICAgZWxzZSB7XG5cdFx0XHRcdFx0ICAgIFx0Y2xvc2VNZW51KClcblx0XHRcdFx0XHQgICAgfVx0XHRcdFx0XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRvbkl0ZW1DbGlja2VkOiBmdW5jdGlvbihldikge1xuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25JdGVtQ2xpY2tlZCcpXG5cdFx0XHRcdFx0XHR2YXIgaWR4ID0gaXRlbS5pbmRleCh0aGlzKVxuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnY2xpY2snLCBpZHgpXG5cdFx0XHRcdFx0XHRldmVudHMuZW1pdCgnbWVudVNlbGVjdGVkJywgb3B0aW9ucy5tZW51c1tpZHhdKVx0XHRcdFx0XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cblx0XHRcdHZhciBzdmcgPSBjdHJsLmVsdFxuXG5cdFx0XHR2YXIgaXRlbSA9IHN2Zy5maW5kKCcuaXRlbScpXG5cdFx0XHR2YXIgaXRlbXMgPSBzdmcuZmluZCgnLml0ZW1zJylcblx0XHRcdFR3ZWVuTGl0ZS5zZXQoaXRlbSwge3NjYWxlOjAsIHZpc2liaWxpdHk6XCJ2aXNpYmxlXCJ9KVxuXG5cblx0XHRcdCQoZG9jdW1lbnQpLm9uKCdjbGljaycsIGNsb3NlTWVudSlcblxuXHRcdFx0aWYgKG9wdGlvbnMuaGFzVHJpZ2dlcikge1xuXHRcdFx0XHRzaG93KG9wdGlvbnMudHJpZ2dlclBvcy5sZWZ0LCBvcHRpb25zLnRyaWdnZXJQb3MudG9wKVxuXHRcdFx0fVxuXG5cblxuXHRcdFx0ZnVuY3Rpb24gc2hvdyh4LCB5KSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ3Nob3cnLCBsZWZ0LCB0b3ApXG5cdFx0XHRcdHZhciBsZWZ0ID0geCAtICh3aWR0aC8yKVxuXHRcdFx0XHR2YXIgdG9wID0geSAtIChoZWlnaHQvMilcblxuXHRcdFx0XHRzdmcuY3NzKHtsZWZ0OiBsZWZ0ICsgJ3B4JywgdG9wOiB0b3ArJ3B4J30pLnNob3coKVxuXHRcdFx0fVxuXG5cblx0XHRcdGZ1bmN0aW9uIHNob3dNZW51KHgsIHkpIHtcblx0XHRcdFx0c2hvdyh4LCB5KVxuXHRcdFx0XHRvcGVuTWVudSgpXG5cdFx0XHR9XG5cblxuXHRcdFx0ZnVuY3Rpb24gb3Blbk1lbnUoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdvcGVuTWVudScpXG5cblx0XHRcdFx0aWYgKCFvcGVuKSB7XG5cdFx0XHQgICAgICAgIFR3ZWVuTWF4LnN0YWdnZXJUbyhpdGVtLCAwLjcsIHtzY2FsZToxLCBlYXNlOkVsYXN0aWMuZWFzZU91dH0sIDAuMDUpO1xuXHRcdFx0ICAgICAgICBjdHJsLnNldERhdGEoe3RyaWdnZXJMYWJlbDogdHJpZ2dlckxhYmVsLm9wZW59KVxuXHRcdFx0ICAgICAgXHRvcGVuID0gdHJ1ZVxuXHRcdCAgICAgIFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBjbG9zZU1lbnUoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdjbG9zZU1lbnUnKVxuXHRcdFx0XHRpZiAob3Blbikge1xuXHRcdFx0XHQgICAgVHdlZW5NYXguc3RhZ2dlclRvKGl0ZW0sIC4zLCB7c2NhbGU6MCwgZWFzZTpCYWNrLmVhc2VJbn0sIDAuMDUsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQgICAgXHQvL2NvbnNvbGUubG9nKCdmaW5pc2hlZCAhIScpXG5cdFx0XHRcdCAgICBcdGlmICghb3B0aW9ucy5oYXNUcmlnZ2VyKSB7XG5cdFx0XHRcdCAgICBcdFx0c3ZnLmhpZGUoKVxuXHRcdFx0XHQgICAgXHRcdGV2ZW50cy5lbWl0KCdtZW51Q2xvc2VkJylcblx0XHRcdFx0ICAgIFx0fVxuXHRcdFx0XHQgICAgfSk7XG5cdFx0XHRcdCAgICBjdHJsLnNldERhdGEoe3RyaWdnZXJMYWJlbDogdHJpZ2dlckxhYmVsLmNsb3NlfSlcblx0XHRcdFx0ICAgIG9wZW4gPSBmYWxzZVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuc2VsZWN0ID0gZnVuY3Rpb24oaWR4KSB7XG5cdFx0XHRcdGl0ZW1zLmZpbmQoJy5pdGVtLmFjdGl2ZScpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuXHRcdFx0XHRpZiAoaWR4ID49IDApIHtcblx0XHRcdFx0XHRpdGVtLmVxKGlkeCkuYWRkQ2xhc3MoJ2FjdGl2ZScpXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dGhpcy5vbiA9IGV2ZW50cy5vbi5iaW5kKGV2ZW50cylcblx0XHRcdHRoaXMuc2hvd01lbnUgPSBzaG93TWVudVxuXHRcdFx0dGhpcy5jbG9zZU1lbnUgPSBjbG9zZU1lbnVcblxuXHRcblx0XHR9XG5cblx0fSlcblxuXG59KSgpOyIsIihmdW5jdGlvbigpIHtcdFxuXG5cdCQkLmxvYWRTdHlsZSgnL2NvbnRyb2xzL2NpcmN1bGFyLmNzcycpXG59KSgpOyJdfQ==
