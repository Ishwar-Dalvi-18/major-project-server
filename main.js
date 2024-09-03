import { config } from "dotenv";
config({
    path: "C:\\Users\\Ishwar Dalvi\\Desktop\\major project server\\config.env",
});
import { language } from "./globals.js";
import { validate } from 'deep-email-validator';
import express, { response } from 'express';
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
import "./strategies/googleStrategy.js"
import "./strategies/localStrategy.js"

const port = process.env.PORT || 8000;
const app = express();
app.use(express.json());
app.use(cors({
    origin: ["http://192.168.0.224:5173", "http://localhost:5173", `httP://${process.env.IP2}:5173`],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUSH"],
}))

mongoose.connect("mongodb+srv://dalviishwar1817_2:CylH7tmznpY1LSqs@cluster0.5029v.mongodb.net/major-project?retryWrites=true&w=majority&appName=Cluster0").then(db => {
    console.log(`Connection to database successfull`);
})

app.use(session({
    secret: "ISHWAR",
    saveUninitialized: false,
    resave: false,
    store: MongoStore.create({
        client: mongoose.connection.getClient()
    })
}))

app.use(passport.initialize());
app.use(passport.session());



const httpServer = app.listen(port, () => {
    console.log(`server is running on port : ${port}`);
})
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "DELETE", "PUSH"],
        allowedHeaders: true
    }
});
io.on("connection", socket => {
    console.log(`One client connected : ${socket.id}`);
})

app.get("/api/auth/google", passport.authenticate('google', { scope: ['profile', 'email'] }))
app.get("/api/auth/google/callback", passport.authenticate('google', {
    successRedirect: "http://localhost:5173/profile",
    failureRedirect: "http://localhost:5173/login"
}))
app.post("/api/user/login", (req, res, next) => {
    const { lang } = req.body
    console.log(language(lang));
    req.language = lang
    next()
}, async (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        console.log(info.message)
        if (err) {
            return next(err)
        }
        if (!user) {

            return next(new Error(info.message));
        }
        if (user) {
            let message
            if (language() === "en") {
                message = "You logged in successfully"
            } else if (language() === "mr") {
                message = "तुम्ही यशस्वीपणे लॉगिन केले आहे"
            } else if (language() === "hi") {
                message = "आपने सफलतापूर्वक लॉगिन किया"
            }
            return res.json({
                response: {
                    type: true,
                    msg: message,
                    user
                }
            })
        }
    })(req, res, next);

})
app.get("/api/user", (req, res) => {
    console.log(req.user)
    if (req.user) {
        res.json({
            response: {
                user: req.user
            }
        })
    } else {
        res.json({
            response: {}
        })
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
    console.log(data)
    console.log(result);
    if (result.errors.length > 0) {
        let message
        if (language() === "en") {
            message = "some errors in email and password or name"
        } else if (language() === "mr") {
            message = "ईमेल, पासवर्ड किंवा नावात काही चुका आहेत"
        } else if (language() === "hi") {
            message = "ईमेल, पासवर्ड या नाम में कुछ गलतियाँ हैं"
        }
        next(new Error(message));
    }
    const { email, password, name } = data;
    console.log(`email : ${email} password : ${password}`);
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
        const { valid } = await validate(email);
        if (valid) {
            const encryptedPassword = encryptPassword(password);
            const model_result = await User.create({
                name: name,
                email: email,
                password: encryptedPassword,
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

app.use((err, req, res, next) => {
    res.json({
        response: {
            type: false,
            msg: err.message
        }
    })
})


