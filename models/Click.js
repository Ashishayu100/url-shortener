const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
    shortCode: {
        type: String,
        required: true,
        index: true
    },
    referrer: {
        type: String,
        default: 'Direct'
    },
    userAgent: {
        type: String
    },
    ipAddress: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient queries
clickSchema.index({ shortCode: 1, timestamp: -1 });

module.exports = mongoose.model('Click', clickSchema);