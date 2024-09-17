import chalk from "chalk";
import { ethers } from "hardhat";
import config from "../config.json";

async function main() {
  try {
    const accounts = await ethers.getSigners();
    console.log(
      chalk.yellow(`Return BaseTokens to Account[0]`),
    );

    for (const address in accounts) {
      const acc = accounts[address];
      const accBalance = await acc.getBalance();
      // Leave 1 BaseToken
      if (accBalance.lt(ethers.utils.parseEther("1"))) continue;
      const amount = accBalance.sub(ethers.utils.parseEther("1"));
      const txResp = await acc.sendTransaction({
        to: accounts[0].address,
        value: amount,
      });

      await txResp.wait(1);

      console.log(
        chalk.green("BaseTokens"),
        chalk.blue(ethers.utils.formatEther(amount)),
        chalk.green("returned to"),
        chalk.blue(accounts[0].address),
        chalk.green("TxHash"),
        chalk.blue(txResp.hash),
      );
    }
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

main();
