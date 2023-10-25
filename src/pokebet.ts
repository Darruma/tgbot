import { ethers } from "ethers";
import { createOrGetWallet } from "./utils";
import { getWalletWithProvider } from ".";
import { WETH, UNISWAP_ROUTER } from "./constants";

export async function buyTokens(
  tgId: string,
  amountOfEth: number,
  tokenAddress: string
) {
  const privkey = await createOrGetWallet(tgId);
  const wallet = await getWalletWithProvider(privkey);
  const router = new ethers.Contract(
    UNISWAP_ROUTER,
    [
      "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
    ],
    wallet
  );
  const oneHourInTheFutureInUnix = Math.floor(Date.now() / 1000) + 3600;
  try {
    const tx = await router.swapExactETHForTokens.staticCall(
      0,
      [WETH, tokenAddress],
      wallet.address,
      oneHourInTheFutureInUnix,
      {
        value: ethers.parseEther(amountOfEth.toString()),
      }
    );
  } catch (e) {
    console.log(e);
    throw e;
  }
  const result = await router.swapExactETHForTokens(
    0,
    [WETH, tokenAddress],
    wallet.address,
    oneHourInTheFutureInUnix,
    {
      value: ethers.parseEther(amountOfEth.toString()),
    }
  );
  console.log(result);
  return result;
}
