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
  log: {type: Array, required: true}
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

// post an exercise to logs
app.post('/api/users/:_id/exercises', (req, res) => {
  console.log("req.body=> ")
  console.log(req.body);
  // make sure required fields are filled
  let outUserId = req.body[':_id'];
  let outDescription = req.body.description;
  let outDuration = Number.parseInt(req.body.duration);
  if (!outUserId || !outDescription || !outDuration) {
    return console.log("error: please complete all required fields");
  }
  // create date object from query or instantiate date for current time
  let outDate;
  // if invalid date return error
  if (!new Date(req.body.date)) {
    return console.log("error: please enter valid date");
  // if empty string then instantiate date with current time
  } else if (req.body.date === "") {
    outDate = new Date().toString().substring(0, 15);
  // if valid date convert query date to valid date
  } else {
    outDate = new Date(req.body.date).toString().substring(0, 15);
  }
  let newExercise = {
    date: outDate,
    duration: outDuration,
    description: outDescription
  };
  User.findById(outUserId, (err, individual) => {
    if (err) {
      return console.log("error finding user by id");
    } else if (individual == null) {
      return console.log("individual is null");
    }
    // console.log("individual=> ")
    // console.log(individual);
    individual.log.push(newExercise);
    individual.save((err, savedIndividual) => {
      if (err) {
        return console.log("error saving user after log update");
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

// get log of exercises from user
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
    let logCopy = JSON.parse(JSON.stringify(individual.log));
    if (from && to) {
      logCopy = logCopy.filter(d => {
        let temp = new Date(d.date);
        return (from <= temp && temp <= to);
      });
    }
    let length = logCopy.length;
    if (limit && limit < length) {
      logCopy = logCopy.slice(0, limit);
    }
    let countOutput = logCopy.length;
    res.json({
      _id: individual._id,
      username: individual.username,
      count: countOutput,
      log: logCopy
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
