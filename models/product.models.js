import mongoose from "mongoose";



const quantitySchema = new mongoose.Schema({
    count:{
        type:Number,
        required:true
    },
    unit:{
        type:String,
        required:true
    }
},{_id:false})


const priceSchema = new mongoose.Schema({
    amount:{
        type:Number,
        required:true,
    },
    currency:{
        type:String,
        required:true
    },
    unit:{
        type:String,
        required:true
    }
},{_id:false})
const productSchema = new mongoose.Schema({
    image:{
        type : String,
        required:true,
    },
    name:{
        type:String,
        required:true
    },
    quantity: quantitySchema,
    price:priceSchema,
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"newuser"
    }
},{timestamps:true})

export const Product = mongoose.model("product",productSchema);