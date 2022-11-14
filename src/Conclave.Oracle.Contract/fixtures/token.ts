import { ethers } from 'hardhat';
import chalk from 'chalk';
import config from '../config.json';
import hardhatConfig from '../hardhat.config';

export async function deployTokenFixture() {
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
    const decimal = await token.decimals();
    console.log(chalk.green(`Token successfully deployed to: ${chalk.blue(token.address)}\n\n`));

    return { token, decimal, name, ticker, totalSupply };
}

export async function airdropTokenFixture() {
    let token, decimal, name, ticker, totalSupply;

    const network = await ethers.provider.getNetwork();

    if (network.chainId === hardhatConfig.networks?.hardhat?.chainId) {
        const {
            token: _token,
            decimal: _decimal,
            name: _name,
            ticker: _ticker,
            totalSupply: _totalSupply,
        } = await deployTokenFixture();
        token = _token;
        decimal = _decimal;
        name = _name;
        ticker = _ticker;
        totalSupply = _totalSupply;
    } else {
        try {
            token = await ethers.getContractAt('Token', config.tokenAddress);
            decimal = await token.decimals();
            name = await token.name();
            ticker = await token.symbol();
            totalSupply = await token.totalSupply();
        } catch (err) {
            console.log(chalk.red('Token contract not found on this network.'));
            process.exit(1);
        }
    }

    const tokenAmount = ethers.utils.parseUnits('100000', decimal);
    const accounts = await ethers.getSigners();

    console.log(chalk.yellow(`Airdropping tokens to ${chalk.blue(accounts.length)} accounts`));
    for (const account of accounts) {
        await token.transfer(account.address, tokenAmount);
        console.log(
            chalk.green(
                `Airdropped ${chalk.blue(ethers.utils.formatUnits(tokenAmount, decimal))} to ${chalk.blue(
                    account.address
                )}`
            )
        );
    }

    console.log('\n\n');
    return { token, decimal, name, ticker, totalSupply };
}
