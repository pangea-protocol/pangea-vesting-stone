// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Multicall.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "./interfaces/IVestingStone.sol";

/// @notice Vesting Locked-Up Governance Token Contract
contract VestingStone is ERC721Enumerable, IVestingStone, Multicall, Ownable {

    using Strings for uint256;
    using SafeERC20 for IERC20;

    IERC20 public immutable stone;

    /// @dev option information per optionId
    mapping(uint256 => Option) public option;
    uint256 private _tokenId;

    constructor(address _stone) ERC721("Pangea Vesting Option", "VOP") {
        stone = IERC20(_stone);
        _tokenId = 0;
        _mint(address(this), _tokenId);
    }

    function tokenURI(uint256 tokenId) public override view returns (string memory text) {
        string memory lockedAmount;
        {
            uint256 value = option[tokenId].amount / (10 ** 15);
            string memory quotient = (value / (10 ** 3)).toString();
            string memory remain = (value % (10 ** 3)).toString();
            lockedAmount = string(abi.encodePacked(quotient, ".", remain));
        }
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{',
                        '"name": "OPTION #', tokenId.toString(), '", ',
                        '"description": "PANGEA VESTING STONE. this NFT represents the locked-up governance token",',
                        '"attributes": [',
                            '{"display_type": "number", "trait_type":"lockedAmount","value":', lockedAmount, "}",
                            ',{"display_type": "date", "trait_type":"expirationTime","value":', (option[tokenId].expirationTime).toString(),"}",
                            ',{"display_type": "date", "trait_type":"creationTime","value":', (option[tokenId].creationTime).toString(),"}",
                        ']}'
                    )
                )
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    /// @notice grant STONE option. It can be received after the expiration time. (technically it means `mint OPTION NFT`)
    /// @param to               address to receive STONE option NFT
    /// @param amount           Amount of STONE to receive after expiration
    /// @param expirationTime   option Expiration Time
    function grantOption(
        address to,
        uint256 amount,
        uint256 expirationTime
    ) external returns (uint256 optionId) {
        if (amount == 0) revert NotZero();
        if (expirationTime <= block.timestamp) revert InvalidExpiredTime();

        stone.safeTransferFrom(_msgSender(), address(this), amount);

        /// mint new Option NFT
        optionId = mintOption(to, amount, expirationTime);

        emit GrantOption(to, amount, expirationTime);
    }

    /// @notice exercise option to receive STONE
    /// @param to       account to receive
    /// @param optionId token ID of option to exercise
    function exerciseOption(address to, uint256 optionId) external {
        if (!_isApprovedOrOwner(_msgSender(), optionId)) revert NotAllowed();
        if (block.timestamp < option[optionId].expirationTime) revert NotExpired();

        stone.transfer(to, option[optionId].amount);

        emit ExerciseOption(ownerOf(optionId), to, optionId);

        _burn(optionId);
        delete option[optionId];
    }

    /// @notice create new STONE option by splitting from the existing STONE option
    /// @param to       account to receive new STONE Option
    /// @param optionId token ID of option
    /// @param amount   The amount of stones to be given to the new STONE option
    function splitOption(
        address to,
        uint256 optionId,
        uint256 amount
    ) external returns (uint256 newOptionId) {
        if (!_isApprovedOrOwner(_msgSender(), optionId)) revert NotAllowed();
        if (amount == 0) revert NotZero();

        uint256 originalAmount = option[optionId].amount;
        // if amount == originalAmount, plz use `transferFrom`
        if (originalAmount <= amount) revert InSufficient();

        // reduce the amount from the existing Option
        option[optionId].amount -= amount;

        newOptionId = mintOption(to, amount, option[optionId].expirationTime);

        emit SplitOption(_msgSender(), optionId, newOptionId, amount);
    }

    /// @notice merge the quantities of the two STONE option and burn `from` STONE option
    /// @param to           account to receive new STONE Option
    /// @param fromOptionId token ID of option to burn
    /// @param toOptionId   token ID of option to be merged
    /// @dev if the expirationTime of `from` option is longer than `to` Option, it should be reverted
    function mergeOption(address to, uint256 fromOptionId, uint256 toOptionId) external {
        if (!_isApprovedOrOwner(_msgSender(), fromOptionId)) revert NotAllowed();
        if (!_isApprovedOrOwner(_msgSender(), toOptionId)) revert NotAllowed();
        if (fromOptionId == toOptionId) revert InvalidParam();
        if (option[fromOptionId].expirationTime > option[toOptionId].expirationTime) revert InvalidExpiredTime();

        option[toOptionId].amount += option[fromOptionId].amount;

        _burn(fromOptionId);
        delete option[fromOptionId];

        address owner = ERC721.ownerOf(toOptionId);
        if (owner != to) {
            _transfer(owner, to, toOptionId);
        }

        emit MergeOption(_msgSender(), to, fromOptionId, toOptionId);
    }

    function mintOption(
        address owner,
        uint256 amount,
        uint256 expirationTime
    ) private returns (uint256 optionId) {
        _tokenId += 1;
        optionId = _tokenId;
        _mint(owner, optionId);

        option[optionId] = Option(amount, block.timestamp, expirationTime);
    }
}
