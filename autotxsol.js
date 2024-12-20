import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import fs from 'fs/promises';
import inquirer from 'inquirer';
import bs58 from 'bs58';

// Function to introduce a delay (in seconds)
const sleep = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

// Function to print in purple color
const purple = (text) => `\x1b[35m${text}\x1b[0m`;

// Function to print in blue color
const blue = (text) => `\x1b[34m${text}\x1b[0m`;

// Function to print in green color
const green = (text) => `\x1b[32m${text}\x1b[0m`;

// Custom "Created By" logo in ASCII art
const createdByLogo = `
 ██████╗ ███████╗███████╗    ██████╗ ██████╗  ██████╗      ██╗███████╗ ██████╗████████╗
██╔═══██╗██╔════╝██╔════╝    ██╔══██╗██╔══██╗██╔═══██╗     ██║██╔════╝██╔════╝╚══██╔══╝
██║   ██║█████╗  █████╗      ██████╔╝██████╔╝██║   ██║     ██║█████╗  ██║        ██║   
██║   ██║██╔══╝  ██╔══╝      ██╔═══╝ ██╔══██╗██║   ██║██   ██║██╔══╝  ██║        ██║   
╚██████╔╝██║     ██║         ██║     ██║  ██║╚██████╔╝╚█████╔╝███████╗╚██████╗   ██║   
 ╚═════╝ ╚═╝     ╚═╝         ╚═╝     ╚═╝  ╚═════╝  ╚════╝ ╚══════╝ ╚═╝   
`;

const creativeMessage = `
We’re here to make blockchain easier and better.
`;

const main = async () => {
  console.log(purple("=== Starting the process ==="));
  console.log(purple("Script created by:"));
  console.log(purple(createdByLogo));
  console.log(purple(creativeMessage));

  // Load private keys
  const privateKeys = (await fs.readFile("YourPrivateKey.txt", "utf-8"))
    .split("\n")
    .map(key => key.trim())
    .filter(key => key)
    .map(key => {
      // Detect and convert Base58 keys to Uint8Array
      if (/^[1-9A-HJ-NP-Za-km-z]+$/.test(key)) {
        return bs58.decode(key);
      }
      // Convert hex string to Uint8Array
      const bytes = Buffer.from(key, 'hex');
      if (bytes.length !== 64) {
        console.error(`Invalid private key format: ${key}`);
        process.exit(1);
      }
      return Uint8Array.from(bytes);
    });

  // Prompt user for network choice and other inputs
  const { networkChoice, amount, transactionsCount, delay, useListAddresses, singleAddress } = await inquirer.prompt([
    {
      type: "list",
      name: "networkChoice",
      message: "Pick the network you want to use:",
      choices: ["Mainnet", "Testnet", "Devnet"],
    },
    {
      type: "input",
      name: "amount",
      message: "Enter the amount to send (in SOL):",
      validate: input => !isNaN(parseFloat(input)) && parseFloat(input) > 0,
    },
    {
      type: "input",
      name: "transactionsCount",
      message: "How many transactions do you want to send?",
      validate: input => !isNaN(parseInt(input)) && parseInt(input) > 0,
    },
    {
      type: "input",
      name: "delay",
      message: "How much delay (in seconds) between transactions?",
      validate: input => !isNaN(parseInt(input)) && parseInt(input) >= 0,
    },
    {
      type: "confirm",
      name: "useListAddresses",
      message: "Do you want to send to multiple addresses from listaddress.txt?",
      default: true,
    },
    {
      type: "input",
      name: "singleAddress",
      message: "Enter one address to send to (if not using list):",
      when: (answers) => !answers.useListAddresses,
      validate: input => /^([1-9A-HJ-NP-Za-km-z]{32,44})$/.test(input) || "Please enter a valid Solana address.",
    },
  ]);

  // Set the correct cluster URL based on the network choice
  const clusterUrl = networkChoice === "Mainnet"
    ? "https://api.mainnet-beta.solana.com"
    : networkChoice === "Testnet"
    ? "https://api.testnet.solana.com"
    : "https://api.devnet.solana.com";

  // Establish connection to the Solana cluster
  const connection = new Connection(clusterUrl, 'confirmed');

  // Load target addresses from file if needed
  const targetAddresses = useListAddresses
    ? (await fs.readFile("listaddress.txt", "utf-8")).split("\n").map(addr => addr.trim()).filter(addr => addr)
    : [singleAddress];

  console.log(`\nYou have selected the ${networkChoice} network.`);

  // Process transactions
  for (const privateKey of privateKeys) {
    const keypair = Keypair.fromSecretKey(privateKey);

    for (let i = 0; i < transactionsCount; i++) {
      for (const toAddress of targetAddresses) {
        try {
          const toPublicKey = new PublicKey(toAddress);

          const transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: keypair.publicKey,
              toPubkey: toPublicKey,
              lamports: amount * LAMPORTS_PER_SOL,
            })
          );

          const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
          console.log(`Transaction to ${green(toAddress)} successful: ${blue(signature)}`);

          if (delay > 0) {
            console.log(`Waiting for ${delay} seconds before sending the next transaction...`);
            await sleep(delay);
          }
        } catch (error) {
          console.error(`Error sending transaction: ${error.message}`);
        }
      }
    }
  }

  console.log(purple("=== All transactions completed ==="));
};

main().catch(error => {
  console.error("An error occurred:", error.message);
});
