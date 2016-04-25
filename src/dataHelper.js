'use strict';

var MYSTYLIN_DB_TABLE_NAME = "myStylinData";
var dynasty = require('dynasty')({});
var myStylinTable = function() {
  return dynasty.table(MYSTYLIN_DB_TABLE_NAME);
};

/**
* CONSTRUCTOR 
*/
var dataHelper = function () {
};

/**
 * Create a new table with user id as primary key in DynamoDB
 * This method requires Dynasty module
 * The user id is primary key
 */
dataHelper.prototype.createMyStylinDataTable = function() {
  return dynasty.describe(MYSTYLIN_DB_TABLE_NAME)
    .catch(function(error) {
      return dynasty.create(MYSTYLIN_DB_TABLE_NAME, {
        key_schema: {
          hash: ['userId', 'string']
        }
      });
    });
};

/**
* Stores document entry into nosql table
*/
dataHelper.prototype.storeMyStylinData = function(userId, myStylinData) {
  return myStylinTable().insert({
    userId: userId,
    data: myStylinData
  }).catch(function(error) {
    console.log(error);
  });
};

/**
* Reads data from nosql table
*/
dataHelper.prototype.readMyStylinData = function(userId) {
  return myStylinTable().find(userId)
    .then(function(result) {
      return result;
    })
    .catch(function(error) {
      console.log(error);
    });
};

module.exports = dataHelper;