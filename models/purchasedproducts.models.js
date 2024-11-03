import mongoose from "mongoose";

const deliveryAddressSchema = new mongoose.Schema({
    state:{
        type:String,
        required:true,
        minlength:[3,'state name should be minimumm of 3 letters']
    },
    city:{
        type : String,
        required: true,
    },
    region:{
        type: String,
        required: true
    },
    landmark:{
        type: String,
        required: true
    },
    pincode: {
        type: Number,
        min:[6,"Pincode must be of 6 digits"],
    }
},{_id:false})
const purchasedProductsSchema = new mongoose.Schema({
    customer_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "newuser",
        required: true,
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
    },
    seller_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"newuser",
        required:true,
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
    },
    addressofdelivery: {
        type:deliveryAddressSchema,
        required: true
    },
    viewpermission:{
        type:{
            customer:{
                type: Boolean,
                required: true
            },
            farmer:{
                type: Boolean,
                required: true
            }
        },
        required: true,
        _id:false
    },
    deletedbyfarmer:{
        type:Boolean,
        required:true
    },
    statusofproduct:{
        type:{
            shortdescription:{
                type:String,
                enum:["Order Not Viewed By Seller","Order Viewed By Seller","Order Dispatched","Order Completed"]
            },
            longdescription:{
                type:String,
            }
        },
        default:{
            shortdescription:"Order Not Viewed By Seller",
            longdescription:"",
        },
        _id:false
    }
}, { timestamps: true, })

export const PurchasedProduct = mongoose.model("purchasedproduct",purchasedProductsSchema);