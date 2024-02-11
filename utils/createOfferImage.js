const fs = require('fs');
const cheerio = require('cheerio');
const { default: axios } = require('axios');

function CreateOfferImage({ brandname = '#Drop Notify', imageSrc, discription, store, mrpPrice, dealPrice, discountPercentage, couponCode, note }) {
    return new Promise(async (resolve, reject) => {
        try {

            if (!imageSrc || !discription || !store || !mrpPrice || !dealPrice || !discountPercentage) {
                console.log({ brandname, imageSrc, discription, store, mrpPrice, dealPrice, discountPercentage, couponCode, note })
                return resolve({ success: false, msg: 'unfilled Params' })
            }

            const { success: dataURLSuccess, dataURL } = await ConvertImagetoBinaryURL(imageSrc)
            if (!dataURLSuccess) return reject({ success: false, msg: 'cant get image binary url' })

            const htmlTemplate = fs.readFileSync('./assets/offerImageTemplate.html', 'utf8');
            const cssTemplate = fs.readFileSync('./assets/offerImageTemplate.css', 'utf8');

            const $ = cheerio.load(htmlTemplate);
            if (couponCode) $('.product-pricrDetials').append(`<div style="font-size: 14px; margin-top: 5px; color: #ffffffce;">Use Cupon : ${couponCode}</div>`)
            if (note) {
                let newNote;
                if (note == 'coupon') newNote = 'Apply discount coupon while purchase'
                else newNote = note

                $('.product-pricrDetials').append(`<div style="font-size: 11.5px; margin-top: 1px; opacity: 0.6; letter-spacing: 0.6px;">• ${newNote}</div>`)
            }

            const modifiedhtmlTemplate = $.html();
            const RenderedHtmlTemplate = modifiedhtmlTemplate
                .replace('$BrandName', brandname)
                .replace('$product-imagesrc', dataURL)
                .replace('$product-discription', discription.length > 80 ? discription.slice(0, 80) + '...' : discription)
                .replace('$product-StoreName', `${store.charAt(0).toUpperCase()}${store.slice(1)}`)
                .replace('$product-mrpPrice', `${mrpPrice} Rs`)
                .replace('$product-dealPrice', `${dealPrice} Rs`)
                .replace('$product-discount', `${discountPercentage} %`)

            const params = {
                html: RenderedHtmlTemplate,
                css: cssTemplate
            }
            const headers = { responseType: 'URL' }
            const { data: { success, src } } = await axios.post('https://html-to-image-fkc0.onrender.com/api/htmltojpegwithselecter', params, { headers })

            resolve({ success, src })
        } catch (error) {
            reject(error)
        }
    })
}

async function ConvertImagetoBinaryURL(imagesrc) {
    try {
        const response = await axios.get(imagesrc, { responseType: 'arraybuffer' });

        const imageBuffer = Buffer.from(response.data);
        const dataURL = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
        return { success: true, dataURL }
    } catch (error) {
        console.error('Error downloading image:', error.message);
        return { success: false, dataURL: null }
    }

}

module.exports = CreateOfferImage;
