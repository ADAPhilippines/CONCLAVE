import chalk from 'chalk';
import { ethers } from 'hardhat';
import config from '../config.json';

async function main() {
    try {
        let nodeApprovals = [];
        const accounts = await ethers.getSigners();
        const token = await ethers.getContractAt('Token', config.tokenAddress);
        console.log(
            chalk.yellow(`Approving ${chalk.blue(accounts.length)} nodes to spend in behalf of oracle contract`)
        );
        for (const account of accounts) {
            console.log(chalk.yellow(`Approving ${chalk.blue(account.address)}...`));
            const approve = await token.connect(account).approve(config.oracleAddress, ethers.constants.MaxUint256);
            const approval = approve.wait();
            nodeApprovals.push(approval);
            console.log(chalk.green(`Approved successfully!\n`));
        }

        await Promise.all(nodeApprovals);
    } catch (err) {
        console.log(chalk.red('Consumer contract not found on this network.'));
        console.log(err);
        process.exit(1);
    }
}

main();
