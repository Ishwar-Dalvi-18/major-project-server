import express from "express";

export const profileRouter = new express.Router();

profileRouter.get("/",(req,res,next)=>{
    console.log("Profile route")
    res.send("Welcome to profile page")
})