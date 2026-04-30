import { registerDesignContractSeedSmokeTests } from './design-and-detection/design-contract-seed.mjs';
import { registerUiDetectionSmokeTests } from './design-and-detection/ui-detection.mjs';
import { registerUpgradeDesignSeedSmokeTests } from './design-and-detection/upgrade-design-seed.mjs';
import { registerOptimizationDefaultsSmokeTests } from './design-and-detection/optimization-defaults.mjs';

export async function registerCliSmokeDesignAndDetectionTests(t) {
  await registerDesignContractSeedSmokeTests(t);
  await registerUiDetectionSmokeTests(t);
  await registerUpgradeDesignSeedSmokeTests(t);
  await registerOptimizationDefaultsSmokeTests(t);
}
