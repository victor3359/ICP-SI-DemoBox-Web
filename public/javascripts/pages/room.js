"use strict";
$(document).ready(function() {

    var powerdata = [];
    var voltagedata = [];
    var amperedata = [];
    var powerdata_c = [];
    var chartdata = [];
    var CO2data = [];
    var PM25data = [];
    var RHdata = [];
    var TEMPdata = [];

    var room = 'room';

    function controlalert(name, cmd){
        iziToast.show({title:'Command',message:'Turn ' + cmd + ' the ' + name + '.' ,color:'#00cc99',position:'bottomRight'});
    }
    socket.emit('done', room);
    //Controller Def Start
    $('#SituationNormal').click(function(){
        socket.emit(room + 'Situation', '2');
        iziToast.show({title:'Converted to Normal Mode.' ,color:'#00cc99',position:'bottomRight'});
    });
    $('#SituationOutside').click(function(){
        socket.emit(room + 'Situation', '1');
        iziToast.show({title:'Converted to Out Mode.' ,color:'#00cc99',position:'bottomRight'});
    });
    $('#SituationPlay').click(function(){
        socket.emit(room + 'Situation', '3');
        iziToast.show({title:'Converted to Amusement Mode.' ,color:'#00cc99',position:'bottomRight'});
    });
    $('#SituationSleep').click(function(){
        socket.emit(room + 'Situation', '4');
        iziToast.show({title:'Converted to Sleep Mode.' ,color:'#00cc99',position:'bottomRight'});
    });
    $('#AC_Light_Switch').click(function () {
        socket.emit(room + 'AL', 'ON');
        //iziToast.show({title:'Dimming Light Status Changed.' ,color:'#00cc99',position:'bottomRight'});
    });
    socket.on('ALDone', function (data) {
        iziToast.show({title:'Dimming Light Status Changed to Level '+data+'.' ,color:'#00cc99',position:'bottomRight'});
    });
    $('#DC_Light_Switch').click(function () {
        if(getText('DC_Light_State') == 'Off'){
            socket.emit(room + 'DL', 'ON');
            controlalert('Batten Light', 'On');
        }else{
            socket.emit(room + 'DL', 'OFF');
            controlalert('Batten Light', 'Off');
        }
    });
    $('#TV_Switch').click(function () {
        if(getText('TV_State') == 'Off'){
            socket.emit(room + 'TV', 'ON');
            controlalert('Television', 'On');
        }else{
            socket.emit(room + 'TV', 'OFF');
            controlalert('Television', 'Off');
        }
    });
    $('#Air_Switch').click(function () {
        if(getText('Air_State') == 'Off'){
            socket.emit(room + 'Air', 'ON');
            controlalert('Air Conditioner', 'On');
        }else{
            socket.emit(room + 'Air', 'OFF');
            controlalert('Air Conditioner', 'Off');
        }
    });
    $('#All_On').click(function () {
        socket.emit(room + 'Devices', 'ON');
        controlalert('Devices', 'On All');
    });
    $('#All_Off').click(function () {
        socket.emit(room + 'Devices', 'OFF');
        controlalert('Devices', 'Off All');
    });

    //Controller Def End
    function state(name, flag){
        if(flag) {
            document.getElementById(name).innerHTML = 'On';
        }else{
            document.getElementById(name).innerHTML = 'Off';
        }
    }


    function setText(name, value) {
        document.getElementById(name).innerHTML = value;
    }

    function getText(name) {
        return document.getElementById(name).innerHTML;
    }

    function ShowNotify(title, message, datetime){
        new PNotify({
            title: title,
            text: message + '<br>' + datetime,
            type:'error',
            after_init:
                function(notice){
                    notice.attention('rubberBand');
                }
        });
    }

    socket.on('error_info', function (data) {
        for(var i=0;i<data.length;i++){
            ShowNotify(data[i]['error_type'], data[i]['error_info'], data[i]['TIME']);
        }
    });

    //Room Socket
    socket.on(room +'_init', function (data) {
        powerdata.push(data['KWH']);
        voltagedata.push(data['V']);
        amperedata.push(data['I']);
        powerdata_c.push(data['KW'] * 1000);
        CO2data.push(data['CO2']);
        RHdata.push(data['HR'] / 100);
        TEMPdata.push(data['TEMP'] / 100);

        new CountUp("widget_countup1", 0,data['KWH'] , 0, 5.0, options).start();
        new CountUp("widget_countup2", 0,data['V'] , 0, 5.0, options).start();
        new CountUp("widget_countup3", 0,data['I'] * 1000, 0, 5.0, options).start();
        new CountUp("widget_countup4", 0,data['KW'] * 1000 , 0, 5.0, options).start();
        new CountUp("widget_countup5", 0,data['CO2'] , 0, 5.0, options).start();
        new CountUp("widget_countup7", 0,parseInt(data['HR'] / 100) , 0, 5.0, options).start();
        new CountUp("widget_countup8", 0,parseInt(data['TEMP'] / 100) , 0, 5.0, options).start();

        setText("widget_countup12", data['KWH']);
        setText("widget_countup22", data['V']);
        setText("widget_countup32", data['I']);
        setText("widget_countup42", data['KW'] * 1000);
        setText("widget_countup52", data['CO2']);
        setText("widget_countup72", data['HR'] / 100);
        setText("widget_countup82", data['TEMP'] / 100);

        setText('AC_Light_State', 'Level '+ parseInt(data['AL'] / 2000));
        if(data['DL']){
            state('DC_Light_State', 1);
        }else{
            state('DC_Light_State', 0);
        }
        if(data['TV']){
            state('TV_State', 1);
        }else{
            state('TV_State', 0);
        }
        if(data['Air']){
            state('Air_State', 1);
        }else{
            state('Air_State', 0);
        }

        $("#visitsspark-chart").sparkline(powerdata, {
            type: 'line',
            width: '100%',
            height: '48',
            lineColor: '#4fb7fe',
            fillColor: '#e7f5ff',
            tooltipSuffix: ' kWh'
        });
        $('#V_chart').sparkline(voltagedata,{
            type: 'line',
            width: "100%",
            height: '48',
            spotColor: '#f0ad4e',
            lineColor: '#EF6F6C',
            tooltipSuffix: ' V'
        });
        $('#I_chart').sparkline(amperedata, {
            type: 'line',
            height: "48",
            width: "100%",
            lineColor: '#0cd32d',
            fillColor: '#27c5f0',
            tooltipSuffix: ' A'
        });
        $("#rating").sparkline(powerdata_c, {
            type: 'line',
            width: "100%",
            height: '48',
            spotColor: '#FF00FF',
            lineColor: '#DF0F7C',
            tooltipSuffix: ' W'
        });
        $("#CO2_chart").sparkline(CO2data, {
            type: 'line',
            width: '100%',
            height: '48',
            lineColor: '#4fb7fe',
            fillColor: '#e7f5ff',
            tooltipSuffix: ' ppm'
        });
        $('#PM25_chart').sparkline(PM25data,{
            type: 'line',
            width: "100%",
            height: '48',
            spotColor: '#f0ad4e',
            lineColor: '#EF6F6C',
            tooltipSuffix: ' μg/m3'
        });
        $('#RH_chart').sparkline(RHdata, {
            type: 'line',
            height: "48",
            width: "100%",
            lineColor: '#0cd32d',
            fillColor: '#27c5f0',
            tooltipSuffix: ' %'
        });
        $("#TEMP_chart").sparkline(TEMPdata, {
            type: 'line',
            width: "100%",
            height: '48',
            spotColor: '#FF00FF',
            lineColor: '#DF0F7C',
            tooltipSuffix: ' ℃'
        });
    });

    socket.on(room + '_chart_rt', function (data) {
        for(var i=data.length - 1;i >= 0;i--) {
            chartdata.push({
                data1: parseFloat(data[i]['KW']) * 1000,
                data2: data[i]['I'],
                data3: data[i]['V'],
                data4: data[i]['CO2'],
                data5: data[i]['HR'],
                data6: data[i]['TEMP'],
                data7: data[i]['AL'],
                data8: data[i]['DL'],
                data9: data[i]['TV'],
                data10: data[i]['Air'],
                date: data[i]['TIME']
            });
        }
        updatechartrt();
    });
    socket.on(room +'_chart_data', function (data) {
        for(var i=data.length - 1;i >= 0;i--) {
            chartdata.push({
                data1: parseFloat(data[i]['KW']) * 1000,
                data2: data[i]['I'],
                data3: data[i]['V'],
                data4: data[i]['CO2'],
                data5: data[i]['HR'],
                data6: data[i]['TEMP'],
                data7: data[i]['AL'],
                data8: data[i]['DL'],
                data9: data[i]['TV'],
                data10: data[i]['Air'],
                date: data[i]['TIME']
            });
        }
        updatechartrt();
    });


    socket.on(room +'_data', function (data) {
        powerdata.push(data['KWH']);
        voltagedata.push(data['V']);
        amperedata.push(data['I']);
        powerdata_c.push(data['KW'] * 1000);
        CO2data.push(data['CO2']);
        RHdata.push(data['HR'] / 100);
        TEMPdata.push(data['TEMP'] / 100);


        setText("widget_countup1", parseInt(data['KWH']));
        setText("widget_countup2", parseInt(data['V']));
        setText("widget_countup3", data['I'] * 1000);
        setText("widget_countup4", data['KW'] * 1000);
        setText("widget_countup5", data['CO2']);
        setText("widget_countup7", parseInt(data['HR'] / 100));
        setText("widget_countup8", parseInt(data['TEMP'] / 100));
        setText("widget_countup12", data['KWH']);
        setText("widget_countup22", data['V']);
        setText("widget_countup32", data['I']);
        setText("widget_countup42", data['KW'] * 1000);
        setText("widget_countup52", data['CO2']);
        setText("widget_countup72", data['HR'] / 100);
        setText("widget_countup82", data['TEMP'] / 100);

        setText('AC_Light_State', 'Level '+ parseInt(data['AL'] / 2000));
        if(data['DL']){
            state('DC_Light_State', 1);
        }else{
            state('DC_Light_State', 0);
        }
        if(data['TV']){
            state('TV_State', 1);
        }else{
            state('TV_State', 0);
        }
        if(data['Air']){
            state('Air_State', 1);
        }else{
            state('Air_State', 0);
        }

        if (CO2data.length > 10) CO2data.shift();
        if (voltagedata.length > 10) voltagedata.shift();
        if (amperedata.length > 10) amperedata.shift();
        if (RHdata.length > 10) RHdata.shift();
        if (TEMPdata.length > 10) TEMPdata.shift();
        if (powerdata.length > 10) powerdata.shift();
        if (powerdata_c.length > 10) powerdata_c.shift();
        if (chartdata.length > 4000) chartdata.shift();

        $("#visitsspark-chart").sparkline(powerdata, {
            type: 'line',
            width: '100%',
            height: '48',
            lineColor: '#4fb7fe',
            fillColor: '#e7f5ff',
            tooltipSuffix: ' kWh'
        });
        $('#V_chart').sparkline(voltagedata,{
            type: 'line',
            width: "100%",
            height: '48',
            spotColor: '#f0ad4e',
            lineColor: '#EF6F6C',
            tooltipSuffix: ' V'
        });
        $('#I_chart').sparkline(amperedata, {
            type: 'line',
            height: "48",
            width: "100%",
            lineColor: '#0cd32d',
            fillColor: '#27c5f0',
            tooltipSuffix: ' A'
        });
        $("#rating").sparkline(powerdata_c, {
            type: 'line',
            width: "100%",
            height: '48',
            spotColor: '#FF00FF',
            lineColor: '#DF0F7C',
            tooltipSuffix: ' W'
        });
        $("#CO2_chart").sparkline(CO2data, {
            type: 'line',
            width: '100%',
            height: '48',
            lineColor: '#4fb7fe',
            fillColor: '#e7f5ff',
            tooltipSuffix: ' ppm'
        });
        $('#PM25_chart').sparkline(PM25data,{
            type: 'line',
            width: "100%",
            height: '48',
            spotColor: '#f0ad4e',
            lineColor: '#EF6F6C',
            tooltipSuffix: ' μg/m3'
        });
        $('#RH_chart').sparkline(RHdata, {
            type: 'line',
            height: "48",
            width: "100%",
            lineColor: '#0cd32d',
            fillColor: '#27c5f0',
            tooltipSuffix: ' %'
        });
        $("#TEMP_chart").sparkline(TEMPdata, {
            type: 'line',
            width: "100%",
            height: '48',
            spotColor: '#FF00FF',
            lineColor: '#DF0F7C',
            tooltipSuffix: ' ℃'
        });
    });

    socket.on(room + '_chart_trend', function (data) {
        var chart = AmCharts.makeChart( "chart_trend2", {
            "type": "serial",
            "addClassNames": true,
            "theme": "light",
            "autoMargins": false,
            "marginLeft": 30,
            "marginRight": 8,
            "marginTop": 10,
            "marginBottom": 26,
            "balloon": {
                "adjustBorderColor": false,
                "horizontalPadding": 10,
                "verticalPadding": 8,
                "color": "#ffffff"
            },

            "dataProvider": data
            ,
            "valueAxes": [ {
                "axisAlpha": 0,
                "position": "left"
            } ],
            "startDuration": 1,
            "graphs": [ {
                "alphaField": "alpha",
                "balloonText": "<span style='font-size:12px;'>[[title]] 在 [[category]]:<br><span style='font-size:20px;'>[[value]]</span> [[additional]]</span>",
                "fillAlphas": 1,
                "title": "耗電量",
                "type": "column",
                "valueField": "kWh",
                "dashLengthField": "dashLengthColumn"
            }],
            "categoryField": "TIME",
            "categoryAxis": {
                "gridPosition": "start",
                "axisAlpha": 0,
                "tickLength": 0
            },
            "export": {
                "enabled": true
            }
        } );
    });




//   flip js

    $("#top_widget1, #top_widget2, #top_widget3, #top_widget4, #top_widget5, #top_widget6, #top_widget7, #top_widget8").flip({
        axis: 'x',
        trigger: 'hover'
    });

    var options = {
        useEasing: true,
        useGrouping: true,
        decimal: '.',
        prefix: '',
        suffix: ''
    };

    socket.on(room + '_chart_status', function (data) {
        var date = [];
        var dataW = [], datakWh = [];
        for(var i = data.length - 1;i >= 0;i--){
            date.push(data[i]['TIME']);
            dataW.push(data[i]['W']);
            datakWh.push(data[i]['kWh']);
        }
        Highcharts.chart('container', {
            chart: {
                zoomType: 'xy'
            },
            title: {
                text: ''
            },
            subtitle: {
                text: ''
            },
            xAxis: [{
                categories: date,
                crosshair: true
            }],
            yAxis: [{ // Primary yAxis
                labels: {
                    format: '{value} W',
                    style: {
                        color: Highcharts.getOptions().colors[0]
                    }
                },
                title: {
                    text: 'Power',
                    style: {
                        color: Highcharts.getOptions().colors[0]
                    }
                },
                opposite: true

            }, { // Secondary yAxis
                gridLineWidth: 0,
                title: {
                    text: 'Kilowatt-Hours',
                    style: {
                        color: Highcharts.getOptions().colors[1]
                    }
                },
                labels: {
                    format: '{value} kWh',
                    style: {
                        color: Highcharts.getOptions().colors[1]
                    }
                }
            }],
            tooltip: {
                shared: true
            },
            legend: {
                layout: 'vertical',
                align: 'left',
                x: 70,
                verticalAlign: 'top',
                y: 0,
                floating: true,
                backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
            },
            series: [
                {
                    name: 'Power',
                    type: 'column',
                    data: dataW,
                    tooltip: {
                        valueSuffix: ' W'
                    }
                },
                {
                    name: 'Kilowatt-Hour',
                    type: 'spline',
                    yAxis: 1,
                    data: datakWh,
                    tooltip: {
                        valueSuffix: ' kWh'
                    }

                }]
        });
    });

    function updatechartrt() {
        AmCharts.makeChart("rt_chart",
            {
                "type": "serial",
                "categoryField": "date",
                "dataDateFormat": "YYYY-MM-DD HH:NN:SS",
                "categoryAxis": {
                    "minPeriod": "ss",
                    "parseDates": true
                },
                "chartCursor": {
                    "enabled": true,
                    "categoryBalloonDateFormat": "JJ:NN:SS"
                },
                "chartScrollbar": {
                    "enabled": true
                },
                "trendLines": [],
                "graphs": [
                    {
                        "bullet": "none",
                        "id": "AmGraph-1",
                        "title": "Power",
                        "valueField": "data1",
                        "lineThickness" : 4,
                        "lineColor": "#000088"
                    },
                    {
                        "bullet": "none",
                        "id": "AmGraph-2",
                        "title": "Current",
                        "valueField": "data2",
                        "lineThickness" : 4,
                        "lineColor": "#00BBFF"
                    },
                    {
                        "bullet": "none",
                        "id": "AmGraph-3",
                        "title": "Voltage",
                        "valueField": "data3",
                        "lineThickness" : 4,
                        "lineColor": "#77DDFF"
                    },
                    {
                        "bullet": "none",
                        "id": "AmGraph-4",
                        "title": "CO2",
                        "valueField": "data4",
                        "lineThickness" : 4,
                        "lineColor": "#00DD00"
                    },
                    {
                        "bullet": "none",
                        "id": "AmGraph-5",
                        "title": "RH",
                        "valueField": "data5",
                        "lineThickness" : 4,
                        "lineColor": "#CCFF33"
                    },
                    {
                        "bullet": "none",
                        "id": "AmGraph-6",
                        "title": "Temperature",
                        "valueField": "data6",
                        "lineThickness" : 4,
                        "lineColor": "#668800"
                    },
                    {
                        "bullet": "none",
                        "id": "AmGraph-7",
                        "title": "Dimming Light",
                        "valueField": "data7",
                        "lineThickness" : 4,
                        "lineColor": "#FFCC22"
                    },
                    {
                        "bullet": "none",
                        "id": "AmGraph-8",
                        "title": "Batten Light",
                        "valueField": "data8",
                        "lineThickness" : 4,
                        "lineColor": "#CC0000"
                    },
                    {
                        "bullet": "none",
                        "id": "AmGraph-9",
                        "title": "Television",
                        "valueField": "data9",
                        "lineThickness" : 4,
                        "lineColor": "#cc0a75"
                    },
                    {
                        "bullet": "none",
                        "id": "AmGraph-10",
                        "title": "Air Conditioner",
                        "valueField": "data10",
                        "lineThickness" : 4,
                        "lineColor": "#cc5aa9"
                    }
                ],
                "guides": [],
                "valueAxes": [
                    {
                        "id": "ValueAxis-1",
                        "title": ""
                    }
                ],
                "allLabels": [],
                "balloon": {},
                "legend": {
                    "enabled": true,
                    "useGraphSettings": false
                },
                "titles": [
                    {
                        "id": "Hok_201",
                        "size": 15,
                        "text": ""
                    }
                ],
                "dataProvider": chartdata
            }
        );
    }
});