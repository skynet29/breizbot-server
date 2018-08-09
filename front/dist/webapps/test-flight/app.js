$$.configReady(function(config) {


	var ctrl = window.app = $$.viewController('body', {
		template: "<div class=\"bn-flex-col bn-flex-1\" style=\"margin: 10px; align-items: center;\">\n	<div bn-control=\"FlightPanelControl\" bn-data=\"roll: roll, altitude:altitude, pitch: pitch, speed:speed\" ></div>\n\n	<div class=\"bn-flex-1 bn-flex-col bn-margin-10\" style=\"width: 100%\">\n		<div class=\"bn-flex-row bn-align-center\">\n			<span style=\"width: 80px\">Speed</span>\n			<div class=\"bn-flex-1\" bn-control=\"SliderControl\" data-max=\"200\" bn-val=\"speed\" bn-update=\"input\"></div>\n		</div>\n		<div class=\"bn-flex-row\" style=\"align-items: center;\" >\n			<span style=\"width: 80px\">Roll</span>\n			<div class=\"bn-flex-1\" bn-control=\"SliderControl\" bn-val=\"roll\" bn-update=\"input\" data-min=\"-50\" data-max=\"50\"></div>\n		</div>\n		<div class=\"bn-flex-row\" style=\"align-items: center;\" >\n			<span style=\"width: 80px\">Pitch</span>\n			<div class=\"bn-flex-1\" bn-control=\"SliderControl\" bn-val=\"pitch\" bn-update=\"input\" data-min=\"-40\" data-max=\"40\"></div>\n		</div>\n		<div class=\"bn-flex-row\" style=\"align-items: center;\" >\n			<span style=\"width: 80px\">Altitude</span>\n			<div class=\"bn-flex-1\" bn-control=\"SliderControl\" bn-val=\"altitude\" bn-update=\"input\"></div>\n		</div>\n		\n	</div>\n	\n</div>",

		data: {

			roll: 10,
			pitch: 10,
			altitude: 50,
			speed: 5,

			options: {
				earthColor: 'green'
			}
		}

	})
})
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQkLmNvbmZpZ1JlYWR5KGZ1bmN0aW9uKGNvbmZpZykge1xuXG5cblx0dmFyIGN0cmwgPSB3aW5kb3cuYXBwID0gJCQudmlld0NvbnRyb2xsZXIoJ2JvZHknLCB7XG5cdFx0dGVtcGxhdGU6IFwiPGRpdiBjbGFzcz1cXFwiYm4tZmxleC1jb2wgYm4tZmxleC0xXFxcIiBzdHlsZT1cXFwibWFyZ2luOiAxMHB4OyBhbGlnbi1pdGVtczogY2VudGVyO1xcXCI+XFxuXHQ8ZGl2IGJuLWNvbnRyb2w9XFxcIkZsaWdodFBhbmVsQ29udHJvbFxcXCIgYm4tZGF0YT1cXFwicm9sbDogcm9sbCwgYWx0aXR1ZGU6YWx0aXR1ZGUsIHBpdGNoOiBwaXRjaCwgc3BlZWQ6c3BlZWRcXFwiID48L2Rpdj5cXG5cXG5cdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtMSBibi1mbGV4LWNvbCBibi1tYXJnaW4tMTBcXFwiIHN0eWxlPVxcXCJ3aWR0aDogMTAwJVxcXCI+XFxuXHRcdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtcm93IGJuLWFsaWduLWNlbnRlclxcXCI+XFxuXHRcdFx0PHNwYW4gc3R5bGU9XFxcIndpZHRoOiA4MHB4XFxcIj5TcGVlZDwvc3Bhbj5cXG5cdFx0XHQ8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LTFcXFwiIGJuLWNvbnRyb2w9XFxcIlNsaWRlckNvbnRyb2xcXFwiIGRhdGEtbWF4PVxcXCIyMDBcXFwiIGJuLXZhbD1cXFwic3BlZWRcXFwiIGJuLXVwZGF0ZT1cXFwiaW5wdXRcXFwiPjwvZGl2Plxcblx0XHQ8L2Rpdj5cXG5cdFx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC1yb3dcXFwiIHN0eWxlPVxcXCJhbGlnbi1pdGVtczogY2VudGVyO1xcXCIgPlxcblx0XHRcdDxzcGFuIHN0eWxlPVxcXCJ3aWR0aDogODBweFxcXCI+Um9sbDwvc3Bhbj5cXG5cdFx0XHQ8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LTFcXFwiIGJuLWNvbnRyb2w9XFxcIlNsaWRlckNvbnRyb2xcXFwiIGJuLXZhbD1cXFwicm9sbFxcXCIgYm4tdXBkYXRlPVxcXCJpbnB1dFxcXCIgZGF0YS1taW49XFxcIi01MFxcXCIgZGF0YS1tYXg9XFxcIjUwXFxcIj48L2Rpdj5cXG5cdFx0PC9kaXY+XFxuXHRcdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtcm93XFxcIiBzdHlsZT1cXFwiYWxpZ24taXRlbXM6IGNlbnRlcjtcXFwiID5cXG5cdFx0XHQ8c3BhbiBzdHlsZT1cXFwid2lkdGg6IDgwcHhcXFwiPlBpdGNoPC9zcGFuPlxcblx0XHRcdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtMVxcXCIgYm4tY29udHJvbD1cXFwiU2xpZGVyQ29udHJvbFxcXCIgYm4tdmFsPVxcXCJwaXRjaFxcXCIgYm4tdXBkYXRlPVxcXCJpbnB1dFxcXCIgZGF0YS1taW49XFxcIi00MFxcXCIgZGF0YS1tYXg9XFxcIjQwXFxcIj48L2Rpdj5cXG5cdFx0PC9kaXY+XFxuXHRcdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtcm93XFxcIiBzdHlsZT1cXFwiYWxpZ24taXRlbXM6IGNlbnRlcjtcXFwiID5cXG5cdFx0XHQ8c3BhbiBzdHlsZT1cXFwid2lkdGg6IDgwcHhcXFwiPkFsdGl0dWRlPC9zcGFuPlxcblx0XHRcdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtMVxcXCIgYm4tY29udHJvbD1cXFwiU2xpZGVyQ29udHJvbFxcXCIgYm4tdmFsPVxcXCJhbHRpdHVkZVxcXCIgYm4tdXBkYXRlPVxcXCJpbnB1dFxcXCI+PC9kaXY+XFxuXHRcdDwvZGl2Plxcblx0XHRcXG5cdDwvZGl2Plxcblx0XFxuPC9kaXY+XCIsXG5cblx0XHRkYXRhOiB7XG5cblx0XHRcdHJvbGw6IDEwLFxuXHRcdFx0cGl0Y2g6IDEwLFxuXHRcdFx0YWx0aXR1ZGU6IDUwLFxuXHRcdFx0c3BlZWQ6IDUsXG5cblx0XHRcdG9wdGlvbnM6IHtcblx0XHRcdFx0ZWFydGhDb2xvcjogJ2dyZWVuJ1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9KVxufSkiXX0=
