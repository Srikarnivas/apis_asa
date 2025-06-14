# 💠 ALGONEST — Flexible NFT Hub

Welcome to **ALGONEST** — your open-source gateway to building robust, flexible, and secure NFT marketplaces using **Algorand Blockchain**! 🔗✨

This project provides a complete backend solution that exposes **powerful NFT APIs** to create, manage, and trade NFTs effortlessly — perfect for developers, startups, and blockchain enthusiasts. Whether you're building a marketplace or experimenting with blockchain, **ALGONEST is your NFT playground**. 🛠️🧠

---

## 🧭 Table of Contents

- [🌟 Features](#-features)
- [🚀 Getting Started](#-getting-started)
- [🛠️ API Reference](#️-api-reference)
  - [Generate Account](#1-generate-account)
  - [Create NFT](#2-create-nft)
  - [Opt-in to NFT](#3-opt-in-to-nft)
  - [Transfer NFT](#4-transfer-nft)
  - [Reconfigure NFT](#5-reconfigure-nft)
  - [Freeze NFT](#6-freeze-nft)
  - [Clawback NFT](#7-clawback-nft)
  - [Countdown Clawback](#8-countdown-clawback)
- [📬 How to Test in Postman](#-how-to-test-in-postman)
- [📌 Contribution Guide](#-contribution-guide)
- [📄 License](#-license)

---

## 🌟 Features

✅ Create NFTs on Algorand  
✅ Transfer NFTs between wallets  
✅ Freeze, reconfigure, or clawback assets  
✅ Countdown-based secure clawback  
✅ Clean, modular REST API  
✅ Easy integration with web frontends  
✅ Works on **TestNet** for experimentation  

---

## 🚀 Getting Started

### 🔧 Prerequisites

- Node.js v16+
- `npm` or `yarn`
- Postman (for API testing)

### 🛠️ Installation

```bash
git clone https://github.com/YOUR_USERNAME/algonest-nft-hub.git
cd algonest-nft-hub
npm install
node server.js
```

## 🌐 Root API URL  
> [https://your-deployment-url.com](https://your-deployment-url.com)  
> _All endpoints are available under this root URL._


## 🛠️ API Reference

### 1️⃣ Generate Account

**`GET /api/nft/generate-account`**

🔹 **Description:** Generates a new Algorand TestNet account with mnemonic.

#### ✅ Example Response

```json
{
  "address": "ABCDEFG....",
  "mnemonic": "artist zoo lemon..."
}
```

> 🧠 Use this address in the TestNet Dispenser: https://bank.testnet.algorand.network/

---

### 2️⃣ Create NFT

**`POST /api/nft/create-nft`**

🔹 **Description:** Creates a single-unit (1 of 1) NFT using a funded Algorand wallet.

#### 🔸 Request Body

```json
{
  "mnemonic": "12-word mnemonic...",
  "assetName": "Dragon Art",
  "unitName": "DRGN",
  "assetURL": "https://gateway.pinata.cloud/ipfs/Qm..."
}
```

#### ✅ Response

```json
{
  "txId": "TXID123...",
  "assetId": 12345678
}
```

> ⚠️ Requires ~0.2 ALGO in the sender account.

---

### 3️⃣ Opt-in to NFT

**`POST /api/nft/optin`**

🔹 **Description:** Prepares a receiver account to accept a specific NFT.

#### 🔸 Request Body

```json
{
  "mnemonic": "receiver's mnemonic",
  "assetId": 12345678
}
```

#### ✅ Response

```json
{ "message": "Opt-in successful", "txId": "..." }
```

---

### 4️⃣ Transfer NFT

**`POST /api/nft/transfer`**

🔹 **Description:** Transfers an NFT to another account.

#### 🔸 Request Body

```json
{
  "mnemonic": "sender mnemonic",
  "assetId": 12345678,
  "receiver": "RECEIVER_ADDRESS",
  "amount": 1
}
```

#### ✅ Response

```json
{ "message": "Transfer successful", "txId": "..." }
```

---

### 5️⃣ Reconfigure NFT

**`POST /api/nft/reconfigure`**

🔹 **Description:** Updates asset roles (manager, reserve, freeze, clawback).

#### 🔸 Request Body

```json
{
  "mnemonic": "creator mnemonic",
  "assetId": 12345678,
  "manager": "NEW_MANAGER_ADDRESS"
}
```

#### ✅ Response

```json
{ "message": "Asset reconfigured", "txId": "..." }
```

---

### 6️⃣ Freeze NFT

**`POST /api/nft/freeze`**

🔹 **Description:** Freezes a user's NFT (they can't transfer it anymore).

#### 🔸 Request Body

```json
{
  "mnemonic": "freeze admin mnemonic",
  "assetId": 12345678,
  "target": "FROZEN_USER_ADDRESS",
  "freeze": true
}
```

#### ✅ Response

```json
{ "message": "Account frozen", "txId": "..." }
```

---

### 7️⃣ Clawback NFT

**`POST /api/nft/clawback`**

🔹 **Description:** Forcefully retrieves an NFT from one account to another.

#### 🔸 Request Body

```json
{
  "mnemonic": "clawback admin mnemonic",
  "assetId": 12345678,
  "revokeFrom": "VIOLATOR_ADDRESS",
  "receiver": "OWNER_ADDRESS",
  "amount": 1
}
```

#### ✅ Response

```json
{ "message": "Clawback successful", "txId": "..." }
```

---

### 8️⃣ Countdown Clawback ⏳

**`POST /api/nft/countdown-clawback`**

🔹 **Description:** Delays the clawback by N seconds. Useful for dispute periods.

#### 🔸 Request Body

```json
{
  "mnemonic": "clawback admin",
  "assetId": 12345678,
  "revokeFrom": "USER_A",
  "receiver": "USER_B",
  "amount": 1,
  "countdownSeconds": 10
}
```

#### ✅ Response

```json
{ "message": "Countdown completed and asset clawed back." }
```

---

## 📬 How to Test in Postman

### 🔹 Setup
1. Open **Postman**
2. Create new `Collection`: `ALGONEST APIs`
3. Set **Base URL**: `http://localhost:5000/api/nft`

### 🔸 Example Usage: Create NFT

1. Method: `POST`
2. URL: `http://localhost:5000/api/nft/create-nft`
3. Body → Raw → JSON:

```json
{
  "mnemonic": "your mnemonic",
  "assetName": "Golden Token",
  "unitName": "GLD",
  "assetURL": "https://link.to/your/asset"
}
```

4. Send ✅ → You'll get the `txId` and `assetId`.

Repeat similarly for other endpoints.

---

## 🤝 Contribution Guide

Want to add more features? Add support for ARC3, ARC69, IPFS pinning, NFT auctions, or even frontend interfaces!

- Fork this repo
- Create a new branch (`feature/my-feature`)
- Submit a pull request

---

## 📄 License

This project is open-sourced under the **MIT License**.  
Use freely, build fearlessly. 🧙‍♂️✨

---

> 🔗 Powered by [Algorand](https://www.algorand.com/) · Built with ❤️ by the community
---

## 👨‍💻 Creator

Made with ❤️ by [**Srikarnivas**](https://github.com/Srikarnivas)

Feel free to contribute, suggest improvements, or ⭐ the repo if you found it helpful!
