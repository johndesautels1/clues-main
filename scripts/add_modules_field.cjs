const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'src', 'data', 'questions');

const exclude = ['types.ts', 'index.ts', 'meta.ts', 'main_module.ts'];
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && !exclude.includes(f));

for (const file of files) {
  const fp = path.join(dir, file);
  let content = fs.readFileSync(fp, 'utf8');

  const moduleIdMatch = content.match(/"moduleId":\s*"([^"]+)"/);
  if (!moduleIdMatch) {
    console.log('SKIP (no moduleId):', file);
    continue;
  }
  const moduleId = moduleIdMatch[1];

  if (content.includes('"modules":')) {
    console.log('SKIP (already has modules):', file);
    continue;
  }

  // Parse the JSON-like structure and add modules to each question
  // Strategy: find each question object by finding "type": "..." patterns
  // and inserting modules after the last property before the closing brace

  // We need to handle two cases:
  // 1. Questions ending with "type": "..." }
  // 2. Questions ending with "sliderRight": "..." }

  // Replace pattern: find each question closing pattern and add modules
  let modified = content;

  // Handle questions that end with "type": "SomeType"\n          }
  // (no sliderLeft/sliderRight)
  modified = modified.replace(
    /("type":\s*"[^"]*")\n(\s*\})/g,
    (match, typeLine, closingBrace) => {
      // Don't add if this is inside a question that has sliderLeft (will be handled below)
      // Check if next line after type is sliderLeft
      return `${typeLine},\n${closingBrace.replace('}', `"modules": ["${moduleId}"]\n${closingBrace}`)}`;
    }
  );

  // Now fix doubled modules for slider questions - those have sliderLeft after type
  // The above regex added modules after type, but slider questions also have sliderLeft/Right
  // We need to remove the incorrectly added modules and add after sliderRight instead

  // Actually, let me take a different approach - just work with the raw file structure
  // Reset and do it properly
  modified = content;

  // Find all question objects and add modules as the last field
  // A question object looks like:
  // {
  //   "number": N,
  //   "question": "...",
  //   "type": "...",
  //   possibly "sliderLeft": "...",
  //   possibly "sliderRight": "..."
  // }

  // Pattern: find the last property line before the closing } of each question
  // The closing } is indented (typically 8+ spaces)

  // Simple approach: add "modules" before every } that follows a "type" or "sliderRight" line
  const lines = modified.split('\n');
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1] || '';

    // Check if this line is the last property of a question object
    // (next line is a closing brace with same or less indentation)
    const isLastProp = (
      (line.includes('"type":') || line.includes('"sliderRight":')) &&
      nextLine.trimStart().startsWith('}')
    );

    if (isLastProp) {
      // Add comma to this line if it doesn't have one, then add modules
      const trimmed = line.trimEnd();
      const indent = line.match(/^(\s*)/)[1];
      if (trimmed.endsWith(',')) {
        result.push(line);
      } else {
        result.push(trimmed + ',');
      }
      result.push(`${indent}"modules": ["${moduleId}"]`);
    } else {
      result.push(line);
    }
  }

  modified = result.join('\n');
  fs.writeFileSync(fp, modified);

  const count = (modified.match(/"modules":/g) || []).length;
  console.log('OK:', file, '- moduleId:', moduleId, '- questions tagged:', count);
}
