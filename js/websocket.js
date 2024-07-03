var samplerate = 1/125000000;//8E-9; //125MHz

$(function() {
	
	var app_id = 'HFLab';
	app_url = '/bazaar?start=' + app_id + '?' + location.search.substr(1);
    socket_url = 'ws://' + window.location.hostname + ':9002';
	
	
	/*
	//var start_app_url = (config.server_ip.length ? 'http://' + config.server_ip : '') + '/bazaar?start=' + config.app_id + '?' + location.search.substr(1);
    var start_app_url = window.location.origin + '/bazaar?start=' + app_id;
    var stop_app_url = window.location.origin + '/bazaar?stop=' + app_id;
	var socket_url = 'ws://' + window.location.host + '/wss';
	//var socket_url = "ws://localhost:6123"; // labview server
	*/
	
	var socket_opened = false;
	var unexpectedClose = true;
	var getref = true;
	
	
	
	    // Starts the application on server
    startApp = function() {
        // Reset dropdown protocol_selector (this is fix for Firefox)
        $('#protocol_selector').prop('selectedIndex', 0);

        $.get(app_url)
			
            .done(function(dresult) {
                if (dresult.status == 'OK') {
                    connectWebSocket();
                } else if (dresult.status == 'ERROR') {
                    console.log(dresult.reason ? dresult.reason : 'Could not start the application (ERR1)');
                    startApp();
                } else {
                    console.log('Could not start the application (ERR2)');
                    startApp();
                }
            })
            .fail(function() {
                console.log('Could not start the application (ERR3)');
                startApp();
            });

    };
    
    convertUnpacked = function(array) {
        var CHUNK_SIZE = 0x8000; // arbitrary number here, not too small, not too big
        var index = 0;
        var length = array.length;
        var result = '';
        var slice;
        while (index < length) {
            slice = Array.prototype.slice.call( array, index, Math.min(index + CHUNK_SIZE, length) );
            //slice = array.slice(index, Math.min(index + CHUNK_SIZE, length)); // `Math.min` is not really necessary here I think
            result += String.fromCharCode.apply(null, slice);
            index += CHUNK_SIZE;
        }
        return result;
    }

	
	
	connectWebSocket = function() {
        if (window.WebSocket) {
            ws = new WebSocket(socket_url);
            ws.binaryType = "arraybuffer";
        } else if (window.MozWebSocket) {
            ws = new MozWebSocket(socket_url);
            ws.binaryType = "arraybuffer";
        } else {
            console.log('Browser does not support WebSocket');
        }

		
        // Define WebSocket event listeners
        if (ws) {
            ws.onopen = function() {
                socket_opened = true;
				local = {};
                console.log('Socket opened');
				local['in_command'] = {value: 'GET_ALLPARAMS'};
				ws.send(JSON.stringify({parameters: local}));
                local = {};
                
            };

            ws.onclose = function() {

                socket_opened = false;
                //$('#graphs .plot').hide(); // Hide all graphs
                console.log('Socket closed');
                if (unexpectedClose == true) {
                    var currentTime = performance.now();
                    var timeDiff = startTime = performance.now();
                    if (timeDiff < 10000)
                        location.reload();
				}else{
                        //$('#feedback_error').modal('show');
                }
            };


            $('#restart_app_btn').on('click', function() {
                location.reload();
            });

            ws.onerror = function(ev) {
                console.log('Websocket error: ', ev);
            };

            var last_time = undefined;
            ws.onmessage = function(ev) {
				var nginx = true;
				if(nginx){
                var data = new Uint8Array(ev.data);
                //compressed_data += data.length;

                var inflate = new Zlib.Gunzip(data);
                var decompressed = inflate.decompress();
                var arr = new Uint16Array(decompressed)
                var text = convertUnpacked(arr);
                //decompressed_data += text.length;
                //console.log('receive : ',text);
                var receive = JSON.parse(text);
				}else{
				var receive = JSON.parse(ev.data);
				}
				
                if (!jQuery.isEmptyObject(receive.parameters)) {
					console.log('parameters',receive.parameters);
					if ('DIGITALNAME' in receive.parameters && receive.parameters['DIGITALNAME'].value != undefined) {
                           digitalname = receive.parameters['DIGITALNAME'].value;
						}
						
					if ('SAMPLERATE' in receive.parameters && receive.parameters['SAMPLERATE'].value != undefined) {
                           samplerate = 1/receive.parameters['SAMPLERATE'].value;
						   $('#SAMPLE_RATE').text(nFormatter(1/samplerate,2));
						}
					if ('TRACELIST' in receive.parameters && receive.parameters['TRACELIST'].value != undefined) {
                           //tracelist = receive.parameters['TRACELIST'].value;
						   
						}
				
			if(getref){				
				local = {};
				local['in_command'] = {value: 'GET_REF'};
				local['DATASTART'] = {value: 0};
				local['DATASIZE'] = {value: 1000};
				console.log(JSON.stringify({parameters: local}));
				ws.send(JSON.stringify({parameters: local}));
                local = {};	
                getref = false;
				}		
                 
                }
				//console.log('is empty : ',jQuery.isEmptyObject(receive.signals)); 
                if (!jQuery.isEmptyObject(receive.signals)) { 
					process = true;
					console.log('signals',receive.signals);
					
					// split multi digital bus signal in 'BUS' according to TRACELIST variable content bus name and size
					if(receive.signals["MBUS"]){
						//console.log('received',receive.signals);
					splitbus(receive.signals,datastart);
					}
					
					splitsignal(receive.signals,datastart);
					process = false; 
                }

            };
			
			var unload = function() {
				ws.onclose = function() {}; // disable onclose handler first
				ws.close();
					$.ajax({
						url: stop_app_url,
						async: false
					});
			}

			// Stop the application when page is unloaded
			$(window).unload(unload);

			$(document).bind('keydown keyup', function(e) {
				if (e.which === 116) //F5
					unload();
				if (e.which === 82 && e.ctrlKey) //CTRL + E
					unload();
			});
        }
    };

	
	
});	