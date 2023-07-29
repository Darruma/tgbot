"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawToWallet = exports.userIsRegistered = exports.createOrGetWallet = void 0;
var Outcome;
(function (Outcome) {
    Outcome[Outcome["Pokemon1Wins"] = 0] = "Pokemon1Wins";
    Outcome[Outcome["Pokemon2Wins"] = 1] = "Pokemon2Wins";
})(Outcome || (Outcome = {}));
const ethers_1 = require("ethers");
const redis_1 = __importDefault(require("./redis"));
async function createOrGetWallet(tgID) {
    const privKey = await redis_1.default.get(tgID);
    if (privKey) {
        return privKey;
    }
    const wallet = ethers_1.ethers.Wallet.createRandom();
    await redis_1.default.set(tgID, wallet.privateKey);
    return wallet.privateKey;
}
exports.createOrGetWallet = createOrGetWallet;
async function userIsRegistered(tgID) {
    const privKey = await redis_1.default.get(tgID);
    if (privKey) {
        return true;
    }
    else {
        return false;
    }
}
exports.userIsRegistered = userIsRegistered;
async function withdrawToWallet(tgID, amount, to) {
    const privKey = await redis_1.default.get(tgID);
    if (privKey) {
        const wallet = new ethers_1.ethers.Wallet(privKey);
        const toAddr = (0, ethers_1.getAddress)(to);
        const tx = await wallet.sendTransaction({
            value: ethers_1.ethers.parseEther(amount.toString()),
            to: toAddr,
        });
        return tx;
    }
    else {
        return null;
    }
}
exports.withdrawToWallet = withdrawToWallet;
function bet(tgId, amount, outcome) {
    const key = createOrGetWallet(tgId);
}
//# sourceMappingURL=utils.js.map