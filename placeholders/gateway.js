// Mock gateway that returns CAR files

const http = require('http')

const express = require('express')
const cors = require('cors')

const cl = console.log
const app = express()

app.use(cors({ maxAge: 7200 }))

app.get('/:cid', (req, res) => {
    const { cid } = req.params
    //res.send(cid)
})

const port = process.env.PORT || 8031
const server = http.createServer(app)
server.listen(port, () => cl(`Gateway running on port ${port}`))
