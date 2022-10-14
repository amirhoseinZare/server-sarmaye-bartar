const redis = require('redis')

let client

exports.connectRedis = async () => {
    client = redis.createClient({url:'redis://:ESv6jNCBdxyUCETdB12X06he@linda.iran.liara.ir:31244/0'});
    client.on('error', err => {
        console.log('redis client got error', err);
    });
    await client.connect();
    console.log('redis connected')
};

exports.getRedisClient = () => {
    if (!client) {
        throw new Error('you must firs connect to redis ');
    }
    return client;
};
