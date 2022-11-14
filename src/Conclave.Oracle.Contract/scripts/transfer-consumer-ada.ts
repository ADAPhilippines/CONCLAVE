import chalk from 'chalk';
import { ethers } from 'hardhat';
import config from '../config.json';

async function main() {
    try {
        const [owner] = await ethers.getSigners();

        const ethAmount = ethers.utils.parseEther('10');

        console.log(
            chalk.yellow(
                `Transferring ${ethers.utils.formatEther(ethAmount)} tMilkAda to Consumer Contract: ${chalk.blue(
                    config.consumerAddress
                )}`
            )
        );
        console.log(await owner.getBalance());
        await owner.sendTransaction({
            to: config.consumerAddress,
            value: ethAmount,
        });
        console.log(chalk.green(`Eth successfully transferred!`));
        console.log('\n\n');
    } catch (err) {
        console.log(chalk.red('Consumer contract not found on this network.'));
        console.log(err);
        process.exit(1);
    }
}

main();
