import mongoose from "mongoose";

const purchasedProductsSchema = new mongoose.Schema({
    customer_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
    },
    image:{
        type : String,
        required:true,
    },
    name: {
        type: String,
        required: true,
    },
    quantity: {
        type: String,
        required: true,
    },
    amount: {
        type: String,
        required: true,
    },
    sellername : {
        type:String,
        required: true
    },
    sellercontact: {
        type: Number,
        required: true
    },
    selleremail: {
        type: String,
        required: true
    }
}, { timestamps: true, })

export const PurchasedProduct = mongoose.model("purchasedproduct",purchasedProductsSchema);