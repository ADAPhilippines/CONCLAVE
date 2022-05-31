using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Api.Services;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Microsoft.Extensions.Options;

namespace Conclave.Snapshot.Handlers;

public class ConclaveOwnerRewardHandler
{

    private readonly IConclaveRewardService _rewardService;
    private readonly IConclaveEpochsService _epochService;
    private readonly IConclaveOwnerRewardService _conclaveOwnerRewardService;
    private readonly IConclaveOwnerSnapshotService _conclaveOwnerSnapshotService;
    private readonly IOptions<RewardOptions> _options;

    public ConclaveOwnerRewardHandler(IConclaveRewardService rewardService,
                                      IConclaveEpochsService epochsService,
                                      IConclaveOwnerRewardService conclaveOwnerRewardService,
                                      IConclaveOwnerSnapshotService conclaveOwnerSnapshotService,
                                      IOptions<RewardOptions> options)
    {
        _rewardService = rewardService;
        _epochService = epochsService;
        _conclaveOwnerRewardService = conclaveOwnerRewardService;
        _conclaveOwnerSnapshotService = conclaveOwnerSnapshotService;
        _options = options;
    }


    public async Task HandleAsync(ConclaveEpoch epoch)
    {
        if (epoch.ConclaveOwnerSnapshotStatus != SnapshotStatus.Completed) return;
        if (epoch.ConclaveOwnerRewardStatus == RewardStatus.Completed) return;

        // TODO: Need to set schedule here

        var conclaveOwnerSnapshots = _conclaveOwnerSnapshotService.GetAllByEpochNumber(epoch.EpochNumber);

        // Update reward status
        epoch.ConclaveOwnerRewardStatus = RewardStatus.InProgress;
        await _epochService.UpdateAsync(epoch.Id, epoch);

        // TODO: calculate reward here
    }
}