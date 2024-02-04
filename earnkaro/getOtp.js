const client = require("../database/redis");
const GetDelay = require("../utils/earnkaro/getDelay");
const GetcrsfToken = require("./helper/getcrsfToken");
const InitialReq = require("./helper/initialreq");
const Requestotp = require("./helper/requestOtp");

async function GetOtpforEarnkaro(phone) {
    try {

        await client.del('earnkaroStatus')
        const { status, data } = await InitialReq()
        if (!status == 200) return { success: false, data, status }
        await sleep(GetDelay(1000, 3000))

        await GetcrsfToken()
        await sleep(GetDelay(1000, 3000))
        const { data: { code }, status: crsfStatus } = await GetcrsfToken()
        if (!crsfStatus == 200) return { success: false, data, status }

        const { data: otpres, status: otpstats } = await Requestotp(code, phone)
        if (!otpstats == 200) { console.log(otpres, otpstats) }

        return { data: otpres, status: otpstats }
    } catch (error) {
        console.log(error)
    }

}


const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
module.exports = GetOtpforEarnkaro;