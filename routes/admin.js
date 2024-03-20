const express=require('express')
const router=express.Router()
const login=require('../controller/admin')
const auth=require('../middleware/auth')
const home=require('../controller/admin')
const all=require('../controller/admin')
const logout=require('../controller/admin')
const message=require('../controller/admin')
const earnings=require('../controller/admin')
const singleUser=require('../controller/admin')

// admin login
router.post('/login',login)

// get admin 
router.get('/home',auth,home)

// get all user details
router.get('/all',auth,all)

// filter users by country
router.post('/all/country',auth,all)

// filter users by refid
router.post('/all/refid',auth,all)

// get a user detail based on refid
router.get('/user/:refid',auth,singleUser)

// send message to a user
router.post('/send-message',auth,message)

// update earning of a user by refid
router.post('/update-earnings/:refid',auth,earnings)

// logout admin
router.get('/logout',auth,logout)

module.exports=router