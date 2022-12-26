// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0;
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IVestingStoneOption {
    struct Option {
        /// @dev option Amount
        uint256 amount;

        /// @dev option creation date
        uint256 creationTime;

        /// @dev option expiration date
        uint256 expirationTime;
    }

    function option(uint256 optionId) external view returns (Option memory);
}

contract CirculatingInfo {

    IERC20 public stone;
    address public vestingStone;
    address public marketing;
    IERC20 public stakedStone;

    constructor(
        address _stone,
        address _vestingStone,
        address _marketing,
        address _stakedStone
    ) {
        stone = IERC20(_stone);
        vestingStone = _vestingStone;
        marketing = _marketing;
        stakedStone = IERC20(_stakedStone);
    }


    function info() external view returns (
        uint256 totalSupply,
        uint256 nominalSupply,
        uint256 marketingSupply,
        uint256 stakingSupply
    ) {
        totalSupply = stone.totalSupply();
        nominalSupply = totalSupply - calculateLockedSupply();
        marketingSupply = stone.balanceOf(marketing);
        stakingSupply = stakedStone.totalSupply();
    }

    function calculateLockedSupply() internal view returns (uint256 locked) {
        IERC721Enumerable nft = IERC721Enumerable(vestingStone);
        uint256 totalSupply = nft.totalSupply();
        for (uint256 i = 0; i < totalSupply; i++) {
            IVestingStoneOption.Option memory option = IVestingStoneOption(vestingStone).option(nft.tokenByIndex(i));
            if (block.timestamp < option.expirationTime) {
                locked += option.amount;
            }
        }
    }
}
