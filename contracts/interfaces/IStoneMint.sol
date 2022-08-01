// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0;

interface IStoneMint {

    function mint(address account, uint256 amount) external returns (bool);

    function totalSupply() external returns (uint256);

}
