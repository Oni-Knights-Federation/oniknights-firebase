const functions = require('firebase-functions')
const axios = require('axios')
const qs = require('querystring')

/* 
 * Requires ['site.home', 'discord.client_id', 'discord.client_secret'] to be configured.
 * Use the following firebase command:
   firebase functions:config:set site.home="https://oniknights.com" discord.client_id="CLIENT_ID" discord.client_secret="CLIENT_SECRET"
 */
exports.discordAuth = functions.https.onRequest((req, res) => {
    const client_id = functions.config().discord.client_id
    const scopes = 'identify'
    const redirect_uri = encodeURIComponent(getFunctionUri('discordCallback'))
    return res.redirect(`https://discordapp.com/oauth2/authorize?response_type=code&client_id=${client_id}&scope=${scopes}&redirect_uri=${redirect_uri}`)
})

exports.discordCallback = functions.https.onRequest((req, res) => {
    const code = req.query.code
    const redirect = functions.config().site.home // TODO replace redirect with programmatic retrieval of url

    if(!code) {
        console.error('No code provided by discord')
        return res.redirect(redirect)
    }

    return axios.post('https://discordapp.com/api/oauth2/token', qs.stringify({
            grant_type: 'authorization_code',
            code: code,
            client_id: functions.config().discord.client_id,
            client_secret: functions.config().discord.client_secret,
            redirect_uri: getFunctionUri('discordCallback')
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(response => {
            return res.redirect(`${redirect}/?token=${response.data.access_token}`)
        }).catch(error => {
            console.error(error)
            return res.redirect(`${redirect}/?loginfailed`)
        })
})

const getFunctionUri = (function_name) => {
    const region = process.env.FUNCTION_REGION
    const project_name = process.env.GCP_PROJECT
    return `https://${region}-${project_name}.cloudfunctions.net/${function_name}`
}