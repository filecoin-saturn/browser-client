// Mock gateway that returns CAR files

const http = require('http')
const path = require('path')

const express = require('express')
const cors = require('cors')

const cl = console.log
const app = express()

app.use(cors({ maxAge: 7200 }))

app.get('/:cid', (req, res, next) => {
    const { cid } = req.params
    const opts = {
        root: path.resolve(__dirname, 'test-files')
    }
    const filename = `${cid}.car`
    res.sendFile(filename, opts, err => {
        if (err) {
            next(err)
        } else {
            console.log('Sent:', filename)
        }
    })
})

const port = process.env.PORT || 8031
const server = http.createServer(app)
server.listen(port, () => cl(`Gateway running on port ${port}`))
