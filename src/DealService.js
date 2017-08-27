var config = require('./config'),
    https = require('https');

/**
 * This is a small wrapper client for the Alexa Address API.
 */
class DealService {
    /**
     * Constructor method empty.
     */
    constructor() {}
    
    /**
     * This will make a request to the Deal API in azure
     * It will retrieve a full list of deals.
     * @return {Promise} promise for the request in flight.
     */
    getDeals() {
        const options = this.__getRequestOptions(
            `/api/Deals`);

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
                let responsePayloadObject = JSON.parse(data);

                var dealResponse = {
                    statusCode: response.statusCode,
                    deal: responsePayloadObject
                };

                fulfill(deviceAddressResponse);
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
    __getRequestOptions(path) {
        return {
              hostname: config.host_name,
              path: path,
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'api_key':config.api_key,
                'Accept': 'application/json'
              }
            };
    }
}

module.exports = DealService;