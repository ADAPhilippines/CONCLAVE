import chalk from "chalk";
import { ethers } from "hardhat";
import config from "../config.json";

async function main() {
	try {
		const accounts = await ethers.getSigners();
		const oracle = await ethers.getContractAt(
			"ConclaveOracle",
			config.oracleAddress,
		);
		const token = await ethers.getContractAt("Token", config.tokenAddress);
		const decimal = await token.decimals();

		for (const account of accounts) {
			const tokenBalance = await token.balanceOf(account.address);
			const formattedTokenBalance = ethers.utils.formatUnits(
				tokenBalance,
				decimal,
			);
			console.log(
				`\n${chalk.blue(account.address)} has ${chalk.green(formattedTokenBalance)
				} tokens\n`,
			);

			const minStake = await oracle.s_minStake();
			const maxStake = {
				baseToken: await account.getBalance(),
				token: await token.balanceOf(account.address),
			};


			const randomBigNum = ethers.BigNumber.from(Math.floor((Math.random() * 1000000000000000)));
			const tokenAmount = randomBigNum.mul(maxStake.token.sub(minStake.token)).add(minStake.token).div(1000000000000000);
			const baseTokenAmount = ethers.utils.parseEther("100");
			const formattedAmount = ethers.utils.formatUnits(tokenAmount, decimal);

			console.log(
				chalk.yellow(
					`Staking ${chalk.blue(formattedAmount)} for ${chalk.blue(account.address)
					}...`,
				),
			);
			const txReceipt = await oracle.connect(account).stake(
				baseTokenAmount,
				tokenAmount,
				{
					value: baseTokenAmount,
				},
			);

			await txReceipt.wait();
			console.log(
				chalk.green(`Staked successfully`),
				chalk.blue(txReceipt.hash),
			);
		}
	} catch (err) {
		console.log(err);
		process.exit(1);
	}
}

main();
