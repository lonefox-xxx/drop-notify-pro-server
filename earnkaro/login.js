const client = require("../database/redis");
const GetcrsfToken = require("./helper/getcrsfToken");
const VerifyOtp = require("./helper/verifyOtp");

async function LogintoEarnkaro(phone, otp) {
    const { data: { code }, status: crsfStatus } = await GetcrsfToken()
    if (!crsfStatus == 200) return { success: false, data, status }
    const { data, status } = await VerifyOtp(phone, otp, code)
    if (status != 200) return { data, status }

    await client.set('earnkaroStatus', 'logined')
    return { data, status }
}

module.exports = LogintoEarnkaro;