import { ethers } from "ethers";
import { config } from "dotenv";
import contractAbi from "./ABI/contractAbi.json";
config();

// npx ts-node scripts/claimScript.ts 
const contractAddress = "0x94177FE1c91a44a620F61083F5477797f6b902E6";
const provider = new ethers.providers.JsonRpcProvider(`${process.env.BSC_MAINNET}`);
const admin = new ethers.Wallet(`${process.env.ADMIN_PRIVATE_KEY}`, provider);
const contract = new ethers.Contract(contractAddress, contractAbi, provider);


async function sendTx() {
  let allReceivers = await contract.callStatic.getReceiversLength();
  for (let i = 0; i < allReceivers; i++) {
    console.log("User № ", i);
    let tempUser = await contract.callStatic.allReceivers(i)
    let lastStakeId = await contract.getMyLastStakedId(tempUser);

    for (let j = 0; j < lastStakeId; j++) {
      console.log("User's Stake № ", j);
      let gasLimit;
      try {
        gasLimit = (
          await admin.estimateGas({
            data: "0xddd5e1b2" + j.toString(16).padStart(64, "0") + tempUser.replace("0x", "").padStart(64, "0"),
            to: contract.address,
            value: 0,
          })
        ).add(50000);
      } catch (error: any) {
        console.log(error.reason);
        continue;
      }
      const n = await admin.getTransactionCount("latest");

      const tx = await admin.sendTransaction({
        to: contract.address,
        gasLimit,
        data: "0xddd5e1b2" + j.toString(16).padStart(64, "0") + tempUser.replace("0x", "").padStart(64, "0"),
        value: 0,
        nonce: n,
        gasPrice: "0x2540be400",
      });

      await tx.wait();
      console.log("CLAIMED");
    }
  }
}

async function start() {
  setInterval(async () => {
    try {
      await sendTx();
    } catch (error: any) {
      console.log(error);
    }
  }, 60 * 1 * 1000); // 1 minute
}
start()