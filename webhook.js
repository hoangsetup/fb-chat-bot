/**
 * Created by FRAMGIA\dinh.van.hoang on 16/05/2017.
 */
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const apiaiApp = require('apiai')(process.env.APIAI_TOKEN);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Hello world!'
    })
});

/* For Facebook Validation */
app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'hoangdv') {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.status(403).end();
    }
});

/* Handling all messenges */
app.post('/webhook', (req, res) => {
    if (req.body.object === 'page') {
        req.body.entry.forEach((entry) => {
            entry.messaging.forEach((event) => {
                if (event.message && event.message.text) {
                    sendMessage(event);
                }
            });
        });
        res.status(200).end();
    }
});

function sendMessage(event) {
    let sender = event.sender.id;
    let text = event.message.text;

    getAiRespons(text, (resp) => {
        let aiText = resp.result.fulfillment.speech;
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
            method: 'POST',
            json: {
                recipient: {id: sender},
                message: {text: aiText}
            }
        }, function (error, response) {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
        });
    })
}

function getAiRespons(text, callback) {
    let apiai = apiaiApp.textRequest(text, {
        sessionId: 'hoangdv'
    });
    apiai.on('response', (resp) => {
        typeof callback === 'function' && callback(resp);
    });
    apiai.on('error', (error) => {
        console.log(error);
    });
    apiai.end();
}

const server = app.listen(process.env.PORT || 5000, () => {
    console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});
