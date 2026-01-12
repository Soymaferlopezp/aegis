// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Like {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address who) external view returns (uint256);
}

contract VaultGuardrails {
    // ========= Errors =========
    error Unauthorized();
    error ZeroAddress();
    error ZeroAmount();
    error ExceedsMaxPerTx(uint256 amount, uint256 maxPerTx);
    error ExceedsDailyLimit(uint256 nextSpent, uint256 dailyLimit);
    error TransferFailed();

    // ========= Events =========
    event Deposited(address indexed from, uint256 amount);
    event Spent(address indexed executor, address indexed to, uint256 amount, uint256 indexed dayIndex, uint256 spentInDayAfter);
    event Withdrawn(address indexed to, uint256 amount);
    event AgentExecutorUpdated(address indexed oldAgent, address indexed newAgent);
    event GuardrailsUpdated(uint256 maxPerTx, uint256 dailyLimit);

    // ========= Storage =========
    IERC20Like public immutable usdc;

    address public owner;
    address public agentExecutor;

    uint256 public maxPerTx;
    uint256 public dailyLimit;

    uint256 private _dayIndex;      // cached day index
    uint256 private _spentInDay;    // spent within cached day

    // ========= Modifiers =========
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyAgent() {
        if (msg.sender != agentExecutor) revert Unauthorized();
        _;
    }

    constructor(
        address usdc_,
        address owner_,
        address agentExecutor_,
        uint256 maxPerTx_,
        uint256 dailyLimit_
    ) {
        if (usdc_ == address(0) || owner_ == address(0) || agentExecutor_ == address(0)) revert ZeroAddress();
        usdc = IERC20Like(usdc_);
        owner = owner_;
        agentExecutor = agentExecutor_;

        maxPerTx = maxPerTx_;
        dailyLimit = dailyLimit_;

        _dayIndex = _currentDayIndex();
        _spentInDay = 0;

        emit AgentExecutorUpdated(address(0), agentExecutor_);
        emit GuardrailsUpdated(maxPerTx_, dailyLimit_);
    }

    // ========= Views =========
    function currentDayIndex() public view returns (uint256) {
        return _currentDayIndex();
    }

    function spentInCurrentDay() public view returns (uint256) {
        uint256 d = _currentDayIndex();
        if (d != _dayIndex) return 0;
        return _spentInDay;
    }

    // ========= Core =========
    function deposit(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        bool ok = usdc.transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();
        emit Deposited(msg.sender, amount);
    }

    function spend(address to, uint256 amount) external onlyAgent {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        if (amount > maxPerTx) revert ExceedsMaxPerTx(amount, maxPerTx);

        _rollDayIfNeeded();

        uint256 nextSpent = _spentInDay + amount;
        if (nextSpent > dailyLimit) revert ExceedsDailyLimit(nextSpent, dailyLimit);

        _spentInDay = nextSpent;

        bool ok = usdc.transfer(to, amount);
        if (!ok) revert TransferFailed();

        emit Spent(msg.sender, to, amount, _dayIndex, _spentInDay);
    }

    function withdraw(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        bool ok = usdc.transfer(to, amount);
        if (!ok) revert TransferFailed();

        emit Withdrawn(to, amount);
    }

    // ========= Admin =========
    function setAgentExecutor(address newAgent) external onlyOwner {
        if (newAgent == address(0)) revert ZeroAddress();
        address old = agentExecutor;
        agentExecutor = newAgent;
        emit AgentExecutorUpdated(old, newAgent);
    }

    function setGuardrails(uint256 maxPerTx_, uint256 dailyLimit_) external onlyOwner {
        maxPerTx = maxPerTx_;
        dailyLimit = dailyLimit_;
        emit GuardrailsUpdated(maxPerTx_, dailyLimit_);
    }

    // ========= Internals =========
    function _currentDayIndex() internal view returns (uint256) {
        return block.timestamp / 1 days;
    }

    function _rollDayIfNeeded() internal {
        uint256 d = _currentDayIndex();
        if (d != _dayIndex) {
            _dayIndex = d;
            _spentInDay = 0;
        }
    }
}
