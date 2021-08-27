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
  // exercises: [{
  //   date: {type: String, required: true},
  //   duration: { type: Number, required: true },
  //   description: {type: String, required: true}
  // }]
  exercises: Array
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
  let outDuration = Number.parseInt(req.body.duration);
  let outDate = new Date (req.body.date);
  if (!outDate) {
    outDate = new Date().toString().substring(0, 15);
  } else {
    outDate = new Date(outDate).toString().substring(0, 15);
  }
  let newExercise = {
    date: outDate,
    duration: outDuration,
    description: outDescription
  };
  // console.log(newExercise);
  User.findById(outUserId, (err, individual) => {
    if (err) {
      return console.log("error finding user by id");
    }
    individual.exercises.push(newExercise);
    individual.save((err, savedIndividual) => {
      if (err) {
        return console.log("error saving user after exercises update");
      }
      res.json({
        _id: outUserId,
        username: individual.username,
        date: outDate,
        duration: outDuration,
        description: outDescription
      });
    })
  });
});

// get log of exercises
app.get('/api/users/:_id/logs', (req, res) => {
  let inputId = req.params._id;
  let from;
  let to;
  if (req.query.from && req.query.to) {
    from = new Date(req.query.from);
    to = new Date(req.query.to);
  }
  let limit = req.query.limit;
  User.findById(inputId, (err, individual) => {
    if (err) {
      return console.log("error finding user for logs");
    }
    console.log(individual.exercises);
    let exercisesCopy = JSON.parse(JSON.stringify(individual.exercises));
    console.log(exercisesCopy);
    if (from && to) {
      exercisesCopy = exercisesCopy.filter(d => {
        let temp = new Date(d.date);
        return (from <= temp && temp <= to);
      });
    }
    let length = exercisesCopy.length;
    if (limit && limit < length) {
      exercisesCopy = exercisesCopy.slice(0, limit);
    }
    console.log(exercisesCopy);
    let countOutput = exercisesCopy.length;
    res.json({
      _id: individual._id,
      username: individual.username,
      count: countOutput,
      log: exercisesCopy
    });
  });
});

// get log of exercises with limit or date range
app.get('/api/users/:_id/logs?')

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
