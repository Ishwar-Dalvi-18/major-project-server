import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
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
    }
})

export const User = mongoose.model("user",UserSchema);