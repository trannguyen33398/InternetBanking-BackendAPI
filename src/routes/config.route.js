const express = require('express')
const router = express.Router()
const User = require('../models/user')
const Account = require('../models/account')

const paymentAccount = {
  number: 206244699,
  pin: 123456,
  balance: 500000
}
const savingAccounts = [
  {
    number: 206244691,
    pin: 123456,
    balance: 100000
  },
  {
    number: 206244692,
    pin: 123456,
    balance: 200000
  },
  {
    number: 206244693,
    pin: 123456,
    balance: 200000
  },
  {
    number: 206244694,
    pin: 123456,
    balance: 400000
  }
]

const userData = {
  username: 'xuanghjem',
  type: 'normal',
  phone: '+84985002876',
  name: 'Nguyễn Xuân Nghiêm',
  password: '123456'
}

router.post('/insertData', async (req, res) => {
  try {
    let newPayment = new Account({
      ...paymentAccount,
      owner: userData.username
    })
    await newPayment.save()
    await Promise.all([savingAccounts.forEach(async item => {
      let newSaving = new Account({
        ...item,
        owner: userData.username,
        isPayment: false
      })
      await newSaving.save()
    })])
    let newUser = new User({
      ...userData,
      payment: paymentAccount.number || 0,
      savings: savingAccounts.map(i => i.number) || []
    })
    await newUser.save()
    return res.json({
      success: true,
      user: newUser
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: error.toString()
    })
  }
})

module.exports = router