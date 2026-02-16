{* OpenClaw Host Error Template *}
{* Displays error messages when instance data cannot be loaded *}

<div class="openclaw-error">
    <div class="alert alert-danger">
        <h4><i class="fa fa-exclamation-triangle"></i> Error Loading Instance</h4>
        <p>{$error}</p>
    </div>

    <div class="panel panel-default">
        <div class="panel-heading">
            <h3 class="panel-title">Troubleshooting</h3>
        </div>
        <div class="panel-body">
            <ul>
                <li>If this is a new service, please wait a few minutes for provisioning to complete.</li>
                <li>Try refreshing this page in a few moments.</li>
                <li>If the problem persists, please contact support with your service ID: <strong>#{$serviceid}</strong>.</li>
            </ul>
        </div>
    </div>
</div>

<style>
.openclaw-error {
    margin-top: 20px;
}
</style>
