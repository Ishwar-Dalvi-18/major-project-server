import { config } from "dotenv";
config({
    path: "C:\\Users\\Ishwar Dalvi\\Desktop\\major project server\\config.env",
});
import express, { response } from "express";
import { language } from "./globals.js";
import { validate } from 'deep-email-validator';
import { Server } from "socket.io";
import mongoose from "mongoose";
import { checkSchema, matchedData, validationResult } from "express-validator";
import { userValidationSchema } from "./validation/UserValidationSchema.js";
import { compareNormalPassWithHashedPass, encryptPassword } from "./utils/passwordEncrption.js";
import { User } from "./models/user.js";
import cors from 'cors';
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import "./strategies/localStrategy.js"
import "./strategies/googleStrategy.js"
import { profileRouter } from "./routers/profileRouter.js";
import { isUserAuthenticated } from "./middlewares/isUserAuthenticated.js";
import { NewUser } from "./models/newuser.models.js";
import cookieParser from "cookie-parser";
import { Product } from "./models/product.models.js";
import { productValidation } from "./validation/productValidation.js";
import { extendedEmailValidation } from "./utils/emailValidation.js";
import { userValidationUpdate } from "./validation/userValidationUpdate.js";
import { PurchasedProduct } from "./models/purchasedproducts.models.js";
import twilio from 'twilio'
import { createRazorPayInstance } from "./utils/RazorPayUtils.js";
//password : cPfzFWUMX3nSsaeK
const port = process.env.PORT || 8000;
const app = express();

const ip = "192.168.0.224"

app.use(cors({
    origin: ["http://192.168.0.224:5173", "http://192.168.249.251:5173", `http://${ip}:5173`],
    credentials: true
}))
mongoose.connect("mongodb+srv://ishwar:cPfzFWUMX3nSsaeK@cluster0.fxllgkn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0").then(db => {
    console.log(`Connection to database successfull`);
})
// mongoose.connect("mongodb+srv://dalviishwar1817_2:CylH7tmznpY1LSqs@cluster0.5029v.mongodb.net/major-project?retryWrites=true&w=majority&appName=Cluster0").then(db => {
//     console.log(`Connection to database successfull`);
// })
app.use(express.json({
    limit: "10mb"
}));
app.use(cookieParser())
app.use(session({
    secret: "ISHWAR",
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
    },

}))

app.use(passport.initialize());
app.use(passport.session());

const httpServer = app.listen(port, ip, () => {
    console.log(`server is running on port : ${port}`);
})
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE", "PUSH"],
        allowedHeaders: true,
        credentials: true
    }
});
const connectedsockets = {}

io.on("connection", socket => {
    socket.on("sending-id", ({ id }) => {
        connectedsockets[id] = {
            socket: socket,
            otp: 0
        }
        socket.emit("id-confirmed", {})
        socket.on("disconnect", (data) => {
            connectedsockets[id] = {
                socket: null,
                otp: 0
            }
        })
    })

})

app.use("/profile", isUserAuthenticated, profileRouter)
app.get("/api/auth/google", passport.authenticate('google', { scope: ['profile', 'email'] }))
app.get("/api/auth/google/callback", passport.authenticate('google', {
    successRedirect: "http://localhost:5173/profile",
    failureRedirect: "http://localhost:5173/login"
}))

function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

const createRazorpayOrder = async(req,res,next)=>{
    try{
        const {body:{cartItems}} = req
        let total_payment_amount=0;
        cartItems.forEach(async(value)=>{
            const amount = (await Product.findOne({_id:value.id})).price.amount;
            total_payment_amount = total_payment_amount+(amount*value.quantity);
        })
        const rp_instance = createRazorPayInstance();
        const options = {
            amount:total_payment_amount,
            currency:"INR",
            receipt:"receipt_order_1"
        }
        rp_instance.orders.create(options,(err,order)=>{
            if(err){
                throw err
            }else{
                res.json({
                    response:{
                        type:true,
                        order:order
                    }
                })
            }
        });
    }catch(err){
        next(err)
    }
}

const verifyPayment = async(req,res,next)=>{
    try{
        const {body:{order_id,payment_id,signature}} = req;
        const rp_secret_key = process.env.RAZORPAY_KEY_SECRET;
        const hmac = crypto.createHmac("sha256",rp_secret_key);
        hmac.update(order_id+"|"+payment_id)
        const generatedsignature = hmac.digest("hex");
        if(generatedsignature===signature){
            res.status(200).json({
                response:{
                    type:true,
                    message:"Payment Verification Successfull"
                }
            })
        }else{
            res.status(400).json({
                response:{
                    type:false,
                    message:"Payment Verification Failed"
                }
            })
        }
    }catch(err){
        next(err)
    }
}

app.post("/api/payment/createorder",createRazorpayOrder)

app.post("/api/payment/verifypaymnet",verifyPayment)

app.get("/api/otp/:id", (req, res, next) => {
    try {
        const { params: { id } } = req
        const targetedsocket = connectedsockets;
        if (connectedsockets[id].otp === 0) {
            throw new Error("OTP Expired")
        } else {
            res.json({
                response: {
                    type: true,
                    otp: connectedsockets[id].otp
                }
            })
        }
    } catch (error) {
        next(error)
    }
})

app.post("/api/otp", async (req, res, next) => {
    try {
        const { body: { id } } = req
        const otp = generateOTP();
        if (connectedsockets[id].socket) {
            connectedsockets[id].socket.emit("otp", {
                OTP: otp
            })
            connectedsockets[id].otp = otp
            setTimeout(() => {
                connectedsockets[id].otp = 0;
            }, 1000 * 30)
        } else {
            next(new Error("User is offline"))
        }
        res.json({
            response: {
                type: true
            }
        })
    } catch (err) {
        next(err)
    }
})

app.get("/api/products/:seq", async (req, res) => {
    const { params: { seq } } = req;
    const re = new RegExp(seq, "i");
    const result = await Product.find({ name: { $regex: re } }, 'name');
    const new_result = result.map((value) => {
        return value.name.toLowerCase()

    });
    const final_result = new Set(new_result);
    const new_arr = Array.from(final_result);
    const final_arr = new_arr.map((value, index) => {
        return {
            _id: index,
            name: value
        }
    })

    res.json({
        response: {
            type: true,
            products: final_arr
        }
    })
})

app.get("/api/user/get/:id", async (req, res, next) => {
    const { params: { id } } = req;
    try {
        const user = await NewUser.findOne({ _id: id });
        res.json({
            response: {
                type: true,
                user: user,
            }
        })
    } catch (err) {
        next(err)
    }
})

app.post("/api/user/cart", async (req, res, next) => {
    try {
        const { body: { cartItem } } = req;
        req.session.cart.push(cartItem);
        res.json({
            response: {
                type: true,
                msg: "Producted added successfully to cart"
            }
        })
    } catch (err) {
        next(err)
    }

})

app.delete("/api/product/:id", async (req, res, next) => {
    try {
        const { params: { id } } = req;
        const result = await Product.deleteOne({ _id: id });
        if (result.deletedCount === 1) {
            res.json({
                response: {
                    type: true
                }
            })
        }
    } catch (err) {
        next(err)
    }
})

app.delete("/api/user/entirecart", (req, res, next) => {
    try {
        req.session.cart = [];
        res.json({
            response: {
                type: true
            }
        })
    } catch (err) {
        next(err)
    }
})

app.post("/api/user/purchased", async (req, res, next) => {
    try {
        const { body: { products, address } } = req
        const detailedProductInfo = [];
        products.forEach(async (value) => {
            const result = await Product.findOne({ _id: value.id }).populate("owner");
            detailedProductInfo.push({
                customer_id: req.user._id,
                product_id: result._id,
                image: result.image,
                name: result.name,
                quantity: (value.quantity + " " + result.price.unit),
                amount: (value.quantity * result.price.amount) + " " + result.price.currency,
                seller_id: result.owner._id,
                sellername: result.owner.name,
                sellercontact: result.owner.contact,
                selleremail: result.owner.email,
                addressofdelivery: address,
                deletedbyfarmer: false,
                viewpermission: {
                    customer: true,
                    farmer: true,
                }
            })
            const result2 = await Product.updateOne({ _id: value.id }, { $set: { quantity: { count: result.quantity.count - value.quantity, unit: result.quantity.unit } } })
        })
        let num = setInterval(async () => {
            if (detailedProductInfo.length === products.length) {
                clearInterval(num);
                const result2 = await PurchasedProduct.insertMany(detailedProductInfo);
                if (result2.length === products.length) {
                    res.json({
                        response: {
                            type: true
                        }
                    })
                } else {
                    res.json({
                        response: {
                            type: false
                        }
                    })
                }
            }
        }, 100)
    } catch (err) {
        next(err);
    }
})

app.get("/api/user/productspurchased", async (req, res, next) => {
    try {
        const result = await PurchasedProduct.find({ customer_id: req.user._id, 'viewpermission.customer': true });
        res.json({
            response: {
                type: true,
                pp: result
            }
        })
    } catch (err) {
        next(err);
    }
})


app.get("/api/farmer/productorders", async (req, res, next) => {
    try {
        const result = await PurchasedProduct.find({ seller_id: req.user._id, 'viewpermission.farmer': true }, {
            _id: 1,
            image: 1,
            name: 1,
            quantity: 1,
            amount: 1,
            statusofproduct: 1
        });
        res.json({
            response: {
                type: true,
                pp: result
            }
        })
    } catch (err) {
        next(err);
    }
})


app.get("/api/farmer/productselled", async (req, res, next) => {
    try {
        const result = await PurchasedProduct.find({ seller_id: req.user._id, 'viewpermission.farmer': false, deletedbyfarmer: false }, {
            _id: 1,
            image: 1,
            name: 1,
            quantity: 1,
            amount: 1,
            statusofproduct: 1
        });
        res.json({
            response: {
                type: true,
                pp: result
            }
        })
    } catch (err) {
        next(err);
    }
})

app.get("/api/farmer/product/:id", async (req, res, next) => {
    try {
        const { params: { id } } = req
        const result = await PurchasedProduct.findOne({
            _id: id
        }).populate("customer_id");
        res.json({
            response: {
                type: true,
                product: result
            }
        })
    } catch (err) {
        next(err)
    }
})

app.get("/api/farmer/orderstatus/:_id", async (req, res, next) => {
    try {
        const { params: { _id } } = req
        const result = await PurchasedProduct.findOne({ _id: _id }, { _id: 0, statusofproduct: 1 });
        res.json({
            response: {
                type: true,
                shortdescription: result.statusofproduct.shortdescription,
                longdescription: result.statusofproduct.longdescription
            }
        })
    } catch (err) {
        next(err)
    }
})

app.patch("/api/farmer/orderstatus/:id", async (req, res, next) => {
    try {
        const { params: { id } } = req
        const { body: { shortdes, longdes } } = req
        const result = await PurchasedProduct.updateOne({ _id: id }, { $set: { 'statusofproduct.shortdescription': shortdes, "statusofproduct.longdescription": longdes } })
        res.json({
            response: {
                type: true
            }
        })
    } catch (err) {
        next(err)
    }
})

app.post("/api/sms/deliverystatus", async (req, res, next) => {
    try {
        const { body: { to, message } } = req
        const accountSid = 'AC47e9dec4925afa08406d1d01a8233bd7';
        const authToken = '26b59d718beab59be98b9fadddf9a720';
        const client = twilio(accountSid, authToken)
        client.messages
            .create({
                from: '+15095607426',
                to: `+91${to}`,
                body: message
            })
            .then(message => {
                res.json({
                    response: {
                        type: true
                    }
                })
            })

    } catch (err) {
        next(err)
    }
})

app.delete("/api/user/productpurchased/:id", async (req, res, next) => {
    try {
        const { params: { id } } = req
        const productinfo = await PurchasedProduct.findOne({ _id: id });
        if (productinfo.deletedbyfarmer === true) {
            await PurchasedProduct.deleteOne({ _id: id });
        } else {
            await PurchasedProduct.updateOne({ _id: id }, { $set: { 'viewpermission.customer': false } })
        }
        res.json({
            response: {
                type: true
            }
        })
    } catch (err) {
        next(err)
    }
})

app.delete("/api/farmer/productsaled/:id", async (req, res, next) => {
    try {
        const { params: { id } } = req
        await PurchasedProduct.updateOne({ _id: id }, { $set: { 'viewpermission.farmer': false } })
        res.json({
            response: {
                type: true
            }
        })
    } catch (err) {
        next(err)
    }
})

app.delete("/api/farmer/complete-delete/:id",async (req,res,next)=>{
    try {
        const { params: { id } } = req
        const productinfo = await PurchasedProduct.findOne({ _id: id });
        if (productinfo.viewpermission.customer === false) {
            await PurchasedProduct.deleteOne({ _id: id });
        } else {
            await PurchasedProduct.updateOne({ _id: id }, { $set: { deletedbyfarmer: true } })
        }
        res.json({
            response: {
                type: true
            }
        })
    } catch (err) {
        next(err)
    }
})

app.delete("/api/user/cart/:index", (req, res, next) => {
    try {
        const { params: { index } } = req;
        const arr = req.session.cart.filter((value, i, arr) => {
            if (i === parseInt(index)) {
                return false;
            } else {
                return true;
            }
        })
        req.session.cart = arr
        res.json({
            response: {
                type: true,
                cart: arr
            }
        })
    } catch (err) {
        next(err)
    }
})

app.get("/api/user/cart", (req, res, next) => {
    try {
        res.json({
            response: {
                type: true,
                cart: req.session.cart
            }
        })
    } catch (err) {
        next(err)
    }
})

app.post("/api/user/login", async (req, res, next) => {
    const { body: { email, role, lang } } = req;
    if (email, role) {
        const result = await NewUser.findOne({ email: email, role: role });
        if (result) {
            next()
        } else {
            if (lang === "en") {
                return next(new Error("You does not belong to selected role"))
            }
            else if (lang === "mr") {
                return next(new Error("तुम्ही निवडलेल्या भूमिकेत नाहीत"))
            }
            else if (lang === "hi") {
                return next(new Error("आप चयनित भूमिका में नहीं हैं।"))
            }

        }
    } else {
        next("Please fill all required credentials");
    }

}, (req, res, next) => {
    const { lang } = req.body
    next()
}, passport.authenticate("local"), (req, res) => {
    if (req.user) {
        req.session.cart = []
        res.json({
            response: {
                type: true,
                msg: "You logged in successfully",
                user: req.user
            }
        })
    }
})





app.post("/api/product", checkSchema(productValidation), async (req, res, next) => {
    try {
        const result = validationResult(req)
        const data = matchedData(req);
        if (result.errors.length > 0) {
            return next(new Error("Validation error"));
        }
        const product = await Product.create({
            image: data.product.image,
            name: data.product.name,
            price: {
                amount: data.product.price.amount,
                currency: data.product.price.currency,
                unit: data.product.price.unit
            },
            quantity: {
                count: data.product.quantity.count,
                unit: data.product.quantity.unit
            },
            owner: req.user._id
        })

        const r = await product.save()
        res.json({
            response: {
                type: true,
                product: r
            }
        })

    } catch (err) {
        next(err)
    }
})

app.get("/api/product/:id", async (req, res, next) => {
    const id = req.params.id;
    try {
        const product = await Product.findOne({ _id: id });
        res.json({
            response: {
                type: true,
                product: product
            }
        })
    } catch (err) {
        next(err)
    }
})


app.get("/api/products/byname/:name", async (req, res, next) => {
    const name = req.params.name;
    const re = new RegExp(name, "i")
    try {
        const products = await Product.find({ name: re });
        res.json({
            response: {
                type: true,
                products: products
            }
        })
    } catch (err) {
        next(err)
    }
})



app.patch("/api/product", checkSchema(productValidation), async (req, res, next) => {
    if (req.user) {
        const validation_result = validationResult(req);
        const data = matchedData(req);
        if (validation_result.errors.length > 0) {
            next(new Error("validation error"))
        }
        const { body: { product: { _id } } } = req;
        const doesProductPresent = await Product.findOne({ _id: _id });
        if (!doesProductPresent) {
            next(new Error("The product you are trying to update does not exist"));
        }
        const result = await Product.findOneAndUpdate({
            _id: doesProductPresent._id
        }, {
            image: data.product.image,
            name: data.product.name,
            quantity: data.product.quantity,
            price: data.product.price,
        }, {
            new: true
        })

        res.json({
            response: {
                type: true,
                product: result
            }
        })
    } else {
        next(new Error("You are not authenticated"))
    }
})

app.get("/api/user/products", async (req, res, next) => {
    try {
        const result = await Product.find({}).limit(10);
        res.json({
            response: {
                type: true,
                products: result
            }
        })
    } catch (err) {
        next(err)
    }
})

app.get("/api/products", async (req, res, next) => {
    if (req.user) {
        try {
            const result = await Product.find({ owner: req.user._id });
            res.json({
                response: {
                    type: true,
                    products: result
                }
            })
        } catch (err) {
            next(err)
        }
    } else {
        next(new Error("You are not authenticated user"))
    }
})

app.get("/api/get/user", async (req, res, next) => {
    try {
        if (req.user) {
            const result = await NewUser.findOne({ _id: req.user._id })
            res.json({
                response: {
                    type: true,
                    user: result
                }
            })
        } else {
            res.json({
                response: {
                    type: false
                }
            })
        }
    } catch (err) {
        next(err)
    }
})

app.patch("/api/user", checkSchema(userValidationUpdate), async (req, res, next) => {
    if (req.user) {
        const validation_result = validationResult(req);
        if (validation_result.errors.length > 0) {
            return next(new Error("Validation error"));
        }
        const data = matchedData(req);
        const result = await NewUser.findOneAndUpdate({ _id: data._id },
            {
                image: data.image,
                country: data.country,
                state: data.state,
                contact: data.contact,
                address: data.address
            }, {
            new: true
        })
        if (result) {
            res.json({
                response: {
                    type: true,
                    user: result
                }
            })
        }
    } else {
        next(new Error("Please log in"))
    }
})

app.post("/api/user", checkSchema(userValidationSchema), (req, res, next) => {
    const { body: { lang } } = req;
    language(lang);
    req.language = lang;
    next();
}, async (req, res, next) => {
    const result = validationResult(req);
    const data = matchedData(req);
    if (result.errors.length > 0) {
        let message
        if (language() === "en") {
            message = "some errors in email and password or name"
        } else if (language() === "mr") {
            message = "ईमेल, पासवर्ड किंवा नावात काही चुका आहेत"
        } else if (language() === "hi") {
            message = "ईमेल, पासवर्ड या नाम में कुछ गलतियाँ हैं"
        }
        return next(new Error(message));
    }
    const { email, password, name, contact, country, state, address, role } = data;
    const does_user_exist = await User.findOne({ email: email });
    if (does_user_exist) {
        let message
        if (language() === "en") {
            message = "User with same email already exists"
        } else if (language() === "mr") {
            message = "समान ईमेल असलेला वापरकर्ता आधीच अस्तित्वात आहे"
        } else if (language() === "hi") {
            message = "एक ही ईमेल वाला उपयोगकर्ता पहले से मौजूद है"
        }
        next(new Error(message));
    } else {
        // const { valid } = await validate(email);
        const valid = extendedEmailValidation(email);
        if (valid) {
            const encryptedPassword = encryptPassword(password);
            const model_result = await NewUser.create({
                name: name,
                email: email,
                password: encryptedPassword,
                contact: contact,
                address: address,
                country: country,
                state: state,
                role: role
            })
            await model_result.save();
            let message
            if (language() === "en") {
                message = "You signed up successfully"
            } else if (language() === "mr") {
                message = "तुम्ही यशस्वीपणे साइन अप केले आहे"
            } else if (language() === "hi") {
                message = "आपने सफलतापूर्वक साइन अप किया"
            }
            res.json({
                response: {
                    type: true,
                    msg: message,
                }
            })
        } else {
            let message
            if (language() === "en") {
                message = "Cannot verify your email . Please enter valid email"
            } else if (language() === "mr") {
                message = "तुमच्या ईमेलची पडताळणी केली जाऊ शकत नाही. कृपया वैध ईमेल प्रविष्ट करा."
            } else if (language() === "hi") {
                message = "आपके ईमेल की पुष्टि नहीं की जा सकती। कृपया एक वैध ईमेल दर्ज करें।"
            }
            next(new Error(message));
        }

    }
})


app.get("/api/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            next(err)
        }else{
            res.json({
                response:{
                    type:true,
                    message: "Logout Successfully"
                }
            })
        }
    })
})

app.use((err, req, res, next) => {
    res.json({
        response: {
            type: false,
            msg: err.message
        }
    })
})


// , (err, user, info) => {
//     if (err) {
//         return next(err)
//     }
//     if (!user) {
//         return next(new Error(info.message));
//     }
//     if (user) {
//         let message
//     if (language() === "en") {
//         message = "You logged in successfully"
//     } else if (language() === "mr") {
//         message = "तुम्ही यशस्वीपणे लॉगिन केले आहे"
//     } else if (language() === "hi") {
//         message = "आपने सफलतापूर्वक लॉगिन किया"
//     }
//     req.session.user = user
//     return res.json({
//         response: {
//             type: true,
//             msg: message,
//             user
//         }
//     })
//     }
// })(req, res, next);