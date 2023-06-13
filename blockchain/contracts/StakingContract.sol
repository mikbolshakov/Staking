// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract StakingContract is AccessControl {
    ERC20 public stakingToken;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 private _shouldPaidAmount;

    mapping(address => uint256) private _balances;
    address[] public allReceivers;

    struct Stake {
        uint256 id;
        bool isClaimed;
        uint256 amount;
        uint256 rate;
        uint256 daysPlan;
        uint256 expiredTime;
    }
    mapping(address => Stake[]) public userStakes;

    event Staked(
        uint256 id,
        address indexed receiver,
        uint256 amount,
        uint256 rate,
        uint256 expiredTime
    );
    event Claimed(address indexed receiver, uint256 amount, uint256 id);
    event TokenAddressChanged(address previousAddress, address newAddress);

    constructor(address _stakingToken, address _defaultAdmin) {
        stakingToken = ERC20(_stakingToken);
        _setupRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
    }

    function getMyLastStakedId(address _user) public view returns (uint256) {
        return userStakes[_user].length;
    }

    function getReceiversLength() public view returns (uint256) {
        return allReceivers.length;
    }

    function getContractBalance() public view returns (uint256) {
        return stakingToken.balanceOf(address(this));
    }

    function userTokenBalance(
        address _account
    ) external view returns (uint256) {
        return _balances[_account];
    }

    function stakingEndTime(
        address _account,
        uint256 id
    ) public view returns (uint256) {
        return userStakes[_account][id].expiredTime;
    }

    function stake(
        address _receiver,
        uint256 _amount,
        uint256 _day
    ) external onlyRole(ADMIN_ROLE) {
        require(
            _day == 90 || _day == 180 || _day == 360 || _day == 720,
            "Choose correct plan: 90/180/360/720 days"
        );
        require(_amount > 0, "The amount must be greater than 0");
        uint256 id = userStakes[_receiver].length;
        uint256 expiredTime = _calculateTime(_day);
        uint256 rate = _checkPlane(_day);

        uint256 contractBalance = getContractBalance();

        require(
            (_amount * rate) / 1000 <= contractBalance - _shouldPaidAmount,
            "Not enough tokens on contract"
        );

        userStakes[_receiver].push(
            Stake(id, false, _amount, rate, _day, expiredTime)
        );

        _checkAllReceivers(_receiver);

        uint256 reward = _earned(_receiver, id) + _amount;
        _shouldPaidAmount += reward;
        _balances[_receiver] += reward;

        stakingToken.transferFrom(msg.sender, address(this), _amount);
        emit Staked(id, _receiver, _amount, rate, expiredTime);
    }

    function claim(uint256 _id, address _receiver) external {
        require(
            stakingEndTime(_receiver, _id) < block.timestamp,
            "Token lock time has not yet expired"
        );
        require(
            !userStakes[_receiver][_id].isClaimed,
            "Reward already claimed!"
        );
        userStakes[_receiver][_id].isClaimed = true;

        uint256 amount = userStakes[_receiver][_id].amount;
        uint256 reward = _earned(_receiver, _id) + amount;

        _shouldPaidAmount -= reward;
        _balances[_receiver] -= reward;

        stakingToken.transfer(_receiver, reward);
        emit Claimed(_receiver, reward, _id);
    }

    function _checkAllReceivers(address _receiver) private {
        bool hasReceiver = false;

        for (uint256 i = 0; i < allReceivers.length; i++) {
            if (allReceivers[i] == _receiver) {
                hasReceiver = true;
                break;
            }
        }

        if (!hasReceiver) {
            allReceivers.push(_receiver);
        }
    }

    // (block.timestamp + _day * 24 * 3600);
    function _calculateTime(uint256 _day) private view returns (uint256) {
        return (block.timestamp + _day * 1 * 1);
    }

    function _earned(
        address receiver,
        uint256 id
    ) private view returns (uint256) {
        return
            (userStakes[receiver][id].amount * userStakes[receiver][id].rate) /
            1000;
    }

    function _checkPlane(uint256 _day) internal pure returns (uint256) {
        if (_day == 90) {
            return 60;
        } else if (_day == 180) {
            return 150;
        } else if (_day == 360) {
            return 380;
        }
        return 1000;
    }

    function setTokenAddress(
        address _changeAddress
    ) external onlyRole(ADMIN_ROLE) {
        emit TokenAddressChanged(address(stakingToken), _changeAddress);
        stakingToken = ERC20(_changeAddress);
    }
}
