const mongoose = require("mongoose");

const mongoURI = 'mongodb+srv://dhruwang19:dhruwang@cluster0.ciyl7y8.mongodb.net/movieWiki'

const connectToMongo=()=>{
    mongoose.connect(mongoURI,()=>{
        console.log('connected to mongoose successfully')
    })
}

module.exports = connectToMongo