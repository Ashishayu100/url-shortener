const Url = require('../models/Url');
const Click = require('../models/Click');
const crypto = require('crypto');
const { getCache, setCache, deleteCache } = require('../config/redis');

// Generate a random short code
const generateShortCode = () => {
    return crypto.randomBytes(4).toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 6);
};

// Validate URL format
const isValidUrl = (string) => {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (err) {
        return false;
    }
};

// Create short URL with caching
const createShortUrl = async (req, res) => {
    const { originalUrl, customAlias } = req.body;

    if (!originalUrl) {
        return res.status(400).json({ error: 'URL is required' });
    }

    if (!isValidUrl(originalUrl)) {
        return res.status(400).json({ error: 'Invalid URL format' });
    }

    try {
        // Check if URL already exists
        let url = await Url.findOne({ originalUrl });
        
        if (url) {
            return res.json({
                message: 'URL already shortened',
                shortUrl: url.shortUrl,
                shortCode: url.shortCode
            });
        }

        // Handle custom alias or generate random
        let shortCode;
        if (customAlias) {
            const existing = await Url.findOne({ shortCode: customAlias });
            if (existing) {
                return res.status(400).json({ error: 'This custom alias is already taken' });
            }
            shortCode = customAlias;
        } else {
            let codeExists = true;
            while (codeExists) {
                shortCode = generateShortCode();
                const existingUrl = await Url.findOne({ shortCode });
                if (!existingUrl) {
                    codeExists = false;
                }
            }
        }

        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const shortUrl = `${baseUrl}/${shortCode}`;

        // Save to database
        url = new Url({
            originalUrl,
            shortCode,
            shortUrl,
            isCustom: !!customAlias
        });

        await url.save();

        // Cache the new URL
        await setCache(`url:${shortCode}`, {
            originalUrl: url.originalUrl,
            shortCode: url.shortCode
        }, 3600);

        res.status(201).json({
            message: 'Short URL created successfully',
            shortUrl: url.shortUrl,
            shortCode: url.shortCode,
            isCustom: url.isCustom
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Redirect with caching
const redirectToOriginal = async (req, res) => {
    const { shortCode } = req.params;

    try {
        // Check cache first
        const cached = await getCache(`url:${shortCode}`);
        
        let url;
        if (cached) {
            console.log('Cache hit for:', shortCode);
            url = cached;
            
            // Update stats asynchronously
            Url.findOneAndUpdate(
                { shortCode },
                { 
                    $inc: { clicks: 1 },
                    lastAccessed: Date.now()
                }
            ).exec();
        } else {
            console.log('Cache miss for:', shortCode);
            const urlDoc = await Url.findOne({ shortCode });
            
            if (!urlDoc) {
                return res.status(404).json({ error: 'URL not found' });
            }
            
            url = urlDoc;
            
            urlDoc.clicks += 1;
            urlDoc.lastAccessed = Date.now();
            await urlDoc.save();
            
            await setCache(`url:${shortCode}`, {
                originalUrl: urlDoc.originalUrl,
                shortCode: urlDoc.shortCode
            }, 3600);
        }

        // Store click data asynchronously
        const clickData = new Click({
            shortCode,
            referrer: req.get('Referrer') || 'Direct',
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip || req.connection.remoteAddress
        });
        clickData.save();

        res.redirect(url.originalUrl);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get analytics for a specific URL
const getUrlAnalytics = async (req, res) => {
    const { shortCode } = req.params;

    try {
        const cacheKey = `analytics:${shortCode}`;
        const cached = await getCache(cacheKey);
        
        if (cached) {
            return res.json(cached);
        }

        const url = await Url.findOne({ shortCode });

        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }

        const recentClicks = await Click.find({ shortCode })
            .sort({ timestamp: -1 })
            .limit(10)
            .select('-_id -__v');

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const clicksByDay = await Click.aggregate([
            {
                $match: {
                    shortCode,
                    timestamp: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const referrerStats = await Click.aggregate([
            { $match: { shortCode } },
            {
                $group: {
                    _id: "$referrer",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const analyticsData = {
            url: {
                originalUrl: url.originalUrl,
                shortUrl: url.shortUrl,
                shortCode: url.shortCode,
                totalClicks: url.clicks,
                createdAt: url.createdAt,
                lastAccessed: url.lastAccessed,
                isCustom: url.isCustom
            },
            analytics: {
                recentClicks,
                clicksByDay,
                topReferrers: referrerStats
            }
        };

        await setCache(cacheKey, analyticsData, 300);

        res.json(analyticsData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all URLs
const getAllUrls = async (req, res) => {
    try {
        const urls = await Url.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .select('-_id -__v');

        res.json({ urls });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    createShortUrl,
    redirectToOriginal,
    getUrlAnalytics,
    getAllUrls
};