// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0;

interface IVestingStoneStruct {
    struct Option {
        /// @dev option Amount
        uint256 amount;

        /// @dev option creation date
        uint256 creationTime;

        /// @dev option expiration date
        uint256 expirationTime;
    }
}

interface IVestingStoneError {
    error NotAllowed();

    error InSufficient();

    error NotZero();

    error InvalidParam();

    error InvalidExpiredTime();

    error NotExpired();
}

interface IVestingStoneEvent {
    event GrantOption(address indexed owner, uint256 amount, uint256 expirationTime);

    event ExerciseOption(address indexed owner, address indexed recipient, uint256 optionId);

    event SplitOption(address indexed operator, uint256 fromOptionId, uint256 toOptionId, uint256 amount);

    event MergeOption(address indexed operator, address indexed recipient, uint256 fromOptionId, uint256 toOptionId);

}

interface IVestingStone is IVestingStoneError, IVestingStoneStruct, IVestingStoneEvent {

    /// @notice grant STONE option. It can be received after the expiration time. (technically it means `mint OPTION NFT`)
    /// @param to               address to receive STONE option NFT
    /// @param amount           Amount of STONE to receive after expiration
    /// @param expirationTime   option Expiration Time
    function grantOption(
        address to,
        uint256 amount,
        uint256 expirationTime
    ) external returns (uint256 optionId);

    /// @notice exercise option to receive STONE
    /// @param to       account to receive
    /// @param optionId token ID of option to exercise
    function exerciseOption(address to, uint256 optionId) external;

    /// @notice create new STONE option by splitting from the existing STONE option
    /// @param to       account to receive new STONE Option
    /// @param optionId token ID of option
    /// @param amount   The amount of stones to be given to the new STONE option
    function splitOption(address to, uint256 optionId, uint256 amount) external returns (uint256 newOptionId);

    /// @notice merge the quantities of the two STONE option and burn `from` STONE option
    /// @param fromOptionId token ID of option to burn
    /// @param toOptionId token ID of option to be merged
    /// @dev if the expirationTime of `from` option is longer than `to` Option, it should be reverted
    function mergeOption(address to, uint256 fromOptionId, uint256 toOptionId) external;
}
