const axios = require('axios');
const { getDetials } = require('./handleToken');

function genarateEarnkaroLinkForProducts(link) {
    return new Promise(async (resolve, reject) => {
        try {
            const { token } = await getDetials()
            const apiUrl = 'https://ekaro-api.affiliaters.in/api/converter';
            const requestBody = { deal: `${link}`, convert_option: 'convert_share' };

            const { data, status } = await axios.post(apiUrl, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })

            resolve({ data, status })
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = genarateEarnkaroLinkForProducts;