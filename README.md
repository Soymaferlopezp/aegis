# Aegis — Financial Guardrails for AI Agents  

<p align="center">
  <img alt="Z-Ray logo" src="frontend/public/brand/aegis.png" width="400">
</p>

<div align="center">

[**Live Demo**]()  
[**Video Demo**]()

</div>
---

## What is AEGIS?
AEGIS is a **security-first system** that enables AI agents to execute **real on-chain USDC payments** only within **strict, verifiable financial guardrails enforced on-chain**.

Core principle:
> **AI can suggest. Smart contracts decide.**

---

## Why this exists (Problem)
When AI agents can trigger payments, the risk is not “bad prompts”—it’s **financial authority**.

Off-chain controls (backend checks, prompt rules, UI restrictions) are insufficient because they:
- can be bypassed,
- can contain bugs,
- are not independently verifiable.

AEGIS moves the source of truth on-chain:
- **The agent cannot exceed limits**
- **Even if the agent is compromised**
- **Even if the backend is misused**

---

## System Guarantee (Non-negotiable)
AEGIS guarantees that **funds cannot move** if the Vault rejects the spend.

Even if:
- the model hallucinates,
- the CLI is misconfigured,
- the execution layer is triggered incorrectly,

👉 **the on-chain contract is the final arbiter.**
---

## Architecture Overview (Layered)

```bash
┌────────────────────────────────────────────┐
│                  FRONTEND                  │
│  Landing + Agent Console (observability)   │
│  - Read-only UX                            │
│  - Shows evidence and state                │
│  - Does NOT execute payments               │
└───────────────────┬────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────┐
│            BACKEND ORCHESTRATOR             │
│                  (CLI)                      │
│  - simulate / validate / execute            │
│  - Reads on-chain Vault state               │
│  - Produces step-by-step logs               │
│  - Enforces a decision gate                 │
│                                             │
│  ❗ Does NOT override the contract         │
└───────────────────┬────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────┐
│            EXECUTION LAYER (Circle)         │
│     Programmable Wallet (Agent Executor)    │
│  - Signs the tx                             │
│  - Calls Vault.spend()                      │
│                                             │
│  ❗ Has no authority to bypass guardrails  │
└───────────────────┬────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────┐
│          ENFORCEMENT LAYER (ON-CHAIN)       │
│              VaultGuardrails.sol            │
│  - maxPerTx                                 │
│  - dailyLimit                               │
│  - spentToday (UTC)                         │
│  - onlyAgent                                │
│                                            │
│  ✅ Final source of truth                   │
└────────────────────────────────────────────┘
```
---
## Trust Boundaries

[ Trusted ]
- VaultGuardrails.sol
- Arc chain execution

[ Semi-trusted ]
- Circle Programmable Wallets (developer-controlled)
- GitHub Actions runner

[ Untrusted by design ]
- AI reasoning / LLM outputs
- Prompts
- UI rendering

Mental model:

* The system assumes the LLM can be wrong
* The system assumes the agent can be compromised
* The system assumes off-chain logic can fail
* The system ensures on-chain limits still hold

---

## Components
AEGIS currently includes:

- **Smart Contracts (Arc Testnet)**
  - Vault with on-chain financial guardrails
  - Reproducible deploy + smoke tests

- **Circle Programmable Wallets Integration**
  - Developer-controlled agent wallet
  - On-chain USDC transfer + contract execution
  - GitHub Actions automation for reproducibility

- **Backend Orchestrator (CLI)**
  - Natural language intent → JSON → on-chain validation → execution gate
  - Groq LLM for intent extraction (no authority)

- **Frontend**
  - Landing 
  - Agent Console

---

## Smart Contracts — Arc Testnet (Base)
This repository includes a Hardhat + TypeScript setup for:
- compilation pipeline
- Arc Testnet connectivity
- reproducible on-chain deploy
- smoke tests
- deployment registry (`deployments/arcTestnet.json`)

Arc Testnet transactions use **USDC** for:
- gas fees
- transfers

---

## Vault & Guardrails 
AEGIS implements a **USDC Vault** with strict on-chain guardrails.

Goal:
- Custody USDC
- Allow a designated **Agent Executor** to spend only within limits
- Make violations impossible via contract enforcement

Key guarantee:

> A malicious, buggy, or compromised agent **cannot** violate on-chain limits.

---

### Vault Roles Model
**Owner (Admin / Human Wallet)**
- Can set `maxPerTx` and `dailyLimit`
- Can set / change `agentExecutor`
- Can withdraw funds (`withdraw`)
- Is not an agent

**Agent Executor**
- Can call `spend(to, amount)` only if allowed
- Cannot withdraw
- Cannot change guardrails
- Cannot change roles

---

### Guardrails Enforced On-Chain
- `maxPerTx` — per-transaction limit  
  Any `spend()` above this reverts.

- `dailyLimit` — daily cumulative limit (UTC)  
  If `spentToday + amount > dailyLimit`, the call reverts.

- `spentToday` — tracked per day (UTC)  
  Resets automatically when the UTC day changes.

---

### Vault High-Level Architecture
```bash
┌──────────────────────────────────────────────┐
│                  OWNER                       │
│            (Admin / Human Wallet)            │
│                                              │
│  - Deploys contract                          │
│  - Configures guardrails                     │
│      • maxPerTx                              │
│      • dailyLimit                            │
│  - Sets / changes Agent Executor             │
│  - Can withdraw funds                        │
│                                              │
│  ❗ Owner is NOT an agent                   │
└───────────────┬──────────────────────────────┘
                │ admin actions
                ▼
┌──────────────────────────────────────────────┐
│            VaultGuardrails.sol               │
│                                              │
│  Custody: USDC (Arc native)                  │
│                                              │
│  Guardrails (immutable to agent)             │
│  • maxPerTx                                  │
│  • dailyLimit                                │
│  • spentToday (UTC)                          │
│                                              │
│  Security rules                              │
│  • Agent cannot withdraw                     │
│  • Agent cannot change limits                │
│  • Agent cannot change roles                 │
│                                              │
│  Key functions                               │
│  • deposit(amount)   ← users / owner         │
│  • spend(to, amount) ← agent executor only   │
│  • withdraw(to, amt) ← owner only            │
└───────────────┬──────────────────────────────┘
                │ spend() (always guardrailed)
                ▼
┌──────────────────────────────────────────────┐
│              AGENT EXECUTOR                  │
│          (Bot / AI / Script / Service)       │
│                                              │
│  - Calls spend()                             │
│  - Can only spend within limits              │
│                                              │
│  ❌ Cannot withdraw / change guardrails      │
└───────────────┬──────────────────────────────┘
                │ USDC transfer
                ▼
┌──────────────────────────────────────────────┐
│                RECIPIENT                     │
│          (Merchant / Service / Wallet)       │
└──────────────────────────────────────────────┘
```

---

## Circle Programmable Wallets Integration
This module integrates **Circle Programmable Wallets (developer-controlled)** so an AI agent can execute transactions on **Arc Testnet**, including:
- creating Circle-controlled wallets
- obtaining on-chain agent address
- transferring USDC
- executing `spend()` against `VaultGuardrails`
- automating the flow via **GitHub Actions** (no frontend dependency)

This flow is:
- real
- verifiable on-chain

### Circle High-Level Architecture (ASCII)
```bash
┌───────────────────────────┐
│        GitHub Actions      │
│  (CI / Automation Layer)   │
└─────────────┬─────────────┘
              │ REST API (W3S)
              ▼
┌───────────────────────────┐
│        Circle W3S          │
│  Programmable Wallets      │
│  (Developer-Controlled)    │
└─────────────┬─────────────┘
              │ Signed tx / contract execution
              ▼
┌───────────────────────────┐
│        Arc Testnet        │
│        (EVM Chain)        │
│                           │
│  ┌─────────────────────┐  │
│  │  Agent Wallet (EOA) │◄─┼── Circle-controlled signer
│  └─────────┬───────────┘  │
│            │ spend()      │
│            ▼              │
│  ┌─────────────────────┐  │
│  │  VaultGuardrails    │  │
│  │  - onlyAgent        │  │
│  │  - maxPerTx         │  │
│  │  - dailyLimit       │  │
│  └─────────────────────┘  │
│            │              │
│            ▼              │
│        USDC (Arc)         │
└───────────────────────────┘
```
---

### Networks & Contracts (Arc Testnet)
- RPC (primary): `https://rpc.testnet.arc.network`
- Explorer: `https://testnet.arcscan.app`

USDC (Arc Testnet):
- `0x3600000000000000000000000000000000000000`

VaultGuardrails (deployed):
- `0x3fFd55E53D7740a93b8B62e93ed11a2c0651098E`

### Executed Evidence (Circle + Arcscan)
Agent wallet address (Arc):
- `0x94f6256f780b4ba6589166dc51765e6d3675dd6c`

Admin tx (setAgentExecutor):
- `0xe6d135880774ad28aa23309a79a7bbac934e3e30f883a88e86680b73880ba514`

Spend execution:
- `circleTxId`: `a8faa556-b5d1-578d-bccf-c15d861e5360`
- `txHash`: `0x7ecf3e46301a586637d3ce0af27fe61967abbd9e607004a772c05f7c6f3333a8`
- Arcscan: https://testnet.arcscan.app/tx/0x7ecf3e46301a586637d3ce0af27fe61967abbd9e607004a772c05f7c6f3333a8

---

## Backend Orchestrator 
The Backend Orchestrator is implemented as a **CLI runner** that executes the flow:

**Natural language intent → strict JSON → on-chain validation → decision gate → execution**

Key principle:

> **The LLM has zero authority.**  
> It only extracts structured intent (JSON).  
> The contract enforces financial truth.

### Backend High-Level Architecture (ASCII)
```bash
+------------------------------+
|        User / AI Agent       |
|  "Comprar 1 USDC de café"    |
+--------------+---------------+
               |
               v
+------------------------------+
|          LLM (Groq)          |
| - Interprets text            |
| - Extracts amount            |
| - Outputs strict JSON        |
|                              |
|  ❌ No validation           |
|  ❌ No blockchain reads     |
|  ❌ No payment execution    |
+--------------+---------------+
               |
               v
+------------------------------+
|   Backend Orchestrator (CLI) |
| - simulate / validate / exec |
| - STEP-by-STEP logs          |
| - Reads on-chain Vault state |
+--------------+---------------+
               |
               v
+------------------------------+
|  VaultGuardrails (On-chain)  |
|  - maxPerTx                  |
|  - dailyLimit                |
|  - spentToday                |
|  - onlyAgent                 |
+--------------+---------------+
               |
               v
+------------------------------+
|        DECISION GATE         |
+-----------+------------------+
            |
     +------+------+ 
     |             |
     v             v
+-----------+   +------------------------------+
|  BLOCKED  |   |       APPROVED_READY         |
| - No tx   |   | -> triggers GitHub Actions   |
+-----------+   +--------------+---------------+
                               |
                               v
                 +------------------------------+
                 |     GitHub Actions Runner    |
                 | - 07_callSpend_vault.ts      |
                 | - 06_waitTx.ts               |
                 | Returns: circleTxId, txHash  |
                 +--------------+---------------+
                               |
                               v
                 +------------------------------+
                 | Circle Programmable Wallets  |
                 | - Signs tx                   |
                 | - Calls Vault.spend()        |
                 +--------------+---------------+
                               |
                               v
                 +------------------------------+
                 |        Arc Testnet           |
                 | - txHash confirmed           |
                 | - Arcscan URL                |
                 +------------------------------+
```

### Principle:
* AI proposes → backend orchestrates → contract decides.
Funds move only if on-chain rules allow it.

---

### LLM Layer (Groq) — Intent Extraction Only
Provider: **Groq** *(OpenAI-compatible API)*

Default model:
- `llama-3.1-8b-instant`

Strict output requirements (conceptual):
- Return ONLY valid JSON
- No Markdown
- No commentary
- Fixed schema
- `amount` in USDC minor units (6 decimals) as a string

**Example:**
```js
{
  "to": "0xDESTINATION",
  "amount": "1000000",
  "currency": "USDC",
  "reason": "Coffee purchase"
}
```
## CLI Commands — Comparative Overview
```js
+-----------+----------------------+-----------------------------+---------------------------+
| Command   | What it does         | What it DOES NOT do         | Typical Result            |
+===========+======================+=============================+===========================+
| simulate  | - Uses LLM (Groq)    | - No blockchain reads       | JSON with:                |
|           | - Interprets text    | - No validation             | { to, amount, currency }  |
|           | - Extracts amount    | - No Circle                 |                           |
|           | - Outputs JSON only  | - No transaction            |                           |
+-----------+----------------------+-----------------------------+---------------------------+
| validate  | - Uses LLM (Groq)    | - No Circle                 | APPROVED_READY            |
|           | - Reads Vault state  | - No transaction            | or BLOCKED                |
|           | - Checks limits      | - No funds moved            | + reason                  |
+-----------+----------------------+-----------------------------+---------------------------+
| execute   | - Uses LLM (Groq)    | - Cannot bypass rules       | APPROVED + txHash         |
|           | - Reads Vault state  | - No execution if BLOCKED   | + Arcscan link            |
|           | - Enforces gate      |                             |                           |
|           | - Executes payment   |                             |                           |
+-----------+----------------------+-----------------------------+---------------------------+
```
**Legend:**
- LLM = Natural language → structured JSON
- Vault = On-chain source of truth
- Circle = Actual on-chain payment execution

**Mental model:**
simulate → understand
validate → decide
execute  → act

---

## Agent Console (Observability-First) — Implementation Notes
The Agent Console is designed for **observability-first UX**:
- It does not execute payments
- It displays:
  - user intent
  - agent interpretation (JSON)
  - vault validation + on-chain state
  - execution evidence (txHash, Arcscan, circleTxId)
  - errors (if any)

This aligns with AEGIS principles:
- execution is on-chain / Circle
- UI is read-only observability

---

### Timeline Event Rendering (Frontend Evidence)
The UI renders a timeline of stages:

- `USER_INTENT`
- `AGENT_INTERPRETATION`
- `VAULT_VALIDATION` (includes a VAULT STATE (ON-CHAIN) block)
- `EXECUTION` (includes txHash, Arcscan URL, circleTxId)
- `ERROR` (if any)

Key fields shown:
- `maxPerTx`, `dailyLimit`, `spentToday`
- `status`, `reason`, optional `reason_model`
- `txHash`, `arcscan`, `circleTxId` when available

---

## Environment Variables (.env)
> NOTE: Do not commit secrets. Use `.env` locally and GitHub Secrets for CI.

```bash
ARC_TESTNET_RPC_PRIMARY="https://rpc.testnet.arc.network"
ARC_TESTNET_RPC_FALLBACKS="https://rpc.blockdaemon.testnet.arc.network,https://rpc.drpc.testnet.arc.network,https://rpc.quicknode.testnet.arc.network"
ARC_TESTNET_CHAIN_ID="5042002"
ARC_EXPLORER_URL="https://testnet.arcscan.app"

DEPLOYER_PRIVATE_KEY=*** 

ARC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
USDC_ARC=0x3600000000000000000000000000000000000000

VAULT_ADDRESS=0x3fFd55E53D7740a93b8B62e93ed11a2c0651098E

VAULT_OWNER_ADDRESS=0x90B3EA700173274560182CbF76ED8E6E66Ad2494
VAULT_AGENT_EXECUTOR_ADDRESS=0x120Aa7A6e13dfb2B51F190da54D4f86B0949fd85

VAULT_MAX_PER_TX=100000000        # 100 USDC (6 decimals)
VAULT_DAILY_LIMIT=250000000       # 250 USDC (6 decimals)

SMOKE_RECIPIENT_ADDRESS=0x90B3EA700173274560182CbF76ED8E6E66Ad2494
SMOKE_DEPOSIT_AMOUNT=500000   # 0.5 USDC
SMOKE_SPEND_AMOUNT=100000     # 0.1 USDC

# Circle Testnet
CIRCLE_BASE_URL=//api.circle.com/v1/w3s
CIRCLE_API_KEY=*** 
CIRCLE_ENTITY_SECRET_HEX=*** 
CIRCLE_BLOCKCHAIN=ARC-TESTNET

# Runtime (filled by scripts)
CIRCLE_WALLET_SET_ID=610f88d0-c0b3-5fa2-88ff-7e39e453e0f7
CIRCLE_WALLET_ID_AGENT=6862b191-d370-5a98-9af5-81af77b04992
CIRCLE_WALLET_ID_RECEIVER=19a6ae3d-5920-5aec-84f1-5b84f6a32637
DESTINATION_ADDRESS=0xc0d33e72d92954641a40e6c3921339010a01893e
TOKEN_ID_USDC=15dc2b5d-0994-58b0-bf8c-3a0501148ee8
CIRCLE_TX_ID=b7d769dd-81d2-5ad9-9fbd-1d1390add452
SPEND_ABI_PARAMS_JSON=["0xc0d33e72d92954641a40e6c3921339010a01893e",100000]
CIRCLE_WALLET_ADDRESS_AGENT=0x94f6256f780b4ba6589166dc51765e6d3675dd6c
CIRCLE_WALLET_ADDRESS_RECEIVER=0xc0d33e72d92954641a40e6c3921339010a01893e

# GitHub repo
GITHUB_REPO=aegis
GITHUB_OWNER=Soymaferlopezp
GITHUB_TOKEN=*** 
GITHUB_WORKFLOW_FILE=circle_spend_vault.yml
GITHUB_REF=main

# Groq
GROQ_API_KEY=*** 
GROQ_MODEL=llama-3.1-8b-instant
GROQ_BASE_URL=https://api.groq.com/openai/v1
LLM_RETRY_MAX=4
LLM_RETRY_BASE_MS=800

# Public
NEXT_PUBLIC_ARCSCAN_TX_BASE=https://testnet.arcscan.app/tx/
NEXT_PUBLIC_VAULT_ADDRESS=0x3fFd55E53D7740a93b8B62e93ed11a2c0651098E
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
```

---

## How to Run (Developer Workflow)
> Commands below reflect the existing repo scripts as provided in the specialist READMEs.

### Requirements
```bash
node >= 20
npm >= 10
git
```

### Install
```bash
git clone <repo-url>
cd aegis
npm install
```

### Compile & Test (local)
```bash
npm run build
npm test
```

### Arc Testnet Console
```bash
npm run arc:console
```

### Inside:
```bash
await ethers.provider.getBlockNumber()
```

### Deploy (Arc Testnet — pipeline placeholder)
```bash
npm run arc:deploy:hello
```

### Smoke Test (on-chain — pipeline placeholder)
```bash
npm run arc:smoke:hello
```

### Deploy Vault (Arc Testnet)
```bash
npm run arc:deploy:vault
```

### Smoke Vault (read-only)
```bash
npm run arc:smoke:vault
```

### Smoke Vault Spend (real spend flow)
```bash
npm run arc:smoke:vault:spend
```

---

## Troubleshooting (Real Cases)
### RPC / DNS Issues (Arc Testnet)
Arc Testnet RPC may fail due to:
- ISP DNS
- corporate networks
- intermittent caching

Workarounds:
- use mobile hotspot
- use DNS 8.8.8.8 / 1.1.1.1
- use official Arc RPC fallbacks

### ERC20: transfer amount exceeds balance
- Owner wallet has insufficient USDC for deposit
- Reduce amount or fund the wallet

### Unauthorized
- Calling `spend()` from a non-agent wallet
- Calling `withdraw()` from a non-owner wallet

### No gas
- Arc gas is paid in native USDC
- Ensure owner and agent have USDC

---

## Deployed Addresses (Arc Testnet)
USDC (Arc):
- `0x3600000000000000000000000000000000000000`

VaultGuardrails:
- `0x3fFd55E53D7740a93b8B62e93ed11a2c0651098E`

Vault deploy tx:
- `0x3afa084cad67ac4f908be79c0a232aab95e5b8f959e1c60244512d6170016fc1`

Explorer:
- https://testnet.arcscan.app/address/0x3fFd55E53D7740a93b8B62e93ed11a2c0651098E
- https://testnet.arcscan.app/tx/0x3afa084cad67ac4f908be79c0a232aab95e5b8f959e1c60244512d6170016fc1

---

## Folder Structure
> This is the consolidated structure across: contracts, Circle scripts, orchestrator, workflows, frontend.

```bash
aegis/
├── contracts/
│   ├── VaultGuardrails.sol
│   └── mocks/
│       └── MockUSDC.sol
│
├── deployments/
│   └── arcTestnet.json
│
├── scripts/
│   ├── circle/
│   │   ├── 00_publicKey.ts
│   │   ├── 01_createWalletSet.ts
│   │   ├── 02_createWallets_arc.ts
│   │   ├── 04_getBalances.ts
│   │   ├── 05_transfer_usdc.ts
│   │   ├── 06_waitTx.ts
│   │   ├── 07_callSpend_vault.ts
│   │   └── _shared.ts
│   │
│   └── vault/
│       ├── 00_readVaultState.ts
│       └── 01_setAgentExecutor_circle.ts
│
├── test/
│   └── vault-guardrails.spec.ts
│
├── orchestrator/
│   ├── cli/
│   │   ├── simulate.ts
│   │   ├── validate.ts
│   │   └── execute.ts
│   │
│   ├── llm/
│   │   └── client.ts
│   │
│   ├── vault/
│   │   └── readState.ts
│   │
│   └── circle/
│       └── githubActions.ts
│
├── frontend/
│   ├── public/
│   │   └── brand/
│   │       └── aegis.png
│   └── components/
│       └── console/
│           └── timeline/
│               └── TimelineEvent.tsx
│
├── .github/
│   └── workflows/
│       ├── circle-spend-and-wait.yml
│       ├── vault-read.yml
│       └── vault-set-agent-executor.yml
│
├── .env.example
├── hardhat.config.ts
├── package.json
└── README.md
```

---

## Scope (Current)
IN:
- Hardhat + TypeScript
- Arc Testnet deploy + smoke tests
- VaultGuardrails (Phase 1)
- Circle Programmable Wallets integration (Phase 2.1)
- Backend Orchestrator CLI (Phase 2.2)
- GitHub Actions automation
- Frontend: landing + observability-first console (in progress)

OUT:
- Additional guardrail policies beyond maxPerTx/dailyLimit
- Formal audit
- Production-grade persistence/webhooks (not yet documented as implemented)

---

## Key Takeaway
AEGIS demonstrates that AI agents can transact safely **when financial authority lives on-chain**, not in the model.

Deterministic.
Auditable.
Reproducible.
Secure by design.

---

## Team
Built by **BlockBears** for the *Agentic Commerce on Arc*.

- **Mafer Lopez — Developer & Design**
- **Mary — PM & Bizdev**

---

## License
MIT © BlockBears Team