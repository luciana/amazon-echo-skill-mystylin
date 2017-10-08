'use strict';

var config = require('./config'),
    https = require('https');

/**
 * This is a small wrapper client for the Deal Service API.
*/
class DealService {
    /**
     * Constructor method empty.
     */
    constructor() {}

    searchDeal(address, treatment){
        var url = '/v1/deals/search?distance=1000&per_page=5&page=1';
        if (treatment){
            url += '&treatment='+treatment;
        }
        if(address){
          if (address.lat && address.lng){
              url += '&lat='+address.lat+'&lon='+address.lng;
          }
          if (address.postalCode){
            url += '&zip='+address.postalCode;
          }
          console.log("deal api url ", url);
          var options = this.__getRequestOptions(url,
              'developer.mystylin.com',
              '');
          return new Promise((fulfill, reject) => {
              this.__handleDealApiRequest(options, fulfill, reject);
          });
        }
    }
    
    /**
     * This will make a request to the Deal API 
     * It will retrieve a full list of deals.
     * @return {Promise} promise for the request in flight.
     */
    getDeals() {
        const options = this.__getRequestOptions('/api/Deals', config.host_name, config.api_key);

        return new Promise((fulfill, reject) => {
            this.__handleDealApiRequest(options, fulfill, reject);
        });
    }

    /**
     * This is a helper method that makes requests to the Deals API and handles the response
     * in a generic manner. It will also resolve promise methods.
     * @param requestOptions
     * @param fulfill
     * @param reject
     * @private
     */
    __handleDealApiRequest(requestOptions, fulfill, reject) {
        var req = https.get(requestOptions, function(res) {
            res.setEncoding('utf8');

            var body = [];
            res.on('data', function (data){
                body.push(data);
            });
            res.on('end', function () {
              try{ 
                var raw = JSON.parse(body);
                console.log("DEAL API RAW RESPONSE", raw);
                 if(raw.status == false){ //missing information | no deals found 404
                    var dealResponse = {
                        statusCode: res.statusCode,
                        message: raw.message,
                        deal: raw
                    };
                 }else{
                    var results = JSON.parse(body[0]).results;
                    if (results){ // 200
                        var dealResponse = {
                        statusCode: res.statusCode,
                        message: "",
                        deal: results
                        };
                    }else{ //no content 204
                        var dealResponse = {
                            statusCode: res.statusCode,
                            message: "",
                            deal: {}
                        };
                    }                    
                 }   
              }catch(e){ //500
                  var dealResponse = {
                        statusCode: res.statusCode,
                        message: e,
                        deal: {}
                    };
              }
              fulfill(dealResponse);
            });
        });

        req.on('error', function (err) {
            reject(err);
        });
    }

    /**
     * Private helper method for retrieving request options.
     * @private
     */
    __getRequestOptions(path, host_name, api_key) {
        return {
              hostname: host_name,
              path: path,
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'api_key': api_key,
                'Accept': 'application/json'
              }
            };
    }
}

module.exports = DealService;