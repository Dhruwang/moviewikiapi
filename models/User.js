const mongoose = require('mongoose')
const { Schema } = mongoose;

const UserSchema = new Schema({
  name :{
    type:String,
    required:true
  },
  email :{
    type:String,
    required:true,
    unique:true
  },
  password :{
    type:String,
    required:true
  },
  movieId:{
    type:[Number]
  },
  poster:{
    type:[String]
  }
});
const User = mongoose.model('users',UserSchema)
module.exports = User