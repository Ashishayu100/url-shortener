const redis = require('redis');

let redisClient = null;
let redisEnabled = false;

const initRedis = async () => {
    try {
        redisClient = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                connectTimeout: 5000,
                reconnectStrategy: (retries) => {
                    if (retries > 3) {
                        console.log('Redis: Too many reconnection attempts');
                        redisEnabled = false;
                        return false;
                    }
                    return retries * 100;
                }
            }
        });

        redisClient.on('error', (err) => {
            console.error('Redis Error:', err.message);
            redisEnabled = false;
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis Connected Successfully');
            redisEnabled = true;
        });

        redisClient.on('ready', () => {
            console.log('✅ Redis is ready to use');
            redisEnabled = true;
        });

        await redisClient.connect();
        
        await redisClient.ping();
        console.log('✅ Redis PING successful');
        redisEnabled = true;
        
    } catch (error) {
        console.log('⚠️ Redis not available - continuing without caching');
        console.log('Error:', error.message);
        console.log('The app will work fine without caching!');
        redisClient = null;
        redisEnabled = false;
    }
};

const getCache = async (key) => {
    if (!redisEnabled || !redisClient) return null;
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Redis GET error:', error.message);
        return null;
    }
};

const setCache = async (key, value, expireSeconds = 3600) => {
    if (!redisEnabled || !redisClient) return;
    try {
        await redisClient.setEx(key, expireSeconds, JSON.stringify(value));
    } catch (error) {
        console.error('Redis SET error:', error.message);
    }
};

const deleteCache = async (key) => {
    if (!redisEnabled || !redisClient) return;
    try {
        await redisClient.del(key);
    } catch (error) {
        console.error('Redis DELETE error:', error.message);
    }
};

module.exports = {
    initRedis,
    getCache,
    setCache,
    deleteCache,
    isRedisEnabled: () => redisEnabled
};