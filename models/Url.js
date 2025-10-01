const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    originalUrl: {
        type: String,
        required: true,
    },
    shortCode: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    shortUrl: {
        type: String,
        required: true,
    },
    clicks: {
        type: Number,
        default: 0
    },
    isCustom: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastAccessed: {
        type: Date,
        default: null
    },
    expiresAt: {
        type: Date,
        default: null
    }
});

// TTL index for automatic deletion of expired URLs
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Url', urlSchema);