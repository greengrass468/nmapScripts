var databuffer = [{data:[[0,0],[1000,0]],label: 'dummy'}];
var datasets = {dummy:{data:[[0,0],[1000,0]],label: 'dummy'}};
var datasize = 1000;
var refsize = 1000;
//var zoomdatasize = 1000;
var datastart = 0;
var tracename = [];
var process = false;
var tracelist = ['{"MBUS":{"PulsePattern":8}}'];
//var digitalname = ['TOTO','TITI','TUTU','TATA','CUCU','CACA','GAGA','FIN'];
var digitalname = [];
var inited = 0;
var changed = false;
var cursors = [];
//var point_index = 0;
//var bus_oldpt = [];
var mbus = {};




	var enableChannel = function() {
				//console.log('enable channel',$(this)[0].id);
				var cursorname = $(this)[0].id;
				var img = $(this).find('img');
				var iscursor = false;
				//console.log(this);
				
				if (img.is(":visible")) {
					if(plot.getData().length > 1){
					//console.log('hide');
					img.hide();
						//console.log(plot.getCursors())
							$.each(plot.getCursors(),function(id,value){
								//console.log(id,cursorname);
								if(value.name.indexOf(cursorname) != -1){
									//console.log('remove cursor: ',value);
									removecursor(value);
									iscursor = true;
									return false;
								}
							});
						if(!iscursor){
							createPlot();
							cursors.forEach(function(curs){
								plot.addCursor(curs);
							});
							updateCursor();
						}
						//createPlot();
						//updateCursor();						
					}
				} else {
						//console.log('show');
						img.show();
						createPlot(); 
						cursors.forEach(function(curs){
							plot.addCursor(curs);
						});
						updateCursor();							
				}
						
	}
	
	
	
	// function to draw bus style for each point
	var bus = function (ctx, x, y, radius, shadow, series) {
		var datavalue = [];
		var bus_oldpt = [];
		var point_index;
		
				if(series.label.indexOf('_bus') == -1){
					datavalue = null;
					return;
				}else{
					datavalue = series.points.datavalue;
					bus_oldpt = series.points.bus_oldpt
					point_index = series.points.point_index;
					
					if(datavalue == null){
						return;
					}
					
					var ysize = radius;
					var size = series.points.lineWidth;
					strcolor = series.color;
					if($.isNumeric(strcolor)){strcolor = "rgb(100,100,100)"};
					
					var fillcolor;
					var text;
					
					if(bus_oldpt.length > 0 ){
						
						if(datavalue[point_index] != -1){
							fillcolor = strcolor.replace(")",",0.2)");
							fillcolor = fillcolor.replace("rgb(", "rgba(");
							
							var text = "0x" + ("00" +(Number(datavalue[point_index]).toString(16))).slice(-2).toUpperCase();
							console.log(text,point_index,datavalue,datavalue.length);
								if(text == '0xAN'){
									text = "??";
									fillcolor = "rgba(200,0,0,0.2)";
								}
								
						}else{
								fillcolor = "rgba(200,0,0,0.2)";
								text = "XX";
						}
					
					
						// draw canvas 
							
							//draw start < symbol
							
							bus_oldpt[1] = y;
							ctx.fillStyle = fillcolor;//"rgba(0,200,0,0.2)";
							ctx.beginPath();
							ctx.moveTo(bus_oldpt[0] + size, bus_oldpt[1] - ysize);
							ctx.lineTo(bus_oldpt[0], bus_oldpt[1]);
							ctx.lineTo(bus_oldpt[0] + size, bus_oldpt[1] + ysize);
							
							// draw end > symbol
							
							ctx.lineTo(x - size, y + ysize);
							ctx.lineTo(x, y);
							ctx.lineTo(x - size, y - ysize);
							ctx.lineTo(bus_oldpt[0] + size, bus_oldpt[1] - ysize);
							ctx.closePath();
							ctx.fill();
							ctx.font = "16px 'Arial'";
							ctx.fillStyle = "black";
							//var text = "0x" + ("00"+(Number(serie.data_value[point_index]).toString(16))).slice(-2).toUpperCase();
							var metrics = ctx.measureText(text).width /2;
							//console.log(metrics,x - bus_oldpt[0]);
								if(x - bus_oldpt[0] > metrics * 2 ){
									ctx.fillText(text, ((bus_oldpt[0] + x) /2) - metrics, y + 5 );
								}
						//}	
						point_index++;
					}
					
					if(point_index == series.data.length){
						point_index = 0;
						bus_oldpt = [];
					}else{
						series.points.bus_oldpt = [x,y];
					}
					
					series.points.point_index = point_index;
			
				}
	
	
	}	

	
	
	


$(function() {


splitbus = function(data,datastart){
	
	//console.log(data,tracelist);
	//var text = '{"MBUS":{"demod": 1,"state":3,"byte":8}}';
	$.each(tracelist, function(index,val){
		if(val.indexOf("MBUS") != -1){
			//console.log('MBUS detected',index,val,data.MBUS.value);
			var busformat = JSON.parse(val)['MBUS'];
			//console.log(Object.keys(busformat));
			var busdata = data.MBUS.value;
			if( busdata.length > 0){ 
			
				// if one point put end point
				if(busdata.length <= 2){
						busdata.push(datastart + datasize);
						busdata.push( busdata[1]); 
				}
				
	
				var bitindex = 0;
				$.each(busformat, function(key, value){
					//console.log('MBUS format',key, value);
					if(value == 1){
						data['DIGITAL_'+key] = {};
						data['DIGITAL_'+key].nbit = value;
						data['DIGITAL_'+key].firstbit = bitindex;
						var part = [];
						
							for(i = 0 ; i < busdata.length;i+=2){
								//var part = new Array(busdata[i]+1).join(busdata[i+1]);
								if(busdata[i+1] == -1)busdata[i+1] = 0;
									part.push(busdata[i])
									part.push((busdata[i+1] >>> bitindex) & (Math.pow(2, value)-1));
								//console.log('busdata >>>',busdata);
								
							}
							//part = part.concat(new Uint8Array(busdata[i]+1).join(Number(busdata[i+1])));
							//part = part.map(Number);
						bitindex += value;
						data['DIGITAL_'+key].value = part;
						//data['DIGITAL_'+key].value = new Uint8Array(1000);
						
					}else{
						data['BUS_'+key] = {};
						data['BUS_'+key].nbit = value;
						data['BUS_'+key].firstbit = bitindex;
						part = [];
						var prev = -1;
						var tmp;
						//console.log('busdata', key, busdata);
						
							for(i = 0 ; i < busdata.length;i+=2){
								
								if(busdata[i+1] == -1)busdata[i+1] = 0;
								
								tmp = ((busdata[i+1] >>> bitindex) & (Math.pow(2, value)-1));
									if(tmp != prev){
										part.push(busdata[i])
										part.push(((busdata[i+1] >>> bitindex) & (Math.pow(2, value)-1)));
										//console.log('busdata >>>',part);
										prev = tmp;
									}
								
							}
						
						bitindex += value;
						data['BUS_'+key].value = part;//busdata;//[0,-1]
						//console.log(data['BUS_'+key].value);
						
					}
					//bitindex++;
				});
				
			}
		}
	});


	
	
	
}




splitsignal = function(data,datastart){
	
		if(datasets['dummy'] && data != null){
			datasets = {};
		}
		
		if(data != null){
			var mask = 0x80;
			var alldata = plot.getData();
			if(datasize > 1000){
				$('#DOWNSAMPLED').text('yes');
			}else{
				$('#DOWNSAMPLED').text('no');
			}
			
			$.each(data, function(key, val) {
				var keytab = key.split('_');

				
				
				if(keytab[0] == 'BUS'){
					//console.log('split',data);
					changed = true;
					var not = [1,0];
					var prefix = keytab[1];
					var name = '';
					var a = 0;
	
					//for(a=7;a>= 0;a--){
					

						if(digitalname.length > 0 && digitalname[a] != ''){
							name = 	digitalname[a];
						}else{
							name = prefix+"_bus";
						}
						

						datasets[name]={
							label: name,
							lines: {
									show: false,
									lineWidth: 1
									},
							data: [],
							points: {
									show: true,
									datavalue: [],
									radius: 20,
									lineWidth: 2, // in pixels
									fillColor: 'rgba(200,0,0,0.2)',
									fill: false,
									symbol: bus,
									bus_oldpt: [],
									point_index: 0
									}
						};
						//datasets[name].label = name;
						
						var old = $.grep(alldata, function(v) {if(v.label === name) return v;})[0];
						
						if(old){
							//console.log(old);
							datasets[name].offset = old.offset;
						}
						old ={};
						//console.log(val.value);
						for(i = 0 ; i < val.value.length; i+=2){
								datasets[name].points.datavalue.push(val.value[i+1]);// y
								datasets[name].data.push([val.value[i],0]); // x,y position point
						};
						// add last point
								datasets[name].data.push([datastart + datasize,0]);
								datasets[name].points.datavalue.push(val.value[i-1]);
						//console.log('datavalue',name,datasets[name].data,datasets[name].points.datavalue);

						var exist = false;
						var index = null;
						$.each(alldata, function (key,data) {
							if(data.label == name){
								exist = true;
								index = key;
							}
							
						});
							
							//console.log('find',name ,alldata,exist);
							if(exist){
								alldata[index] = datasets[name];
								//console.log(alldata[index].points.datavalue);
							}else{
								//console.log(name,'not exist');
								alldata.push(datasets[name]);
							}
						
		
						
						//console.log(datasets[name]);
						mask = mask >> 1;
					//}
					//console.log(datasets[name]);
				}
				
				
				
				
			
				if(keytab[0] == 'DIGITAL'){
					changed = true;
					var not = [1,0];
					var prefix = keytab[1];
					var name = '';
					var nbit = 7;// default 8 bits digital
					var bitindex = val.firstbit;
					
					if(val.nbit){
						nbit = val.nbit -1;
							
					}
					
					for(a = nbit + bitindex ; a >= bitindex ;a--){

						if(digitalname.length > 0 && digitalname[a] != ''){
							name = 	digitalname[a];
						}else{
							name = prefix+a;
						}
						
						datasets[name]={['label']:"",['data']: []};
						datasets[name].label = name;
						datasets[name].data = [];
						
						var old = $.grep(alldata, function(v) {if(v.label === name) return v;})[0];
						
						if(old){
							//console.log(old);
							datasets[name].offset = old.offset;
						}
						old ={};
						// if bus mode
						if(val.nbit){
							//console.log('bus detected',val.value);
							for(i=0;i<val.value.length;i+=2){
								datasets[name].data.push([val.value[i],val.value[i+1]]);
							}
							//datasets[name].data = val.value;
							// set steps in datasets for this digital signal only
							datasets[name]['lines'] = {'steps': true};
						}else{
							if(datasize <= 1000){	
								for(i = datastart; i < (datastart + datasize);i++){
									//datasets[name].data.push([i,not[((val.value[i- datastart] & mask)>> a)]])
									datasets[name].data.push([i,((val.value[i- datastart] & mask)>> a)])
								}
							}else{
								for(i = 0; i < 2000;i+=2){
									//datasets[name].data.push([i,not[((val.value[i- datastart] & mask)>> a)]])
									datasets[name].data.push([val.value[i],((val.value[i+1] & mask)>> a)])
								}
							}
						}
						
						var index = 0;
						alldata.forEach(function (data) {
							if(data.label == name){
								alldata[index].data = datasets[name].data;
							}
							index++;
						});
						
						//console.log(mask,((val.value[i] & mask)&mask)>> a,val.value[i]);
						mask = mask >> 1;
					}
				
				}
				if(keytab[0] == 'ANALOG'){
					changed = true;
					datasets[keytab[1]]={['label']:"",['data']: []};
					datasets[keytab[1]].label = keytab[1];
					var old = $.grep(alldata, function(v) {if(v.label === keytab[1]) return v;})[0];
					
					if(old){
						//console.log(old.offset);
						datasets[keytab[1]].offset = old.offset;
					}
					old ={};
					if(datasize <= 1000){	
						for(i = datastart; i< datastart + datasize;i++){
								//datasets[keytab[1]].data.push([i,Math.abs(val.value[i- datastart])*-1])//Math.abs(num) * -1
								datasets[keytab[1]].data.push([i,val.value[i- datastart]])
							}
					}else{
						//console.log('zoomed',val.value);
						
						for(i = 0; i < 2000;i += 2){
							//datasets[name].data.push([i,not[((val.value[i- datastart] & mask)>> a)]])
								datasets[keytab[1]].data.push([val.value[i],val.value[i+1]])
							}
					}
					//console.log('dataset',datasets[keytab[1]].data);
						//console.log(datastart,datasets);
					var index = 0;
						alldata.forEach(function (data) {
							if(data.label == keytab[1]){
								alldata[index].data = datasets[keytab[1]].data;
							}
						index++;
						});
				}
				if(keytab[0] == 'REF'){
					databuffer = [];
					var buf = {};
					buf = {['label']:"",['data']: []};
					buf.label = 'REF';
					//buf['REF'].data = val;
					for(i = 0; i< val.value.length-1;i+=2){
							buf.data.push([val.value[i],val.value[i+1]]);
							refsize = val.value[i];
						}
					databuffer.push(buf);
					createbuffer();
				}
			
			});
			process = false;
		}
		
		if(changed == true || inited == 0){
				tracecolor();
					if(inited < 2){
						//tracecolor();
						createmenu();
						createPlot();
					}else{
						plot.getAxes().xaxis.options.panRange = [-refsize, refsize];
						plot.setData(alldata);
					}
					
				updateplot();
				changed = false;
				if(inited < 2)inited ++;
		}
		//console.log(datasets);
	return;
	}
	
	
	tracecolor = function(){
			// color for trace
				var i = 0;
			$.each(datasets, function(key, val) {
				val.color = i;
				++i;
				//console.log(key,val);
			
			});
	}
	
	
	createmenu = function(){
	   // create menu checkboxes 
		$("#lines_tab").empty();
		var choiceContainer = $("#lines_tab");
		$.each(datasets, function(key, val) {	
			choiceContainer.append('<div class="col-xs-12 option-content">'+
									'<div class="col-xs-3 option-content no-lr-padding">'+
										'<div class="right-menu-option enable-ch" id="id' + key + '"><img src="img/check.png" /></div>'+
									'</div>'+
									'<div class="col-xs-9 option-content no-lr-padding">'+
										'<div class="right-menu-option">'+
											'<input type="text" class="ch-name-inp form-control no-up-down dropdown-menu-decoder" maxlength="4" placeholder="'+ val.label +'" id="id'+ key +'" />'+
										'</div>'+
									'</div>'+
								'</div>'
									);
		});								
		$('.enable-ch').click(enableChannel);
	}
});
