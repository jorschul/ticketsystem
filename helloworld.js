//
// Copyright (c) 2016 Cisco Systems
// Licensed under the MIT License 
//

/* 
 * a Webex Teams bot that:
 *   - sends a welcome message as he joins a room, 
 *   - answers to a /hello command, and greets the user that chatted him
 *   - supports /help and a 'fallback' helper message
 *
 * + leverages the "node-sparkclient" library for bot to Webex communications.
 * 
 */
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var SparkBot = require("node-sparkbot");
var request = require("request");

var bot = new SparkBot();
//bot.interpreter.prefix = "#"; // Remove comment to overlad default / prefix to identify bot commands

var SparkAPIWrapper = require("node-sparkclient");
if (!process.env.ACCESS_TOKEN) {
    console.log("Could not start as this bot requires a Webex Teams API access token.");
    console.log("Please add env variable ACCESS_TOKEN on the command line");
    console.log("Example: ");
    console.log("> ACCESS_TOKEN=XXXXXXXXXXXX DEBUG=sparkbot* node helloworld.js");
    process.exit(1);
}
var client = new SparkAPIWrapper(process.env.ACCESS_TOKEN);


//
// Help and fallback commands
//
bot.onCommand("help", function (command) {
    client.createMessage(command.message.roomId, "Hi, I am the Hello World bot !\n\nType /hello to see me in action.", {
        "markdown": true
    }, function (err, message) {
        if (err) {
            console.log("WARNING: could not post message to room: " + command.message.roomId);
            return;
        }
    });
});
bot.onCommand("fallback", function (command) {
    client.createMessage(command.message.roomId, "Sorry, I did not understand.\n\nTry /help.", {
        "markdown": true
    }, function (err, response) {
        if (err) {
            console.log("WARNING: could not post Fallback message to room: " + command.message.roomId);
            return;
        }
    });
});


//
// Bots commands here
//
bot.onCommand("hello", function (command) {
    
    var email = command.message.personEmail; // User that created the message orginally 
    client.createMessage(command.message.roomId, `Hello, your email is: **${email}**`, {
        "markdown": true
    }, function (err, message) {
        if (err) {
            console.log("WARNING: could not post message to room: " + command.message.roomId);
            return;
        }
    });
    var room_id = command.message.roomId
    console.log(command.message.roomId);
    var sys_id;
    var options = {
        method: 'GET',
        url: 'https://dev20560.service-now.com/api/now/v1/table/incident',
        qs: {
            sysparm_query: room_id
        },
        headers: {
            'Postman-Token': '3dc54710-8e0f-4547-8337-5b2f68c402e2',
            'cache-control': 'no-cache',
            Authorization: 'Basic YWRtaW46QzFzY28xMjMu',
            'Content-Type': 'application/json'
        },
        body: {
            close_code: 'Closed/Resolved By Caller',
            state: '7',
            caller_id: '6816f79cc0a8016401c5a33be04be331',
            close_notes: 'Closed by API'
        },
        json: true
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);


        //console.log(body.result[0].number)
        sys_id = body.result[0].sys_id




    });



});


//
// Welcome message 
// sent as the bot is added to a Room
//
bot.onEvent("memberships", "created", function (trigger) {
    var newMembership = trigger.data; // see specs here: https://developer.webex.com/endpoint-memberships-get.html
    if (newMembership.personId != bot.interpreter.person.id) {
        // ignoring
        console.log("new membership fired, but it is not us being added to a room. Ignoring...");
        return;
    }

    // so happy to join
    console.log("bot's just added to room: " + trigger.data.roomId);

    client.createMessage(trigger.data.roomId, "Hi, I am the Service now bot !\n\nType /hello to see me in action.", {
        "markdown": true
    }, function (err, message) {
        if (err) {
            console.log("WARNING: could not post Hello message to room: " + trigger.data.roomId);
            return;
        }

        if (message.roomType == "group") {
            client.createMessage(trigger.data.roomId, "**Note that this is a 'Group' room. I will wake up only when mentionned.**", {
                "markdown": true
            }, function (err, message) {
                if (err) {
                    console.log("WARNING: could not post Mention message to room: " + trigger.data.roomId);
                    return;
                }
            });
        }
    });
});


// Bots commands here
//
bot.onCommand("close", function (command) {

    var email = command.message.personEmail; // User that created the message orginally 
    client.createMessage(command.message.roomId, `I will go ahead and close this ticket for you`, {
        "markdown": true
    }, function (err, message) {
        if (err) {
            console.log("WARNING: could not post message to room: " + command.message.roomId);
            return;
        }
    });
    var room_id = command.message.roomId
    console.log("room id is: " + room_id);
    console.log(command.message.roomId);
    var sys_id;

    var url_get_title = "https://api.ciscospark.com/v1/rooms/" + room_id;
    var options = {
        method: 'GET',
        url: url_get_title,
        headers: {
            'cache-control': 'no-cache',
            Authorization: 'Bearer ZjdmNGM0MTMtOTZhMS00NWNkLWFiNzktMDQ0NTMzYzE3NzExMGZhMzc5ODEtZTk4_PF84_1eb65fdf-9643-417f-9974-ad72cae0e10f'
        }
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        body = JSON.parse(body);
        var incr = body.title;
        //console.log("body is: " + body);
        console.log("space title is: " + incr);
        query = "number=" + incr;
        var options = {
            method: 'GET',
            url: 'https://dev20560.service-now.com/api/now/v1/table/incident',
            qs: {
                sysparm_query: query
            },
            headers: {
                'Postman-Token': '5ce08abd-0393-4c8c-a449-cba9cc8b9485',
                'cache-control': 'no-cache',
                Authorization: 'Basic YWRtaW46QzFzY28xMjMu',
                'Content-Type': 'application/json'
            },
            body: {
                close_code: 'Closed/Resolved By Caller',
                state: '7',
                caller_id: '6816f79cc0a8016401c5a33be04be331',
                close_notes: 'Closed by API'
            },
            json: true
        };
        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            var sys_id = body.result[0].sys_id

            close_url = 'https://dev20560.service-now.com/api/now/table/incident/'+ sys_id;
            var options = {
                method: 'PUT',
                url: close_url,
                headers: {
                    'Postman-Token': 'fd33d5c3-5f4f-4964-93c2-f57591c30d5b',
                    'cache-control': 'no-cache',
                    Authorization: 'Basic YWRtaW46QzFzY28xMjMu',
                    'Content-Type': 'application/json'
                },
                body: {
                    close_code: 'Closed/Resolved By Caller',
                    state: '7',
                    caller_id: '6816f79cc0a8016401c5a33be04be331',
                    close_notes: 'Closed by API'
                },
                json: true
            };
            console.log("close url is: "+close_url);
            request(options, function (error, response, body) {
                if (error) throw new Error(error);

                console.log("dit is: " + body);
            });

        });



    });








});