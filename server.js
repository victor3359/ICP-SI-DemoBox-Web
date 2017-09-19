var express = require('express');
var app = express();
var port = 8080;
var cors = require('cors');
var date = require('date-and-time');

var oldACLight = null;

var updateroom = null;
var oldInterval = null;
var oldchartInterval = null;


//var mongoose = require('mongoose');
var mongodb = require('mongodb').MongoClient;

var url = "mongodb://192.168.100.181:27017/demo";
var error_count = 0;

app.use(cors());
var route = express.Router();

function Init(){
    mongodb.connect(url, function(err, db){
        //todo: Init Room Data
        db.collection('demo').find({}).sort({_id: -1}).limit(1).toArray(function (mongoError, objects) {
            if (mongoError) throw mongoError;
            var data = {
                V: objects[0]['V'],
                I: objects[0]['I'],
                KWH: objects[0]['kWh'],
                KW: objects[0]['kW'],
                PF: objects[0]['PF'],
                CO2: objects[0]['CO2'],
                HR: objects[0]['HR'],
                TEMP: objects[0]['Temp'],
                AL: objects[0]['DimmingLight'],
                DL: objects[0]['BattenLighting'],
                TV: objects[0]['TV_Status'],
                Air: objects[0]['ac_Status'],
                TIME: date.format(objects[0]['sysdatetime'], 'YYYY-MM-DD HH:mm:ss')
            };
            oldACLight = data['AL'];
            socket.emit('room_init', data);
            db.close();
        });
    });
    mongodb.connect(url, function (err, db) {
        //todo: Room - RealTime Chart
        db.collection('demo').aggregate([{$match: {}},
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$sysdatetime"},
                        "dayOfYear": {"$dayOfYear": "$sysdatetime"},
                        "hour": {"$hour": "$sysdatetime"},
                        "interval": {
                            "$subtract": [
                                {"$minute": "$sysdatetime"},
                                {"$mod": [{"$minute": "$sysdatetime"}, 1]}
                            ]
                        }
                    },
                    datetime: {"$first": "$sysdatetime"},
                    data: {$first: "$$ROOT"}
                }
            },
            {$sort: {_id: -1}}, {$limit: 1000}
        ], {allowDiskUse: true}).toArray(function (mongoError, objects) {
            if (mongoError) throw mongoError;
            var realtimedata = [];
            for (var i = 0; i < objects.length; i++) {
                realtimedata.push({
                    V: objects[i]['data']['V'],
                    I: objects[i]['data']['I'],
                    KWH: objects[i]['data']['kWh'],
                    KW: objects[i]['data']['kW'],
                    PF: objects[i]['data']['PF'],
                    CO2: objects[i]['data']['CO2'],
                    HR: objects[i]['data']['HR'],
                    TEMP: objects[i]['data']['Temp'],
                    AL: objects[i]['data']['DimmingLight'],
                    DL: objects[i]['data']['BattenLighting'],
                    TV: objects[i]['data']['TV_Status'],
                    Air: objects[i]['data']['ac_Status'],
                    TIME: date.format(objects[i]['data']['sysdatetime'], 'YYYY-MM-DD HH:mm:ss')
                });
            }
            socket.emit('room_chart_rt', realtimedata);
            db.close();
        });
    });
    mongodb.connect(url, function(err, db){
        //todo: Room - Status Chart
        db.collection('demo').aggregate([{$match: {}},
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$sysdatetime"},
                        "dayOfYear": {"$dayOfYear": "$sysdatetime"},
                        "hour": {"$hour": "$sysdatetime"},
                        "interval": {
                            "$subtract": [
                                {"$minute": "$sysdatetime"},
                                {"$mod": [{"$minute": "$sysdatetime"}, 1]}
                            ]
                        }
                    },
                    datetime: {"$first": "$sysdatetime"},
                    data: {$first: "$$ROOT"}
                }
            },
            {$sort: {_id: -1}}
        ], {allowDiskUse: true}).toArray(function (mongoError, objects) {
            if (mongoError) throw mongoError;
            var data = [];
            for (var i = 0; i < objects.length; i++) {
                data.push({
                    kWh: objects[i]['data']['kWh'],
                    W: objects[i]['data']['kW'] * 1000,
                    TIME: date.format(objects[i]['data']['sysdatetime'], 'MM-DD HH:mm')
                });
            }
            data.sort(function (a, b) {
                return b.kWh - a.kWh;
            });
            socket.emit('room_chart_status', data);
            db.close();
        });
    });
    mongodb.connect(url, function(err, db){
        //todo: Room - Trend Chart
        var data = [];
        var tmp = [];
        db.collection('demo').aggregate([{$match: {}},
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$sysdatetime"},
                        "dayOfYear": {"$dayOfYear": "$sysdatetime"},
                        "interval": {
                            "$subtract": [
                                {"$hour": "$sysdatetime"},
                                {"$mod": [{"$hour": "$sysdatetime"}, 1]}
                            ]
                        }
                    },
                    datetime: {"$first": "$sysdatetime"},
                    data: {$first: "$$ROOT"}
                }
            },
            {$sort: {_id: -1}}, {$limit: 20}
        ], {allowDiskUse: true}).toArray(function (mongoError, objects) {
            for (var i = 0; i < objects.length; i++) {
                data.push({
                    kWh: objects[i]['data']['kWh'],
                    TIME: date.format(objects[i]['data']['sysdatetime'], 'MM-DD HH:mm')
                });
            }
            data.sort(function (a, b) {
                return a.kWh - b.kWh;
            });
            for (var i = 1; i < data.length; i++) {
                tmp.push({
                    kWh: data[i]['kWh'] - data[i - 1]['kWh'],
                    TIME: data[i]['TIME']
                });
            }
            socket.emit('room_chart_trend', tmp);
            db.close();
        });
    });
    mongodb.connect(url, function (err, db) {
        if(err)throw err;
        //todo: Init ErrorEvent Data
        db.collection('even').find().toArray(function (mongoError, objects) {
            if(mongoError)throw mongoError;
            error_count = objects.length;
            db.close();
        });
    });
}

function Update(){
    mongodb.connect(url, function(err, db){
        //todo: Update Room Data
        db.collection('demo').find({}).sort({_id: -1}).limit(1).toArray(function (mongoError, objects) {
            if (mongoError) throw mongoError;
            var data = {
                V: objects[0]['V'],
                I: objects[0]['I'],
                KWH: objects[0]['kWh'],
                KW: objects[0]['kW'],
                PF: objects[0]['PF'],
                CO2: objects[0]['CO2'],
                HR: objects[0]['HR'],
                TEMP: objects[0]['Temp'],
                AL: objects[0]['DimmingLight'],
                DL: objects[0]['BattenLighting'],
                TV: objects[0]['TV_Status'],
                Air: objects[0]['ac_Status'],
                TIME: date.format(objects[0]['sysdatetime'], 'YYYY-MM-DD HH:mm:ss')
            };
            socket.emit('room_data', data);
            db.close();
        });
    });
    mongodb.connect(url, function (err, db) {
        if(err)console.log(err);
        //todo: Update ErrorEvent Data
        db.collection('even').find().sort({_id:-1}).toArray(function (mongoError, objects) {
            if (mongoError) throw mongoError;
            if (objects.length > error_count) {
                var tmp = [];
                for(var i=0;i< objects.length - error_count ;i++){
                    if(objects[i]['PIR']){
                        tmp.push({
                            error_type: '人影感測警報',
                            error_info: '警告：發現人影！',
                            TIME: date.format(objects[i]['sysdatetime'], 'YYYY-MM-DD HH:mm:ss')
                        });
                    }
                    if(objects[i]['Windows']){
                        tmp.push({
                            error_type: '窗戶栓鎖警報',
                            error_info: '警告：窗戶為開啟狀態！',
                            TIME: date.format(objects[i]['sysdatetime'], 'YYYY-MM-DD HH:mm:ss')
                        });
                    }
                }
                socket.emit('error_info', tmp);
                error_count = objects.length;
            }
            db.close();
        });
    });
}

function UpdateChart(){
    mongodb.connect(url, function(err, db){
        //todo: Update Room - RealTime Chart
        db.collection('demo').find({}).sort({_id: -1}).limit(60).toArray(function (mongoError, objects) {
            if (mongoError) throw mongoError;
            var data = {
                V: objects[0]['V'],
                I: objects[0]['I'],
                KWH: objects[0]['kWh'],
                KW: objects[0]['kW'],
                PF: objects[0]['PF'],
                CO2: objects[0]['CO2'],
                HR: objects[0]['HR'],
                TEMP: objects[0]['Temp'],
                AL: objects[0]['DimmingLight'],
                DL: objects[0]['BattenLighting'],
                TV: objects[0]['TV_Status'],
                Air: objects[0]['ac_Status'],
                TIME: date.format(objects[0]['sysdatetime'], 'YYYY-MM-DD HH:mm:ss')
            };
            socket.emit('room_chart_data', data);
            db.close();
        });
    });
}


app.use('/', route);
//Start the server
app.listen(port);
console.log('Big5-API is listening on port ' + port + "<-- Unused");
var state = 'ON';
function ONOFF(){
    if(state == 'ON'){
        client.publish('hok/4f_public/light', 'ON');
        state = 'OFF';
    }else{
        client.publish('hok/4f_public/light', 'OFF');
        state = 'ON';
    }
}

var io = require('socket.io');
var mqtt = require('mqtt');
var opt = {
    port: 1883,
    clientId: 'nodejs',
    username: 'icpsi',
    password: '12345678'
};
var client = mqtt.connect('tcp://192.168.100.181', opt);

client.on('connect', function () {
    console.log('Connected to MQTT Server.');
});
var socket = io.listen(10000);
socket.sockets.on('connection', function (socket) {
    console.log('Socket Client Connected.');
    socket.on('roomSituation', function(data){
        client.publish('demo/home/1709181907/situation', data);
    });
    socket.on('roomAL', function(){
        if(oldACLight / 2000 > 4) oldACLight = 0;
        else oldACLight += 2000;
        client.publish('demo/home/1709181907/dimming', (oldACLight / 2000).toString());
        socket.emit('ALDone', oldACLight / 2000);
    });
    socket.on('roomDL', function(data){
        client.publish('demo/home/1709181907/BattenLighting', data);
    });
    socket.on('roomTV', function(data){
        client.publish('demo/home/1709181907/TV', data);
    });
    socket.on('roomAir', function(data){
        client.publish('demo/home/1709181907/AC', data);
    });
    socket.on('roomDevices', function(data){
        if(data == 'ON'){
            oldACLight = 10000;
            client.publish('demo/home/1709181907/dimming', '5');
            client.publish('demo/home/1709181907/BattenLighting', data);
            client.publish('demo/home/1709181907/TV', data);
            client.publish('demo/home/1709181907/AC', data);
        }else{
            oldACLight = 0;
            client.publish('demo/home/1709181907/dimming', '0');
            client.publish('demo/home/1709181907/BattenLighting', data);
            client.publish('demo/home/1709181907/TV', data);
            client.publish('demo/home/1709181907/AC', data);
        }
    });
    socket.on('done', function (room) {
        Init(room);
        if(!oldInterval){
            oldInterval = setInterval(function(){Update(room);}, 1000);
            oldchartInterval = setInterval(function(){UpdateChart(room);}, 60000);
            updateroom = room;
            console.log('First Done.');
        }
    });
});