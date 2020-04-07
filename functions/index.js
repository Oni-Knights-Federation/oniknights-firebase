const functions = require('firebase-functions')
const axios = require('axios')
const qs = require('querystring')

/* 
 * Requires ['site.home', 'discord.client_id', 'discord.client_secret'] to be configured.
 * Use the following firebase command:
   firebase functions:config:set site.home="https://oniknights.com" discord.client_id="CLIENT_ID" discord.client_secret="CLIENT_SECRET"
 */

exports.discordCallback = functions.https.onRequest((req, res) => {
    const code = req.query.code
    const redirect = functions.config().site.home

    if(!code) {
        console.error('No code provided by discord')
        return res.redirect(redirect)
    }
    
    return getToken(code).then((response) => {
        return res.redirect(`${redirect}/?token=${response.data.access_token}`)
    }, (error) => {
        console.error(error)
        return res.redirect(`${redirect}/?loginfailed`)
    })
})

const getToken = (code) => {
    const discordCallback = 'https://us-central1-oniknights-com.cloudfunctions.net/discordCallback'

    const data = {
        grant_type: 'authorization_code',
        code: code,
        client_id: functions.config().discord.client_id,
        client_secret: functions.config().discord.client_secret,
        redirect_uri: discordCallback
    }

    const options = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }

    return axios.post('https://discordapp.com/api/oauth2/token', qs.stringify(data), options)
}