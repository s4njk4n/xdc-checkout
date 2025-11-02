// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Checkout {
    address public immutable owner;
    event Paid(uint256 amount, string orderId, address payer);

    constructor() {
        owner = msg.sender;
    }

    /// @notice Accept XDC payment with order ID
    function pay(string memory orderId) external payable {
        require(msg.value > 0, "Send XDC");
        emit Paid(msg.value, orderId, msg.sender);
    }

    /// @notice Withdraw all funds to owner
    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        payable(owner).transfer(address(this).balance);
    }
}
