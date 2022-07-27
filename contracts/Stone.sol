// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/governance/Governor.sol";

/// @notice Pangea's Governance Token
contract Stone is ERC20, ERC20Permit, ERC20Votes, Ownable {

    address public minter;

    event MinterChanged(address minter);

    constructor() ERC20("PANGEA GOVERNANCE TOKEN", "STONE") ERC20Permit("PANGEA GOVERNANCE TOKEN") {
        _mint(_msgSender(), 10_000_000 ether);

        minter = _msgSender();
    }

    function setMinter(address _minter) external {
        require(minter == _msgSender(), "ONLY MINTER");
        minter = _minter;
        emit MinterChanged(_minter);
    }

    function mint(
        address account,
        uint256 amount
    ) external returns (bool) {
        require(minter == _msgSender(), "ONLY MINTER");
        _mint(account, amount);
        return true;
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(
        address account,
        uint256 amount
    ) internal override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
}
