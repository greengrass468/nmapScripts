$(document).ready(function(){
$(function(){
      var data =  [
            {data: [[1, 5], [2, 10], [3, 15], [4, 15], [5, 10], [6, 5]], color: '#3a8df6'},
            {data: [[1, 52], [2, 42], [3, 32], [4, 32], [5, 42], [6, 52]], color: '#ff0000'}
            ];
      var options = {
              lines: {show: true},
              yaxis: {tickDecimals: 0, min: 0, max: 100, autoscaleMargin: null}
             };
     var graph = $.plot($('#graph'), data, options);
     var points = graph.getData();
     var graphx = $('#graph').offset().left;
     graphx = graphx + 30; // replace with offset of canvas on graph
     var graphy = $('#graph').offset().top;
     graphy = graphy + 10; // how low you want the label to hang underneath the point
     for(var k = 0; k < points.length; k++){
          for(var m = 0; m < points[k].data.length; m++){
            showTooltip(graphx + points[k].xaxis.p2c(points[k].data[m][0]), graphy + points[k].yaxis.p2c(points[k].data[m][1]),points[k].data[m][1])
            }
      }
 });
 });
 function showTooltip(x,y,contents){
      $('<div id="tooltip">' +  contents + '</div>').css( {
            position: 'absolute',
            display: 'none',
            top: y,
            left: x
      }).appendTo("body").fadeIn(200);
 } 