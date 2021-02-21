const { default: axios } = require("axios");
require('dotenv').config()
const express = require("express");
const cors = require("cors");
const formidable = require("express-formidable");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const mongoose = require("mongoose");
const uid2 = require("uid2");

const app = express();
app.use(formidable());
app.use(cors());

const isAuthenticated = require("./middleware/isAuthenticated");
const User = require("./models/User");
const Favorite = require("./models/Favorite");


mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
});

app.get("/favorites/:userToken", async (req, res) => {
    try {
        const token = req.params.userToken;
        const user = await User.findOne({token : token});
        const favorites = await Favorite.find({ owner: user._id})
       
        console.log(favorites)
        res.json(favorites)
    } catch (error) {
        res.status(404).json({ error: error.message})
    }
})

app.get("/characters", async (req, res) => {

    try {

    const response = await axios.get(`https://lereacteur-marvel-api.herokuapp.com/characters?apiKey=${process.env.MARVEL_API_KEY}`)
    res.status(200).json(response.data);

    } catch (error) {
        res.status(404).json({ error: error.message})
    }  
});

app.get("/comics", async (req, res) => {
    try {
        const response = await axios.get(`https://lereacteur-marvel-api.herokuapp.com/comics?apiKey=${process.env.MARVEL_API_KEY}`);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(404).json({ error: error.message})
    }
})


app.get("/comics/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const response = await axios.get(`https://lereacteur-marvel-api.herokuapp.com/comics/${id}?apiKey=${process.env.MARVEL_API_KEY}`);
      res.status(200).json(response.data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/characters",isAuthenticated, async (req, res) => {
      try {

        const { id, name, description, picture_path } = req.fields;

        const newFavorite = new Favorite({
            id: id,
            name: name,
            description: description,
            picture_path: picture_path,
            owner: req.user,
        })
        
        await newFavorite.populate("owner").save();

        res.status(200).json(newFavorite);

      } catch (error) {
        res.status(404).json({ error: error.message})
      }
  })

app.post("/signup", async (req, res) => {

    try {
 
     const user = await User.findOne({ email: req.fields.email });
     
     const password = req.fields.password;
     const salt = uid2(64);
     const hash = SHA256(password + salt).toString(encBase64);
     const token = uid2(64);
 
     if (!user) {
 
         if (req.fields.email && req.fields.username && req.fields.password) {
 
             const newUser = new User({
 
                email: req.fields.email,
                username: req.fields.username,
                token: token,
                salt: salt,
                hash: hash,
             });

             await newUser.save();
     
             res.json({
                 _id: newUser._id,
                token: newUser.token,
                username: newUser.username,
             });
      } else {
         res.status(400).json({ message: "Missing parameters" });
      }
     } else {
         res.status(400).json({ message: "User already exists" });
     };
        
    } catch (error) {
        res.status(404).json({ error: error.message})
    }
 });
 

app.post("/login", async (req, res) => {
    
    try {

        const userToLog = await (await User.findOne({ email: req.fields.email })).populate("favorites");

        if (userToLog) {
            
            const userPassword = req.fields.password;
            const salt = userToLog.salt;
            const hash = SHA256(userPassword + salt).toString(encBase64);
            
            if (userToLog.hash === hash) {
                res.json({
                    _id: userToLog._id,
                    token: userToLog.token,
                    username: userToLog.username
                });
            } else {
                res.json("Invalid email or password, please try again")
            }  
        } else {
            res.status(401).json({ message: "Unauthorized" });
          } 
    }
        catch (error) {
            res.status(404).json({ error: error.message})
    }
})

app.listen((process.env.PORT || 5000), () => {
    console.log("Server has started");
});
