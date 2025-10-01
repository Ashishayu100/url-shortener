const express=require('express');
const dotenv=require('dotenv');
dotenv.config();
const path=require('path');
const connectDB=require('./config/database');
const {initRedis}=require('./config/redis');
const urlRoutes=require('./routes/urlRoutes');
const {securityHeaders,apiLimiter}=require('./middleware/security');



// create express app
const app=express();

//connect and initialize to database
connectDB();
initRedis();

// security middleware
app.use(securityHeaders);

//middleware to parse json
app.use(express.json({limit:'10kb'}));

app.use(express.urlencoded({extended:true,limit:'10kb'}));

app.use(express.static('public'));

//Routes
app.use('/api',apiLimiter,urlRoutes);

app.get('/:shortCode', (req, res, next) => {
    // Let API routes handle this
    urlRoutes.handle(req, res, next);
});

// 404 handler
app.use((req,res)=>{
    res.status(404).json({error:'Route not found'});
});

// Error handler
app.use((err,req,res,next)=>{
    console.error(err.stack);
    res.status(err.status||500).json({
        error:process.env.NODE_ENV==='production'
        ? 'Something went wrong!'
        : err.message
    });
});

const PORT=process.env.PORT||5000;

app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
    
});