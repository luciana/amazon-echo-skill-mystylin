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
        var options = this.__getRequestOptions('/v1/deals/search?treatment=nails&distance=10&zip=44077',
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
        https.get(requestOptions, (response) => {
            console.log(`DealAPI responded with a status code of : ${response.statusCode}`);

            response.on('data', (data) => {
                //var responsePayloadObject = JSON.parse(data);
                var responsePayloadObject = data;


                var dealResponse = {
                    statusCode: response.statusCode,
                    deal: JSON.parse(responsePayloadObject)
                };

                fulfill(dealResponse);
            });
        }).on('error', (e) => {
            console.error(e);
            reject();
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