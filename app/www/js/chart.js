// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
function drawChart(time_and_temp) {
        var data = google.visualization.arrayToDataTable(time_and_temp);

        var options = {
          title: 'Progression of Temperature',
          hAxis: {title: 'Time', minValue: 0, maxValue: 100},
          vAxis: {title: 'Temperature', minValue: 20, maxValue: 30},
          legend: 'none'
        };

        var chart = new google.visualization.ScatterChart(document.getElementById('chart_div'));

        chart.draw(data, options);
      }
