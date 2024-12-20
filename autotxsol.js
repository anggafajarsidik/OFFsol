import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import inquirer from 'inquirer';
import bs58 from 'bs58';
import { promises as fs } from 'fs';

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m"
};

async function loadPrivateKey() {
  const data = await fs.readFile('YourPrivateKey.txt', 'utf8');
  const privateKeys = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  return privateKeys;
}

async function loadAddresses() {
  const data = await fs.readFile('listaddress.txt', 'utf8');
  const addresses = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  return addresses;
}

async function getBalance(connection, publicKey) {
  const balance = await connection.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
}

async function main() {
  const privateKeys = await loadPrivateKey();
  const addresses = await loadAddresses();

  const { network, amount, delay, useList, numTransactionsPerAddress } = await inquirer.prompt([
    {
      type: 'list',
      name: 'network',
      message: 'Select network:',
      choices: ['Mainnet', 'Testnet', 'Devnet']
    },
    {
      type: 'input',
      name: 'amount',
      message: 'Enter amount to send in SOL:',
      validate: input => !isNaN(input) && input > 0 ? true : 'Please enter a valid amount'
    },
    {
      type: 'input',
      name: 'delay',
      message: 'Enter delay (in seconds) between transactions:',
      validate: input => !isNaN(input) && input >= 0 ? true : 'Please enter a valid delay'
    },
    {
      type: 'confirm',
      name: 'useList',
      message: 'Do you want to use the listaddress.txt file?',
      default: true
    },
    {
      type: 'input',
      name: 'numTransactionsPerAddress',
      message: 'Enter number of transactions per address:',
      validate: input => !isNaN(input) && input > 0 ? true : 'Please enter a valid number'
    }
  ]);

  const connection = new Connection(
    network === 'Mainnet'
      ? 'https://api.mainnet-beta.solana.com'
      : network === 'Testnet'
      ? 'https://api.testnet.solana.com'
      : 'https://api.devnet.solana.com'
  );

  const sender = Keypair.fromSecretKey(bs58.decode(privateKeys[0]));
  const balance = await getBalance(connection, sender.publicKey);
  console.log(`${colors.blue}Current balance of sender (${colors.green}${sender.publicKey.toString()}${colors.blue}): ${colors.yellow}${balance} SOL${colors.reset}`);

  const sendTransactionWithRetry = async (transaction) => {
    let confirmed = false;
    const maxRetries = 5;
    let delay = 500;
    for (let attempt = 1; attempt <= maxRetries && !confirmed; attempt++) {
      try {
        await sendAndConfirmTransaction(connection, transaction, [sender]);
        confirmed = true;
      } catch (error) {
        if (error.message.includes("429")) {
          console.warn(`${colors.red}Server responded with 429 Too Many Requests. Retrying after ${delay}ms delay...${colors.reset}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        } else if (attempt === maxRetries) {
          throw error;
        } else {
          console.warn(`${colors.red}Attempt ${attempt} failed, retrying...${colors.reset}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
        }
      }
    }
  };

  const allTransactions = [];

  if (useList) {
    for (let address of addresses) {
      const recipient = new PublicKey(address);

      for (let i = 0; i < numTransactionsPerAddress; i++) {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: sender.publicKey,
            toPubkey: recipient,
            lamports: amount * LAMPORTS_PER_SOL
          })
        );

        console.log(`${colors.cyan}Sending transaction to ${recipient.toString()} (${i + 1}/${numTransactionsPerAddress})${colors.reset}`);
        allTransactions.push(sendTransactionWithRetry(transaction));
        console.log(`${colors.green}Transaction ${i + 1} to ${recipient.toString()} sent${colors.reset}`);

        if (i < numTransactionsPerAddress - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * 1000));
        }
      }
    }
  } else {
    const { singleAddress } = await inquirer.prompt({
      type: 'input',
      name: 'singleAddress',
      message: 'Enter the recipient address:',
      validate: input => PublicKey.isOnCurve(new PublicKey(input)) ? true : 'Please enter a valid Solana address'
    });
    const recipient = new PublicKey(singleAddress);

    for (let i = 0; i < numTransactionsPerAddress; i++) {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: sender.publicKey,
          toPubkey: recipient,
          lamports: amount * LAMPORTS_PER_SOL
        })
      );

      console.log(`${colors.cyan}Sending transaction to ${recipient.toString()} (${i + 1}/${numTransactionsPerAddress})${colors.reset}`);
      allTransactions.push(sendTransactionWithRetry(transaction));
      console.log(`${colors.green}Transaction ${i + 1} to ${recipient.toString()} sent${colors.reset}`);

      if (i < numTransactionsPerAddress - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * 1000));
      }
    }
  }

  await Promise.all(allTransactions);
  console.log(`${colors.bright}${colors.green}All transactions have been completed!${colors.reset}`);

  const finalBalance = await getBalance(connection, sender.publicKey);
  console.log(`${colors.blue}Final balance of sender (${colors.green}${sender.publicKey.toString()}${colors.blue}): ${colors.yellow}${finalBalance} SOL${colors.reset}`);
}

main().catch(console.error);
