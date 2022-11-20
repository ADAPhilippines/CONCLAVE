import chalk from "chalk";
import { ethers } from "hardhat";
import config from "../config.json";

async function main() {
  try {
    const accounts = await ethers.getSigners();
    const airdropAmount = ethers.utils.parseEther("500");
    console.log(
      chalk.yellow(`Airdropping BaseTokens to`),
      chalk.blue(accounts.length),
      'accounts'
    );

    for (const address in accounts) {
      const acc = accounts[address];
      const txResp = await accounts[0].sendTransaction({
        to: acc.address,
        value: airdropAmount,
      });

      await txResp.wait(1);

      console.log(
        chalk.green("Airdropped"),
        chalk.blue(ethers.utils.formatEther(airdropAmount)),
        chalk.green("BaseTokens to"),
        chalk.blue(acc.address),
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
