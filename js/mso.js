var plot;
var plotbuffer;
$(function () {
	
var i = 0;
var cursors_old;
var movecursor;
var bmovecursor;
var old_xmin = 0;
var offset = 0;
var dir;
var yindex;
var latestPosition =[];
var stack = true;
var fine = false;
var cbuffersize;
var zoom = 1;
var splited = [];
var xmin = 0;
var xmax = 1000;


	
	updateCursor = function(n){
	//console.log("latestposition",latestPosition,n);
	var index = 0;

		//console.log(latestPosition)	;
		latestPosition.forEach(function (pos) {
			
			var res = String.fromCharCode(65 + index) + ' ';
			var cursor = plot.getCursors()[index];
			var buffercursor = plotbuffer.getCursors()[index+1];
			//console.log(cursor);
			cursor.position = {};
			cursor.name = res + convertTime((pos.x *1000) * samplerate);
			cursor.position = {x: pos.x, y: pos.y};
			
			//  update clone cursor on buffer graph
			buffercursor.position = {};
			buffercursor.position = {x: pos.x, y: pos.y};
			plotbuffer.setupGrid();
			plotbuffer.draw();
			
			index++;
		});	
		//attachcursor();

	}
	
	set_data = function(id,posy,dir){
		var index = 0;
		dir = dir;
		offset = plot.getAxes().yaxis.c2p(posy);
		var alldata = plot.getData();
		//console.log('datasets',datasets,id);
		var origin_data = datasets[id].data[0];
		offset = offset - origin_data[1];
			//console.log(id,origin_data,offset)
				alldata.forEach(function (data) {
					if(data.label == id){
						alldata[index].offset = offset;
					}
					index++;
				});
				//console.log('plot set data');
				plot.setData(alldata);
				plot.draw();
				
	}
	
	data_block = function(){
		
			//console.log('request data block',datastart,datasize)

			
			if(datastart + datasize > refsize){
					datastart = refsize - datasize;
					//console.log('end oveflow',datastart,datasize)
			}

			if(datastart < 0){
					datastart = 0;
					//console.log('start overflow',datastart,datasize);
			}
			
			// request ws the new trace block from datastart
			// first set param datastart
			// and server send 1000 points trace block
			if(process == false){
				var local = {};
				local['DATASTART'] = {value: datastart};
				local['DATASIZE'] = {value: datasize};
				ws.send(JSON.stringify({parameters: local}));
				local = {};
			}
			
	}
	
	updateplot = function(){
			//console.log('update plot',datastart,datasize);
			//console.log(datasets);
			xmin = datastart;
			xmax = datastart + datasize;
			
			plot.getAxes().xaxis.options.min = 	xmin;
			plot.getAxes().xaxis.options.max = 	xmax;
			
			plot.setupGrid();
			plot.draw();
			ypos_legends();
			//if(zoomdatasize <= 1000){
			//$("#SIGNAL_PART").text('Signal start: '+datastart +', Signal size: '+datasize+' pts');
			//}else{
			$("#SIGNAL_PART").text('Signal start: '+datastart +', Signal size: '+datasize+' pts');	
			//}
			updatebufcursor();
			process = false;
			//console.log('datasets',datasets);
	}
	
	nFormatter = function(num, digits) {
		  var si = [
			{ value: 1E18, symbol: "E" },
			{ value: 1E15, symbol: "P" },
			{ value: 1E12, symbol: "T" },
			{ value: 1E9,  symbol: "G" },
			{ value: 1E6,  symbol: "M" },
			{ value: 1E3,  symbol: "k" }
		  ], rx = /\.0+$|(\.[0-9]*[1-9])0+$/, i;
		  for (i = 0; i < si.length; i++) {
			if (num >= si[i].value) {
			  return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
			}
		  }
		  return num.toFixed(digits).replace(rx, "$1");
	}
	
	$('#SAMPLE_RATE').text(nFormatter(1/samplerate,2));	
	$("#SIGNAL_PART").text('0');
	
	convertTime = function(t) {
	//console.log(t);
        var abs_t = Math.abs(t);
        var unit = 'ms';

        if (abs_t >= 1000) {
            t = t / 1000;
            unit = 's';
        } else if (abs_t >= 1) {
            t = t * 1;
            unit = 'ms';
        } else if (abs_t >= 0.001) {
            t = t * 1000;
            unit = 'us';
        } else if (abs_t >= 0.000001) {
            t = t * 1000000;
            unit = ' ns';
        }

        return +(t.toFixed(3)) + ' ' + unit;
    };
	
    
	
	createPlot = function() {
        var data = [];
		//get_datasets();
		$(".legend").remove();
		yindex = 0; // for offset y
		var list = $('#lines_tab .enable-ch');
		//var tmp = [];
		list.each(function (elem) {

			if (list[yindex].firstChild.style.display != 'none'){
				var key = $('#lines_tab input')[yindex].placeholder;
				
                data.push(datasets[key]);

			}
			yindex++;
		});
		
		//console.log('data',data,'datasets',datasets);
		
        if (data.length > 0){
		//console.log("create graph",datasets,data);
		
		// if exist destroy table
		if(document.getElementById('table')){
		var table = document.getElementById('table');
		table.parentNode.removeChild(table);
		}
		//console.log(data);
        plot = $.plot($("#graphs"), data,{
			series: {
					stack: stack, 
					offset: 0,
					shadowSize: 0
					//,downsample: { threshold: 0} 	
					},
            lines: {
                    show: true,
                    lineWidth: 1
                    },
			cursors:[],		
			shadowSize: 0,		
			legend: {
                    show: true,
                    noColumns: 1, // number of colums in legend table
                    labelFormatter: null, // fn: string -> string
                    labelBoxBorderColor: "#ccc", // border color for the little label boxes
                    container: null, // container (as jQuery object) to put legend in, null means default on top of graph
                    //position: "nw", // position of default legend container within plot
                    margin: -50, // distance from grid edge to default legend container within plot
                    backgroundColor: null, // null means auto-detect
                    backgroundOpacity: 0 // set to 0 to avoid background
                },
                //yaxis: {
				//		min: 0,
				//		show: false	
				//		},
                //xaxis: { tickDecimals: 0 }
				xaxis: {
					min: xmin,
					zoomRange: [0.1, 1000],//[-1024, 1024],//false,//[0.1, 10],
					panRange: [0, 1000],
					//tickSize: 100,
					//color: '#f4f142',
					//tickColor: '#f4f142',
					tickFormatter: function(val, axis) {
							return convertTime((val*1000) * samplerate);
					},
					max: xmax
				},
				yaxis: {
					show: false,
					//tickFormatter: function(val, axis) {
					//console.log(document);
					//		return $('.ch_RF').selector.substring(4);
					//},
					//transform: function (v) { return -v; },  
					//inverseTransform: function (v) { return -v; },  
					zoomRange:false,//[-50, 50], //[0.1, 10],
					panRange: [-100, 100]//[-10, 10]
				},
				grid: {
					hoverable: true,
					//color: "#999",
					//color: '#f4f142',
					autoHighlight: true
				},
				zoom: {
					interactive: false
				},
				//crosshair: {
				//	mode: "x" 
				//	},
				selection: { 
					mode: "x" 
					},
				pan: {
					interactive: true
				}
				});
			
				
			if((plot.getOptions().legend.show) == true){
			place_legend();
			convert_legend();
			}
			
			//createcursor();
			updateplot();
			updatetimescale();
		}
    }
	
	// buffer graphs
	$("#graphs-buffer").attr("style", "position: absolute; top: -11px; height: 60px; z-index: 10;");//width: 1285px;
	//var databuffer = [];
	
createbuffer = function(){
	// autosize y axis REF signal for signal 0 -> 1v
	var tmp = [];
	for(i = 0 ; i < databuffer[0].data.length;i++){
		//console.log(databuffer[0].data[i]);
			tmp.push(databuffer[0].data[i][1]);
	}
	var ymax = Math.max(...tmp)+0.5;
	var ymin = Math.min(...tmp)-1;

	plotbuffer = $.plot($("#graphs-buffer"),databuffer ,{
		series: {
				stack: null,
				offset: 0,	
				},
		legend: {
                show: false
				},				
		lines: {
                show: true,
				lineWidth: 1
                    },
		xaxis: {
				show: false,
				max: refsize
		},
		yaxis: {
				show: false,
				max: ymax,
				min: ymin
		},
		grid: {
				color: '#343433'
				},
		cursors: [{
				name: "buffer",
				mouseGrabMargin: 2,
				lineWidth: 10,
				mode: 'x',
				color: "rgba(0,255,0,0.5)",
				showIntersections: false,
				showLabel: false,
				fontSize: '14px',
				symbol: 'none',
				//showValuesRelativeToSeries: 0,
				position: {
						x: 0,
						y: 0
						}
				}]
		
	});
	plotbuffer.setupGrid();
	plotbuffer.draw();
}	
	
	convert_legend = function(){
	//$('table').appendTo($('body'));
	//$('legend').appendTo($('body'));
	//$(".legend").remove(); 	
		$('table').replaceWith( $('table').html()
		   .replace(/<tbody/gi, "<div id='table'")
		   .replace(/<tr/gi, "<div id =''")
		   .replace(/<\/tr>/gi, "</div>")
		   .replace(/<td/gi, "<div")//span
		   .replace(/<\/td>/gi, "</div>")//span
		   .replace(/<\/tbody/gi, "<\/div")
			);
		var list = $("#table").children();
		
		for( i = 0; i < list.length; i++ ){
			var txt = list[i].getElementsByClassName("legendLabel")[0].innerText;
			/*
				if(txt.indexOf("_bus") != -1){
					txt = txt.substring(0,txt.indexOf("_bus"));
				}
				*/
			//console.log('new label',txt);
			$(list[i]).attr("id", "ch_"+txt);
			$(list[i]).attr("class", "trace_label draggable");
			$(list[i]).attr("style", "position: absolute;");
			$('.legend').append($(list[i]));
			
			$( "#ch_"+txt ).draggable({
							axis: "y",
							start: function (event, ui) {
								//console.log("start drag");
								},
							drag: function (event, ui) {
									//bus_oldpt[0] = 0;
									//console.log("drag",ui.helper.attr("id").substring(3),"to ",ui.position.top);
									//console.log(ui);
									var ypos = ui.position.top ;//- ui.originalPosition.top ;
									var dir = '-';
									if(ui.position.top > ui.originalPosition.top){
									dir = '+';
									}
									var id = ui.helper.attr("id").substring(3);
											//console.log('id',id);
											set_data(id,ypos,dir);
									},
							stop: function (event, ui) {
								//console.log("stop drag");
								}
							});
			
		}
		
		$('#graphs_holder').append($('.legend'));
		//$('.legend').attr("style", "position: absolute; top: 60px; left: 10px; height: 300px;width: 100px;z-index: -1;");
		$('.legend').attr("style", "width: 100px; height: "+ $('#graphs').height() +"px; z-index: 10;position: absolute; top: "+ $('#graphs').position().top +"px;");
		//$('#legend').attr("style", "height: "+ ggh +"; top: "+ $('#graphs').position().top +";");
		$('#legend').remove('#table');
		
		// position of each legend to y of first point
		ypos_legends();
		
		// disable flot legend generation
		plot.getOptions().legend.show = false;
	}
	
	ypos_legends = function(){
		// position of each legend to y of first point
		$.each(plot.getData(), function(key, val) {
			//console.log(key,val);
			var label = val.label;
			var points = plot.getData()[key];
			//console.log(points);
			var tmp = [];
			for(i=1;i< points.datapoints.points.length;i+=2){
				
				tmp.push(points.datapoints.points[i]);
			}
			var minindex = Math.min(...tmp);
			//var maxindex = Math.max(...tmp);
			//var index = (Math.max(maxindex, minindex) - Math.min(maxindex, minindex)) /2;
			tmp = null;
			
			var k = key;
			//var pos = points.yaxis.p2c(points.datapoints.points[1]);
			var pos = points.yaxis.p2c(minindex);
			//console.log('pos',k,pos,points,points.datapoints.points[1]); 
			//document.getElementById("ch_"+label).setAttribute  
			/*
			if(label.indexOf("_bus" != -1)){
				label = label.substring(0,label.indexOf("_bus"));
			}
			*/
			$("#ch_"+label).attr("style", "position: absolute; top: "+pos+"px;");
		});
	
	}
	
	// place and move legend
	place_legend = function(){
	//var legend = $('table');
	//var legend = document.getElementsByClassName("legend")[0].firstChild;// legend table
		//legend.setAttribute("style", "position: absolute; top: 0; left: -10px; height: 300px;width: 100px");
		$('table').attr("style", "position: absolute; top: 0; left: -10px; height: 300px;width: 100px")
	}
	
/*	
		$(document).keypress(function(event){
			//console.log(String.fromCharCode(event.which));
			switch(String.fromCharCode(event.which)) {
			case "x":
				
				break;
			case "y":
				
				break;
				
			case "c":
			
				break;	
				
			default:
				return;
			} 	
			plot.setupGrid();
			plot.draw();
		}); 

*/		

		    // Exits from editing mode
		exitEditing = function(noclose) {
			$('.dialog:visible').hide();
			$('#right_menu').show();
		};
		
		$('#CURSOR_ADD').click(function() {
			
			var cname = String.fromCharCode(65 + cursors.length) + ' ';//'cursor'+cursors.length;
			var color;
			var strcolor = 'rgba(';
			var index=0;
	
			$.each(lookupColors,function(key,val){
				
				if(index == (cursors.length + 4)){
					color = key;
					val.forEach(function(num){
						strcolor += num +', ';
					});
					//strcolor += '0.5)';
					strcolor += ')';
					return false;
				}
	
				index++;
			});
			//var ypos = $('#graphs')[0].offsetWidth
			var color = color;//'#666';//cursors.length;
			var curoffset = latestPosition.length * 50;
			var pos = ((plot.getAxes().xaxis.max - plot.getAxes().xaxis.min)/2)+curoffset + plot.getAxes().xaxis.min;
			
			var curs ={
						show: true,
						name: cname,
						labelcolor: 'black',
						labelbackground: 'white',//color,
						mode: 'x',
						mouseGrabMargin: 2,
						color: color,
						showIntersections: false,
						//snapToPlot: 0,
						showLabel: true,
						fontSize: '14px',
						symbol: 'none',
						//showValuesRelativeToSeries: 0,
						position: {
							x: pos,
							y: plot.getAxes().yaxis.max - latestPosition.length
							}
					};
			cursors.push(curs);
				//cursors.forEach(function(curs){
			plot.addCursor(curs);
			curs.showLabel =  false;
			curs.movable = false;
			plotbuffer.addCursor(curs);
			//console.log(plot.getCursors());
				//});	
			latestPosition.push({x:pos,y:plot.getAxes().yaxis.max - latestPosition.length});
			updateCursor(2);	
			//$('#cursor-info').show();	
		});
		

		removecursor = function(cursor){
			//console.log('removecursor',cursor);
			//console.log(latestPosition, cursors);
			var index = 0;
			var pos = -1;
					
			cursors.forEach(function(curs){
				//console.log('elem',cursor,curs);
					//var name = curs.name.split(' ')[0];
					//if(curs.name == cursor){
					if(cursor.name.indexOf(curs.name) != -1){
						//console.log('found',cursor,curs,index);
						//console.log(plot.getCursors().indexOf(cursor));
						plot.removeCursor(cursor);
						
						plotbuffer.getCursors().splice(index +1,1); 
						plotbuffer.setupGrid();
						plotbuffer.draw();
						
						//plot.getCursors().splice(index + 1,1)
						pos = index;
					}
				index++;
			});
			//remove cursor and position
				//console.log(pos);	
			if(pos != -1)	{
				cursors.splice(pos,1);
				latestPosition.splice(pos,1);
				//console.log(latestPosition, cursors);
				//setTimeout(function() { OSC.checkAndShowArrows(); }, 500);
				//updateCursor(3);
				setTimeout(cursorremovemenu(),100);
				//cursorremovemenu();
				//$( "#cursor_remove" ).hide();
				
				if(cursors.length == 0){
				$('#cursor-info').hide();
				}
			}
		}
		
		
		cursorremovemenu = function(){
			
			$( "#cursor_remove" ).empty();
			var rcursors = plot.getCursors();
			var list = [];
			var index =0;
			/*
			rcursors.forEach(function(curs){
				//console.log(cursor);
				res = String.fromCharCode(65 + index) + ' ';
				list.push('cursor' + index + ': ' + rcursors[index].name);
				index++;
			});
			*/
			//console.log(list);
			
			  // create remove menu checkboxes 
			var cursorremove = $("#cursor_remove");
			index = 0;
				rcursors.forEach(function(key) {
					var name = rcursors[index].name	
					//var res = String.fromCharCode(65 + index) + ' ';
					var res = rcursors[index].name.split(' ')[0]+' ';
						//console.log('new id list',res);
						cursorremove.append('<div class="col-xs-12 option-content">'+
												'<div class="col-xs-3 option-content no-lr-padding">'+
													'<div class="right-menu-option enable-ch" id="' + res + '"><img src="img/check.png" /></div>'+
												'</div>'+
												'<div class="col-xs-9 option-content no-lr-padding">'+
													'<div class="right-menu-option">'+
														'<input type="text" class="ch-name-inp form-control no-up-down dropdown-menu-decoder" maxlength="8" placeholder="'+ name +'" id="'+ res +' style="color:blue;"/>'+
													'</div>'+
												'</div>'+
											'</div>'
												);
																		
						//var elem = document.getElementById('cursor' + index); 						
						//elem.addEventListener('click',function(){deletecursor('cursor' + index)},true);						
						index++;						
				});							
			$('.enable-ch').click(enableChannel);							
			$('#cursor_remove').show();
		}
		
		
		$('#CURSOR_REMOVE').click(function() {
				cursorremovemenu();
		});
		
		
		
		
		$('.close-dialog').on('click', function() {
        exitEditing();
		});
		
		
		
		$('.enable-ch').click(enableChannel);
		
		
		
		$('.edit-mode').on('click', function() {
			//OSC.state.editing = true;
			$('#right_menu').hide();
			$('#' + $(this).attr('id') + '_dialog').show();
			//console.log('clicked:',$(this).attr('id'));
			//if($(this).attr('id') == 'cursor_remove'){ 
			//	removecursor($(this));
			//}
		});
		
		
		$('.menu-btn').on('click', function() {
			$('#right_menu .menu-btn').not(this).removeClass('active');
			if (!$(this).hasClass('active')){
				//console.log("active",this);
				//OSC.state.sel_sig_name = $(this).data('signal');
			}else{
				//console.log("else",this);
				//OSC.state.sel_sig_name = null;
			//$('.y-offset-arrow').css('z-index', 10);
			//$('#' + OSC.state.sel_sig_name + '_offset_arrow').css('z-index', 11);
			}
		});
		
		$('#resetx').on('click', function() {
			datastart = 0;
			datasize = 	refsize;
			data_block();
			updateplot();
			updatebufcursor();
		});
		
		$('#resety').on('click', function() {
			plot.getAxes().yaxis.options.min = 	null;
			plot.getAxes().yaxis.options.max = 	null;
			
			plot.setupGrid();
			plot.draw();
			ypos_legends();
		});
		
		
		$( "#graphs" ).dblclick(function(ev,elem) {
			//console.log('double click',ev,elem,datastart,datasize);
			// zoom center at point
			var downratio = fine == false ? 0.5 : 0.9;
			datasize = Math.round(datasize * downratio);
			
			var point = Math.round(plot.getAxes().xaxis.c2p(ev.clientX - 110));
			//var index = plot.getData()[0].data[point];
			datastart = point - (datasize/2);
			//console.log('startdata',datastart,point,datasize);
			data_block();
			
			setTimeout(function() { 
			plot.getAxes().xaxis.options.min = 	null;
			plot.getAxes().xaxis.options.max = 	null;
			plot.setupGrid();
			plot.draw();
			ypos_legends();
			 }, 1000);
		
		});
		
		
		attachcursor = function(){
			plot.getAxes().xaxis.min = Math.round(plot.getAxes().xaxis.min);
			var axes = plot.getAxes();
			var offset = Math.abs(axes.xaxis.min) - Math.abs(old_xmin);
			var index = 0;
			plot.getCursors().forEach(function (curs) {
					//console.log(pos);
					posx = curs.position.x;
					//console.log('cursor pos',posx, 'xmin',axes.xaxis.min, 'new pos',posx - offset,'offset',offset,'old',old_xmin );
					plot.setCursor(curs , {position: {x: posx, y: axes.yaxis.max - index}});
					//console.log(plot.getCursors());
					index++;
				});
			old_xmin = axes.xaxis.min;				
		}
	
		$("#graphs").bind("plotpan", function (event, plot) {
			//console.log(event);
			datastart = Math.round(plot.getAxes().xaxis.min);
			//console.log(datastart,datasize);
			data_block();
			attachcursor();
			updatebufcursor();			
			ypos_legends();
		});

		updatebufcursor = function(){
			//console.log('buffer cursor',datastart,datasize)
				var pixpoint = ($("#graphs-buffer")[0].clientWidth / refsize);
				var cursorlinesize = pixpoint * datasize;
				
					if(datastart + datasize > refsize){
						datastart = refsize - datasize;
						//console.log('end oveflow',datastart,datasize)
					}
					
					if(datastart < 0){
						datastart = 0;
						//console.log('start overflow',datastart,datasize);
					}
					
					// buffer cursor size and color
					plotbuffer.getCursors()[0].lineWidth = cursorlinesize;
					plotbuffer.getCursors()[0].mouseGrabMargin = cursorlinesize/2;
						if(datasize > 1000){
							plotbuffer.getCursors()[0].color = "rgba(255,0,0,0.5)";//red
						}else{
							plotbuffer.getCursors()[0].color = "rgba(0,255,0,0.5)";//green	
						}
					plotbuffer.getCursors()[0].position = {};
					plotbuffer.getCursors()[0].position['x'] = datastart + (datasize/2);
					plotbuffer.getCursors()[0].position['y'] = 0;
					
					plotbuffer.setupGrid();
					plotbuffer.draw();
		}	
		
		
		updatetimescale = function(){
			var axes = plot.getAxes();
			var timescale = convertTime(((axes.xaxis.ticks[1].v - axes.xaxis.ticks[0].v) *1000)*samplerate);
			$('#TIME_SCALE').text(timescale);
			
		}

		
		$("#graphs").bind("plotzoom", function (event, plot) {
			updatetimescale();
			/*
			datastart = Math.round(plot.getAxes().xaxis.min);
			data_block();
			*/
			attachcursor();
			ypos_legends();
		});		
		
		
		clearCursorDragmode = function(){
		
			plot.getCursors().forEach(function (curs) {
					delete curs.dragmode;
					});
		}
		
				// activate cursor update only if mouse enter
		$("#graphs-buffer").bind("cursorupdatesx", function (event, cursormove) {
		bmovecursor = cursormove;
		});
		
		$("#graphs-buffer").bind("cursorupdates", function (event, cursordata) {
			if(bmovecursor){
			
			if(cursordata['0'].x > refsize - (datasize/2)){
				cursordata['0'].x = refsize - (datasize/2);
			}	
			datastart = Math.round(cursordata['0'].x) - (datasize/2);
			data_block();
			//attachcursor();	
			//updateCursor()			
			//ypos_legends();
			}
		});
		
		// activate cursor update only if mouse enter
		$("#graphs").bind("cursorupdatesx", function (event, cursormove) {
		movecursor = cursormove;
		});
		
		$("#graphs").bind("cursorupdates", function (event, cursordata) {
			if(movecursor && !bmovecursor){
				var index = 0;
				var axes = plot.getAxes();
				//latestPosition = [];
				//console.log('cursordata',cursordata);
				$('#cursor-info').show();	
				cursordata.forEach(function (cursor) {
					//console.log(cursor.cursor);
					if(cursor.target.selected){
						latestPosition[index] = ({x: Math.round(cursor.x), y: axes.yaxis.max - index});
					}	
					if(cursor.cursor.indexOf('A ') != -1){
						$('#CURSOR_A').text(convertTime((Math.round(cursor.x)*1000) * samplerate));
					}		

					if(cursor.cursor.indexOf('B ') != -1){
						$('#CURSOR_B').text(convertTime((Math.round(cursor.x)*1000) * samplerate));
						var x0 = latestPosition[0].x
						var x1 = latestPosition[1].x
						//console.log((x1-x0)*1000 * samplerate);
						$('#CURSOR_DELTA').text(convertTime((x1-x0)*1000 * samplerate) +" "+ nFormatter(1/((x1-x0) * samplerate), 3)+"Hz");
					}						
				index++;						
				});
				updateCursor(1);
			}
		});


	
	changezoom = function(targetid){
		var axes = plot.getAxes();
		var upratio = fine == false ? 2 : 1.1;
		var downratio = fine == false ? 0.5 : 0.9;
		switch(targetid) {
			case "jtk_up":
				axes.yaxis.options.min = axes.yaxis.min * downratio;
				axes.yaxis.options.max = axes.yaxis.max * downratio; 
				break;
			case "jtk_down":
				axes.yaxis.options.min = axes.yaxis.min * upratio;
				axes.yaxis.options.max = axes.yaxis.max * upratio; 	
				break;
			case "jtk_left":
				//axes.xaxis.options.min = axes.xaxis.min * upratio;
				//axes.xaxis.options.max = axes.xaxis.max * upratio;
				
				datasize = Math.round(datasize * upratio);
				if(datasize > refsize){
					datasize = refsize;
					datastart = 0;
				}
				updatebufcursor();
				data_block();
				
				break;
			case "jtk_right":
				//axes.xaxis.options.min = axes.xaxis.min * downratio;
				//axes.xaxis.options.max = axes.xaxis.max * downratio; 
	
				if(datasize > 10){
				datasize = Math.round(datasize * downratio);
				updatebufcursor();
				data_block();
				}
				break;		
			default:
				return;
			} 
		plot.setupGrid();	
		plot.draw();
		//data_block();	
		ypos_legends();
		updatetimescale();
		
	}
	

    // Joystick events
    $('#jtk_up').on('mousedown touchstart', function() {
        $('#jtk_btns').attr('src', 'img/node_up.png');
    });
    $('#jtk_left').on('mousedown touchstart', function() {
        $('#jtk_btns').attr('src', 'img/node_left.png');
    });
    $('#jtk_right').on('mousedown touchstart', function() {
        $('#jtk_btns').attr('src', 'img/node_right.png');
    });
    $('#jtk_down').on('mousedown touchstart', function() {
        $('#jtk_btns').attr('src', 'img/node_down.png');
    });
	
	//  $('#jtk_fine').on('click touchstart', function(ev){
    $('#jtk_fine').on('click', function(ev) {
        var img = $('#jtk_fine');

        if (img.attr('src') == 'img/fine.png') {
            img.attr('src', 'img/fine_active.png');
            fine = true;
        } else {
            img.attr('src', 'img/fine.png');
            fine = false;
        }
        ev.preventDefault();
        ev.stopPropagation();
    });
	
	$(document).on('mouseup touchend', function() {
        $('#jtk_btns').attr('src', 'img/node_fine.png');
    });

    //  $('#jtk_up, #jtk_down').on('click touchstart', function(ev) {
    $('#jtk_up, #jtk_down, #jtk_left, #jtk_right').on('click', function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
		//console.log(ev.target.id);
		changezoom(ev.target.id);
        
    });
		
		
$(window).resize(function() {
	    var window_width = window.innerWidth;
        var window_height = window.innerHeight;
        if (window_width > 768 && window_height > 580) {
            var global_width = window_width - 30,
                global_height = global_width / 1.77885;
            if (window_height < global_height) {
                global_height = window_height - 70 * 1.77885;
                global_width = global_height * 1.77885;
            }

            $('#global_container').css('width', global_width - 10);
            $('#global_container').css('height', global_height - 90);
			$('#main').css('height', global_height - 90);
			$('#graphs').css('width',global_width - 290);
			$('#buffer').css('width',global_width - 310);
			$('#graphs').css('height',global_height - 230);
			$('#graphs-buffer').css('width',global_width - 310);
			$('#graphs').css('left', 100);
			//$('#body').css('overflow', 'auto');
		}
		createbuffer();
		createPlot();
 }).resize();		
	
		
		
	splitsignal(null,datastart); // init graph
    //createPlot();
	//$(window).resize();
	//add_cursors();
	startApp();
	
});