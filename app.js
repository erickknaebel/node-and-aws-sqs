// Require objects.
var express  = require('express');
var app      = express();
var aws      = require('aws-sdk');
const { runInNewContext } = require('vm');
var queueUrl = "";
var receipt  = "";
    
// Load your AWS credentials and try to instantiate the object.
aws.config.loadFromPath(__dirname + '/config.json');

// Instantiate SQS.
var sqs = new aws.SQS();

// Creating a queue.
app.post('/create-queue', function (req, res) {
    var params = {
        QueueName: req.body.name
    };
    
    sqs.createQueue(params, function(err, data) {
        if(err) {
            res.send(err);
        } 
        else {
            queueUrl = res.body.QueueUrl;
            res.send(data);
        } 
    });
});

// Listing our queues.
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

// Sending a message.
// NOTE: Here we need to populate the queue url you want to send to.
// That variable is indicated at the top of app.js.
app.post('/send-message', function (req, res) {
    var params = {
        MessageBody: req.body,
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
            receipt = res.body.Messages[0].ReceiptHandle
            res.send(data);
        } 
    });
});

// Deleting a message.
app.get('/delete-queue', function (req, res) {
    var params = {
        QueueUrl: queueUrl,
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

// Purging the entire queue.
app.get('/purge-queue', function (req, res) {
    var params = {
        QueueUrl: queueUrl
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

// Start server.
var server = app.listen(80, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('AWS SQS example app listening at http://%s:%s', host, port);
});
