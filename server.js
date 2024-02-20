require('dotenv').config({ path: './.env' });
const express = require('express');
const client = require('./database/redis');
const cors = require('cors');
const GetOtpforEarnkaro = require('./earnkaro/getOtp');
const LogintoEarnkaro = require('./earnkaro/login');
const getallOffers = require('./earnkaro/helper/getallOffers');
const GetEarnkaroProductLink = require('./earnkaro/helper/getProductLink');
const CheckandUpdateEarnkaroOffers = require('./earnkaro/helper/checkandupdateearnoffers');
const LogintoAffliaters = require('./earnkaro/createlinkforAllproducts/logintoAffliaters');
const genarateEarnkaroLinkForProducts = require('./earnkaro/createlinkforAllproducts/genarateLinkForProducts');
const checkAndUpdateAmazonAndFlipkartOffers = require('./helpers/checkandupdateamazonandflipkartoffers');
require('./database/redis')
require('./database/mongodb')
const app = express();
const port = process.env.PORT || 3000;
// const port = 3000;

app.use(express.json())
app.use(cors({ origin: '*' }))

// Get requests
app.get('/', (req, res) => res.send('OK'));
app.get('/earnkarostatus', async (req, res) => {
    try {
        const status = await client.get('earnkaroStatus')
        res.send({ success: true, status })
    } catch (error) {
        res.send({ success: true, status: null })
    }
});

app.get('/getEarnkaroOffers', async (req, res) => {
    try {
        const { data, status } = await getallOffers()
        res.send({ success: true, status, data })
    } catch (error) {
        res.send({ success: true, status: null, data: null, error })
    }
});

app.get('/getEarnkaroCookies', async (req, res) => {
    try {
        const cookies = await client.get('cookies')
        res.send({ success: true, cookies })
    } catch (error) {
        res.send({ success: true, cookies: null, data: null, error })

    }
});


// post req
app.post('/getOtp', async (req, res) => {
    try {
        const { phone = null, password = null } = req.body
        if (!phone) return res.send({ success: false, msg: 'phone required', status: 400, code: 'error' })
        if (password != process.env.PASSWORD) return res.send({ success: false, msg: 'incorrect password', status: 400, code: 'error' })
        const { data: { code, msg }, status } = await GetOtpforEarnkaro(phone)
        res.send({ success: true, code, msg, status })
    } catch (error) {
        res.send({ success: false, status: 400 })
    }
})

app.post('/login', async (req, res) => {
    try {
        const { phone = null, otp = null, password = null } = req.body
        if (!phone || !otp) return res.send({ success: false, msg: 'phone and otp required', status: 400, code: 'error' })
        if (password != process.env.PASSWORD) return res.send({ success: false, msg: 'incorrect password', status: 400, code: 'error' })
        const { data: { code, msg }, status } = await LogintoEarnkaro(phone, otp)
        res.send({ success: true, code, msg, status })
    } catch (error) {
        res.send({ success: false, status: 400 })
    }
})

app.post('/getEarnkaroProductLink', async (req, res) => {
    try {
        const { itemId, itemProductId, itemType = null } = req.body
        if (!itemId || !itemProductId) return res.send({ success: false, msg: 'temId and itemProductId are required', status: 400, code: 'error' })
        const { data, status } = await GetEarnkaroProductLink({ itemId, itemProductId, itemType })
        res.send({ success: true, data, status })
    } catch (error) {
        res.send({ success: false, data: error, status: 400 })
    }
})

app.post('/logintoaffliaters', async (req, res) => {
    try {
        const { email = null, password = null } = req.body;
        if (!email || !password) return res.send({ success: false, msg: 'Eamil and Password are required', status: 400, code: 'error' });
        const status = await LogintoAffliaters({ email, password });
        res.send({ success: false, status })
    } catch (error) {
        res.send({ success: false, error, status: 400 })
    }
})

app.post('/genarateLinkforProducts', async (req, res) => {
    try {
        const { link = null } = req.body
        if (!link) return res.send({ success: false, msg: 'Link is required', status: 400 });
        const { data, status } = await genarateEarnkaroLinkForProducts(link)
        res.send({ success: true, data, msg: 'success', status });
    } catch (error) {
        res.send({ success: false, error, status: 400 });
    }
})
// Path request
app.patch('/checkandupdateearnkarooffers', async (req, res) => {
    const u = await CheckandUpdateEarnkaroOffers()
    res.send(u)
})
app.patch('/checkandupdateAlloffers', async (req, res) => {
    const u = await checkAndUpdateAmazonAndFlipkartOffers()
    res.send(u)
})

app.post('/clearredis', (req, res) => {
    const key = req.body.key
    client.del(key).then((d) => {
        res.send('ok')
    })
})

app.get('/getoffers', require('./routes/fetchallOffers'))
app.post('/savealert', require('./routes/saveAlert'))
app.get('/getalert', require('./routes/getalert'))
app.delete('/dropalert', require('./routes/dropAlert'))
app.post('/contactus', require('./routes/contactUs'))

app.listen(port, async () => {
    console.log(`Server running on port: ${port}`);
});

