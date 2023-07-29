"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Redis = require("ioredis");
require("dotenv").config();
const redis = new Redis(process.env.REDIS_URL);
console.log("Redis connected");
exports.default = redis;
//# sourceMappingURL=redis.js.map