
(function ($) {
    var options = {
        series: { stack: null,
				  offset: 0
		} 
    };
	var index = 0;
	var nextserie;
    function init(plot) {
        
        
        function stackData(plot, s, datapoints) {
			//console.log('stack');//,s.stack,s);
            if (s.stack == null || s.stack === false)
                return;
			
			var newpoints = [];
			var i;
			if(s.offset != 0){
				for(i = 0 ; i< s.datapoints.points.length;i+=2){
				
					newpoints[i] = s.datapoints.points[i];//x point
					newpoints[i+1] = s.datapoints.points[i+1] + s.offset;//y point
				}
				
			}else{
				for(i = 0 ; i< s.datapoints.points.length;i+=2){
				
					newpoints[i] = s.datapoints.points[i];//x point
					newpoints[i+1] = s.datapoints.points[i+1]+ (1.5 * index) + 0.5;//y point
				}
			}
 
            datapoints.points = newpoints;
			index++;
			if(plot.getData().length == index){
				index = 0;
			}

        }
        
        plot.hooks.processDatapoints.push(stackData);
		

    }
    
    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'offsety',
        version: '1.0'
    });
})(jQuery);
