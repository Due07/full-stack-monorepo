import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const ENV_EXAMPLE_PATH = path.join(ROOT_DIR, '.env.example');
const OUTPUT_PATH = path.join(ROOT_DIR, 'src', 'types', 'env.ts');

const ENV_TYPE_NAME = 'TEnv';
const NODE_ENV_TYPE_NAME = 'TNodeEnv';

const EscapeJsDocText = (text) => text.replace(/\*\//g, '*\\/');

const GetEnvEntries = (content) => {
  const lines = content.split(/\r?\n/);
  const entries = [];
  const seenKeys = new Set();
  let pendingCommentLines = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      pendingCommentLines = [];
      continue;
    }

    if (trimmedLine.startsWith('#')) {
      pendingCommentLines.push(trimmedLine.replace(/^#\s?/, '').trim());
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');
    if (separatorIndex <= 0) {
      pendingCommentLines = [];
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    if (!key) {
      pendingCommentLines = [];
      continue;
    }

    seenKeys.add(key);
    const description = pendingCommentLines.join(' ').trim() || `ENV variable: ${key}`;
    entries.push({
      key,
      description: EscapeJsDocText(description),
    });
    pendingCommentLines = [];
  }

  return entries;
};

const GetFieldType = (key) => {
  if (key === 'NODE_ENV') return NODE_ENV_TYPE_NAME;

  return 'string';
};

const BuildEnvTypeFile = (entries) => {
  const fields = entries
    .map(({ key, description }) => `  /** ${description} */\n  ${key}: ${GetFieldType(key)};`)
    .join('\n');

  return `// 请勿手动修改，此文件由 */script/create-env-types.mjs* 生成
type ${NODE_ENV_TYPE_NAME} = 'development' | 'test' | 'production';

export type ${ENV_TYPE_NAME} = {
${fields}
};
`;
};

if (!fs.existsSync(ENV_EXAMPLE_PATH)) {
  throw new Error(`.env.example not found at ${ENV_EXAMPLE_PATH}`);
}

const envExampleContent = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf8');
const envEntries = GetEnvEntries(envExampleContent);
const outputContent = BuildEnvTypeFile(envEntries);

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, outputContent, 'utf8');

const outputRelativePath = path.relative(ROOT_DIR, OUTPUT_PATH);
const [COLOR_BLUE, COLOR_YELLOW, COLOR_RESET] = ['\x1b[34m', '\x1b[33m', '\x1b[0m'];

console.log(
  `${COLOR_BLUE}Generated ${COLOR_YELLOW}${outputRelativePath}${COLOR_BLUE} from .env.example${COLOR_RESET}`,
);
