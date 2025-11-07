from unittest.mock import patch, MagicMock

from agents_stubs.utils.hardhat import run_hardhat_deploy


@patch("agents_stubs.utils.hardhat.subprocess.run")
def test_run_hardhat_deploy_success(mock_run):
    mock_proc = MagicMock()
    mock_proc.returncode = 0
    mock_proc.stdout = "Deploying... MightyVerseAssets deployed to: 0xAbCdEf0123456789abcdef0123456789ABCDef01"
    mock_proc.stderr = ""
    mock_run.return_value = mock_proc
    addr = run_hardhat_deploy()
    assert addr is not None and addr.startswith("0x")
