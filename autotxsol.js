import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import inquirer from 'inquirer';
import bs58 from 'bs58';
import { promises as fs } from 'fs';

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

async function main() {
  const privateKeys = await loadPrivateKey();
  const addresses = await loadAddresses();

  const { network, amount, numTransactions, delay, useList } = await inquirer.prompt([
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
      name: 'numTransactions',
      message: 'Enter number of transactions:',
      validate: input => !isNaN(input) && input > 0 ? true : 'Please enter a valid number'
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
    }
  ]);

  const connection = new Connection(
    network === 'Mainnet'
      ? 'https://api.mainnet-beta.solana.com'
      : network === 'Testnet'
      ? 'https://api.testnet.solana.com'
      : 'https://api.devnet.solana.com'
  );

  for (let i = 0; i < numTransactions; i++) {
    let recipient;

    if (useList) {
      recipient = new PublicKey(addresses[i % addresses.length]);
    } else {
      const { singleAddress } = await inquirer.prompt({
        type: 'input',
        name: 'singleAddress',
        message: 'Enter the recipient address:',
        validate: input => PublicKey.isOnCurve(new PublicKey(input)) ? true : 'Please enter a valid Solana address'
      });
      recipient = new PublicKey(singleAddress);
    }

    const sender = Keypair.fromSecretKey(bs58.decode(privateKeys[i % privateKeys.length]));

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: recipient,
        lamports: amount * LAMPORTS_PER_SOL
      })
    );

    await sendAndConfirmTransaction(connection, transaction, [sender]);

    console.log(`Transaction ${i + 1} sent to ${recipient.toString()}`);

    if (i < numTransactions - 1) {
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }
  }
}

main().catch(console.error);
