import { ethers } from 'hardhat';
import chalk from 'chalk';

async function main() {
    const name = 'ConclaveTestToken';
    const ticker = 'tCNCLV';
    const totalSupply = 1_000_000_000;
    const Token = await ethers.getContractFactory('Token');
    console.log(
        chalk.yellow(
            `Deploying token with: 
            \nname: ${chalk.blue(name)} \nticker: ${chalk.blue(ticker)} \ntotalSupply: ${chalk.blue(totalSupply)}`
        )
    );
    const token = await Token.deploy(name, ticker, totalSupply);
    await token.deployed();
    console.log(chalk.green(`Token deployed to: ${chalk.blue(token.address)}`));
}

main();
