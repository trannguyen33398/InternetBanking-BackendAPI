const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const cors = require('cors')
const { isPartner } = require('./src/middlewares/bankService')
require('express-async-errors')

//Init Express App
const app = express()
dotenv.config()
const apiPort = process.env.PORT || '3000'
app.use(cors())
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

// Some route
app.get('/', (req, res) => {
  res.send('Sacombank Internet Banking API')
})

app.use('/services/accounts', isPartner, require('./src/routes/service.route'))
app.use('/static', express.static(path.join(__dirname, 'public')))

//handle error
app.use(function (err, req, res, next) {
  return res.status(err.status).json(err)
})

// NOT FOUND API
app.use((req, res, next) => {
  res.status(404).send('NOT FOUND')
})

//connect database
const uri = `mongodb+srv://XuanNghiemNguyen:${process.env.DB_PASSWORD}@cluster0-6az1w.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
const connectDatabase = () => {
  mongoose.connect(
    uri,
    {
      useUnifiedTopology: true,
      useNewUrlParser: true
    },
    (err) => {
      if (err) {
        console.log(
          'Failed to connect to mongo on startup - retrying in 2 sec',
          err
        )
        setTimeout(connectDatabase, 2000)
      } else {
        console.log('Connected to the database')
      }
    }
  )
}

//Init apiServer
app.listen(apiPort, () => {
  connectDatabase()
  console.log(`Listening at http://localhost:${apiPort}`)
})

module.exports = app
