import TelegramBot from "node-telegram-bot-api";
import { userIsRegistered, createOrGetWallet, withdrawToWallet } from "./utils";
import { ethers } from "ethers";
import { buyTokens } from "./pokebet";
import { Alchemy, Network } from "alchemy-sdk";
const hexToDecimal = (hex: string) => parseInt(hex, 16);
const settings = {
  apiKey: "yaOs3UBcQbQ743cB2xjFvhZm0q7020BH",
  network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(settings);

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
    "67TaLoEIQQoQuydDn4HcFCGgi9Kc5Kn0"
  );
  const wallet = new ethers.Wallet(privKey, provider);
  return wallet;
}
async function mainMenu(tgID: string, msg: TelegramBot.Message) {
  const privKey = await createOrGetWallet(tgID);
  const wallet = getWalletWithProvider(privKey);
  const provider = new ethers.AlchemyProvider(
    "mainnet",
    "67TaLoEIQQoQuydDn4HcFCGgi9Kc5Kn0"
  );
  const ethBalance =
    Number((await provider.getBalance(wallet.address)).toString()) / 1e18;

  const messages = [
    "🤼‍♂️ <b> AquaTrading </b> ⬩<b>  Cross trading platform </b> ⬩ <a href='aquatrading.io' > <b> Website </b> </a>  🤼",
    "",
    "<b>═══ Your Wallet ═══ </b>",
    "",
    `👤 <b> Address: </b> ${wallet.address}`,
    `💰 <b> ETH Balance: </b> ${ethBalance} ETH`,
    "",
  ];
  bot.sendMessage(msg.chat.id, messages.join("\n"), {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Buy Tokens",
            callback_data: "buy_tokens",
          },
        ],
        [
          {
            text: "Reveal Private Key",
            callback_data: "private_key",
          },
        ],
        [
          {
            text: "Portfolio Balances",
            callback_data: "show_portfolio",
          },
          {
            text: "Withdraw ETH",
            callback_data: "withdraw_eth",
          },
        ],
        [
          {
            text: "ASK AI",
            callback_data: "ask_ai",
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
  if (!userIsRegistered(id.toString())) {
    console.log("Here2");
    bot.sendMessage(chatId, "Registring...");
    const privKey = await createOrGetWallet(id.toString());
    const wallet = getWalletWithProvider(privKey);
    bot.sendMessage(
      chatId,
      `Registered!. Your wallet address is ${wallet.address}`
    );
    return;
  } else {
    if (msg.text == "/menu" || msg.text == "/start") {
      await mainMenu(id.toString(), msg);
      return;
    }

    switch (msg?.reply_to_message?.text) {
      case "Enter amount of ETH to spend and token address":
        const [numSpend, addressOfToken] = msg.text.split(" ");
        bot.sendMessage(chatId, "Buying Token...");
        if (!checkNum(msg, chatId)) break;
        if (!isAddress(addressOfToken)) {
          bot.sendMessage(chatId, "❌ Invalid address format!");
          break;
        }
        try {
          const txBuy = await buyTokens(
            id.toString(),
            Number(numSpend.toString()),
            addressOfToken
          );
          bot.sendMessage(
            chatId,
            `🛍️ <b> Buying ${addressOfToken}}!... </b> <a href="etherscan.io/tx/${txBuy.hash}"> View on Etherscan </a>`,
            {
              parse_mode: "HTML",
            }
          );
          const receiptBuy = await txBuy.wait();
          bot.sendMessage(
            chatId,
            `✅ ${addressOfToken} bought! <a href="etherscan.io/tx/${txBuy.hash}"> View on Etherscan </a>`,
            {
              parse_mode: "HTML",
            }
          );
        } catch (e) {
          bot.sendMessage(chatId, "❌ Error buying token: " + e.reason);
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
            id.toString(),
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
      default:
        bot.sendMessage(chatId, "❌ Invalid command");
        await mainMenu(chatId.toString(), msg);
    }
  }
});

bot.on("callback_query", async (query) => {
  const privkey = await createOrGetWallet(query.from.id.toString());
  const wallet = getWalletWithProvider(privkey);
  const { data } = query;
  switch (data) {
    case "private_key":
      bot.sendMessage(query.message.chat.id, privkey);
      break;
    case "buy_tokens":
      bot.sendMessage(query.message.chat.id, "Buying Token...");
      bot.sendMessage(
        query.message.chat.id,
        "Enter amount of ETH to spend on Token and token address",
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
    case "show_portfolio":
      bot.sendMessage(query.message.chat.id, "Showing Portfolio...");
      const address = wallet.address;
      const balances = await alchemy.core.getTokenBalances(address);
      let messages = [
        "🤼‍♂️ <b> AquaTrading </b> ⬩<b>  Cross trading platform </b> ⬩ <a href='aquatrading.io' > <b> Website </b> </a>  🤼",
        "",
        "<b>═══ Your Portfolio ═══ </b>",
        "",
      ];
      for (const balance of balances.tokenBalances) {
        const metadata = await alchemy.core.getTokenMetadata(
          balance.contractAddress
        );
        const bal =
          hexToDecimal(balance.tokenBalance || "0") /
          10 ** (metadata.decimals || 18);
        messages.push(
          `🔹 <b> ${metadata.symbol} </b> (${balance.contractAddress}) : ${bal}`
        );
      }
      bot.sendMessage(query.message.chat.id, messages.join("\n"), {
        parse_mode: "HTML",
      });
      break;
    case "ask_ai":
      bot.sendMessage(query.message.chat.id, "Currently not available");
      break;
    default:
      bot.sendMessage(query.message.chat.id, "Unknown command");
  }
});
