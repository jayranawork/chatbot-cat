const SECRET_PATTERN = /\b(?:API_KEY|TOKEN|SECRET|PASSWORD|KEY)\s*[=:]\s*[^\s,;]+/gi;
const URL_CREDENTIAL_PATTERN = /\b([a-z][a-z\d+.-]*:\/\/)([^\s/@]+):([^\s/@]+)@/gi;
const PROCESS_ENV_DUMP_PATTERN = /process\.env(?:\s*=\s*|\s*:\s*)\{[^}]*\}|process\.env\.[A-Z0-9_]+/gi;
const WINDOWS_PATH_PATTERN = /\b[A-Za-z]:\\[^\r\n"'<>|?*]+/g;
const UNIX_PATH_PATTERN = /(?:^|\s)(\/[^\r\n"'<>|?*]+)/g;

function shortenPath(path: string, separator: "\\" | "/") {
  const normalized = path.replace(/[\\/]+/g, separator);
  const prefix = separator === "\\" && /^[A-Za-z]:\\/.test(normalized) ? normalized.slice(0, 3) : "";
  const parts = normalized.slice(prefix.length).split(separator).filter(Boolean);
  const lastTwo = parts.slice(-2);
  return `...${separator}${lastTwo.join(separator)}`;
}

export function redact(input: string) {
  return input
    .replace(URL_CREDENTIAL_PATTERN, "$1[REDACTED]@")
    .replace(SECRET_PATTERN, "[REDACTED]")
    .replace(PROCESS_ENV_DUMP_PATTERN, "[REDACTED_ENV]")
    .replace(WINDOWS_PATH_PATTERN, (match) => shortenPath(match, "\\"))
    .replace(UNIX_PATH_PATTERN, (match, path: string) => `${match.slice(0, match.length - path.length)}${shortenPath(path, "/")}`);
}
