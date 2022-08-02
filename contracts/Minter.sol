// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IStoneMint.sol";
import "./interfaces/INotifyMint.sol";

/// @notice Pangea's Governance Token inflation System (it works after 4 years )
contract Minter is Ownable {

    IStoneMint public stone;
    address public treasury;
    uint256 public epochStartTime;

    // inflation parameters (0.5% / 90 days)
    uint256 public period = 90 days;
    uint256 public inflationRate = 500;

    constructor(
        address _stone,
        address _treasury,
        uint256 _epochStartTime
    ) {
        require(_stone != address(0));
        require(_treasury != address(0));
        require(_epochStartTime >= block.timestamp);

        stone = IStoneMint(_stone);
        treasury = _treasury;
        epochStartTime = _epochStartTime;
    }

    // @notice update Treasury address
    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    // @notice Mint Stone
    // @dev anyone can call, but only treasury can receive token
    function mintStone() external {
        require(epochStartTime + period <= block.timestamp, "NOT YET");

        uint256 amount = stone.totalSupply() * inflationRate / 100_000;

        stone.mint(treasury, amount);

        if(Address.isContract(treasury)) {
            // @dev if treasury has logic to distribute or something,
            // it should by called after mint
            require(INotifyMint(treasury).notifyMint(amount), "REVERT MINT");
        }

        epochStartTime += period;
    }
}
