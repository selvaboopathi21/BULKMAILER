import express from "express"
import cors from "cors"
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'

dotenv.config()

const app = express()
app.use(cors());
app.use(express.json())

async function getTransporter() {
    const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER
    const gmailPass = process.env.GMAIL_PASS || process.env.EMAIL_PASS

    if (!gmailUser || !gmailPass) {
        throw new Error('GMAIL_USER and GMAIL_PASS environment variables are required')
    }

    return {
        from: gmailUser.trim(),
        transporter: nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailUser.trim(),
                pass: gmailPass.replace(/\s+/g, '')
            }
        })
    }
}

app.post('/', async (req, res) => {
    const { msg, emailList } = req.body

    if (!msg || !Array.isArray(emailList) || emailList.length === 0) {
        return res.status(400).json({ error: 'Message and at least one email address are required' })
    }

    try {
        const { from, transporter } = await getTransporter()

        for (const email of emailList) {
            await transporter.sendMail({
                from,
                to: email,
                subject: 'Testing the bulk mailer',
                text: msg
            })
            console.log('Email sent to ' + email)
        }

        return res.json({ message: 'Emails sent successfully' })
    } catch (error) {
        console.error('Email sending failed:', error.message)
        return res.status(500).json({ error: error.message })
    }
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
