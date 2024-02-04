const { createClient } = require('redis');

const client = createClient({
    password: 'NxEiRrZ5D4oFPESU6sIKHYNNfV1E9Nv4',
    socket: {
        host: 'redis-17056.c264.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 17056
    }
});


(async () => {
    try {
        const d = await client.connect()
    } catch (error) {
        console.log(error)
    }
})()

client.on('connect', () => {
    console.log('Connected to Redis');
});

client.on('error', (err) => {
    console.log(`Error: ${err}`);
});

module.exports = client;
