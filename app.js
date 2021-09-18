// Require objects.
var express  = require('express');
var app      = express();
var aws      = require('aws-sdk');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json()
var sqs = new aws.SQS();
var queueUrl = "";
var receipt  = "";
  
const { runInNewContext } = require('vm');

aws.config.loadFromPath(__dirname + '/config.json');

app.post('/create-queue', jsonParser, function(req, res) {
    params = {
        QueueName: req.body.name
    };
    
    sqs.createQueue(params, function(err, data) {
        if(err) {
            res.send(err);
        } 
        else {
            queueUrl = data.QueueUrl;
            res.send(data);
        } 
    });
});

app.get('/list-all-queues', function (req, res) {
    sqs.listQueues(function(err, data) {
        if(err) {
            res.send(err);
        } 
        else {
            res.send(data);
        } 
    });
});

app.post('/send-message', jsonParser, function (req, res) {
    var params = {
        MessageBody: req.body.message,
        QueueUrl: queueUrl,
        DelaySeconds: 0
    };

    sqs.sendMessage(params, function(err, data) {
        if(err) {
            res.send(err);
        } 
        else {
            res.send(data);
        } 
    });
});

// Receive a message.
// NOTE: This is a great long polling example. You would want to perform
// this action on some sort of job server so that you can process these
// records. In this example I'm just showing you how to make the call.
// It will then put the message "in flight" and I won't be able to 
// reach that message again until that visibility timeout is done.
app.get('/receive-message', function (req, res) {
    var params = {
        QueueUrl: queueUrl,
        VisibilityTimeout: 600 // 10 min wait time for anyone else to process.
    };
    
    sqs.receiveMessage(params, function(err, data) {
        if(err) {
            res.send(err);
        } 
        else {
            receipt = data.Messages[0].ReceiptHandle
            res.send(data);
        } 
    });
});

app.get('/delete-queue', jsonParser, function (req, res) {
    var params = {
        QueueUrl: req.body.queueUrl,
        ReceiptHandle: receipt
    };
    
    sqs.deleteMessage(params, function(err, data) {
        if(err) {
            res.send(err);
        } 
        else {
            res.send(data);
        } 
    });
});


app.get('/purge-queue', jsonParser, function (req, res) {
    var params = {
        QueueUrl: req.body.queueUrl
    };
    
    sqs.purgeQueue(params, function(err, data) {
        if(err) {
            res.send(err);
        } 
        else {
            res.send(data);
        } 
    });
});

var server = app.listen(80, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('AWS SQS example app listening at http://%s:%s', host, port);
});
