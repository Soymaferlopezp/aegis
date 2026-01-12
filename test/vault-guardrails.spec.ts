import { expect } from "chai";
import { ethers } from "hardhat";
import type { Contract } from "ethers";

const ONE_USDC = 1_000_000n; // 6 decimals

describe("VaultGuardrails (Checkpoint 1)", function () {
  async function deploy() {
    const [deployer, owner, agent, user, recipient] = await ethers.getSigners();

    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    const usdc = (await MockUSDCFactory.deploy()) as unknown as Contract;
    await usdc.waitForDeployment();

    // mint to user
    await (usdc.connect(deployer) as any).mint(user.address, 10_000n * ONE_USDC);

    const VaultFactory = await ethers.getContractFactory("VaultGuardrails");
    const maxPerTx = 100n * ONE_USDC;
    const dailyLimit = 250n * ONE_USDC;

    const vault = (await VaultFactory.deploy(
      await usdc.getAddress(),
      owner.address,
      agent.address,
      maxPerTx,
      dailyLimit
    )) as unknown as Contract;
    await vault.waitForDeployment();

    return { deployer, owner, agent, user, recipient, usdc, vault, maxPerTx, dailyLimit };
  }

  it("deploys with correct config", async () => {
    const { owner, agent, usdc, vault, maxPerTx, dailyLimit } = await deploy();

    expect(await (vault as any).owner()).to.eq(owner.address);
    expect(await (vault as any).agentExecutor()).to.eq(agent.address);
    expect(await (vault as any).usdc()).to.eq(await usdc.getAddress());
    expect(await (vault as any).maxPerTx()).to.eq(maxPerTx);
    expect(await (vault as any).dailyLimit()).to.eq(dailyLimit);
  });

  it("allows deposit (transferFrom) and emits event", async () => {
    const { user, usdc, vault } = await deploy();

    await (usdc.connect(user) as any).approve(await vault.getAddress(), 500n * ONE_USDC);

    await expect((vault.connect(user) as any).deposit(500n * ONE_USDC))
      .to.emit(vault, "Deposited")
      .withArgs(user.address, 500n * ONE_USDC);

    expect(await (usdc as any).balanceOf(await vault.getAddress())).to.eq(500n * ONE_USDC);
  });

  it("only agent can spend", async () => {
    const { user, usdc, vault, recipient } = await deploy();

    await (usdc.connect(user) as any).approve(await vault.getAddress(), 500n * ONE_USDC);
    await (vault.connect(user) as any).deposit(500n * ONE_USDC);

    await expect((vault.connect(user) as any).spend(recipient.address, 1n * ONE_USDC))
      .to.be.revertedWithCustomError(vault, "Unauthorized");
  });

  it("enforces maxPerTx", async () => {
    const { user, agent, usdc, vault, recipient, maxPerTx } = await deploy();

    await (usdc.connect(user) as any).approve(await vault.getAddress(), 500n * ONE_USDC);
    await (vault.connect(user) as any).deposit(500n * ONE_USDC);

    const tooMuch = maxPerTx + 1n;

    await expect((vault.connect(agent) as any).spend(recipient.address, tooMuch))
      .to.be.revertedWithCustomError(vault, "ExceedsMaxPerTx")
      .withArgs(tooMuch, maxPerTx);
  });

  it("enforces dailyLimit and tracks spend", async () => {
  const { user, agent, usdc, vault, recipient, dailyLimit } = await deploy();

  await (usdc.connect(user) as any).approve(await vault.getAddress(), 500n * ONE_USDC);
  await (vault.connect(user) as any).deposit(500n * ONE_USDC);

  // spend within maxPerTx (100) but accumulate toward dailyLimit (250)
  await (vault.connect(agent) as any).spend(recipient.address, 100n * ONE_USDC);
  expect(await (vault as any).spentInCurrentDay()).to.eq(100n * ONE_USDC);

  await (vault.connect(agent) as any).spend(recipient.address, 100n * ONE_USDC);
  expect(await (vault as any).spentInCurrentDay()).to.eq(200n * ONE_USDC);

  // this would push total to 260 > 250
  await expect((vault.connect(agent) as any).spend(recipient.address, 60n * ONE_USDC))
    .to.be.revertedWithCustomError(vault, "ExceedsDailyLimit");

  // exact remaining (50) should work: 200 + 50 = 250
  await (vault.connect(agent) as any).spend(recipient.address, dailyLimit - 200n * ONE_USDC);
  expect(await (vault as any).spentInCurrentDay()).to.eq(dailyLimit);
});

  it("resets spent on next day", async () => {
    const { user, agent, usdc, vault, recipient } = await deploy();

    await (usdc.connect(user) as any).approve(await vault.getAddress(), 500n * ONE_USDC);
    await (vault.connect(user) as any).deposit(500n * ONE_USDC);

    await (vault.connect(agent) as any).spend(recipient.address, 100n * ONE_USDC);
    expect(await (vault as any).spentInCurrentDay()).to.eq(100n * ONE_USDC);

    await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 5]);
    await ethers.provider.send("evm_mine", []);

    expect(await (vault as any).spentInCurrentDay()).to.eq(0);
  });

  it("only owner can withdraw and admin-set guardrails/agent", async () => {
    const { user, owner, agent, usdc, vault, recipient } = await deploy();

    await (usdc.connect(user) as any).approve(await vault.getAddress(), 500n * ONE_USDC);
    await (vault.connect(user) as any).deposit(500n * ONE_USDC);

    await expect((vault.connect(user) as any).withdraw(recipient.address, 1n * ONE_USDC))
      .to.be.revertedWithCustomError(vault, "Unauthorized");

    await expect((vault.connect(agent) as any).setGuardrails(1n, 2n))
      .to.be.revertedWithCustomError(vault, "Unauthorized");

    await (vault.connect(owner) as any).withdraw(recipient.address, 10n * ONE_USDC);
    expect(await (usdc as any).balanceOf(recipient.address)).to.eq(10n * ONE_USDC);
  });
});

