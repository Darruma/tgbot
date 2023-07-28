enum Outcome {
  Pokemon1Wins,
  Pokemon2Wins,
}
import { ethers, getAddress } from "ethers";
import redis from "./redis";

export async function createOrGetWallet(tgID: number) {
  const privKey = await redis.get(tgID);
  if (privKey) {
    return privKey;
  }
  const wallet = ethers.Wallet.createRandom();
  await redis.set(tgID, wallet.privateKey);
  return wallet.privateKey;
}

export async function userIsRegistered(tgID: number) {
  const privKey = await redis.get(tgID);
  if (privKey) {
    return true;
  } else {
    return false;
  }
}

export async function withdrawToWallet(
  tgID: number,
  amount: number,
  to: string
) {
  const privKey = await redis.get(tgID);
  if (privKey) {
    const wallet = new ethers.Wallet(privKey);
    const toAddr = getAddress(to);
    const tx = await wallet.sendTransaction({
      value: ethers.parseEther(amount.toString()),
      to: toAddr,
    });
    return tx;
  } else {
    return null;
  }
}

function bet(tgId: number, amount: number, outcome: Outcome) {
  const key = createOrGetWallet(tgId);
}
