import chalk from 'chalk';
import { ethers } from 'hardhat';
import config from '../config.json';

async function main() {
    try {
        let nodeDelegations = [];
        const accounts = await ethers.getSigners();
        const oracle = await ethers.getContractAt('ConclaveOracle', config.oracleAddress);
        console.log(chalk.yellow(`Delegating ${chalk.blue(accounts.length)} nodes to oracle contract`));
        for (const account of accounts) {
            console.log(
                chalk.yellow(
                    `Delegating ${chalk.blue(account.address)} for ${chalk.blue(account.address)} to be a node`
                )
            );
            const delegation = await oracle.connect(account).delegateNode(account.address);
            const delegationTx = delegation.wait();
            nodeDelegations.push(delegationTx);
            console.log(chalk.green(`Successfully delegated node!!\n`));
        }

        await Promise.all(nodeDelegations);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

main();
