
# MetaMask Wallet Usage

## Can MetaMask be used?
Yes — **MetaMask-compatible wallets can be used**.

### Important Clarification
- MetaMask itself is a UI wallet.
- The agent **does not control the MetaMask UI**.
- The agent controls the **private key directly**, using the same standards MetaMask uses.

### How This Works
- Wallet is generated via BIP-39 / BIP-44
- Compatible with MetaMask import
- Funds can later be viewed or moved in MetaMask by importing the seed

### Why This Is Safe
- Non-custodial
- No platform lock-in
- Agent acts as wallet owner during runtime

### What Is NOT Allowed
- Automating MetaMask browser extension UI
- Clicking confirmation popups

Wallet operations are **programmatic**, MetaMask-compatible, but UI-free.
