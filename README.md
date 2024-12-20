Tentu saja! Berikut adalah isi lengkap dari file `README.md` yang dapat Anda salin dan tempel ke GitHub:

```markdown
# Solana Auto Transaction Script Guide

## Overview

This repository contains a script for automatically sending transactions on the Solana blockchain. The script allows you to send multiple transactions to a list of addresses or a single address, with a specified delay between each transaction.

## Prerequisites

1. **Node.js and npm**: Ensure you have Node.js and npm installed on your system. You can download them from [Node.js official website](https://nodejs.org/).

2. **Dependency**: The script requires the following npm package:
   - `@solana/web3.js`

## Setup

1. **Clone the Repository**: Clone the repository to your local machine.
   ```bash
   git clone https://github.com/your-repo/solana-auto-transaction.git
   cd solana-auto-transaction
   ```

2. **Install Dependency**: Run the following command to install the required npm package.
   ```bash
   npm install @solana/web3.js
   ```

3. **Prepare Your Files**:
   - **YourPrivateKey.txt**: This file should contain your private keys. Each private key should be labeled as `privatekey1`, `privatekey2`, and so on, placed on a new line.
   - **listaddress.txt**: This file should contain the list of addresses you want to send transactions to. Each address should be labeled as `address1`, `address2`, and so on, placed on a new line.

### Example File Formats

#### `YourPrivateKey.txt`
```
privatekey1
privatekey2
privatekey3
privatekey4
```

#### `listaddress.txt`
```
address1
address2
address3
address4
```

## Running the Script

1. **Start the Script**: Run the script using Node.js.
   ```bash
   node autotxsol.js
   ```

2. **Follow the Prompts**: The script will prompt you to provide the following information:
   - Network choice: Select "Mainnet", "Testnet", or "Devnet".
   - Amount: Enter the amount to send in SOL.
   - Number of transactions: Specify how many transactions you want to send.
   - Delay: Enter the delay (in seconds) between transactions.
   - Use listaddress.txt: Choose whether to use the list of addresses from the file.
   - Single address: If you chose not to use the list, enter the single address to send to.

3. **Confirm and Execute**: The script will process your inputs and start sending transactions according to the specified parameters.

## Disclaimer

This script is provided as-is, without any guarantees or warranties. Use it at your own risk. Ensure you understand the implications of running the script, especially when using real funds. The author is not responsible for any loss of funds or other damages incurred through the use of this script.
```
