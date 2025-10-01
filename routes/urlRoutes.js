const express=require('express');
const router=express.Router();
const { createShortUrl,redirectToOriginal,getUrlAnalytics,getAllUrls}= require('../controllers/urlController');
const {validateUrl,validateShortCode,validateCustomAlias}=require('../middleware/validation');
const {createUrlLimiter,analyticsLimiter}=require('../middleware/security');


// health check endpoint
router.get('/health',(req,res)=>{
    const {isRedisEnabled}=require('../config/redis');
    res.json({
        status:'OK',
        redis:isRedisEnabled()? 'Connected' : 'Not Available',
        database:'Connected',
        timestamp: new Date().toISOString()
    });
});

router.post('/shorten',createUrlLimiter,validateUrl,validateCustomAlias,createShortUrl);
router.get('/analytics/:shortCode',analyticsLimiter,validateShortCode,getUrlAnalytics);
router.get('/urls',analyticsLimiter,getAllUrls);

router.get('/:shortCode',validateShortCode,redirectToOriginal);
module.exports=router;
