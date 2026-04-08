import path from 'node:path';
import { performRollback } from '../rollback.mjs';
import { ensureDirectory } from '../utils.mjs';

/**
 * Command module for `rollback`
 */
export async function runRollbackCommand(commandArguments) {
  // Parse simple argument <targetDir>
  const targetDirectoryArgument = commandArguments.length > 0 ? commandArguments[0] : null;

  if (!targetDirectoryArgument) {
    console.error('Usage: agentic-senior-core rollback <target-directory>');
    process.exit(1);
  }

  const resolvedTargetDirectoryPath = path.resolve(targetDirectoryArgument);
  
  try {
      await ensureDirectory(resolvedTargetDirectoryPath);
  } catch (err) {
      console.error(`[FATAL] Cannot access target directory: ${resolvedTargetDirectoryPath}`);
      process.exit(1);
  }

  console.log(`Starting manual rollback for directory: ${resolvedTargetDirectoryPath} ...\n`);

  try {
      const report = await performRollback(resolvedTargetDirectoryPath);

      if (report.success) {
          console.log('[OK] Rollback successful.\n');
      } else {
          console.error('[WARN] Rollback completed with errors.\n');
      }

      console.log('Restored files:');
      if (report.restoredFiles.length === 0) console.log('  (none)');
      report.restoredFiles.forEach(f => console.log(`  + ${f}`));

      console.log('\nDeleted (new) files:');
      if (report.deletedFiles.length === 0) console.log('  (none)');
      report.deletedFiles.forEach(f => console.log(`  - ${f}`));

      if (report.errors.length > 0) {
          console.error('\nErrors encountered:');
          report.errors.forEach(e => console.error(`  ! ${e}`));
      }

      const exitCode = report.success ? 0 : 1;
      process.exit(exitCode);
  } catch (error) {
      console.error('\n[FATAL] Rollback operation failed:');
      console.error(error.message);
      process.exit(1);
  }
}
