
import 'dotenv/config'
import express from 'express'
import { ethers } from 'ethers'

const app = express()
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
const wallet = ethers.Wallet.createRandom().connect(provider)

console.log("Revenue wallet:", wallet.address)

app.get('/', (_, res) => {
  res.send("Crypto Revenue Agent Running")
})

app.listen(3000)
