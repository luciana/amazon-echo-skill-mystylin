var config = require('./config'),
    https = require('https');

/**
 * This is a small wrapper client for the Alexa Address API.
 * curl -v -X GET "http://developer.mystylin.com/v1/deals/search?treatment=nails&distance=10&zip=44077";
 */
class DealService {
    /**
     * Constructor method empty.
     */
    constructor() {}


    searchDeal(postalCode, treatment){
        var url = '/v1/deals/search?distance=100&';
        if (treatment){
            url += treatment;
        }
        if (postalCode){
            url += '&zip='+postalCode;
        }
        var url = '/v1/deals/search?treatment=nails&distance=100&zip=44124';
        var options = this.__getRequestOptions(url,
            'developer.mystylin.com',
            '');
        return new Promise((fulfill, reject) => {
            this.__handleDealApiRequest(options, fulfill, reject);
        });
    }
    
    /**
     * This will make a request to the Deal API in azure
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
            console.log('GET DEAL STATUS: ' + res.statusCode);
            res.setEncoding('utf8');
            
            if (res.statusCode < 200 || res.statusCode > 299) {
                reject(new Error('FAILED TO LOAD API, STATUS CODE: ' + res.statusCode));
            }

            var body = [];
            var dealResponse ={};
            res.on('data', function (data){
                body.push(data);
            });
            res.on('end', function () {
              try{
                  var responsePayloadObject = body;
                  dealResponse = {
                        statusCode: res.statusCode,
                        deal: JSON.parse(body)
                    };
              }catch(e){
                  console.log("ERROR GETTING DEALS API RESPONSE",e);
                  dealResponse = {};
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
               // 'Content-Type': 'application/json',
                'api_key': api_key,
               // 'Accept': 'application/json'
              }
            };
    }
}

module.exports = DealService;