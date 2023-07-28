import { ethers, getDefaultProvider } from "ethers";
import { createOrGetWallet } from "./utils";
import { getWalletWithProvider } from ".";
import { BET_CONTRACT, PBETS, UNISWAP_ROUTER } from "./constants";
import erc20_abi from "./erc20_abi";
const {
  Token,
  WETH,
  Fetcher,
  Route,
  Trade,
  TokenAmount,
  TradeType,
  Percent,
} = require("@uniswap/sdk");

import bet_abi from "./bet_abi";
import TelegramBot from "node-telegram-bot-api";

export async function betOnOutcome(
  tgId: number,
  amount: number,
  outcome: number,
  bot: TelegramBot
) {
  const privkey = await createOrGetWallet(tgId);
  const wallet = await getWalletWithProvider(privkey);
  // check if approved enough
  const pokeContract = new ethers.Contract(PBETS, erc20_abi, wallet);
  const betContract = new ethers.Contract(BET_CONTRACT, bet_abi, wallet);
  const balance = Number(
    (await pokeContract.balanceOf(wallet.address)).toString()
  );
  amount = Number(ethers.parseUnits(amount.toString(), 9));
  if (balance < amount) {
    console.log("here1 ");
    bot.sendMessage(tgId, `<b> ❌ Not enough PBETS in wallet </b>`, {
      parse_mode: "HTML",
    });
    return;
  } else {
    const allowance = await pokeContract.allowance(
      wallet.address,
      BET_CONTRACT
    );
    const allowanceNum = Number(allowance.toString());
    if (allowanceNum < amount || !allowanceNum) {
      try {
        const tx = await pokeContract.approve.staticCall(
          BET_CONTRACT,
          ethers.parseUnits("100000000", 9)
        );
        const result = await pokeContract.approve(
          BET_CONTRACT,
          ethers.parseUnits("100000000", 9)
        );
        bot.sendMessage(
          tgId,
          `<b> ✅ Approving PBETS for betting...</b> <a href="etherscan.io/tx/${result.hash}"> View on Etherscan </a>`,
          {
            parse_mode: "HTML",
          }
        );
        const receipt = await result.wait();
        bot.sendMessage(
          tgId,
          `<b> ✅ Approved PBETS for betting! </b> <a href="etherscan.io/tx/${result.hash}"> View on Etherscan </a>`,
          {
            parse_mode: "HTML",
          }
        );
      } catch (e) {
        console.log(e);
        bot.sendMessage(
          tgId,
          `<b> ✅ Approving PBETS for betting failed </b>`,
          {
            parse_mode: "HTML",
          }
        );
        throw e;
      }
    }
    try {
      const tx = await betContract.battleWager.staticCall(
        outcome,
        ethers.parseUnits(amount.toString(), 9)
      );
    } catch (e) {
      console.log(e);
      throw e;
    }

    const result = await betContract.battleWager(
      outcome,
      ethers.parseUnits(amount.toString(), 9)
    );
    return result;
  }
}
export async function withdrawPBETS(tgId: number, amount: number, to: string) {
  const privkey = await createOrGetWallet(tgId);
  const wallet = await getWalletWithProvider(privkey);
  const pbets = new ethers.Contract(PBETS, erc20_abi, wallet);
  // call static to see if it works
  try {
    const tx = await pbets.transfer.staticCall(to, amount);
  } catch (e) {
    throw e;
  }

  const result = await pbets.transfer(to, amount);
  return result;
}

export async function claimWinnings(tgId: number) {
  const privkey = await createOrGetWallet(tgId);
  const wallet = await getWalletWithProvider(privkey);
  const betContract = new ethers.Contract(BET_CONTRACT, bet_abi, wallet);
  // call static to see if it works
  try {
    const tx = await betContract.winnerClaim.staticCall();
  } catch (e) {
    throw e;
  }
  const result = await betContract.winnerClaim();
  return result;
}

export async function getUserBets(tgId: number) {
  const privkey = await createOrGetWallet(tgId);
  const wallet = await getWalletWithProvider(privkey);
  const betContract = new ethers.Contract(BET_CONTRACT, bet_abi, wallet);
  const predictions = await betContract.getUserPredictionForOutcomes(
    wallet.address,
    [1, 2]
  );
  return {
    trainer1Bet: Number(predictions[0].toString()),
    trainer2Bet: Number(predictions[1].toString()),
  };
}

export async function buyPoke(tgId: number, amountOfEth: number) {
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
      ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", PBETS],
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
    ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", PBETS],
    wallet.address,
    oneHourInTheFutureInUnix,
    {
      value: ethers.parseEther(amountOfEth.toString()),
    }
  );
  console.log(result);
  return result;
}
