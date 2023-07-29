import TelegramBot from "node-telegram-bot-api";
import { userIsRegistered, createOrGetWallet, withdrawToWallet } from "./utils";
import { Wallet, ethers } from "ethers";
import {
  betOnOutcome,
  buyPoke,
  claimWinnings,
  withdrawPBETS,
  getUserBets,
  isBetEnabled,
} from "./pokebet";
import { PBETS } from "./constants";
import erc20_abi from "./erc20_abi";

const isAddress = ethers.isAddress;
require("dotenv").config();
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

const checkNum = (msg: TelegramBot.Message, chatId: number) => {
  const num = Number(msg.text);
  if (isNaN(num) || num < 0) {
    bot.sendMessage(chatId, "⚠️ Please enter a valid non-negative number!");
    return false;
  } else {
    return true;
  }
};
const checkNumActual = (num: any, chatId: number) => {
  num = Number(num);
  if (isNaN(num) || num < 0) {
    bot.sendMessage(chatId, "⚠️ Please enter a valid non-negative number!");
    return false;
  } else {
    return true;
  }
};

export function getWalletWithProvider(privKey: string) {
  const provider = new ethers.AlchemyProvider(
    "mainnet",
    "mgcF2dJ1jCEID3s2J2Oui80yTu3AYDF8"
  );
  const wallet = new ethers.Wallet(privKey, provider);
  return wallet;
}
async function mainMenu(tgID: number, msg: TelegramBot.Message) {
  const privKey = await createOrGetWallet(tgID);
  const wallet = getWalletWithProvider(privKey);
  const provider = new ethers.AlchemyProvider(
    "mainnet",
    "mgcF2dJ1jCEID3s2J2Oui80yTu3AYDF8"
  );
  const ethBalance =
    Number((await provider.getBalance(wallet.address)).toString()) / 1e18;
  const pokeContract = new ethers.Contract(PBETS, erc20_abi, wallet);
  const userbets = await getUserBets(tgID);
  const betState = Number((await isBetEnabled(tgID)).toString());
  let betStateString = "";
  if (betState == 0) {
    betStateString = "🟡 Betting is open";
  } else if (betState == 1) {
    betStateString =
      "🔴 Betting is closed, please wait for the battle to finish";
  } else {
    betStateString = "🟢 Betting has resolved, please wait ";
  }
  const pokeBalance =
    Number((await pokeContract.balanceOf(wallet.address)).toString()) / 1e9;
  const messages = [
    "🤼‍♂️ <b> Pokebets </b> ⬩<b> Bet on pokemon battles </b> ⬩ <a href='pokebets.io' > <b> Website </b> </a>  🤼",
    "",
    "<b>═══ Your Wallet ═══ </b>",
    "",
    `👤 <b> Address: </b> ${wallet.address}`,
    `💰 <b> ETH Balance: </b> ${ethBalance} ETH`,
    `💰 <b> PBETS Balance: </b> ${pokeBalance.toLocaleString()} PBETS`,
    `📝 <b  Bet State: </b> ${betStateString}`,
    `📝 <b> Trainer1 Bet: </b> ${userbets.trainer1Bet}`,
    `📝 <b> Trainer2 Bet: </b> ${userbets.trainer2Bet}`,
    "",
  ];
  bot.sendMessage(msg.chat.id, messages.join("\n"), {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Buy PBETS",
            callback_data: "buy_poke",
          },
        ],
        //[
        //  {
        //    text: "Withdraw ETH",
        //    callback_data: "withdraw_eth",
        //  },
        //  {
        //    text: "Withdraw PBETS",
        //    callback_data: "withdraw_poke",
        //  },
        //        ],
        [
          {
            text: "Bet on Trainer 1",
            callback_data: "bet_trainer1",
          },
          {
            text: "Bet on Trainer 2",
            callback_data: "bet_trainer2",
          },
        ],
        [
          {
            text: "Claim Winnings",
            callback_data: "claim",
          },
        ],
        [
          {
            text: "Reveal Private Key",
            callback_data: "private_key",
          },
        ],
      ],
    },
  });
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const { id } = msg.from;
  console.log("here");
  if (!userIsRegistered(id)) {
    console.log("Here2");
    bot.sendMessage(chatId, "Registring...");
    const privKey = await createOrGetWallet(id);
    const wallet = getWalletWithProvider(privKey);
    bot.sendMessage(
      chatId,
      `Registered!. Your wallet address is ${wallet.address}`
    );
    return;
  } else {
    if (msg.text == "/menu") {
      await mainMenu(id, msg);
      return;
    }

    switch (msg?.reply_to_message?.text) {
      case "Enter amount to bet on trainer 1":
        console.log("im here");
        bot.sendMessage(chatId, "Bet on trainer 1");
        if (!checkNum(msg, chatId)) break;
        const num1 = Number(msg.text);
        if (num1 < 100) {
          bot.sendMessage(chatId, "⚠️ Minimum bet is 100 PBETS");
          break;
        }
        if (!msg.text) break;
        try {
          const tx1 = await betOnOutcome(id, num1, 0, bot);
          bot.sendMessage(chatId, `🛒 <b> Placing bet... </b>`, {
            parse_mode: "HTML",
          });
          const receipt1 = await tx1.wait();
          bot.sendMessage(
            chatId,
            `✅ Bet placed! <a href="etherscan.io/tx/${tx1.hash}"> View on Etherscan </a>`,
            {
              parse_mode: "HTML",
            }
          );
        } catch (e) {
          bot.sendMessage(chatId, "❌ Error placing bet: " + e.reason);
          break;
        }
        break;
      case "Enter amount to bet on trainer 2":
        bot.sendMessage(chatId, "Bet on trainer 2");
        if (!checkNum(msg, chatId)) break;
        const num = Number(msg.text);
        if (num < 100) {
          bot.sendMessage(chatId, "⚠️ Minimum bet is 100 PBETS");
          break;
        }
        if (!msg.text) break;
        try {
          const tx = await betOnOutcome(id, num, 1, bot);
          bot.sendMessage(chatId, `🛒 <b> Placing bet... </b>`, {
            parse_mode: "HTML",
          });
          const receipt = await tx.wait();
          bot.sendMessage(
            chatId,
            `✅ Bet placed! <a href="etherscan.io/tx/${tx.hash}"> View on Etherscan </a>`,
            {
              parse_mode: "HTML",
            }
          );
        } catch (e) {
          bot.sendMessage(chatId, "❌ Error placing bet: " + e.reason);
          return;
        }
        break;
      case "Enter amount of ETH to spend on PBETS":
        bot.sendMessage(chatId, "Buying PBETS...");
        if (!checkNum(msg, chatId)) break;
        try {
          const txBuy = await buyPoke(id, Number(msg.text));
          bot.sendMessage(
            chatId,
            `🛍️ <b> Buying PBETS!... </b> <a href="etherscan.io/tx/${txBuy.hash}"> View on Etherscan </a>`,
            {
              parse_mode: "HTML",
            }
          );
          const receiptBuy = await txBuy.wait();
          bot.sendMessage(
            chatId,
            `✅ PBETS bought! <a href="etherscan.io/tx/${txBuy.hash}"> View on Etherscan </a>`,
            {
              parse_mode: "HTML",
            }
          );
        } catch (e) {
          bot.sendMessage(chatId, "❌ Error buying PBETS: " + e.reason);
          break;
        }
        break;
      case "Enter amount of ETH to withdraw and address to withdraw to (separated by a space)":
        console.log("here2");
        const [numWithdrawEth, address2] = msg.text.split(" ");
        console.log(numWithdrawEth, address2);
        if (!checkNumActual(numWithdrawEth, chatId)) break;
        try {
          if (!isAddress(address2)) {
            bot.sendMessage(chatId, "❌ Invalid address format!");
            break;
          }
          const txEth = await withdrawToWallet(
            id,
            Number(numWithdrawEth) * 1e18,
            address2
          );
          bot.sendMessage(
            chatId,
            `💸 <b> Withdrawing ETH!... </b> <a href="etherscan.io/tx/${txEth.hash}"> View on Etherscan </a>`,
            {
              parse_mode: "HTML",
            }
          );
        } catch (e) {
          bot.sendMessage(
            chatId,
            `❌ <b> Error withdrawing ETH: ${e.reason} </b>`,
            {
              parse_mode: "HTML",
            }
          );
          return;
        }
        break;
      case "Enter amount of PBETS to withdraw and address to withdraw to (separated by a space)":
        bot.sendMessage(chatId, "Withdrawing PBETS...");
        const [numWithdrawPbets, address1] = msg.text.split(" ");
        if (!checkNumActual(numWithdrawPbets, chatId)) break;
        try {
          if (!isAddress(address1)) {
            bot.sendMessage(chatId, "❌ Invalid address format!");
            break;
          }
          const tx = await withdrawPBETS(
            id,
            Number(numWithdrawPbets) * 1e9,
            address1
          );
          bot.sendMessage(
            chatId,
            `💸 <b> Withdrawing PBETS!... </b> <a href="etherscan.io/tx/${tx.hash}"> View on Etherscan </a>`,
            {
              parse_mode: "HTML",
            }
          );
        } catch (e) {
          bot.sendMessage(chatId, `❌ Error withdrawing PBETS: ` + e.reason);
          break;
        }
        break;
      default:
        bot.sendMessage(chatId, "❌ Invalid command");
        await mainMenu(chatId, msg);
    }
  }
});

bot.on("callback_query", async (query) => {
  const privkey = await createOrGetWallet(query.from.id);
  const wallet = getWalletWithProvider(privkey);
  const { data } = query;
  switch (data) {
    case "private_key":
      bot.sendMessage(query.message.chat.id, privkey);
      break;
    case "buy_poke":
      bot.sendMessage(query.message.chat.id, "Buying PBETS...");
      bot.sendMessage(
        query.message.chat.id,
        "Enter amount of ETH to spend on PBETS",
        {
          reply_markup: {
            force_reply: true,
            input_field_placeholder: "",
          },
        }
      );
      break;
    case "withdraw_eth":
      bot.sendMessage(query.message.chat.id, "Withdrawing ETH...");
      bot.sendMessage(
        query.message.chat.id,
        "Enter amount of ETH to withdraw and address to withdraw to (separated by a space)",
        {
          reply_markup: {
            force_reply: true,
            input_field_placeholder: "",
          },
        }
      );
      break;
    case "withdraw_poke":
      bot.sendMessage(query.message.chat.id, "Withdrawing PBETS...");
      bot.sendMessage(
        query.message.chat.id,
        "Enter amount of PBETS to withdraw and address to withdraw to (separated by a space)",
        {
          reply_markup: {
            force_reply: true,
            input_field_placeholder: "",
          },
        }
      );
      break;
    case "bet_trainer1":
      bot.sendMessage(query.message.chat.id, "Making a bet...");
      bot.sendMessage(
        query.message.chat.id,
        "Enter amount to bet on trainer 1",
        {
          reply_markup: {
            force_reply: true,
            input_field_placeholder: "",
          },
        }
      );
      break;
    case "bet_trainer2":
      bot.sendMessage(query.message.chat.id, "Making a bet...");
      bot.sendMessage(
        query.message.chat.id,
        "Enter amount to bet on trainer 2",
        {
          reply_markup: {
            force_reply: true,
            input_field_placeholder: "",
          },
        }
      );
    case "claim":
      try {
        const tx = await claimWinnings(query.from.id);
        bot.sendMessage(
          query.message.chat.id,
          `💸 <b> Claiming Winnings!... </b> <a href="etherscan.io/tx/${tx.hash}"> View on Etherscan </a>`,
          {
            parse_mode: "HTML",
          }
        );
        const receipt = await tx.wait();
        bot.sendMessage(
          query.message.chat.id,
          `🎉 <b> Claimed Winnings! </b> <a href="etherscan.io/tx/${tx.hash}"> View on Etherscan </a>`,
          {
            parse_mode: "HTML",
          }
        );
      } catch (e) {
        bot.sendMessage(
          query.message.chat.id,
          `❌ Error claiming winnings: ` + e.reason
        );
        break;
      }

      break;
    default:
      bot.sendMessage(query.message.chat.id, "Unknown command");
  }
});
