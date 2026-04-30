export async function askChoice(promptMessage, options, userInterface) {
  console.log(`\n${promptMessage}`);
  options.forEach((choiceLabel, choiceIndex) => {
    console.log(`  ${choiceIndex + 1}. ${choiceLabel}`);
  });

  while (true) {
    const selectedRawInput = await userInterface.question('Choose a number (press Enter for 1): ');
    const normalizedInput = selectedRawInput.trim();

    if (!normalizedInput) {
      return options[0];
    }

    const selectedIndex = Number.parseInt(normalizedInput, 10) - 1;

    if (Number.isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= options.length) {
      console.log('Invalid choice. Please select a valid number.');
      continue;
    }

    return options[selectedIndex];
  }
}

export async function askYesNo(promptMessage, userInterface, defaultValue) {
  const suffix = typeof defaultValue === 'boolean'
    ? defaultValue ? ' (Y/n): ' : ' (y/N): '
    : ' (y/n): ';

  while (true) {
    const answer = await userInterface.question(`\n${promptMessage}${suffix}`);
    const normalizedAnswer = answer.trim().toLowerCase();

    if (!normalizedAnswer && typeof defaultValue === 'boolean') {
      return defaultValue;
    }

    if (normalizedAnswer === 'y' || normalizedAnswer === 'yes') return true;
    if (normalizedAnswer === 'n' || normalizedAnswer === 'no') return false;

    console.log("Please answer with 'y' or 'n'.");
  }
}
