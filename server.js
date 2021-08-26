const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var bodyParser = require('body-parser');

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// middleware bodyparser that parses post request
app.use(bodyParser.urlencoded({extended: false}));

// connect mongoose
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// schema for user
const userSchema = new Schema({
  username: {type: String, unique: true, required: true},
  exercises: [{
    description: {type: String, required: true},
    duration: { type: Number, required: true },
    date: {type: String, required: true},
    _id: false
  }]
});
// model for user
const User = mongoose.model('User', userSchema);

// post user
app.post('/api/users', (req, res) => {
  let usernameInput = req.body.username;
  let newUser = new User({
    username: usernameInput
  });
  newUser.save((err, individual) => {
    if (err) {
      return console.log("error saving user");
    } else {
      res.json({
        username: individual.username,
        _id: individual._id
      });
    }
  })
});

// get users
app.get('/api/users', (req, res) => {
  User.find((err, docs) => {
    if (err) {
      return console.log("error finding users");
    } else {
      res.json(docs);
    }
  })
});

// post exercises
app.post('/api/users/:_id/exercises', (req, res) => {
  // console.log(req.body);
  // console.log(typeof(req.body[':_id']));
  let outUserId = req.body[':_id'];
  let outDescription = req.body.description;
  let outDuration = req.body.duration;
  let outDate = new Date (req.body.date);
  if (!outDate) {
    outDate = new Date().toString().substring(0, 15);
  } else {
    outDate = new Date(outDate).toString().substring(0, 15);
  }
  let newExercise = {
    description: outDescription,
    duration: outDuration,
    date: outDate
  };
  // console.log(newExercise);
  User.findById(outUserId, (err, individual) => {
    if (err) {
      return console.log("error finding user by id");
    } else {
      // console.log(individual);
      // console.log(individual.username);
      // console.log(individual._id);
      console.log(individual.exercises);
      individual.exercises.push(newExercise);
      individual.save((err, savedIndividual) => {
        if (err) {
          return console.log("error saving user after exercises update");
        } else {
          res.json({
            _id: outUserId,
            username: individual.username,
            description: outDescription,
            duration: outDuration,
            date: outDate
          });
        }
      })
    }
  });
});

// get log of exercises
// app.get('/api/users/:_id/logs', (req, res) => {
//   let inputId = req.params._id;
//   console.log(inputId);
// })

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
