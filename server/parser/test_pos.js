var fs = require('fs');
var amqp = require('amqp-connection-manager');
// var StreamBrake = require('streambrake');


// var test_file = './rover_2016-12-23.txt';
// var test_file = './rover_2017-1-6.txt';
var sta_id = 0;
var step = 2000;
var Config = require('config');
var queueConf = Config.get('message_queue');
var DEFAULT_QUEUE = 'amqp://' + queueConf.username + ':' + queueConf.password + '@' + queueConf.server + '/' + queueConf.virtual_hose;
var parser = require('./parser');

var onMessage = function (data) {

    var message = JSON.parse(data.content.toString());
    var buffer = new Buffer(message.data, 'base64');
    fs.appendFile( './test.txt', buffer, function () {
        console.log('---------------------------------save----------------');
        var result = parser.parse(0, buffer);
        console.log(result)
    });
    channelWrapper.ack(data);
}
// var fs = require('fs');
// var parsed_file = './parsed.log';
// var readline = require('readline');
// var parser = require('./parser');
// var rl = readline.createInterface({
//     input: fs.createReadStream(parsed_file),
// });
//
// // var wstream = fs.createWriteStream('rover_2017-1-6.txt');
//
// rl.on('line', function (line) {
//     var message = JSON.parse(line);
//     var buffer = new Buffer(message.data, 'base64');
//     // wstream.write(buffer);
//     parser.parse(0, buffer);
// });
//
// rl.on('end', function () {
//     // wstream.end();
// })


// stream.on('data', function (data) {
//     var results = parser.parse(0, data);
//     results.forEach(function (result) {
//         console.log(result)
//         console.log(result.posR.Lat + ',' + result.posR.Lon);
//     })
// });
// stream.on("end", function () {
//     console.log('the file process end');
// });
// stream.on("close", function () {
// });

// var stream = fs.createReadStream(test_file).pipe(new StreamBrake(step));

var connection = amqp.connect([DEFAULT_QUEUE], {json: true});
connection.on('connect', function () {
    console.log('Connected!');
});
connection.on('disconnect', function (params) {
    console.log('Disconnected.', params.err.stack);
});


var channelWrapper = connection.createChannel({
    setup: function (channel) {
        // `channel` here is a regular amqplib `ConfirmChannel`.
        return Promise.all([
            channel.assertQueue(queueConf.name, {durable: false}),
            channel.consume(queueConf.name, onMessage)
        ]);
    }
});

channelWrapper.waitForConnect()
    .then(function () {
        console.log("Listening for messages");
    });
