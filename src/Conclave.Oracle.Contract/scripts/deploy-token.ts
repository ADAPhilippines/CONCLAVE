import { ethers } from 'hardhat';
import { writeFileSync } from 'fs';
import config from '../config.json';
import chalk from 'chalk';

async function main() {
    const name = 'ConclaveTestToken';
    const ticker = 'tCNCLV';
    const totalSupply = 1_000_000_000_000_000;
    const Token = await ethers.getContractFactory('Token');
    console.log(
        chalk.yellow(
            `Deploying token:\nname: ${chalk.blue(name)} \nticker: ${chalk.blue(ticker)} \ntotalSupply: ${chalk.blue(
                totalSupply
            )}`
        )
    );
    const token = await Token.deploy(name, ticker, totalSupply);
    await token.deployed();
    const decimal = await token.decimals();
    console.log(chalk.green(`\nToken successfully deployed to: ${chalk.blue(token.address)}\n\n`));

    config.tokenAddress = token.address;
    config.decimal = decimal.toString();
    config.ticker = ticker;
    config.name = name;
    config.totalSupply = totalSupply.toString();
    writeFileSync('./config.json', JSON.stringify(config, null, 2));
}

main();
