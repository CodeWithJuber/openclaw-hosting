{* OpenClaw Host Client Area Template *}
{* Displays instance status and quick actions to clients *}

<div class="openclaw-client-area">
    <div class="row">
        <div class="col-md-6">
            {* Instance Status Panel *}
            <div class="panel panel-default">
                <div class="panel-heading">
                    <h3 class="panel-title">
                        <i class="fa fa-server"></i> Instance Status
                    </h3>
                </div>
                <div class="panel-body">
                    <table class="table table-striped">
                        <tr>
                            <td><strong>Status:</strong></td>
                            <td>
                                <span class="label label-{if $status eq 'active'}success{elseif $status eq 'suspended'}danger{elseif $status eq 'pending'}info{else}warning{/if}">
                                    {$status|upper}
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>IP Address:</strong></td>
                            <td><code>{$ip}</code></td>
                        </tr>
                        <tr>
                            <td><strong>Region:</strong></td>
                            <td>{$region|upper}</td>
                        </tr>
                        <tr>
                            <td><strong>Plan:</strong></td>
                            <td>{$plan|upper}</td>
                        </tr>
                        {if $instance.created_at}
                        <tr>
                            <td><strong>Created:</strong></td>
                            <td>{$instance.created_at}</td>
                        </tr>
                        {/if}
                    </table>
                </div>
            </div>

            {* Instance Details Panel *}
            {if $instance.specs}
            <div class="panel panel-default">
                <div class="panel-heading">
                    <h3 class="panel-title">
                        <i class="fa fa-cogs"></i> Specifications
                    </h3>
                </div>
                <div class="panel-body">
                    <table class="table table-striped">
                        <tr>
                            <td><strong>CPU:</strong></td>
                            <td>{$instance.specs.cpu} vCores</td>
                        </tr>
                        <tr>
                            <td><strong>RAM:</strong></td>
                            <td>{$instance.specs.ram} GB</td>
                        </tr>
                        <tr>
                            <td><strong>Storage:</strong></td>
                            <td>{$instance.specs.storage} GB NVMe</td>
                        </tr>
                        <tr>
                            <td><strong>Bandwidth:</strong></td>
                            <td>{$instance.specs.bandwidth} TB/month</td>
                        </tr>
                    </table>
                </div>
            </div>
            {/if}
        </div>

        <div class="col-md-6">
            {* Quick Actions Panel *}
            <div class="panel panel-primary">
                <div class="panel-heading">
                    <h3 class="panel-title">
                        <i class="fa fa-bolt"></i> Quick Actions
                    </h3>
                </div>
                <div class="panel-body">
                    {* Open Dashboard Button *}
                    <a href="{$dashboardUrl}" target="_blank" class="btn btn-primary btn-lg btn-block">
                        <i class="fa fa-external-link"></i> Open Dashboard
                    </a>

                    <hr>

                    {* Reboot Button *}
                    <form method="post" action="clientarea.php?action=productdetails" class="form-inline">
                        <input type="hidden" name="id" value="{$serviceid}" />
                        <input type="hidden" name="modop" value="custom" />
                        <input type="hidden" name="a" value="reboot" />
                        <button type="submit" class="btn btn-warning btn-block" 
                                onclick="return confirm('Are you sure you want to reboot your server?');">
                            <i class="fa fa-refresh"></i> Reboot Server
                        </button>
                    </form>

                    {* Additional action buttons can be added here *}
                </div>
            </div>

            {* Connection Info Panel *}
            <div class="panel panel-info">
                <div class="panel-heading">
                    <h3 class="panel-title">
                        <i class="fa fa-info-circle"></i> Connection Information
                    </h3>
                </div>
                <div class="panel-body">
                    <p>Your OpenClaw instance is accessible at:</p>
                    <div class="well well-sm text-center">
                        <code>{$dashboardUrl}</code>
                    </div>
                    <p class="small text-muted">
                        Use the "Open Dashboard" button above for one-click access.
                    </p>
                </div>
            </div>

            {* AI Configuration Panel *}
            {if $instance.ai_preset}
            <div class="panel panel-success">
                <div class="panel-heading">
                    <h3 class="panel-title">
                        <i class="fa fa-robot"></i> AI Configuration
                    </h3>
                </div>
                <div class="panel-body">
                    <p><strong>Active Preset:</strong> {$instance.ai_preset|capitalize}</p>
                    <p class="small text-muted">
                        You can change your AI preset from the dashboard.
                    </p>
                </div>
            </div>
            {/if}
        </div>
    </div>

    {* Usage Statistics Row *}
    {if $instance.usage}
    <div class="row">
        <div class="col-md-12">
            <div class="panel panel-default">
                <div class="panel-heading">
                    <h3 class="panel-title">
                        <i class="fa fa-bar-chart"></i> Usage Statistics
                    </h3>
                </div>
                <div class="panel-body">
                    <div class="row">
                        <div class="col-md-4 text-center">
                            <h4>CPU Usage</h4>
                            <div class="progress">
                                <div class="progress-bar" role="progressbar" 
                                     style="width: {$instance.usage.cpu_percent}%;"
                                     aria-valuenow="{$instance.usage.cpu_percent}" aria-valuemin="0" aria-valuemax="100">
                                    {$instance.usage.cpu_percent}%
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 text-center">
                            <h4>Memory Usage</h4>
                            <div class="progress">
                                <div class="progress-bar progress-bar-info" role="progressbar" 
                                     style="width: {$instance.usage.memory_percent}%;"
                                     aria-valuenow="{$instance.usage.memory_percent}" aria-valuemin="0" aria-valuemax="100">
                                    {$instance.usage.memory_percent}%
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 text-center">
                            <h4>Storage Usage</h4>
                            <div class="progress">
                                <div class="progress-bar progress-bar-success" role="progressbar" 
                                     style="width: {$instance.usage.storage_percent}%;"
                                     aria-valuenow="{$instance.usage.storage_percent}" aria-valuemin="0" aria-valuemax="100">
                                    {$instance.usage.storage_percent}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    {/if}
</div>

<style>
.openclaw-client-area {
    margin-top: 20px;
}
.openclaw-client-area .panel {
    margin-bottom: 20px;
}
.openclaw-client-area .well {
    margin: 10px 0;
}
</style>
