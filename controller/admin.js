const dotenv = require('dotenv')
const jwt = require("jsonwebtoken")
const auth = require("../middleware/auth")
const express = require("express")
const cookieParser = require('cookie-parser')
const user = require('../models/user')

const app = express()

app.use(express.json())
app.use(cookieParser())
dotenv.config()

const { Admin_User, Admin_Pass, TOKEN_KEY } = process.env

const users = [
    { id: 1, username: Admin_User, password: Admin_Pass },
]

app.post("/login",async (req, res) => {
    try {
        const { username, password ,rememberMe} = req.body;

        if (!username || !password) {
            return res.json({ msg: 'Please fill the login details completely', status: false })
        }

        const user = users.find(u => u.username === username && u.password === password)

        if (!user) {
            return res.json({ msg: 'Invalid credentials', status: false })
        }
        const expiresIn = rememberMe ? '7d' : '2h';         
            const token = jwt.sign({ id: user.id, username: user.username }, TOKEN_KEY,{expiresIn})
        res.cookie('jwt', token, {
            secure: true,
            maxAge: expiresIn === '7d' ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000,
            httpOnly: true
        })
        return res.json({ 
            msg: 'Login successful',
            status: true,
            token: token
        })
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: 'Server error', status: false })
    }
});

app.get("/all", auth, async(req,res) => {
    try {
        const users=await user.find({})
        return res.status(200).json(users)
    } catch (error) {
        return res.status(400).json("cant fetch data from database")
    }
})
app.post("/all/country", auth, async (req, res) => {
    try {
        const { country } = req.body
        const users = await user.find({ country: country }, { refid: 1, f_name: 1, l_name: 1, _id: 0 })
        if (users.length === 0) {
            return res.status(200).json({ msg: 'No data found for this country', status: false })
        }
        return res.status(200).json(users);
    } catch (error) {
        return res.status(400).json({ msg: 'Can\'t fetch data from database', status: false })
    }
})

app.post("/all/refid", auth, async (req, res) => {
    try {
        const { refid } = req.body
        const users = await user.find({ refid: refid })
        if (users.length === 0) {
            return res.status(200).json({ msg: 'No data found for this refid', status: false })
        }
        return res.status(200).json(users)
    } catch (error) {
        return res.status(400).json({ msg: 'Can\'t fetch data from database', status: false })
    }
})

app.post("/send-message", auth, async (req, res) => {
    try {
      const { targetType, targetValue, message } = req.body;
  
      let query = {};
  
      // Construct the query based on the targetType
      switch (targetType) {
        case 'country':
          query = { country: targetValue };
          break;
        case 'refid':
          query = { refid: targetValue };
          break;
        case 'all':
          // No need to specify a query for 'all' option
          break;
        default:
          return res.status(400).json({ error: 'Invalid targetType' });
      }
  
      // Find the users based on the query
      let users = [];
      if (targetType === 'all') {
        users = await user.find({});
      } else {
        users = await user.find(query);
      }
  
      if (!users || users.length === 0) {
        return res.status(404).json({ error: "No users found" });
      }
  
      // Send message to each user found
      for (const user of users) {
        user.messages.push({
          sender: "Admin",
          content: message,
          timestamp: new Date()
        });
        await user.save();
      }
  
      res.status(200).json({ message: "Message sent successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/update-earnings/:refid", auth, async (req, res) => {
    try {
      const refid = req.params.refid;
      const { earningData } = req.body;
      // console.log(earningData[0])
      if (!earningData) {
        return res.status(400).json({ error: "Earning data is required" });
      }
  
      const foundUser = await user.findOne({ refid: refid });
      if (!foundUser) {
        return res.status(404).json({ error: "User not found" });
      }
  
      foundUser.earnings.push(earningData[0]);
      await foundUser.save();
  
      return res.status(200).json({ message: "Earning data added successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/user/:refid", auth, async (req, res) => {
    try {
        const refid = req.params.refid;
        const foundUser = await user.findOne({ refid: refid });

        if (!foundUser) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(foundUser);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/home", auth, (req,res) => {
    res.status(200).send("User Logged in and Session is Active")
})

app.get("/logout", async (req, res) => {
    try {
      res.clearCookie('jwt')
      res.status(200).send("User Logged out and session ended")
    } catch (ex) {
      next(ex)
    }
  })

module.exports = app;

