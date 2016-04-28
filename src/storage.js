/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

'use strict';
var AWS = require("aws-sdk");
var MYSTYLIN_DB_TABLE_NAME = "myStylinData";

var storage = (function () {
    var dynamodb = new AWS.DynamoDB({apiVersion: '2016-04-30'});

    /*
     * The Game class stores all game states for the user
     */
    function DataHelper(session, data) {
        if (data) {
            this.data = data;
        } else {
            this.data = {                
                location: {zip:{}}
            };
        }
        this._session = session;
    }

    DataHelper.prototype = {       
        save: function (callback) {
            dynamodb.putItem({
                TableName: MYSTYLIN_DB_TABLE_NAME,
                Item: {
                    userId: {
                        S: this._session.user.userId
                    },
                    Data: {
                        S: JSON.stringify(this.data)
                    }
                }
            }, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                }
                if (callback) {
                    callback();
                }
            });
        }
    };

    return {
        read: function (session, callback) {
           
            dynamodb.getItem({
                TableName: MYSTYLIN_DB_TABLE_NAME,
                Key: {
                    userId: {
                        S: session.user.userId
                    }
                }
            }, function (err, data) {
                var currentGame;
                if (err) {
                    console.log(err, err.stack);
                    currentGame = new DataHelper(session);
                   
                    callback(currentGame);
                } else if (data.Item === undefined) {
                    currentGame = new DataHelper(session);
                  
                    callback(currentGame);
                } else {
                    console.log('get game from dynamodb=' + data.Item.Data.S);
                    currentGame = new DataHelper(session, JSON.parse(data.Item.Data.S));
                  
                    callback(currentGame);
                }
            });
        },
        newStorage: function (session) {
            return new DataHelper(session);
        }
    };
})();
module.exports = storage;