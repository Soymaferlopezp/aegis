// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract HelloAegis {
    address public owner;

    event Ping(address indexed caller, string message);

    constructor() {
        owner = msg.sender;
    }

    function ping() external returns (string memory) {
        emit Ping(msg.sender, "Aegis pipeline OK");
        return "Aegis pipeline OK";
    }
}
