import algosdk from "algosdk";

// ✅ ALGOD Client Setup
function getAlgodClient() {
  const algodToken = "";
  const algodServer = "https://testnet-api.algonode.cloud";
  const algodPort = "";
  return new algosdk.Algodv2(algodToken, algodServer, algodPort);
}

// ✅ Generate and Display New Account
function generateAndDisplayAccount() {
  const account = algosdk.generateAccount();
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);

  console.log("✅ Address:", account.addr);
  console.log("✅ Mnemonic:", mnemonic);
  return { account, mnemonic };
}

// ✅ Prompt User to Fund Account
async function promptToFundAccount(address) {
  console.log(
    "\n⏳ Please manually fund this address with at least 0.2 ALGO (200000 microAlgos)"
  );
  console.log("👉 Faucet: https://dispenser.testnet.aws.algodev.network/");
  console.log(`🔗 Address: ${address}`);
  console.log("🚀 Press Enter once funded to continue...");

  return new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.on("data", () => resolve());
  });
}

// ✅ NFT Creation Function
async function createNFTIfFunded({
  mnemonic,
  algodClient,
  assetName,
  unitName,
  assetURL,
}) {
  try {
    const account = algosdk.mnemonicToSecretKey(mnemonic);
    const accountInfo = await algodClient.accountInformation(account.addr).do();

    const minBalance = 200_000;
    console.log(`💰 Current Balance: ${accountInfo.amount} microAlgos`);

    if (accountInfo.amount < minBalance) {
      console.error(
        `❌ Account ${account.addr} does not have enough balance. Minimum 0.2 ALGO required.`
      );
      return null;
    }

    const suggestedParams = await algodClient.getTransactionParams().do();

    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      sender: account.addr,
      total: 1,
      decimals: 0,
      assetName,
      unitName,
      assetURL,
      manager: account.addr,
      reserve: account.addr,
      freeze: account.addr,
      clawback: account.addr,
      suggestedParams,
    });

    console.log("✍️ Signing transaction...");
    const signedTxn = algosdk.signTransaction(txn, account.sk);
    console.log(`📨 Signature. TxID: ${signedTxn.txID}`);
    console.log("📤 Sending transaction...");
    await algodClient.sendRawTransaction(signedTxn.blob).do();

    console.log("⏳ Waiting for confirmation...");
    const confirmedTxn = await algosdk.waitForConfirmation(
      algodClient,
      signedTxn.txID,
      10
    );

    console.log(
      "🔎 Full Confirmed Transaction:",
      JSON.stringify(
        confirmedTxn,
        (key, value) => (typeof value === "bigint" ? value.toString() : value),
        2
      )
    );

    const assetId = confirmedTxn.assetIndex?.toString() ?? "Not found";
    console.log("✅ NFT Created Successfully! Asset ID:", assetId);

    return assetId;
  } catch (err) {
    console.error("🔥 Error during NFT creation:", err);
    return null;
  }
}

async function optInToAssetIfNotOptedIn({ mnemonic, assetId, algodClient }) {
  // 1. Recover account from mnemonic
  console.log("⚠️ mnemonic received:", mnemonic);
  const account = algosdk.mnemonicToSecretKey(mnemonic);

  // 2. Fetch account info to check asset holdings
  const accountInfo = await algodClient.accountInformation(account.addr).do();
  const assetHolding = accountInfo.assets.find(
    (a) => a["asset-id"] === assetId
  );

  if (assetHolding) {
    return `Account ${account.addr} is already opted in to asset ${assetId}.`;
  }

  // 3. Get suggested params
  const suggestedParams = await algodClient.getTransactionParams().do();

  // 4. Construct opt-in transaction (send 0 of the asset to self)
  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: account.addr,
    receiver: account.addr,
    assetIndex: assetId,
    amount: 0,
    suggestedParams,
  });

  // 5. Sign and send the transaction
  const signedTxn = algosdk.signTransaction(txn, account.sk);
  await algodClient.sendRawTransaction(signedTxn.blob).do();

  // 6. Wait for confirmation
  const result = await algosdk.waitForConfirmation(
    algodClient,
    signedTxn.txID,
    4
  );
  console.log(result);
  const accountInfo2 = await algodClient.accountInformation(account.addr).do();
  const assetHolding2 = accountInfo2.assets.find(
    (a) => a["asset-id"] === assetId
  );

  if (assetHolding2) {
    return `Account ${account.addr} is already opted in to asset ${assetId}.`;
  }
  return `Opt-in transaction sent. TxID:`;
}

// ✅ Transfer Asset (NFT) to another account
async function transferAsset({
  senderMnemonic,
  receiverAddress,
  assetId,
  algodClient,
}) {
  try {
    const sender = algosdk.mnemonicToSecretKey(senderMnemonic);

    const suggestedParams = await algodClient.getTransactionParams().do();

    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: sender.addr,
      receiver: receiverAddress,
      assetIndex: assetId,
      amount: 1,
      suggestedParams,
    });

    console.log("✍️ Signing transfer transaction...");
    const signedTxn = algosdk.signTransaction(txn, sender.sk);
    console.log("📤 Sending transfer transaction...");
    await algodClient.sendRawTransaction(signedTxn.blob).do();

    console.log("⏳ Waiting for confirmation...");
    const confirmedTxn = await algosdk.waitForConfirmation(
      algodClient,
      signedTxn.txID,
      4
    );

    console.log(`✅ Asset transferred! TxID: ${signedTxn.txID}`);
    return confirmedTxn;
  } catch (err) {
    console.error("🔥 Error during asset transfer:", err);
    return null;
  }
}

async function reconfigureAsset({
  managerMnemonic,
  assetId,
  newManager,
  newReserve,
  newFreeze,
  newClawback,
  algodClient,
}) {
  // 1. Recover manager account from mnemonic
  const managerAccount = algosdk.mnemonicToSecretKey(managerMnemonic);

  // 2. Get suggested params
  const suggestedParams = await algodClient.getTransactionParams().do();

  const assetInfo = await algodClient.getAssetByID(assetId).do();

  // 3. Construct asset config transaction
  const txn = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject({
    sender: managerAccount.addr,
    assetIndex: assetId,
    manager: newManager || assetInfo.params.manager,
    reserve: newReserve || assetInfo.params.reserve,
    freeze: newFreeze || assetInfo.params.freeze,
    clawback: newClawback || assetInfo.params.clawback,
    suggestedParams,
  });

  // 4. Sign the transaction
  const signedTxn = algosdk.signTransaction(txn, managerAccount.sk);

  // 5. Send the transaction
  await algodClient.sendRawTransaction(signedTxn.blob).do();

  // 6. Wait for confirmation
  const result = await algosdk.waitForConfirmation(
    algodClient,
    signedTxn.txID,
    4
  );

  return `Asset reconfiguration transaction sent. TxID: `, result;
}

async function freezeAssetForAccount({
  freezeMnemonic,
  assetId,
  accountToFreeze,
  algodClient,
}) {
  const freezeAccount = algosdk.mnemonicToSecretKey(freezeMnemonic);

  // Ensure asset ID is defined
  if (assetId === undefined || typeof assetId !== "bigint") {
    throw new Error("Invalid assetId: must be a BigInt");
  }


  const suggestedParams = await algodClient.getTransactionParams().do();

  const txn = algosdk.makeAssetFreezeTxnWithSuggestedParamsFromObject({
    sender: freezeAccount.addr,
    assetIndex: Number(assetId), // or BigInt(assetId) if needed
    freezeTarget: accountToFreeze,
    frozen: true,
    suggestedParams,
  });

  const signedTxn = algosdk.signTransaction(txn, freezeAccount.sk);

  await algodClient.sendRawTransaction(signedTxn.blob).do();
  await algosdk.waitForConfirmation(algodClient, signedTxn.txID, 4);

  return `✅ Asset freeze transaction sent. TxID: ${signedTxn.txID}`;
}

async function revokeAsset({
  clawbackMnemonic,
  assetId,
  revokeFrom,
  receiver,
  amount,
  algodClient,
}) {
  // 1. Recover clawback account from mnemonic
  const clawbackAccount = algosdk.mnemonicToSecretKey(clawbackMnemonic);
  // 2. Fetch asset info to get the current clawback address

  const accountInfo = await algodClient.accountInformation(receiver).do();
  const minBalance = 1000;
  if (accountInfo.amount < minBalance) {
    console.log(`⚠️ Clawback account has low balance (${accountInfo.amount} microAlgos). Prompting to fund...`);

    // Prompt to fund the account (uses testnet faucet or wallet depending on environment)
    await algokit.promptToFundAccount({
      address: receiver.addr
    });
  }

  console.log(
    "🔁 Checking if original creator has opted in before clawback..."
  );

  const optInBackResult = await optInToAssetIfNotOptedIn({
    mnemonic: receiver,
    assetId: BigInt(assetId),
    algodClient,
  });
  const receiverAccount = algosdk.mnemonicToSecretKey(receiver);
  console.log(optInBackResult);

  // 4. Get suggested params
  const suggestedParams = await algodClient.getTransactionParams().do();

  // 5. Construct asset clawback transaction
  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: clawbackAccount.addr,
    receiver: receiverAccount.addr,
    assetIndex: assetId,
    amount: amount,
    revokeFrom: revokeFrom,
    suggestedParams,
  });

  // 6. Sign the transaction
  const signedTxn = algosdk.signTransaction(txn, clawbackAccount.sk);

  // 7. Send the transaction
  await algodClient.sendRawTransaction(signedTxn.blob).do();

  // 8. Wait for confirmation
  const result = await algosdk.waitForConfirmation(
    algodClient,
    signedTxn.txID,
    10
  );

  return `Asset revoke (clawback) transaction sent. TxID:`, result;
}

// ✅ Main Function
async function main() {
  const algodClient = getAlgodClient();
  const { account, mnemonic } = generateAndDisplayAccount();

  await promptToFundAccount(account.addr);

  console.log("🚧 Attempting to create NFT...");
  const assetId = await createNFTIfFunded({
    mnemonic,
    algodClient,
    assetName: "My NFT",
    unitName: "MNFT",
    assetURL: "https://example.com/metadata.json",
  });

  if (assetId && assetId !== "Not found") {
    console.log(
      `🎉 Success! View your NFT at: https://testnet.explorer.perawallet.app/assets/${assetId}`
    );
  } else {
    console.log("❌ NFT creation failed. See above for details.");
  }

  const result = await optInToAssetIfNotOptedIn({
    mnemonic: mnemonic,
    assetId: BigInt(assetId), // your asset ID
    algodClient, // your initialized Algodv2 client
  });
  console.log(result);

  if (assetId && assetId !== "Not found") {
    console.log(
      `🎉 Success! View your NFT at: https://testnet.explorer.perawallet.app/assets/${assetId}`
    );
  } else {
    console.log("❌ NFT creation failed. See above for details.");
    process.exit(1);
  }

  // ✅ Create another account to receive the asset
  const { account: receiverAccount, mnemonic: receiverMnemonic } =
    generateAndDisplayAccount();

  console.log("⏳ Please fund the receiver address too (for opt-in)");
  await promptToFundAccount(receiverAccount.addr);

  console.log("🚪 Opting-in receiver account...");
  const optInResult = await optInToAssetIfNotOptedIn({
    mnemonic: receiverMnemonic,
    assetId: BigInt(assetId),
    algodClient,
  });
  console.log(optInResult);

  console.log("📦 Transferring NFT to receiver...");
  await transferAsset({
    senderMnemonic: mnemonic,
    receiverAddress: receiverAccount.addr,
    assetId: BigInt(assetId),
    algodClient,
  });

  console.log(
    `🎉 You can now view it in the receiver’s account: ${receiverAccount.addr}`
  );

  console.log("🔧 Reconfiguring NFT... (changing manager to receiver)");

  const reconfigMessage = await reconfigureAsset({
    managerMnemonic: mnemonic,
    assetId: BigInt(assetId),
    newManager: receiverAccount.addr,
    newReserve: undefined, // Keep existing
    newFreeze: undefined, // Keep existing
    newClawback: undefined, // Keep existing
    algodClient,
  });

  console.log(reconfigMessage);

  // ✅ Confirm reconfiguration by fetching asset again
  const assetInfo = await algodClient.getAssetByID(Number(assetId)).do();
  console.log("🔍 Updated Asset Info:");
  console.log("👑 Manager:", assetInfo.params.manager);
  console.log("💼 Reserve:", assetInfo.params.reserve);
  console.log("❄️ Freeze:", assetInfo.params.freeze);
  console.log("🦞 Clawback:", assetInfo.params.clawback);

  console.log("❄️ Freezing the NFT for receiver...");

//   const freezeResult = await freezeAssetForAccount({
//     freezeMnemonic: mnemonic, // only works if receiver is current freeze address
//     assetId: BigInt(assetId),
//     accountToFreeze: receiverAccount.addr,
//     algodClient,
//   });

//   console.log(freezeResult);

  const { account: receiver, mnemonic: receiverm } =
    generateAndDisplayAccount();

  console.log("⏳ Please fund the receiver address too (for opt-in)");
  await promptToFundAccount(receiver.addr);

  console.log("🦞 Revoking NFT (clawback from receiver back to creator)...");

  const revokeResult = await revokeAsset({
    clawbackMnemonic: mnemonic,
    assetId: BigInt(assetId),
    revokeFrom: receiverAccount.addr,
    receiver: receiverm,
    amount: 1,
    algodClient,
  });

  console.log(revokeResult);
  process.exit();
}

main();
