import { RUNTIME_ENVIRONMENT_CHOICES } from '../../constants.mjs';

export function resolveRuntimeEnvironmentKeyFromLabel(selectedRuntimeEnvironmentLabel) {
  const runtimeEnvironmentEntry = RUNTIME_ENVIRONMENT_CHOICES.find(
    (runtimeEnvironmentChoice) => runtimeEnvironmentChoice.label === selectedRuntimeEnvironmentLabel
  );

  return runtimeEnvironmentEntry?.key || null;
}

export function resolveRuntimeEnvironmentLabelFromKey(runtimeEnvironmentKey) {
  const runtimeEnvironmentEntry = RUNTIME_ENVIRONMENT_CHOICES.find(
    (runtimeEnvironmentChoice) => runtimeEnvironmentChoice.key === runtimeEnvironmentKey
  );

  return runtimeEnvironmentEntry?.label || runtimeEnvironmentKey;
}

export function detectRuntimeEnvironment() {
  const isWslEnvironment = Boolean(process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP || process.env.__IS_WSL_TEST__);

  if (isWslEnvironment) {
    return {
      key: 'linux-wsl',
      label: resolveRuntimeEnvironmentLabelFromKey('linux-wsl'),
      shellFamily: 'bash',
      isAutoDetected: true,
      source: 'WSL environment markers',
    };
  }

  if (process.platform === 'win32') {
    return {
      key: 'windows',
      label: resolveRuntimeEnvironmentLabelFromKey('windows'),
      shellFamily: 'powershell',
      isAutoDetected: true,
      source: 'process.platform',
    };
  }

  if (process.platform === 'darwin') {
    return {
      key: 'macos',
      label: resolveRuntimeEnvironmentLabelFromKey('macos'),
      shellFamily: 'bash',
      isAutoDetected: true,
      source: 'process.platform',
    };
  }

  return {
    key: 'linux',
    label: resolveRuntimeEnvironmentLabelFromKey('linux'),
    shellFamily: 'bash',
    isAutoDetected: true,
    source: 'process.platform',
  };
}
