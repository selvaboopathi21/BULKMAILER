import express from "express"
import cors from "cors"
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import mongoose from 'mongoose'

dotenv.config()

const app = express()
app.use(cors());
app.use(express.json())

const campaignSchema = new mongoose.Schema({
    message: { type: String, required: true },
    recipients: { type: [String], required: true },
    sentAt: { type: Date, default: Date.now }
})

const Campaign = mongoose.model('Campaign', campaignSchema)

// Uses the document you added in MongoDB's `bulkmailer` collection:
// { user: "your-gmail@gmail.com", pass: "your-gmail-app-password" }
const emailCredentialSchema = new mongoose.Schema(
    {
        user: { type: String, required: true },
        pass: { type: String, required: true }
    },
    { collection: 'bulkmailer' }
)

const EmailCredential = mongoose.model('EmailCredential', emailCredentialSchema)

async function getTransporter() {
    const credentials = await EmailCredential.findOne({
        user: { $type: 'string' },
        pass: { $type: 'string' }
    })
        .sort({ _id: -1 })
        .lean()

    if (!credentials) {
        throw new Error('No email credentials found in the bulkmailer collection')
    }

    return {
        from: credentials.user.trim(),
        transporter: nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: credentials.user.trim(),
                // Gmail app passwords are sometimes copied with spaces between groups.
                pass: credentials.pass.replace(/\s+/g, '')
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

        await Campaign.create({
            message: msg,
            recipients: emailList
        })

        return res.json({ message: 'Emails sent successfully' })
    } catch (error) {
        console.error('Email sending failed:', error.message)
        return res.status(500).json({ error: error.message })
    }
})

const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGO_URL || process.env.MONGO_URI

async function startServer() {
    try {
        if (!MONGODB_URI) {
            throw new Error('MONGO_URL or MONGO_URI environment variable is not set')
        }

        await mongoose.connect(MONGODB_URI)
        console.log('MongoDB connected')

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`)
        })
    } catch (error) {
        console.error('MongoDB connection failed:', error.message)
        process.exit(1)
    }
}

startServer()
