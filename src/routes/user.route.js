const express = require('express')
const router = express.Router()
const User = require('../models/user')
const Account = require('../models/account')
const Transaction = require('../models/transaction')
const Debt = require('../models/debt')
const bcrypt = require('bcryptjs')
const HHBANK_API = require('../services/hhbank')
const TEAM29_API = require('../services/agribank')
const { isTrustlyOTP } = require('../middlewares/auth')
router.get('/getListAccount', async (req, res) => {
  try {
    const { email } = req.query
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required!',
      })
    }
    const accounts = await Account.find({ owner: email, isEnabled: true })
    return res.json({
      success: true,
      results: accounts,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: err.toString(),
    })
  }
})
// router.get('/getAllAccount', async (req, res) => {
//   try {
//     const accounts = await Account.find({  isEnabled: true })
//     return res.json({
//       success: true,
//       results: accounts
//     })
//   } catch (err) {
//     console.log(err)
//     return res.status(500).json({
//       success: false,
//       message: err.toString()
//     })
//   }
// })
// router.get('/getOtherUser', async (req, res) => {
//   try {
//     const { email } = req.query
//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email is required!'
//       })
//     }
//     const accountsArray = await User.find({ isEnabled: true })
//     const accounts = accountsArray.filter(function (item) {
//       return (item.email !== email)
//     })
//     return res.json({
//       success: true,
//       results: accounts
//     })
//   } catch (err) {
//     console.log(err)
//     return res.status(500).json({
//       success: false,
//       message: err.toString()
//     })
//   }
// })
router.get('/getUserByEmail', async (req, res) => {
  try {
    const { email } = req.query
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required!',
      })
    }
    const user = await User.find({ email: email, isEnabled: true })
    return res.json({
      success: true,
      results: user,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: err.toString(),
    })
  }
})

router.post('/changePassword', async (req, res) => {
  try {
    const { userId } = req.tokenPayload
    const { old_password, new_password } = req.body
    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'password_1 and password_2 are required!',
      })
    }
    const user = await User.findById(userId)
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'user not found!',
      })
    }
    const passwordMatching = await bcrypt.compare(old_password, user.password)
    if (passwordMatching) {
      user.password = await bcrypt.hash(new_password, 10)
      await user.save()
      return res.json({
        success: true,
        message: 'change password successfully!',
      })
    } else {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu cũ không đúng!',
      })
    }
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: err.toString(),
    })
  }
})

router.post('/receivers/update', async (req, res) => {
  try {
    const { userId } = req.tokenPayload
    const user = await User.findById(userId)
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'user not found!',
      })
    }
    const { receivers } = req.body

    if (!receivers) {
      return res.status(400).json({
        success: false,
        message: 'receivers is required!',
      })
    }
    user.receivers = receivers
    await user.save()
    return res.json({
      success: true,
      receivers: user.receivers,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: err.toString(),
    })
  }
})

router.post('/receivers/add', async (req, res) => {
  try {
    const { userId } = req.tokenPayload
    const user = await User.findById(userId)
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'user not found!',
      })
    }
    const { receiver } = req.body

    if (!receiver) {
      return res.status(400).json({
        success: false,
        message: 'receiver is required!',
      })
    }
    console.log(receiver)
    if (
      user.receivers.length > 0 &&
      user.receivers.some((i) => i.number === receiver.number)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Người nhận đã tồn tại trong danh sách!',
      })
    }
    user.receivers.push(receiver)
    await user.save()
    return res.json({
      success: true,
      receivers: user.receivers,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: err.toString(),
    })
  }
})

router.post('/sendDebt', async (req, res) => {
  try {
    const { info } = req.body

    if (!info) {
      return res.status(400).json({
        success: false,
        message: 'info is required!',
      })
    }
    const debt = await Debt.insertMany(info)
    return res.json({
      success: true,
      debt: debt,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: err.toString(),
    })
  }
})
router.post('/cancelDebt', async (req, res) => {
  try {
    const { info } = req.body

    if (!info) {
      return res.status(400).json({
        success: false,
        message: 'info is required!',
      })
    }

    const debt = await Debt.findOne(info)

    debt.isEnabled = false
    debt.save()
    return res.json({
      success: true,
      debt: debt,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: err.toString(),
    })
  }
})
router.post('/payDebt', async (req, res) => {
  try {
    const { info } = req.body
    if (!info) {
      return res.status(400).json({
        success: false,
        message: 'info is required!',
      })
    }
    const fromAccount = await Account.findOne({
      number: parseInt(info.fromAccount),
    })
    fromAccount.balance = fromAccount.balance - parseInt(info.amount)
    fromAccount.save()

    const toAccount = await Account.findOne({
      number: parseInt(info.toAccount),
    })
    toAccount.balance = toAccount.balance + parseInt(info.amount)
    toAccount.save()

    const debt = await Debt.findOne(info)
    debt.state = true
    debt.save()

    return res.json({
      success: true,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: err.toString(),
    })
  }
})
router.get('/getDebt', async (req, res) => {
  try {
    const d = await Debt.find()
    const debt = d.filter(
      (item) => item.isEnabled === true && item.state === false
    )
    return res.json({
      success: true,
      debt: debt,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: err.toString(),
    })
  }
})
router.get('/receivers', async (req, res) => {
  try {
    const { userId } = req.tokenPayload
    const user = await User.findById(userId)
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'user not found!',
      })
    }
    const { receivers } = user
    if (!receivers) {
      return res.status(400).json({
        success: false,
        message: 'receivers is not existed!',
      })
    }
    return res.json({
      success: true,
      receivers,
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: err.toString(),
    })
  }
})

router.get('/getOtherInfo', async (req, res) => {
  try {
    const { number } = req.query
    const account = await Account.findOne({ number })
    if (!account) {
      return res.status(400).json({
        success: false,
        message: 'account not found!',
      })
    }
    const user = await User.findOne({ email: account.owner })
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'user not found!',
      })
    }
    return res.json({
      success: true,
      user: {
        number,
        name: user.name,
        bank_name: 'sacombank',
      },
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: err.toString(),
    })
  }
})

router.get('/accountsByUser', async (req, res) => {
  try {
    const { email } = req.query
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required!',
      })
    }
    const accounts = await Account.find({ owner: email })
    if (!accounts || accounts.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'user does not own any email!',
      })
    }
    return res.json({
      success: true,
      accounts,
    })
  } catch (error) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: err.toString(),
    })
  }
})

router.post('/transfer', isTrustlyOTP, async (req, res) => {
  try {
    const { email } = req.tokenPayload
    let {
      numberResource,
      numberReceiver,
      amount,
      message,
      isSenderPaidFee,
    } = req.body
    if (!numberResource || !numberReceiver || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Required Fields: numberResource, numberReceiver, amount!',
      })
    }
    if (amount % 10000 !== 0) {
      return res.status(400).json({
        success: false,
        status_code: 1001,
        message: 'Amount must be a multiple of 10000!',
      })
    }
    console.log(email)
    const sender = await Account.findOne({
      number: numberResource,
      owner: email,
    })
    const receiver = await Account.findOne({ number: numberReceiver })
    if (!sender) {
      return res.status(400).json({
        success: false,
        status_code: 1001,
        message: 'sender is not found!',
      })
    }
    if (!receiver) {
      return res.status(400).json({
        success: false,
        status_code: 1002,
        message: 'receiver is not found!',
      })
    }
    if (isSenderPaidFee) {
      if (sender.balance - amount * 1.01 < 50000) {
        return res.status(400).json({
          success: false,
          status_code: 1003,
          message: 'balance is not enough!',
        })
      }
      sender.balance -= parseInt(amount * 1.01)
      receiver.balance += parseInt(amount)
      await sender.save()
      await receiver.save()
    } else {
      if (sender.balance - amount < 50000) {
        return res.status(400).json({
          success: false,
          status_code: 1003,
          message: 'balance is not enough!',
        })
      }
      sender.balance -= parseInt(amount)
      receiver.balance += parseInt(amount * 0.99)
      await sender.save()
      await receiver.save()
    }
    let report = new Transaction()
    report.sender = {
      email: sender.owner,
      number: numberResource,
    }
    report.receiver = {
      email: receiver.owner,
      number: numberReceiver,
    }
    report.message = message
    report.amount = amount
    report.isSenderPaidFee = !!isSenderPaidFee
    await report.save()
    return res.json({
      success: true,
      message: 'Transfer successfully!',
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: error.toString(),
    })
  }
})

//HHBANK
router.get('/hhbank/getInfo', async (req, res) => {
  try {
    const { number } = req.query
    if (!number) {
      return res.status(400).json({
        success: false,
        message: 'number is required!',
      })
    }
    const data = await HHBANK_API.getUserInfo(number)
    if (data && data.success) {
      return res.json({
        success: true,
        user: {
          name: data.data,
        },
      })
    } else {
      return res.status(400).json({
        success: false,
        message: 'user not found',
      })
    }
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: err.toString(),
    })
  }
})

router.post('/hhbank/transfer', async (req, res) => {
  try {
    const { email } = req.tokenPayload
    let {
      numberResource,
      numberReceiver,
      amount,
      message,
      isSenderPaidFee,
    } = req.body
    if (!numberResource || !numberReceiver || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Required Fields: numberResource, numberReceiver, amount!',
      })
    }
    if (amount % 10000 !== 0) {
      return res.status(400).json({
        success: false,
        status_code: 1001,
        message: 'Amount must be a multiple of 10000!',
      })
    }

    const sender = await Account.findOne({
      number: numberResource,
      owner: email,
    })
    const receiver = await HHBANK_API.getUserInfo(numberReceiver)
    if (!sender) {
      return res.status(400).json({
        success: false,
        status_code: 1001,
        message: 'sender is not found!',
      })
    }
    if (!receiver || !receiver.success) {
      return res.status(400).json({
        success: false,
        status_code: 1002,
        message: 'receiver is not found!',
      })
    }
    if (isSenderPaidFee) {
      if (sender.balance - amount * 1.02 < 50000) {
        return res.status(400).json({
          success: false,
          status_code: 1003,
          message: 'balance is not enough!',
        })
      }
      sender.balance -= parseInt(amount * 1.02)
      let result_transfer = await HHBANK_API.transfer(numberReceiver, amount)
      result_transfer = JSON.parse(result_transfer)
      if (result_transfer && result_transfer.success) {
        console.log(result_transfer)
        await sender.save()
      }
    } else {
      if (sender.balance - amount < 50000) {
        return res.status(400).json({
          success: false,
          status_code: 1003,
          message: 'balance is not enough!',
        })
      }
      sender.balance -= parseInt(amount)
      let result_transfer = await HHBANK_API.transfer(
        numberReceiver,
        parseInt(amount * 0.98)
      )
      result_transfer = JSON.parse(result_transfer)
      if (result_transfer && result_transfer.success) {
        console.log(result_transfer)
        await sender.save()
      }
    }
    let report = new Transaction()
    report.sender = {
      email: sender.owner,
      number: numberResource,
    }
    report.receiver = {
      name: receiver.data,
      number: numberReceiver,
    }
    report.isInterbankTrans = true
    report.message = message
    report.amount = amount
    report.isSenderPaidFee = !!isSenderPaidFee
    await report.save()
    return res.json({
      success: true,
      message: 'Transfer successfully!',
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: error.toString(),
    })
  }
})

//TEAM 29
router.get('/team29/getInfo', async (req, res) => {
  try {
    const { number } = req.query
    if (!number) {
      return res.status(400).json({
        success: false,
        message: 'number is required!',
      })
    }
    const data = await TEAM29_API.getUserInfo(number)
    if (data && data.message === 'OK' && data.payload) {
      return res.json({
        success: true,
        user: {
          name: data.payload.userName,
        },
      })
    } else {
      return res.status(400).json({
        success: false,
        message: 'user not found',
      })
    }
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: err.toString(),
    })
  }
})

router.post('/team29/transfer', async (req, res) => {
  try {
    const { email } = req.tokenPayload
    let {
      numberResource,
      numberReceiver,
      amount,
      message,
      isSenderPaidFee,
    } = req.body
    console.log(isSenderPaidFee)
    if (!numberResource || !numberReceiver || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Required Fields: numberResource, numberReceiver, amount!',
      })
    }
    if (amount % 10000 !== 0) {
      return res.status(400).json({
        success: false,
        status_code: 1001,
        message: 'Amount must be a multiple of 10000!',
      })
    }

    const sender = await Account.findOne({
      number: numberResource,
      owner: email,
    })
    const receiver = await TEAM29_API.getUserInfo(numberReceiver)
    if (!sender) {
      return res.status(400).json({
        success: false,
        status_code: 1001,
        message: 'sender is not found!',
      })
    }
    if (!receiver || !receiver.message === 'OK' || !receiver.payload) {
      return res.status(400).json({
        success: false,
        status_code: 1002,
        message: 'receiver is not found!',
      })
    }
    if (isSenderPaidFee) {
      if (sender.balance - amount * 1.02 < 50000) {
        return res.status(400).json({
          success: false,
          status_code: 1003,
          message: 'balance is not enough!',
        })
      }
      sender.balance -= parseInt(amount * 1.02)
      let result_transfer = await TEAM29_API.transfer(numberReceiver, amount)
      console.log('chuyen khoan:', result_transfer)
      // result_transfer = JSON.parse(result_transfer)
      // if (result_transfer && result_transfer.success) {
      //   await sender.save()
      // }
    } else {
      if (sender.balance - amount < 50000) {
        return res.status(400).json({
          success: false,
          status_code: 1003,
          message: 'balance is not enough!',
        })
      }
      console.log('di vao day')
      sender.balance -= parseInt(amount)
      let result_transfer = await TEAM29_API.transfer(
        numberReceiver,
        98000
      )
      console.log(result_transfer)
      // result_transfer = JSON.parse(result_transfer)
      // if (result_transfer && result_transfer.success) {
      //   await sender.save()
      // }
    }
    // let report = new Transaction()
    // report.sender = {
    //   email: sender.owner,
    //   number: numberResource,
    // }
    // report.receiver = {
    //   name: receiver.data,
    //   number: numberReceiver,
    // }
    // report.isInterbankTrans = true
    // report.message = message
    // report.amount = amount
    // report.isSenderPaidFee = !!isSenderPaidFee
    // await report.save()
    return res.json({
      success: true,
      message: 'Transfer successfully!',
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: error.toString(),
    })
  }
})

module.exports = router
