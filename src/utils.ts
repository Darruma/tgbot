import { ethers, getAddress } from "ethers";
import redis from "./redis";

export async function createOrGetWallet(tgID: string) {
  const privKey = await redis.get(tgID);
  if (privKey) {
    return privKey;
  }
  const wallet = ethers.Wallet.createRandom();
  await redis.set(tgID, wallet.privateKey);
  return wallet.privateKey;
}

export async function userIsRegistered(tgID: string) {
  const privKey = await redis.get(tgID);
  if (privKey) {
    return true;
  } else {
    return false;
  }
}

export async function withdrawToWallet(
  tgID: string,
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
