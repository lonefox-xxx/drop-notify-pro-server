const axios = require('axios');
const { saveDetials } = require('./handleToken');
function LogintoAffliaters({ email, password }) {
    return new Promise(async (resolve, reject) => {
        try {
            const apiUrl = 'https://ekaro-api.affiliaters.in/api/users/login';
            const requestBody = {
                email,
                password
            };

            const { data, status } = await axios.post(apiUrl, requestBody)
            await saveDetials(data)
            resolve(status)
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = LogintoAffliaters