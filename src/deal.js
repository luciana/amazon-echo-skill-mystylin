var config = require('./config'),
	https = require('https');

var Deal = function(){
  this.id = 0;
  this.name = "";
  this.description ="";
  this.imageUrl = "";
  this.treatment = "";
  this.expireDateTime = 0;
};

Deal.prototype.get = function(){
	var self = this;
    return new Promise(function(resolve, reject) {
        var options = {
              hostname: config.host_name,
              path: '/api/Deals',
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'api_key':config.api_key,
                'Accept': 'application/json'
              }
            };

        var req = https.get(options, function(res) {
            console.log('GET USER STATUS: ' + res.statusCode);
            res.setEncoding('utf8');
            
            if (res.statusCode < 200 || res.statusCode > 299) {
                reject(new Error('Failed to load page, status code: ' + res.statusCode));
            }

            var body = [];
            res.on('data', function (data){
                body.push(data);
            });
            res.on('end', function () {
              try{
                  a=JSON.parse(body);
                  this.hasUser = true;
              }catch(e){
                  console.log("ERROR getting Deals response",e);
                  a = [];
              }
              resolve(a);
            });
        });
        req.on('error', function (err) {
            reject(err);
        });
    });
};



module.exports = Deal;