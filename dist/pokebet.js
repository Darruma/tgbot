"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyPoke = exports.getUserBets = exports.claimWinnings = exports.withdrawPBETS = exports.betOnOutcome = void 0;
const ethers_1 = require("ethers");
const utils_1 = require("./utils");
const _1 = require(".");
const constants_1 = require("./constants");
const erc20_abi_1 = __importDefault(require("./erc20_abi"));
const { Token, WETH, Fetcher, Route, Trade, TokenAmount, TradeType, Percent, } = require("@uniswap/sdk");
const bet_abi_1 = __importDefault(require("./bet_abi"));
async function betOnOutcome(tgId, amount, outcome, bot) {
    const privkey = await (0, utils_1.createOrGetWallet)(tgId);
    const wallet = await (0, _1.getWalletWithProvider)(privkey);
    // check if approved enough
    const pokeContract = new ethers_1.ethers.Contract(constants_1.PBETS, erc20_abi_1.default, wallet);
    const betContract = new ethers_1.ethers.Contract(constants_1.BET_CONTRACT, bet_abi_1.default, wallet);
    const balance = Number((await pokeContract.balanceOf(wallet.address)).toString());
    amount = Number(ethers_1.ethers.parseUnits(amount.toString(), 9));
    if (balance < amount) {
        console.log("here1 ");
        bot.sendMessage(tgId, `<b> ❌ Not enough PBETS in wallet </b>`, {
            parse_mode: "HTML",
        });
        return;
    }
    else {
        const allowance = await pokeContract.allowance(wallet.address, constants_1.BET_CONTRACT);
        const allowanceNum = Number(allowance.toString());
        if (allowanceNum < amount || !allowanceNum) {
            try {
                const tx = await pokeContract.approve.staticCall(constants_1.BET_CONTRACT, ethers_1.ethers.parseUnits("100000000", 9));
                const result = await pokeContract.approve(constants_1.BET_CONTRACT, ethers_1.ethers.parseUnits("100000000", 9));
                bot.sendMessage(tgId, `<b> ✅ Approving PBETS for betting...</b> <a href="etherscan.io/tx/${result.hash}"> View on Etherscan </a>`, {
                    parse_mode: "HTML",
                });
                const receipt = await result.wait();
                bot.sendMessage(tgId, `<b> ✅ Approved PBETS for betting! </b> <a href="etherscan.io/tx/${result.hash}"> View on Etherscan </a>`, {
                    parse_mode: "HTML",
                });
            }
            catch (e) {
                console.log(e);
                bot.sendMessage(tgId, `<b> ✅ Approving PBETS for betting failed </b>`, {
                    parse_mode: "HTML",
                });
                throw e;
            }
        }
        try {
            const tx = await betContract.battleWager.staticCall(outcome, ethers_1.ethers.parseUnits(amount.toString(), 9));
        }
        catch (e) {
            console.log(e);
            throw e;
        }
        const result = await betContract.battleWager(outcome, ethers_1.ethers.parseUnits(amount.toString(), 9));
        return result;
    }
}
exports.betOnOutcome = betOnOutcome;
async function withdrawPBETS(tgId, amount, to) {
    const privkey = await (0, utils_1.createOrGetWallet)(tgId);
    const wallet = await (0, _1.getWalletWithProvider)(privkey);
    const pbets = new ethers_1.ethers.Contract(constants_1.PBETS, erc20_abi_1.default, wallet);
    // call static to see if it works
    try {
        const tx = await pbets.transfer.staticCall(to, amount);
    }
    catch (e) {
        throw e;
    }
    const result = await pbets.transfer(to, amount);
    return result;
}
exports.withdrawPBETS = withdrawPBETS;
async function claimWinnings(tgId) {
    const privkey = await (0, utils_1.createOrGetWallet)(tgId);
    const wallet = await (0, _1.getWalletWithProvider)(privkey);
    const betContract = new ethers_1.ethers.Contract(constants_1.BET_CONTRACT, bet_abi_1.default, wallet);
    // call static to see if it works
    try {
        const tx = await betContract.winnerClaim.staticCall();
    }
    catch (e) {
        throw e;
    }
    const result = await betContract.winnerClaim();
    return result;
}
exports.claimWinnings = claimWinnings;
async function getUserBets(tgId) {
    const privkey = await (0, utils_1.createOrGetWallet)(tgId);
    const wallet = await (0, _1.getWalletWithProvider)(privkey);
    const betContract = new ethers_1.ethers.Contract(constants_1.BET_CONTRACT, bet_abi_1.default, wallet);
    const predictions = await betContract.getUserPredictionForOutcomes(wallet.address, [1, 2]);
    return {
        trainer1Bet: Number(predictions[0].toString()),
        trainer2Bet: Number(predictions[1].toString()),
    };
}
exports.getUserBets = getUserBets;
async function buyPoke(tgId, amountOfEth) {
    const privkey = await (0, utils_1.createOrGetWallet)(tgId);
    const wallet = await (0, _1.getWalletWithProvider)(privkey);
    const router = new ethers_1.ethers.Contract(constants_1.UNISWAP_ROUTER, [
        "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
    ], wallet);
    const oneHourInTheFutureInUnix = Math.floor(Date.now() / 1000) + 3600;
    try {
        const tx = await router.swapExactETHForTokens.staticCall(0, ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", constants_1.PBETS], wallet.address, oneHourInTheFutureInUnix, {
            value: ethers_1.ethers.parseEther(amountOfEth.toString()),
        });
    }
    catch (e) {
        console.log(e);
        throw e;
    }
    const result = await router.swapExactETHForTokens(0, ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", constants_1.PBETS], wallet.address, oneHourInTheFutureInUnix, {
        value: ethers_1.ethers.parseEther(amountOfEth.toString()),
    });
    console.log(result);
    return result;
}
exports.buyPoke = buyPoke;
//# sourceMappingURL=pokebet.js.map