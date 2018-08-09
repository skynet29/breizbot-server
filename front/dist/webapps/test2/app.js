$$.configReady(function() {

	var symbols = [
		"SFG*UCDSS-*****",
		"SNG*UCDSS-*****",
		"SHG*UCDSS-*****",
		"SUG*UCDSV-*****",
		"SFG*UCDSV-*****",
		"SNG*UCDSV-*****",
		"SHG*UCDSV-*****",
		"SUG*UCDM--*****",
		"SFG*UCDM--*****",
		"SNG*UCDM--*****",
		"SHG*UCDM--*****",
		"SUG*UCDML-*****",
		"SFG*UCDML-*****",
		"SNG*UCDML-*****",
		"SHG*UCDML-*****",
		"SUG*UCDMLA*****",
		"SFG*UCDMLA*****",
		"SNG*UCDMLA*****",
		"SHG*UCDMLA*****"
	]
		

	var ctrl = window.app = $$.viewController('body', {
		template: "<div>\n<p>Exemple:</p>\n<code>\n	<pre>\n		&lt;div bn-control=\"MilSymbolControl\" data-size=\"40\" data-sidc=\"SFG-UCIZ---B\"&gt;\n	</pre>\n</code>\n<div bn-control=\"MilSymbolControl\" data-size=\"60\" data-sidc=\"SFG-UCIZ---B\" data-unique-designation=\"toto\"></div>\n<div class=\"bn-flex-row bn-flex-wrap\" bn-each=\"s of symbols\">\n	<div bn-control=\"MilSymbolControl\" data-size=\"40\" bn-data=\"sidc: s\"></div>\n</div>\n\n<div class=\"bn-flex-row\">\n	<div bn-event=\"input.field: onPropsChange\">\n		<div class=\"bn-flex-row bn-space-between\">\n			<label>Size:</label>\n			<input type=\"number\" bn-val=\"size\" name=\"size\" class=\"field\">\n		</div>\n		<div class=\"bn-flex-row bn-space-between\">\n			<label>SIDC:</label>\n			<input type=\"text\" bn-val=\"sidc\" name=\"sidc\" class=\"field\">\n		</div>	\n		<div class=\"bn-flex-row bn-space-between\">\n			<label>Unique designation:</label>\n			<input type=\"text\" bn-val=\"uniqueDesignation\" name=\"uniqueDesignation\" class=\"field\">\n		</div>		\n	</div>	\n\n	<div style=\"margin-left: 10px\">\n		<div bn-control=\"MilSymbolControl\" bn-data=\"sidc: sidc, size: size, uniqueDesignation: uniqueDesignation\"></div>\n	</div>\n</div>\n</div>\n",
		data: {
			size: 40,
			sidc: 'SFG-UCI----D',
			uniqueDesignation: 'toto',			
			symbols: symbols
		},	
		events: {
			onPropsChange: function() {
				var attrName = this.name
				var value = this.value
				console.log('onPropsChange', attrName, value)
				ctrl.setData(attrName, value)
			}

		}
	})


})
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIkJC5jb25maWdSZWFkeShmdW5jdGlvbigpIHtcblxuXHR2YXIgc3ltYm9scyA9IFtcblx0XHRcIlNGRypVQ0RTUy0qKioqKlwiLFxuXHRcdFwiU05HKlVDRFNTLSoqKioqXCIsXG5cdFx0XCJTSEcqVUNEU1MtKioqKipcIixcblx0XHRcIlNVRypVQ0RTVi0qKioqKlwiLFxuXHRcdFwiU0ZHKlVDRFNWLSoqKioqXCIsXG5cdFx0XCJTTkcqVUNEU1YtKioqKipcIixcblx0XHRcIlNIRypVQ0RTVi0qKioqKlwiLFxuXHRcdFwiU1VHKlVDRE0tLSoqKioqXCIsXG5cdFx0XCJTRkcqVUNETS0tKioqKipcIixcblx0XHRcIlNORypVQ0RNLS0qKioqKlwiLFxuXHRcdFwiU0hHKlVDRE0tLSoqKioqXCIsXG5cdFx0XCJTVUcqVUNETUwtKioqKipcIixcblx0XHRcIlNGRypVQ0RNTC0qKioqKlwiLFxuXHRcdFwiU05HKlVDRE1MLSoqKioqXCIsXG5cdFx0XCJTSEcqVUNETUwtKioqKipcIixcblx0XHRcIlNVRypVQ0RNTEEqKioqKlwiLFxuXHRcdFwiU0ZHKlVDRE1MQSoqKioqXCIsXG5cdFx0XCJTTkcqVUNETUxBKioqKipcIixcblx0XHRcIlNIRypVQ0RNTEEqKioqKlwiXG5cdF1cblx0XHRcblxuXHR2YXIgY3RybCA9IHdpbmRvdy5hcHAgPSAkJC52aWV3Q29udHJvbGxlcignYm9keScsIHtcblx0XHR0ZW1wbGF0ZTogXCI8ZGl2PlxcbjxwPkV4ZW1wbGU6PC9wPlxcbjxjb2RlPlxcblx0PHByZT5cXG5cdFx0Jmx0O2RpdiBibi1jb250cm9sPVxcXCJNaWxTeW1ib2xDb250cm9sXFxcIiBkYXRhLXNpemU9XFxcIjQwXFxcIiBkYXRhLXNpZGM9XFxcIlNGRy1VQ0laLS0tQlxcXCImZ3Q7XFxuXHQ8L3ByZT5cXG48L2NvZGU+XFxuPGRpdiBibi1jb250cm9sPVxcXCJNaWxTeW1ib2xDb250cm9sXFxcIiBkYXRhLXNpemU9XFxcIjYwXFxcIiBkYXRhLXNpZGM9XFxcIlNGRy1VQ0laLS0tQlxcXCIgZGF0YS11bmlxdWUtZGVzaWduYXRpb249XFxcInRvdG9cXFwiPjwvZGl2PlxcbjxkaXYgY2xhc3M9XFxcImJuLWZsZXgtcm93IGJuLWZsZXgtd3JhcFxcXCIgYm4tZWFjaD1cXFwicyBvZiBzeW1ib2xzXFxcIj5cXG5cdDxkaXYgYm4tY29udHJvbD1cXFwiTWlsU3ltYm9sQ29udHJvbFxcXCIgZGF0YS1zaXplPVxcXCI0MFxcXCIgYm4tZGF0YT1cXFwic2lkYzogc1xcXCI+PC9kaXY+XFxuPC9kaXY+XFxuXFxuPGRpdiBjbGFzcz1cXFwiYm4tZmxleC1yb3dcXFwiPlxcblx0PGRpdiBibi1ldmVudD1cXFwiaW5wdXQuZmllbGQ6IG9uUHJvcHNDaGFuZ2VcXFwiPlxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LXJvdyBibi1zcGFjZS1iZXR3ZWVuXFxcIj5cXG5cdFx0XHQ8bGFiZWw+U2l6ZTo8L2xhYmVsPlxcblx0XHRcdDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIGJuLXZhbD1cXFwic2l6ZVxcXCIgbmFtZT1cXFwic2l6ZVxcXCIgY2xhc3M9XFxcImZpZWxkXFxcIj5cXG5cdFx0PC9kaXY+XFxuXHRcdDxkaXYgY2xhc3M9XFxcImJuLWZsZXgtcm93IGJuLXNwYWNlLWJldHdlZW5cXFwiPlxcblx0XHRcdDxsYWJlbD5TSURDOjwvbGFiZWw+XFxuXHRcdFx0PGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGJuLXZhbD1cXFwic2lkY1xcXCIgbmFtZT1cXFwic2lkY1xcXCIgY2xhc3M9XFxcImZpZWxkXFxcIj5cXG5cdFx0PC9kaXY+XHRcXG5cdFx0PGRpdiBjbGFzcz1cXFwiYm4tZmxleC1yb3cgYm4tc3BhY2UtYmV0d2VlblxcXCI+XFxuXHRcdFx0PGxhYmVsPlVuaXF1ZSBkZXNpZ25hdGlvbjo8L2xhYmVsPlxcblx0XHRcdDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBibi12YWw9XFxcInVuaXF1ZURlc2lnbmF0aW9uXFxcIiBuYW1lPVxcXCJ1bmlxdWVEZXNpZ25hdGlvblxcXCIgY2xhc3M9XFxcImZpZWxkXFxcIj5cXG5cdFx0PC9kaXY+XHRcdFxcblx0PC9kaXY+XHRcXG5cXG5cdDxkaXYgc3R5bGU9XFxcIm1hcmdpbi1sZWZ0OiAxMHB4XFxcIj5cXG5cdFx0PGRpdiBibi1jb250cm9sPVxcXCJNaWxTeW1ib2xDb250cm9sXFxcIiBibi1kYXRhPVxcXCJzaWRjOiBzaWRjLCBzaXplOiBzaXplLCB1bmlxdWVEZXNpZ25hdGlvbjogdW5pcXVlRGVzaWduYXRpb25cXFwiPjwvZGl2Plxcblx0PC9kaXY+XFxuPC9kaXY+XFxuPC9kaXY+XFxuXCIsXG5cdFx0ZGF0YToge1xuXHRcdFx0c2l6ZTogNDAsXG5cdFx0XHRzaWRjOiAnU0ZHLVVDSS0tLS1EJyxcblx0XHRcdHVuaXF1ZURlc2lnbmF0aW9uOiAndG90bycsXHRcdFx0XG5cdFx0XHRzeW1ib2xzOiBzeW1ib2xzXG5cdFx0fSxcdFxuXHRcdGV2ZW50czoge1xuXHRcdFx0b25Qcm9wc0NoYW5nZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBhdHRyTmFtZSA9IHRoaXMubmFtZVxuXHRcdFx0XHR2YXIgdmFsdWUgPSB0aGlzLnZhbHVlXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdvblByb3BzQ2hhbmdlJywgYXR0ck5hbWUsIHZhbHVlKVxuXHRcdFx0XHRjdHJsLnNldERhdGEoYXR0ck5hbWUsIHZhbHVlKVxuXHRcdFx0fVxuXG5cdFx0fVxuXHR9KVxuXG5cbn0pIl19
