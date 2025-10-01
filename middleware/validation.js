const { body, param, validationResult } = require('express-validator');

// URL validation rules
const validateUrl = [
    body('originalUrl')
        .trim()
        .notEmpty().withMessage('URL is required')
        .isURL({
            protocols: ['http', 'https'],
            require_protocol: true,
        }).withMessage('Please provide a valid HTTP/HTTPS URL'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({ 
                error: errors.array()[0].msg,
                details: errors.array() 
            });
        }
        next();
    }
];

// Custom alias validation
const validateCustomAlias = [
    body('customAlias')
        .optional()
        .trim()
        .isLength({ min: 3, max: 20 }).withMessage('Alias must be 3-20 characters')
        .matches(/^[a-zA-Z0-9-_]+$/).withMessage('Alias can only contain letters, numbers, hyphens, and underscores'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: errors.array()[0].msg,
                details: errors.array() 
            });
        }
        next();
    }
];

// Short code validation
const validateShortCode = [
    param('shortCode')
        .trim()
        .notEmpty().withMessage('Short code is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: errors.array()[0].msg 
            });
        }
        next();
    }
];

module.exports = {
    validateUrl,
    validateCustomAlias,
    validateShortCode
};