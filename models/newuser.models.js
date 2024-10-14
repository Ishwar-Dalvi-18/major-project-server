import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    image:{
        type:String
    },
    name:{
        type: mongoose.Schema.Types.String,
        require : true,
    },
    email : {
        type : mongoose.Schema.Types.String,
        required : true,
        unique : true,
    },
    password : {
        type : mongoose.Schema.Types.String,
        required : true,
    },
    country :{
        type: mongoose.Schema.Types.String,
        required : true
    },
    state : {
        type : mongoose.Schema.Types.String,
        required : true
    },
    contact : {
        type : mongoose.Schema.Types.Number,
        required : true
    },
    address : {
        type : mongoose.Schema.Types.String,
        required:true
    },
    role:{
        type: mongoose.Schema.Types.String,
        required:true
    }
})

export const NewUser = mongoose.model("newuser",userSchema);