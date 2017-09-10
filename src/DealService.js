var config = require('./config'),
    https = require('https');

/**
 * This is a small wrapper client for the Alexa Address API.
 * curl -v -X GET "http://developer.mystylin.com/v1/deals/search?treatment=nails&distance=10&zip=44077";
 * curl -v -X GET "http://developer.mystylin.com/v1/deals/search?treatment=massage&distance=10&lat=41.383063&lon=-81.4498717&per_page=1&page=1"\;
 * curl -v -X GET "http://developer.mystylin.com/v1/deals/search?treatment=hair&distance=50000&lat=41.4932198&lon=--81.46085599999999&per_page=1&page=1"\;
 */
class DealService {
    /**
     * Constructor method empty.
     */
    constructor() {}

    searchDeal(address, treatment){
        var url = '/v1/deals/search?distance=100&per_page=5&page=1';
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
          //var url = '/v1/deals/search?treatment=nails&distance=100&zip=44124';
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
            if (res.statusCode < 200 || res.statusCode > 299) {
                reject(new Error('FAILED TO LOAD API, STATUS CODE: ' + res.statusCode));
            }

            var body = [];          
            res.on('data', function (data){
                body.push(data);
            });
            res.on('end', function () {
              try{                
                var raw = JSON.parse(body);
                console.log("DEAL API RAW RESPONSE", raw);
                 if(raw.status == false){ //missing information
                    var dealResponse = {
                        statusCode: 404,
                        message: raw.message,
                        deal: raw
                    };
                 }else{
                    var results = JSON.parse(body[0]).results;
                    //console.log(' DEAL API RESPONSE RESULTS: ' + results);
                    if (results){
                        var dealResponse = {
                        statusCode: res.statusCode,
                        message: "",
                        deal: results
                        };
                    }else{ //no deals found - no content
                        var dealResponse = {
                            statusCode: 204,
                            message: "",
                            deal: {}
                        };
                    }
                    
                 }   
              }catch(e){
                  var dealResponse = {
                        statusCode: 500,
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