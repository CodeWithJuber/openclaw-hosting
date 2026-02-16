{* OpenClaw Host Admin Status Panel Template *}
{* Displays detailed instance information in the admin area *}

<div class="openclaw-admin-panel">
    <div class="row">
        <div class="col-md-6">
            <div class="panel panel-default">
                <div class="panel-heading">
                    <h3 class="panel-title">Instance Details</h3>
                </div>
                <div class="panel-body">
                    <table class="table table-striped">
                        <tr>
                            <td><strong>Instance ID:</strong></td>
                            <td><code>{$instance.id}</code></td>
                        </tr>
                        <tr>
                            <td><strong>Status:</strong></td>
                            <td>
                                <span class="label label-{if $instance.status eq 'active'}success{elseif $instance.status eq 'suspended'}danger{elseif $instance.status eq 'pending'}info{else}warning{/if}">
                                    {$instance.status|upper}
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>IP Address:</strong></td>
                            <td><code>{$instance.ip_address}</code></td>
                        </tr>
                        <tr>
                            <td><strong>Region:</strong></td>
                            <td>{$instance.region|upper}</td>
                        </tr>
                        <tr>
                            <td><strong>Plan:</strong></td>
                            <td>{$instance.plan|upper}</td>
                        </tr>
                        <tr>
                            <td><strong>AI Preset:</strong></td>
                            <td>{$instance.ai_preset|capitalize}</td>
                        </tr>
                        <tr>
                            <td><strong>Created:</strong></td>
                            <td>{$instance.created_at}</td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>

        <div class="col-md-6">
            <div class="panel panel-primary">
                <div class="panel-heading">
                    <h3 class="panel-title">Quick Actions</h3>
                </div>
                <div class="panel-body">
                    <a href="{$instance.url}" target="_blank" class="btn btn-primary btn-block">
                        <i class="fa fa-external-link"></i> Open Dashboard
                    </a>

                    <hr>

                    <form method="post" action="{$modulelink}">
                        <input type="hidden" name="action" value="reboot" />
                        <input type="hidden" name="id" value="{$serviceid}" />
                        <button type="submit" class="btn btn-warning btn-block"
                                onclick="return confirm('Reboot this server?');">
                            <i class="fa fa-refresh"></i> Reboot Server
                        </button>
                    </form>

                    <form method="post" action="{$modulelink}" style="margin-top: 10px;">
                        <input type="hidden" name="action" value="repair" />
                        <input type="hidden" name="id" value="{$serviceid}" />
                        <button type="submit" class="btn btn-info btn-block"
                                onclick="return confirm('Run repair on this server?');">
                            <i class="fa fa-wrench"></i> Repair OpenClaw
                        </button>
                    </form>

                    <form method="post" action="{$modulelink}" style="margin-top: 10px;">
                        <input type="hidden" name="action" value="syncstatus" />
                        <input type="hidden" name="id" value="{$serviceid}" />
                        <button type="submit" class="btn btn-default btn-block">
                            <i class="fa fa-sync"></i> Force Sync Status
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
