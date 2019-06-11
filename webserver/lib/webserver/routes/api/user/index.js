const debug = require('debug')('linto-admin:api')
const DBmodel = require(`${process.cwd()}/model/${process.env.BDD_TYPE}`)
const sha1 = require('sha1')
const randomstring = require('randomstring')
const model = new DBmodel()
const mailer = require(`${process.cwd()}/lib/webserver/sendMail`)

module.exports = (webServer) => {
  return [{
      path: '/getInfos',
      method: 'post',
      controller: async (req, res, next) => {
        const userHash = req.body.hash
        const user = await model.getUserByHash(userHash)
        res.json({
          user
        })
      }
    },
    {
      path: '/',
      method: 'put',
      requireAuth: true,
      controller: async (req, res, next) => {
        const data = req.body
        const userHash = data.userHash
        const getUserInfos = await model.getUserByHash(userHash)
        let payload = getUserInfos[0]
        for (let key in data) {
          payload[key] = data[key]
        }

        const updateUser = await model.updateUser(payload)
        res.json({
          'status': updateUser
        })
      }
    },
    {
      path: '/',
      method: 'delete',
      requireAuth: true,
      controller: async (req, res, next) => {
        const userHash = req.body.userHash
        const audioList = await model.getAudiosByUserHash(userHash)
        let audioDelete = true
        for (let i in audioList) {
          let removeTrack = await model.deleteAudio(audioList[i]._id)
          if(removeTrack === 'success') {
            i++
          } else {
            audioDelete = false
          }
        }
        if (audioDelete) {
          const deleteUser = await model.deleteUser(userHash)
          if(deleteUser === 'success') {
          //  res.redirect('/logout')
          res.json({
            status: 'success',
            msg:'l\'utilisateur à été supprimé'
          })
          }
        } else {
          res.json({
            status: 'error',
            msg: 'error on deleting audio file'
          })
        }
      }
    },
    {
      path: '/userEmailExist',
      method: 'post',
      controller: async (req, res, next) => {
        const email = req.body.email
        const getUser = await model.getUserByMail(email)
        if(getUser.length > 0) {
          res.json({
            status: 'success',
            msg: 'user found'
          })
        } else {
          res.json({
            status: 'error',
            msg: 'user not found'
          })
        }
      }
    },
    {
      path: '/userNameExist',
      method: 'post',
      controller: async (req, res, next) => {
        const name = req.body.name
        const getUser = await model.getUserByName(name)
        if(getUser.length > 0) {
          res.json({
            status: 'success',
            msg: 'user found'
          })
        } else {
          res.json({
            status: 'error',
            msg: 'user not found'
          })
        }
      }
    },
    {
      path: '/pswd',
      method: 'put',
      requireAuth: true,
      controller: async (req, res, next) => {
        const data = req.body
        const userHash = data.userHash
        const getUserInfos = await model.getUserByHash(userHash)
        let payload = getUserInfos[0]
        // Check current password
        if (sha1(data.currentPswd + payload.salt) === payload.passwordHash) {
          const newSalt = randomstring.generate(12)
          payload.salt = newSalt;
          payload.passwordHash = sha1(data.newPswd + newSalt)

          const updateUser = await model.updateUser(payload)
          if (updateUser === 'success') {
            res.json({
              status: updateUser,
              msg: 'Votre mot de passe à été modifié',
              code: 1
            })
          } else {
            res.json({
              status: updateUser,
              msg: 'Une erreur est survenue',
              code: -1
            })
          }
        } else {
          res.json({
            status: 'error',
            msg: 'Le mot de passe actuel est erroné',
            code: 0
          })
        }
      }
    },
    {
      path: '/pswdcheck',
      method: 'post',
      requireAuth: true,
      controller: async (req, res, next) => {
        const pswd = req.body.pswd
        const userHash = req.body.userHash
        const getUserInfos = await model.getUserByHash(userHash)
        let payload = getUserInfos[0]
        // Check current password
        if (sha1(pswd + payload.salt) === payload.passwordHash) {
          res.json({
            status: 'success'
          })
        } else {
          res.json({
            status: 'error'
          })
        }
      }
    },
    {
      path: '/reinitPswd',
      method: 'post',
      controller: async (req, res, next) => {
        const userHash = req.body.userHash
        const newPswd = req.body.newPswd
        const getUser = await model.getUserByHash(userHash)
        if(getUser.length > 0) {
          let user = getUser[0]
          const newSalt = randomstring.generate(12)
          const newHash = sha1(newPswd + newSalt)
          user.salt = newSalt
          user.passwordHash = newHash
          const updateUser = await model.updateUser(user)

          res.json({status: updateUser})
        } else {
          res.json({status: 'error'})
        }
      }
    },
    {
      path: '/setReinit',
      method: 'post',
      controller: async (req, res, next) => {
        const email = req.body.email
        const getUser = await model.getUserByMail(email)
        if(getUser.length > 0) {
          const user = getUser[0]
          const dateExpire = new Date().getTime() + 60*30*1000;
          const expire =  new Date(dateExpire)
          user.reinit = {
            resetToken: randomstring.generate(16),
            expire
          }
          const updateUser = await model.updateUser(user)
          const reinitLink = 'reinit-password/' + user.userName + '/' + user.reinit.resetToken
          const sendmail = await mailer.sendReinitPasswordMail(email, user.userName, reinitLink)
          if(sendmail === 'mailSend' && updateUser === 'success') {
            res.json({status: 'success'})
          } else {
            let msg = ''
            if(sendmail !== 'mailSend') {
              msg += `Error on sending email (${sendmail}).`
            }
            if(updateUser !== 'success') {
              msg += `Error on updating database.`
            }
            res.json({
              status: 'error',
              msg
            })
          }
        } else {
          res.json({
            status: 'error',
            msg: 'user not found'
          })
        }
      }
    },
    {
      path: '/checkToken',
      method: 'post',
      controller: async (req, res, next) => {
        const token = req.body.token
        const userName = req.body.user
        const getUser = await model.getUserByName(userName)
        if(getUser.length > 0) {
          const user = getUser[0]
          const userToken = user.reinit.resetToken
          const expire = user.reinit.expire
          if(userToken === token) {
            const now = new Date()
            if (expire >= now) {
              res.json({
                status: 'success',
                msg: 'tokenValid',
                userHash: user.userHash
              })
            } else {
              res.json({
                status: 'error',
                msg: 'tokenExpired'
              })
            }
          } else {
            res.json({
              status: 'error',
              msg: 'tokenInvalid'
            })
          }
        } else {
          res.json({
            satus: 'error',
            msg: 'userNotFound'
          })
        }
      }
    }
  ]
}