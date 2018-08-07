(function() {	

	$$.loadStyle('/controls/file.css')
})();
$$.registerControlEx('FileControl', {
	deps: ['FileService'], 
	options: {
		toolbar: true,
		imageOnly: false,
		maxUploadSize: 2*1024*2014 // 2 Mo		
	},
	events: 'fileClick',
	iface: 'getFiles()',

	
	lib: 'file',
init: function(elt, options, fileSrv) {

		var cutFiles = []
		var cutDir = '/'
		var copy = true

		function getSelFiles() {
			var selDiv = elt.find('.thumbnail.selected a')

			var selFile = []
			selDiv.each(function() {
				selFile.push(ctrl.model.rootDir + $(this).data('name'))
			})
			return selFile
		}


		var ctrl = window.fileCtrl = $$.viewController(elt, {
			template: "<div class=\"bn-flex-col\" style=\"height: 100%\">\r\n	<div class=\"bn-toolbar\">\r\n\r\n		<div class=\"subToolbar\" bn-show=\"showToolbar\">		\r\n\r\n			<button \r\n				bn-event=\"click: onToggleSelMode\" \r\n				title=\"Select mode\" \r\n				bn-class=\"selected: selMode\"\r\n				>\r\n					<i class=\"fa fa-check\"></i>\r\n			</button>\r\n\r\n			<button \r\n				bn-event=\"click: onCancelSelection\" \r\n				title=\"Cancel selection\"\r\n				bn-prop=\"disabled: !canCancel\"  \r\n				>\r\n					<i class=\"fa fa-times\"></i>\r\n			</button>\r\n\r\n		</div>\r\n\r\n		<div class=\"subToolbar\" bn-show=\"showToolbar\">\r\n\r\n			<button \r\n				bn-event=\"click: onDelete\" \r\n				bn-prop=\"disabled: !fileSelected\" \r\n				title=\"Delete selected files\"\r\n				>\r\n					<i class=\"fa fa-trash\" ></i>\r\n			</button>\r\n\r\n			<button \r\n				title=\"Cut\" \r\n				bn-event=\"click: onCut\" \r\n				bn-prop=\"disabled: !fileSelected\"\r\n				>\r\n					<i class=\"fa fa-cut\" ></i>\r\n			</button>\r\n\r\n			<button \r\n				title=\"Copy\" \r\n				bn-prop=\"disabled: !fileSelected\" \r\n				bn-event=\"click: onCopy\"\r\n				>\r\n					<i class=\"fa fa-copy\" ></i>\r\n			</button>\r\n\r\n			<button \r\n				title=\"Paste\" \r\n				bn-prop=\"disabled: !canPaste\" \r\n				bn-event=\"click: onPaste\"\r\n				>\r\n					<i class=\"fa fa-paste\" ></i>\r\n			</button>\r\n\r\n		</div>\r\n\r\n		<div class=\"subToolbar\" bn-show=\"showToolbar\">\r\n\r\n			<button \r\n				bn-event=\"click: onCreateFolder\" \r\n				title=\"New folder\"\r\n				>\r\n					<i class=\"fa fa-folder-open\" ></i>\r\n			</button>\r\n			\r\n			<button \r\n				title=\"Import file\" \r\n				bn-event=\"click: onImportFile\"\r\n				>\r\n					<i class=\"fa fa-upload\" ></i>\r\n			</button>\r\n\r\n		</div>\r\n\r\n		<div class=\"subToolbar\"  bn-show=\"backVisible\">\r\n\r\n			<button bn-event=\"click: onBackBtn\" title=\"Top folder\">\r\n				<i class=\"fa fa-arrow-left\"></i>\r\n			</button>	\r\n		</div>			\r\n\r\n	</div>\r\n\r\n	<div class=\"contentPanel\">\r\n		<div class=\"pathPanel\">\r\n			Path:&nbsp;<span bn-text=\"rootDir\"></span>\r\n		</div>\r\n\r\n\r\n		<div bn-each=\"f of files\" class=\"container\" bn-event=\"click.folder: onFolder, click.file: onFile\">\r\n			\r\n			<div class=\"thumbnail\">\r\n					<a bn-if=\"f.isImage\" href=\"#\" bn-attr=\"title: f.size\" class=\"file\" bn-data=\"name: f.name\">\r\n						<div>\r\n							<img bn-attr=\"src: f.imgUrl\">\r\n						</div>\r\n						\r\n						<span bn-text=\"f.name\"></span>\r\n					</a>			\r\n					<a bn-if=\"f.isDir\" href=\"#\" class=\"folder\" bn-data=\"name: f.name\">\r\n						<div>\r\n							<i class=\"fa fa-4x fa-folder-open w3-text-blue-grey\"></i>\r\n						</div>\r\n						\r\n						<span bn-text=\"f.name\"></span>\r\n					</a>\r\n					<a bn-if=\"f.isFile\" href=\"#\" bn-data=\"name: f.name\" class=\"file\" bn-attr=\"title: f.size\">\r\n						<div>\r\n							<i class=\"fa fa-4x fa-file w3-text-blue-grey\"></i>\r\n						</div>\r\n						\r\n						<span bn-text=\"f.name\"></span>\r\n					</a>			\r\n				\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>\r\n\r\n",
			data: {
				files: [],
				cutFiles: [],
				rootDir: '/',
				cutDir: '/',
				backVisible: function() {
					return this.rootDir != '/'
				},
				selMode: false,
				fileSelected: false,
				showToolbar: options.toolbar,
				canCancel: function() {
					return this.cutFiles.length != 0 || this.fileSelected
				},
				canPaste: function() {
					return this.cutFiles.length != 0 && this.rootDir != this.cutDir
				}
			},
			events: {
				onFolder: function(ev) {
					console.log('onFolder')
					if (ctrl.model.selMode) {
						console.log('this', $(this).closest('.thumbnail'))
						$(this).closest('.thumbnail').toggleClass('selected')

						ctrl.setData('fileSelected', getSelFiles().length != 0)
						return
					}

					var dirName = $(this).data('name')
					//console.log('onFolder', dirName)
					ev.preventDefault()
					loadData(ctrl.model.rootDir + dirName + '/')
				},
				onBackBtn: function() {
					var split = ctrl.model.rootDir.split('/')
					//console.log('onBackBtn', split)
					
					split.pop()
					split.pop()
					
					//console.log('rootDir', rootDir)
					loadData(split.join('/') + '/')

				},
				onFile: function(ev) {
					var name = $(this).data('name')
					//console.log('onPicture', name)
					ev.preventDefault()
					//var filePath = fileSrv.fileUrl(rootDir + name)
					//console.log('filePath', filePath)
					if (ctrl.model.selMode) {
						$(this).closest('.thumbnail').toggleClass('selected')
						ctrl.setData('fileSelected', getSelFiles().length != 0)
						return
					}
					elt.trigger('fileClick', {name, rootDir: ctrl.model.rootDir})
				},
				onToggleSelMode: function() {
					ctrl.setData('selMode', !ctrl.model.selMode)
					if (!ctrl.model.selMode) {
						elt.find('.thumbnail.selected').removeClass('selected')
						ctrl.setData('fileSelected', false)
					}
				},
				onDelete: function() {
					$$.showConfirm("Are you sure ?", "Delete files", function() {
						var selFile = getSelFiles()
						//console.log('onDelete', selFile)
						fileSrv.removeFiles(selFile)
						.then(function(resp) {
							console.log('resp', resp)
							loadData()
						})
						.catch(function(resp) {
							console.log('resp', resp)
							$$.showAlert(resp.responseText, 'Error')
						})					
					})

				},
				onCreateFolder: function() {
					var rootDir = ctrl.model.rootDir
					$$.showPrompt('Folder name:', 'New Folder', function(folderName) {
						fileSrv.mkdir(rootDir + folderName)
						.then(function(resp) {
							console.log('resp', resp)
							loadData()
						})
						.catch(function(resp) {
							console.log('resp', resp)
							$$.showAlert(resp.responseText, 'Error')
						})	
					})
				},
				onCut: function() {

					copy = false

					//console.log('onCut', cutFiles)
					
					ctrl.setData({
						selMode: false,
						fileSelected: false,
						cutFiles: getSelFiles(),
						cutDir: ctrl.model.rootDir
					})

					elt.find('.thumbnail.selected').removeClass('selected').addClass('cuted')

				},
				onCopy: function() {

					copy = true

					//console.log('onCopy', cutFiles)
					
					ctrl.setData({
						selMode: false,
						fileSelected: false,
						cutFiles: getSelFiles(),
						cutDir: ctrl.model.rootDir
					})

					elt.find('.thumbnail.selected').removeClass('selected').addClass('cuted')
				},

				onPaste: function() {
					//console.log('onPaste')
					var {rootDir, cutFiles} = ctrl.model
					var promise = (copy) ? fileSrv.copyFiles(cutFiles, rootDir) : fileSrv.moveFiles(cutFiles, rootDir)
					copy = false
					promise
					.then(function(resp) {
						console.log('resp', resp)
						ctrl.setData({cutFiles: []})
						loadData()
					})
					.catch(function(resp) {
						console.log('resp', resp)
						ctrl.setData({cutFiles: []})
						$$.showAlert(resp.responseText, 'Error')
					})	
				},
				onCancelSelection: function() {
					elt.find('.thumbnail').removeClass('selected cuted')
					ctrl.setData({
						fileSelected: false,
						cutFiles: []
					})				
				},
				onImportFile: function() {
					//console.log('onImportFile')
					var rootDir = ctrl.model.rootDir

					$$.openFileDialog(function(file) {
						//console.log('fileSize', file.size / 1024)
						if (file.size > options.maxUploadSize) {
							$$.showAlert('File too big', 'Error')
							return
						}
						$$.readFileAsDataURL(file, function(dataURL) {
							//console.log('dataURL', dataURL)
							fileSrv.uploadFile(dataURL, file.name, rootDir).then(function() {
								loadData()
							})
							.catch(function(resp) {
								console.log('resp', resp)
								$$.showAlert(resp.responseText, 'Error')							
							})
						})					
					})
				}
			} 
		})

		function loadData(rootDir) {
			if (rootDir == undefined) {
				rootDir = ctrl.model.rootDir
			}
			fileSrv.list(rootDir, options.imageOnly).then(function(files) {
				//console.log('files', files)
				ctrl.setData({
					rootDir,
					fileSelected: false,
					files: files
		/*				.filter(function(file) {
							return !file.isDir
						})*/
						.map(function(file, idx) {
							var name = file.title
							var isDir = file.folder
							var isImage = $$.isImage(name)
							return {
								name,
								size: 'Size : ' + Math.floor(file.size/1024) + ' Ko',
								imgUrl:  isDir ? '' : fileSrv.fileUrl(rootDir + name),
								isDir,
								isImage, 
								isFile: !isDir && !isImage
							}
						})
				})
			})		
		}

		loadData()

		this.getFiles = function() {
			return ctrl.model.files
		}
	}

});

(function() {

function getNodePath(node) {

	var path = node.getParentList(false, true).map((node) => node.key == 'root' ? '/' : node.title)
	return path.join('/')
}

$$.registerControlEx('FileTreeControl', {
	deps: ['FileService'],
	iface: 'refresh();getValue()',
	
	lib: 'file',
init: function(elt, options, fileSrv) {
		var ctrl = $$.viewController(elt, {
			template: "<div>\r\n	<div bn-control=\"TreeControl\" bn-options=\"treeOptions\" bn-iface=\"treeCtrl\" bn-event=\"contextMenuAction: onTreeAction\"></div>\r\n</div>",		
			data: {
				treeOptions: {
					source: [{title: 'Home', folder: true, lazy: true, key: 'root'}],

					lazyLoad: function(event, data) {
						
						//console.log('lazyLoad', data.node.key)
						var path = getNodePath(data.node)
						data.result = fileSrv.list(path, false, true)

					},
					contextMenu: {
						menu: {
							newFolder: {'name': 'New Folder'}
						}
					}
				}
			},
			events: {
				onTreeAction: function(node, action) {
					//console.log('onTreeAction', node.title, action)
					$$.showPrompt('Folder name', 'New Folder', function(folderName) {
						
						var path = getNodePath(node)
						//console.log('folderName', folderName, 'path', path)
						fileSrv.mkdir(path + '/' + folderName)
						.then(function(resp) {
							console.log('resp', resp)
							node.load(true)
						})
						.catch(function(resp) {
							console.log('resp', resp)
							$$.showAlert(resp.responseText, 'Error')
						})							
					})
				}
			}			
		})

		this.getValue = function() {
			return getNodePath(ctrl.scope.treeCtrl.getActiveNode())
		},

		this.refresh = function() {
			const root = ctrl.scope.treeCtrl.getRootNode().getFirstChild()
			if (root) {
				root.load(true)
			}
		}
		
	}

});


})();




//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlcHMuanMiLCJmaWxlLmpzIiwiZmlsZXRyZWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZmlsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcdFxyXG5cclxuXHQkJC5sb2FkU3R5bGUoJy9jb250cm9scy9maWxlLmNzcycpXHJcbn0pKCk7IiwiJCQucmVnaXN0ZXJDb250cm9sRXgoJ0ZpbGVDb250cm9sJywge1xyXG5cdGRlcHM6IFsnRmlsZVNlcnZpY2UnXSwgXHJcblx0b3B0aW9uczoge1xyXG5cdFx0dG9vbGJhcjogdHJ1ZSxcclxuXHRcdGltYWdlT25seTogZmFsc2UsXHJcblx0XHRtYXhVcGxvYWRTaXplOiAyKjEwMjQqMjAxNCAvLyAyIE1vXHRcdFxyXG5cdH0sXHJcblx0ZXZlbnRzOiAnZmlsZUNsaWNrJyxcclxuXHRpZmFjZTogJ2dldEZpbGVzKCknLFxyXG5cclxuXHRcblx0bGliOiAnZmlsZScsXG5pbml0OiBmdW5jdGlvbihlbHQsIG9wdGlvbnMsIGZpbGVTcnYpIHtcclxuXHJcblx0XHR2YXIgY3V0RmlsZXMgPSBbXVxyXG5cdFx0dmFyIGN1dERpciA9ICcvJ1xyXG5cdFx0dmFyIGNvcHkgPSB0cnVlXHJcblxyXG5cdFx0ZnVuY3Rpb24gZ2V0U2VsRmlsZXMoKSB7XHJcblx0XHRcdHZhciBzZWxEaXYgPSBlbHQuZmluZCgnLnRodW1ibmFpbC5zZWxlY3RlZCBhJylcclxuXHJcblx0XHRcdHZhciBzZWxGaWxlID0gW11cclxuXHRcdFx0c2VsRGl2LmVhY2goZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0c2VsRmlsZS5wdXNoKGN0cmwubW9kZWwucm9vdERpciArICQodGhpcykuZGF0YSgnbmFtZScpKVxyXG5cdFx0XHR9KVxyXG5cdFx0XHRyZXR1cm4gc2VsRmlsZVxyXG5cdFx0fVxyXG5cclxuXHJcblx0XHR2YXIgY3RybCA9IHdpbmRvdy5maWxlQ3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2IGNsYXNzPVxcXCJibi1mbGV4LWNvbFxcXCIgc3R5bGU9XFxcImhlaWdodDogMTAwJVxcXCI+XFxyXFxuXHQ8ZGl2IGNsYXNzPVxcXCJibi10b29sYmFyXFxcIj5cXHJcXG5cXHJcXG5cdFx0PGRpdiBjbGFzcz1cXFwic3ViVG9vbGJhclxcXCIgYm4tc2hvdz1cXFwic2hvd1Rvb2xiYXJcXFwiPlx0XHRcXHJcXG5cXHJcXG5cdFx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvblRvZ2dsZVNlbE1vZGVcXFwiIFxcclxcblx0XHRcdFx0dGl0bGU9XFxcIlNlbGVjdCBtb2RlXFxcIiBcXHJcXG5cdFx0XHRcdGJuLWNsYXNzPVxcXCJzZWxlY3RlZDogc2VsTW9kZVxcXCJcXHJcXG5cdFx0XHRcdD5cXHJcXG5cdFx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLWNoZWNrXFxcIj48L2k+XFxyXFxuXHRcdFx0PC9idXR0b24+XFxyXFxuXFxyXFxuXHRcdFx0PGJ1dHRvbiBcXHJcXG5cdFx0XHRcdGJuLWV2ZW50PVxcXCJjbGljazogb25DYW5jZWxTZWxlY3Rpb25cXFwiIFxcclxcblx0XHRcdFx0dGl0bGU9XFxcIkNhbmNlbCBzZWxlY3Rpb25cXFwiXFxyXFxuXHRcdFx0XHRibi1wcm9wPVxcXCJkaXNhYmxlZDogIWNhbkNhbmNlbFxcXCIgIFxcclxcblx0XHRcdFx0Plxcclxcblx0XHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtdGltZXNcXFwiPjwvaT5cXHJcXG5cdFx0XHQ8L2J1dHRvbj5cXHJcXG5cXHJcXG5cdFx0PC9kaXY+XFxyXFxuXFxyXFxuXHRcdDxkaXYgY2xhc3M9XFxcInN1YlRvb2xiYXJcXFwiIGJuLXNob3c9XFxcInNob3dUb29sYmFyXFxcIj5cXHJcXG5cXHJcXG5cdFx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkRlbGV0ZVxcXCIgXFxyXFxuXHRcdFx0XHRibi1wcm9wPVxcXCJkaXNhYmxlZDogIWZpbGVTZWxlY3RlZFxcXCIgXFxyXFxuXHRcdFx0XHR0aXRsZT1cXFwiRGVsZXRlIHNlbGVjdGVkIGZpbGVzXFxcIlxcclxcblx0XHRcdFx0Plxcclxcblx0XHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtdHJhc2hcXFwiID48L2k+XFxyXFxuXHRcdFx0PC9idXR0b24+XFxyXFxuXFxyXFxuXHRcdFx0PGJ1dHRvbiBcXHJcXG5cdFx0XHRcdHRpdGxlPVxcXCJDdXRcXFwiIFxcclxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkN1dFxcXCIgXFxyXFxuXHRcdFx0XHRibi1wcm9wPVxcXCJkaXNhYmxlZDogIWZpbGVTZWxlY3RlZFxcXCJcXHJcXG5cdFx0XHRcdD5cXHJcXG5cdFx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLWN1dFxcXCIgPjwvaT5cXHJcXG5cdFx0XHQ8L2J1dHRvbj5cXHJcXG5cXHJcXG5cdFx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdFx0dGl0bGU9XFxcIkNvcHlcXFwiIFxcclxcblx0XHRcdFx0Ym4tcHJvcD1cXFwiZGlzYWJsZWQ6ICFmaWxlU2VsZWN0ZWRcXFwiIFxcclxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkNvcHlcXFwiXFxyXFxuXHRcdFx0XHQ+XFxyXFxuXHRcdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS1jb3B5XFxcIiA+PC9pPlxcclxcblx0XHRcdDwvYnV0dG9uPlxcclxcblxcclxcblx0XHRcdDxidXR0b24gXFxyXFxuXHRcdFx0XHR0aXRsZT1cXFwiUGFzdGVcXFwiIFxcclxcblx0XHRcdFx0Ym4tcHJvcD1cXFwiZGlzYWJsZWQ6ICFjYW5QYXN0ZVxcXCIgXFxyXFxuXHRcdFx0XHRibi1ldmVudD1cXFwiY2xpY2s6IG9uUGFzdGVcXFwiXFxyXFxuXHRcdFx0XHQ+XFxyXFxuXHRcdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS1wYXN0ZVxcXCIgPjwvaT5cXHJcXG5cdFx0XHQ8L2J1dHRvbj5cXHJcXG5cXHJcXG5cdFx0PC9kaXY+XFxyXFxuXFxyXFxuXHRcdDxkaXYgY2xhc3M9XFxcInN1YlRvb2xiYXJcXFwiIGJuLXNob3c9XFxcInNob3dUb29sYmFyXFxcIj5cXHJcXG5cXHJcXG5cdFx0XHQ8YnV0dG9uIFxcclxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkNyZWF0ZUZvbGRlclxcXCIgXFxyXFxuXHRcdFx0XHR0aXRsZT1cXFwiTmV3IGZvbGRlclxcXCJcXHJcXG5cdFx0XHRcdD5cXHJcXG5cdFx0XHRcdFx0PGkgY2xhc3M9XFxcImZhIGZhLWZvbGRlci1vcGVuXFxcIiA+PC9pPlxcclxcblx0XHRcdDwvYnV0dG9uPlxcclxcblx0XHRcdFxcclxcblx0XHRcdDxidXR0b24gXFxyXFxuXHRcdFx0XHR0aXRsZT1cXFwiSW1wb3J0IGZpbGVcXFwiIFxcclxcblx0XHRcdFx0Ym4tZXZlbnQ9XFxcImNsaWNrOiBvbkltcG9ydEZpbGVcXFwiXFxyXFxuXHRcdFx0XHQ+XFxyXFxuXHRcdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS11cGxvYWRcXFwiID48L2k+XFxyXFxuXHRcdFx0PC9idXR0b24+XFxyXFxuXFxyXFxuXHRcdDwvZGl2Plxcclxcblxcclxcblx0XHQ8ZGl2IGNsYXNzPVxcXCJzdWJUb29sYmFyXFxcIiAgYm4tc2hvdz1cXFwiYmFja1Zpc2libGVcXFwiPlxcclxcblxcclxcblx0XHRcdDxidXR0b24gYm4tZXZlbnQ9XFxcImNsaWNrOiBvbkJhY2tCdG5cXFwiIHRpdGxlPVxcXCJUb3AgZm9sZGVyXFxcIj5cXHJcXG5cdFx0XHRcdDxpIGNsYXNzPVxcXCJmYSBmYS1hcnJvdy1sZWZ0XFxcIj48L2k+XFxyXFxuXHRcdFx0PC9idXR0b24+XHRcXHJcXG5cdFx0PC9kaXY+XHRcdFx0XFxyXFxuXFxyXFxuXHQ8L2Rpdj5cXHJcXG5cXHJcXG5cdDxkaXYgY2xhc3M9XFxcImNvbnRlbnRQYW5lbFxcXCI+XFxyXFxuXHRcdDxkaXYgY2xhc3M9XFxcInBhdGhQYW5lbFxcXCI+XFxyXFxuXHRcdFx0UGF0aDombmJzcDs8c3BhbiBibi10ZXh0PVxcXCJyb290RGlyXFxcIj48L3NwYW4+XFxyXFxuXHRcdDwvZGl2Plxcclxcblxcclxcblxcclxcblx0XHQ8ZGl2IGJuLWVhY2g9XFxcImYgb2YgZmlsZXNcXFwiIGNsYXNzPVxcXCJjb250YWluZXJcXFwiIGJuLWV2ZW50PVxcXCJjbGljay5mb2xkZXI6IG9uRm9sZGVyLCBjbGljay5maWxlOiBvbkZpbGVcXFwiPlxcclxcblx0XHRcdFxcclxcblx0XHRcdDxkaXYgY2xhc3M9XFxcInRodW1ibmFpbFxcXCI+XFxyXFxuXHRcdFx0XHRcdDxhIGJuLWlmPVxcXCJmLmlzSW1hZ2VcXFwiIGhyZWY9XFxcIiNcXFwiIGJuLWF0dHI9XFxcInRpdGxlOiBmLnNpemVcXFwiIGNsYXNzPVxcXCJmaWxlXFxcIiBibi1kYXRhPVxcXCJuYW1lOiBmLm5hbWVcXFwiPlxcclxcblx0XHRcdFx0XHRcdDxkaXY+XFxyXFxuXHRcdFx0XHRcdFx0XHQ8aW1nIGJuLWF0dHI9XFxcInNyYzogZi5pbWdVcmxcXFwiPlxcclxcblx0XHRcdFx0XHRcdDwvZGl2Plxcclxcblx0XHRcdFx0XHRcdFxcclxcblx0XHRcdFx0XHRcdDxzcGFuIGJuLXRleHQ9XFxcImYubmFtZVxcXCI+PC9zcGFuPlxcclxcblx0XHRcdFx0XHQ8L2E+XHRcdFx0XFxyXFxuXHRcdFx0XHRcdDxhIGJuLWlmPVxcXCJmLmlzRGlyXFxcIiBocmVmPVxcXCIjXFxcIiBjbGFzcz1cXFwiZm9sZGVyXFxcIiBibi1kYXRhPVxcXCJuYW1lOiBmLm5hbWVcXFwiPlxcclxcblx0XHRcdFx0XHRcdDxkaXY+XFxyXFxuXHRcdFx0XHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtNHggZmEtZm9sZGVyLW9wZW4gdzMtdGV4dC1ibHVlLWdyZXlcXFwiPjwvaT5cXHJcXG5cdFx0XHRcdFx0XHQ8L2Rpdj5cXHJcXG5cdFx0XHRcdFx0XHRcXHJcXG5cdFx0XHRcdFx0XHQ8c3BhbiBibi10ZXh0PVxcXCJmLm5hbWVcXFwiPjwvc3Bhbj5cXHJcXG5cdFx0XHRcdFx0PC9hPlxcclxcblx0XHRcdFx0XHQ8YSBibi1pZj1cXFwiZi5pc0ZpbGVcXFwiIGhyZWY9XFxcIiNcXFwiIGJuLWRhdGE9XFxcIm5hbWU6IGYubmFtZVxcXCIgY2xhc3M9XFxcImZpbGVcXFwiIGJuLWF0dHI9XFxcInRpdGxlOiBmLnNpemVcXFwiPlxcclxcblx0XHRcdFx0XHRcdDxkaXY+XFxyXFxuXHRcdFx0XHRcdFx0XHQ8aSBjbGFzcz1cXFwiZmEgZmEtNHggZmEtZmlsZSB3My10ZXh0LWJsdWUtZ3JleVxcXCI+PC9pPlxcclxcblx0XHRcdFx0XHRcdDwvZGl2Plxcclxcblx0XHRcdFx0XHRcdFxcclxcblx0XHRcdFx0XHRcdDxzcGFuIGJuLXRleHQ9XFxcImYubmFtZVxcXCI+PC9zcGFuPlxcclxcblx0XHRcdFx0XHQ8L2E+XHRcdFx0XFxyXFxuXHRcdFx0XHRcXHJcXG5cdFx0XHQ8L2Rpdj5cXHJcXG5cdFx0PC9kaXY+XFxyXFxuXHQ8L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cXHJcXG5cIixcclxuXHRcdFx0ZGF0YToge1xyXG5cdFx0XHRcdGZpbGVzOiBbXSxcclxuXHRcdFx0XHRjdXRGaWxlczogW10sXHJcblx0XHRcdFx0cm9vdERpcjogJy8nLFxyXG5cdFx0XHRcdGN1dERpcjogJy8nLFxyXG5cdFx0XHRcdGJhY2tWaXNpYmxlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLnJvb3REaXIgIT0gJy8nXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRzZWxNb2RlOiBmYWxzZSxcclxuXHRcdFx0XHRmaWxlU2VsZWN0ZWQ6IGZhbHNlLFxyXG5cdFx0XHRcdHNob3dUb29sYmFyOiBvcHRpb25zLnRvb2xiYXIsXHJcblx0XHRcdFx0Y2FuQ2FuY2VsOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmN1dEZpbGVzLmxlbmd0aCAhPSAwIHx8IHRoaXMuZmlsZVNlbGVjdGVkXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRjYW5QYXN0ZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5jdXRGaWxlcy5sZW5ndGggIT0gMCAmJiB0aGlzLnJvb3REaXIgIT0gdGhpcy5jdXREaXJcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0sXHJcblx0XHRcdGV2ZW50czoge1xyXG5cdFx0XHRcdG9uRm9sZGVyOiBmdW5jdGlvbihldikge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ29uRm9sZGVyJylcclxuXHRcdFx0XHRcdGlmIChjdHJsLm1vZGVsLnNlbE1vZGUpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3RoaXMnLCAkKHRoaXMpLmNsb3Nlc3QoJy50aHVtYm5haWwnKSlcclxuXHRcdFx0XHRcdFx0JCh0aGlzKS5jbG9zZXN0KCcudGh1bWJuYWlsJykudG9nZ2xlQ2xhc3MoJ3NlbGVjdGVkJylcclxuXHJcblx0XHRcdFx0XHRcdGN0cmwuc2V0RGF0YSgnZmlsZVNlbGVjdGVkJywgZ2V0U2VsRmlsZXMoKS5sZW5ndGggIT0gMClcclxuXHRcdFx0XHRcdFx0cmV0dXJuXHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0dmFyIGRpck5hbWUgPSAkKHRoaXMpLmRhdGEoJ25hbWUnKVxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25Gb2xkZXInLCBkaXJOYW1lKVxyXG5cdFx0XHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxyXG5cdFx0XHRcdFx0bG9hZERhdGEoY3RybC5tb2RlbC5yb290RGlyICsgZGlyTmFtZSArICcvJylcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uQmFja0J0bjogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHR2YXIgc3BsaXQgPSBjdHJsLm1vZGVsLnJvb3REaXIuc3BsaXQoJy8nKVxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25CYWNrQnRuJywgc3BsaXQpXHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdHNwbGl0LnBvcCgpXHJcblx0XHRcdFx0XHRzcGxpdC5wb3AoKVxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdyb290RGlyJywgcm9vdERpcilcclxuXHRcdFx0XHRcdGxvYWREYXRhKHNwbGl0LmpvaW4oJy8nKSArICcvJylcclxuXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbkZpbGU6IGZ1bmN0aW9uKGV2KSB7XHJcblx0XHRcdFx0XHR2YXIgbmFtZSA9ICQodGhpcykuZGF0YSgnbmFtZScpXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdvblBpY3R1cmUnLCBuYW1lKVxyXG5cdFx0XHRcdFx0ZXYucHJldmVudERlZmF1bHQoKVxyXG5cdFx0XHRcdFx0Ly92YXIgZmlsZVBhdGggPSBmaWxlU3J2LmZpbGVVcmwocm9vdERpciArIG5hbWUpXHJcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdmaWxlUGF0aCcsIGZpbGVQYXRoKVxyXG5cdFx0XHRcdFx0aWYgKGN0cmwubW9kZWwuc2VsTW9kZSkge1xyXG5cdFx0XHRcdFx0XHQkKHRoaXMpLmNsb3Nlc3QoJy50aHVtYm5haWwnKS50b2dnbGVDbGFzcygnc2VsZWN0ZWQnKVxyXG5cdFx0XHRcdFx0XHRjdHJsLnNldERhdGEoJ2ZpbGVTZWxlY3RlZCcsIGdldFNlbEZpbGVzKCkubGVuZ3RoICE9IDApXHJcblx0XHRcdFx0XHRcdHJldHVyblxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWx0LnRyaWdnZXIoJ2ZpbGVDbGljaycsIHtuYW1lLCByb290RGlyOiBjdHJsLm1vZGVsLnJvb3REaXJ9KVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25Ub2dnbGVTZWxNb2RlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdGN0cmwuc2V0RGF0YSgnc2VsTW9kZScsICFjdHJsLm1vZGVsLnNlbE1vZGUpXHJcblx0XHRcdFx0XHRpZiAoIWN0cmwubW9kZWwuc2VsTW9kZSkge1xyXG5cdFx0XHRcdFx0XHRlbHQuZmluZCgnLnRodW1ibmFpbC5zZWxlY3RlZCcpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpXHJcblx0XHRcdFx0XHRcdGN0cmwuc2V0RGF0YSgnZmlsZVNlbGVjdGVkJywgZmFsc2UpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbkRlbGV0ZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHQkJC5zaG93Q29uZmlybShcIkFyZSB5b3Ugc3VyZSA/XCIsIFwiRGVsZXRlIGZpbGVzXCIsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHR2YXIgc2VsRmlsZSA9IGdldFNlbEZpbGVzKClcclxuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25EZWxldGUnLCBzZWxGaWxlKVxyXG5cdFx0XHRcdFx0XHRmaWxlU3J2LnJlbW92ZUZpbGVzKHNlbEZpbGUpXHJcblx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXHJcblx0XHRcdFx0XHRcdFx0bG9hZERhdGEoKVxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcclxuXHRcdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQocmVzcC5yZXNwb25zZVRleHQsICdFcnJvcicpXHJcblx0XHRcdFx0XHRcdH0pXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fSlcclxuXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbkNyZWF0ZUZvbGRlcjogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHR2YXIgcm9vdERpciA9IGN0cmwubW9kZWwucm9vdERpclxyXG5cdFx0XHRcdFx0JCQuc2hvd1Byb21wdCgnRm9sZGVyIG5hbWU6JywgJ05ldyBGb2xkZXInLCBmdW5jdGlvbihmb2xkZXJOYW1lKSB7XHJcblx0XHRcdFx0XHRcdGZpbGVTcnYubWtkaXIocm9vdERpciArIGZvbGRlck5hbWUpXHJcblx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXHJcblx0XHRcdFx0XHRcdFx0bG9hZERhdGEoKVxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcclxuXHRcdFx0XHRcdFx0XHQkJC5zaG93QWxlcnQocmVzcC5yZXNwb25zZVRleHQsICdFcnJvcicpXHJcblx0XHRcdFx0XHRcdH0pXHRcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRvbkN1dDogZnVuY3Rpb24oKSB7XHJcblxyXG5cdFx0XHRcdFx0Y29weSA9IGZhbHNlXHJcblxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnb25DdXQnLCBjdXRGaWxlcylcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtcclxuXHRcdFx0XHRcdFx0c2VsTW9kZTogZmFsc2UsXHJcblx0XHRcdFx0XHRcdGZpbGVTZWxlY3RlZDogZmFsc2UsXHJcblx0XHRcdFx0XHRcdGN1dEZpbGVzOiBnZXRTZWxGaWxlcygpLFxyXG5cdFx0XHRcdFx0XHRjdXREaXI6IGN0cmwubW9kZWwucm9vdERpclxyXG5cdFx0XHRcdFx0fSlcclxuXHJcblx0XHRcdFx0XHRlbHQuZmluZCgnLnRodW1ibmFpbC5zZWxlY3RlZCcpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpLmFkZENsYXNzKCdjdXRlZCcpXHJcblxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25Db3B5OiBmdW5jdGlvbigpIHtcclxuXHJcblx0XHRcdFx0XHRjb3B5ID0gdHJ1ZVxyXG5cclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uQ29weScsIGN1dEZpbGVzKVxyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRjdHJsLnNldERhdGEoe1xyXG5cdFx0XHRcdFx0XHRzZWxNb2RlOiBmYWxzZSxcclxuXHRcdFx0XHRcdFx0ZmlsZVNlbGVjdGVkOiBmYWxzZSxcclxuXHRcdFx0XHRcdFx0Y3V0RmlsZXM6IGdldFNlbEZpbGVzKCksXHJcblx0XHRcdFx0XHRcdGN1dERpcjogY3RybC5tb2RlbC5yb290RGlyXHJcblx0XHRcdFx0XHR9KVxyXG5cclxuXHRcdFx0XHRcdGVsdC5maW5kKCcudGh1bWJuYWlsLnNlbGVjdGVkJykucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkJykuYWRkQ2xhc3MoJ2N1dGVkJylcclxuXHRcdFx0XHR9LFxyXG5cclxuXHRcdFx0XHRvblBhc3RlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uUGFzdGUnKVxyXG5cdFx0XHRcdFx0dmFyIHtyb290RGlyLCBjdXRGaWxlc30gPSBjdHJsLm1vZGVsXHJcblx0XHRcdFx0XHR2YXIgcHJvbWlzZSA9IChjb3B5KSA/IGZpbGVTcnYuY29weUZpbGVzKGN1dEZpbGVzLCByb290RGlyKSA6IGZpbGVTcnYubW92ZUZpbGVzKGN1dEZpbGVzLCByb290RGlyKVxyXG5cdFx0XHRcdFx0Y29weSA9IGZhbHNlXHJcblx0XHRcdFx0XHRwcm9taXNlXHJcblx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcclxuXHRcdFx0XHRcdFx0Y3RybC5zZXREYXRhKHtjdXRGaWxlczogW119KVxyXG5cdFx0XHRcdFx0XHRsb2FkRGF0YSgpXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxyXG5cdFx0XHRcdFx0XHRjdHJsLnNldERhdGEoe2N1dEZpbGVzOiBbXX0pXHJcblx0XHRcdFx0XHRcdCQkLnNob3dBbGVydChyZXNwLnJlc3BvbnNlVGV4dCwgJ0Vycm9yJylcclxuXHRcdFx0XHRcdH0pXHRcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9uQ2FuY2VsU2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdGVsdC5maW5kKCcudGh1bWJuYWlsJykucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkIGN1dGVkJylcclxuXHRcdFx0XHRcdGN0cmwuc2V0RGF0YSh7XHJcblx0XHRcdFx0XHRcdGZpbGVTZWxlY3RlZDogZmFsc2UsXHJcblx0XHRcdFx0XHRcdGN1dEZpbGVzOiBbXVxyXG5cdFx0XHRcdFx0fSlcdFx0XHRcdFxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0b25JbXBvcnRGaWxlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uSW1wb3J0RmlsZScpXHJcblx0XHRcdFx0XHR2YXIgcm9vdERpciA9IGN0cmwubW9kZWwucm9vdERpclxyXG5cclxuXHRcdFx0XHRcdCQkLm9wZW5GaWxlRGlhbG9nKGZ1bmN0aW9uKGZpbGUpIHtcclxuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZmlsZVNpemUnLCBmaWxlLnNpemUgLyAxMDI0KVxyXG5cdFx0XHRcdFx0XHRpZiAoZmlsZS5zaXplID4gb3B0aW9ucy5tYXhVcGxvYWRTaXplKSB7XHJcblx0XHRcdFx0XHRcdFx0JCQuc2hvd0FsZXJ0KCdGaWxlIHRvbyBiaWcnLCAnRXJyb3InKVxyXG5cdFx0XHRcdFx0XHRcdHJldHVyblxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdCQkLnJlYWRGaWxlQXNEYXRhVVJMKGZpbGUsIGZ1bmN0aW9uKGRhdGFVUkwpIHtcclxuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdkYXRhVVJMJywgZGF0YVVSTClcclxuXHRcdFx0XHRcdFx0XHRmaWxlU3J2LnVwbG9hZEZpbGUoZGF0YVVSTCwgZmlsZS5uYW1lLCByb290RGlyKS50aGVuKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0bG9hZERhdGEoKVxyXG5cdFx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdyZXNwJywgcmVzcClcclxuXHRcdFx0XHRcdFx0XHRcdCQkLnNob3dBbGVydChyZXNwLnJlc3BvbnNlVGV4dCwgJ0Vycm9yJylcdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHRcdH0pXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gXHJcblx0XHR9KVxyXG5cclxuXHRcdGZ1bmN0aW9uIGxvYWREYXRhKHJvb3REaXIpIHtcclxuXHRcdFx0aWYgKHJvb3REaXIgPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0cm9vdERpciA9IGN0cmwubW9kZWwucm9vdERpclxyXG5cdFx0XHR9XHJcblx0XHRcdGZpbGVTcnYubGlzdChyb290RGlyLCBvcHRpb25zLmltYWdlT25seSkudGhlbihmdW5jdGlvbihmaWxlcykge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2ZpbGVzJywgZmlsZXMpXHJcblx0XHRcdFx0Y3RybC5zZXREYXRhKHtcclxuXHRcdFx0XHRcdHJvb3REaXIsXHJcblx0XHRcdFx0XHRmaWxlU2VsZWN0ZWQ6IGZhbHNlLFxyXG5cdFx0XHRcdFx0ZmlsZXM6IGZpbGVzXHJcblx0XHQvKlx0XHRcdFx0LmZpbHRlcihmdW5jdGlvbihmaWxlKSB7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuICFmaWxlLmlzRGlyXHJcblx0XHRcdFx0XHRcdH0pKi9cclxuXHRcdFx0XHRcdFx0Lm1hcChmdW5jdGlvbihmaWxlLCBpZHgpIHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgbmFtZSA9IGZpbGUudGl0bGVcclxuXHRcdFx0XHRcdFx0XHR2YXIgaXNEaXIgPSBmaWxlLmZvbGRlclxyXG5cdFx0XHRcdFx0XHRcdHZhciBpc0ltYWdlID0gJCQuaXNJbWFnZShuYW1lKVxyXG5cdFx0XHRcdFx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0XHRcdFx0XHRuYW1lLFxyXG5cdFx0XHRcdFx0XHRcdFx0c2l6ZTogJ1NpemUgOiAnICsgTWF0aC5mbG9vcihmaWxlLnNpemUvMTAyNCkgKyAnIEtvJyxcclxuXHRcdFx0XHRcdFx0XHRcdGltZ1VybDogIGlzRGlyID8gJycgOiBmaWxlU3J2LmZpbGVVcmwocm9vdERpciArIG5hbWUpLFxyXG5cdFx0XHRcdFx0XHRcdFx0aXNEaXIsXHJcblx0XHRcdFx0XHRcdFx0XHRpc0ltYWdlLCBcclxuXHRcdFx0XHRcdFx0XHRcdGlzRmlsZTogIWlzRGlyICYmICFpc0ltYWdlXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH0pXHRcdFxyXG5cdFx0fVxyXG5cclxuXHRcdGxvYWREYXRhKClcclxuXHJcblx0XHR0aGlzLmdldEZpbGVzID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiBjdHJsLm1vZGVsLmZpbGVzXHJcblx0XHR9XHJcblx0fVxyXG5cclxufSk7XHJcbiIsIihmdW5jdGlvbigpIHtcclxuXHJcbmZ1bmN0aW9uIGdldE5vZGVQYXRoKG5vZGUpIHtcclxuXHJcblx0dmFyIHBhdGggPSBub2RlLmdldFBhcmVudExpc3QoZmFsc2UsIHRydWUpLm1hcCgobm9kZSkgPT4gbm9kZS5rZXkgPT0gJ3Jvb3QnID8gJy8nIDogbm9kZS50aXRsZSlcclxuXHRyZXR1cm4gcGF0aC5qb2luKCcvJylcclxufVxyXG5cclxuJCQucmVnaXN0ZXJDb250cm9sRXgoJ0ZpbGVUcmVlQ29udHJvbCcsIHtcclxuXHRkZXBzOiBbJ0ZpbGVTZXJ2aWNlJ10sXHJcblx0aWZhY2U6ICdyZWZyZXNoKCk7Z2V0VmFsdWUoKScsXHJcblx0XG5cdGxpYjogJ2ZpbGUnLFxuaW5pdDogZnVuY3Rpb24oZWx0LCBvcHRpb25zLCBmaWxlU3J2KSB7XHJcblx0XHR2YXIgY3RybCA9ICQkLnZpZXdDb250cm9sbGVyKGVsdCwge1xyXG5cdFx0XHR0ZW1wbGF0ZTogXCI8ZGl2Plxcclxcblx0PGRpdiBibi1jb250cm9sPVxcXCJUcmVlQ29udHJvbFxcXCIgYm4tb3B0aW9ucz1cXFwidHJlZU9wdGlvbnNcXFwiIGJuLWlmYWNlPVxcXCJ0cmVlQ3RybFxcXCIgYm4tZXZlbnQ9XFxcImNvbnRleHRNZW51QWN0aW9uOiBvblRyZWVBY3Rpb25cXFwiPjwvZGl2PlxcclxcbjwvZGl2PlwiLFx0XHRcclxuXHRcdFx0ZGF0YToge1xyXG5cdFx0XHRcdHRyZWVPcHRpb25zOiB7XHJcblx0XHRcdFx0XHRzb3VyY2U6IFt7dGl0bGU6ICdIb21lJywgZm9sZGVyOiB0cnVlLCBsYXp5OiB0cnVlLCBrZXk6ICdyb290J31dLFxyXG5cclxuXHRcdFx0XHRcdGxhenlMb2FkOiBmdW5jdGlvbihldmVudCwgZGF0YSkge1xyXG5cdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZygnbGF6eUxvYWQnLCBkYXRhLm5vZGUua2V5KVxyXG5cdFx0XHRcdFx0XHR2YXIgcGF0aCA9IGdldE5vZGVQYXRoKGRhdGEubm9kZSlcclxuXHRcdFx0XHRcdFx0ZGF0YS5yZXN1bHQgPSBmaWxlU3J2Lmxpc3QocGF0aCwgZmFsc2UsIHRydWUpXHJcblxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGNvbnRleHRNZW51OiB7XHJcblx0XHRcdFx0XHRcdG1lbnU6IHtcclxuXHRcdFx0XHRcdFx0XHRuZXdGb2xkZXI6IHsnbmFtZSc6ICdOZXcgRm9sZGVyJ31cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHRcdFx0ZXZlbnRzOiB7XHJcblx0XHRcdFx0b25UcmVlQWN0aW9uOiBmdW5jdGlvbihub2RlLCBhY3Rpb24pIHtcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ29uVHJlZUFjdGlvbicsIG5vZGUudGl0bGUsIGFjdGlvbilcclxuXHRcdFx0XHRcdCQkLnNob3dQcm9tcHQoJ0ZvbGRlciBuYW1lJywgJ05ldyBGb2xkZXInLCBmdW5jdGlvbihmb2xkZXJOYW1lKSB7XHJcblx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHR2YXIgcGF0aCA9IGdldE5vZGVQYXRoKG5vZGUpXHJcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coJ2ZvbGRlck5hbWUnLCBmb2xkZXJOYW1lLCAncGF0aCcsIHBhdGgpXHJcblx0XHRcdFx0XHRcdGZpbGVTcnYubWtkaXIocGF0aCArICcvJyArIGZvbGRlck5hbWUpXHJcblx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygncmVzcCcsIHJlc3ApXHJcblx0XHRcdFx0XHRcdFx0bm9kZS5sb2FkKHRydWUpXHJcblx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ3Jlc3AnLCByZXNwKVxyXG5cdFx0XHRcdFx0XHRcdCQkLnNob3dBbGVydChyZXNwLnJlc3BvbnNlVGV4dCwgJ0Vycm9yJylcclxuXHRcdFx0XHRcdFx0fSlcdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cdFx0XHRcclxuXHRcdH0pXHJcblxyXG5cdFx0dGhpcy5nZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gZ2V0Tm9kZVBhdGgoY3RybC5zY29wZS50cmVlQ3RybC5nZXRBY3RpdmVOb2RlKCkpXHJcblx0XHR9LFxyXG5cclxuXHRcdHRoaXMucmVmcmVzaCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRjb25zdCByb290ID0gY3RybC5zY29wZS50cmVlQ3RybC5nZXRSb290Tm9kZSgpLmdldEZpcnN0Q2hpbGQoKVxyXG5cdFx0XHRpZiAocm9vdCkge1xyXG5cdFx0XHRcdHJvb3QubG9hZCh0cnVlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRcclxuXHR9XHJcblxyXG59KTtcclxuXHJcblxyXG59KSgpO1xyXG5cclxuXHJcblxyXG4iXX0=
