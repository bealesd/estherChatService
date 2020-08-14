'use strict';
var cr = require('./chatRepo');
var chatRepo = new cr();
chatRepo.setup();

var port = process.env.PORT || 1337;
console.log(`Listening on ${port}.`);
var express = require('express');
var app = express();


var allowCrossDomain = function(request, response, next) {
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    response.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};

app.use(allowCrossDomain);
app.use(express.json());

app.get('/getMessages', function(request, response) {
    const recordCount = isNaN(parseInt(request.query.recordCount)) ? 10 : parseInt(request.query.recordCount);
    chatRepo.getChatRecords(recordCount)
        .then((result) => {
            return response.status(201).json(result);
        })
        .catch((err) => {
            console.error(err);
            return response.status(400).send('Get messages request failed.');
        });
});

app.get('/GeNewMessages', function(request, response) {
    const lastId = request.query.lastId;
    chatRepo.getChatRecordsAfterId(lastId)
        .then((result) => {
            return response.status(201).json(result);
        })
        .catch((err) => {
            console.error(err);
            return response.status(400).send('Get messages request failed.');
        });
});

app.post('/postMessage', function(request, response) {
    const message = request.body.Message;
    const who = request.body.Username;
    chatRepo.addChatRecord(message, who)
        .then((result) => {
            return response.status(201).json(result);
        })
        .catch((err) => {
            console.error(err.stack);
            return response.status(400).send('Post message failed.');
        });
});

app.put('/updateMessage', function(request, response) {
    const rowKey = request.query.rowKey;
    const message = request.body.Message;
    chatRepo.updateOrReplaceRecord(message, rowKey)
        .then((result) => {
            return response.status(201).json(result);
        })
        .catch((err) => {
            console.error(err.stack);
            return response.status(400).send('Update message failed.');
        });
});

app.delete('/deleteMessage', function(request, response) {
    const rowKey = request.query.rowKey;
    chatRepo.deleteChatRecord(rowKey)
        .then((result) => {
            return response.status(201).json(result);
        })
        .catch((err) => {
            console.error(err.stack);
            return response.status(400).send('Delete message failed.');
        });
});

var server = app.listen(port, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port);
});