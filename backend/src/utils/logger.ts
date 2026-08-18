import winston from "winston";

const scrubSecrets = winston.format((info) => {
  // these will be hidden from logs
  // by checking if the log message or object contains these words
  // this is done by regex replacing these words with [REDACTED]
  const secrets = ["password", "token", "jwt", "secret", "authorization"];
  const infoObj = info as any;

  // this function masks the specified secrets in the log object
  // masks -> replace the secret with [REDACTED]
  const mask = (obj: any): any => {
    if (!obj || typeof obj !== "object") return obj;
    for (const key in obj) {
      if (secrets.includes(key.toLowerCase())) {
        obj[key] = "[REDACTED]";
      } else if (typeof obj[key] === "object") {
        obj[key] = mask(obj[key]);
      }
    }
    return obj;
  };

  // this function masks the specified secrets in the log message USING REGEX
  if (typeof infoObj.message === "string") {
    for (const secret of secrets) {
      const regex = new RegExp(`("${secret}"\\s*:\\s*")[^"]+(")`, "gi");
      infoObj.message = infoObj.message.replace(regex, `$1[REDACTED]$2`);
    }
  }

  mask(infoObj);
  return infoObj;
});

const isProduction = process.env.NODE_ENV === "production";

// if production -> JSON format (machine-readable format)
// if development -> colorize format with printf (human-readable format)
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  scrubSecrets(),
  isProduction
    ? winston.format.json()
    : winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
);

// transports: where the logger outputs the logs (e.g., console, file, database)
// will log to console only for now, can be expanded to log to files or database
const transports = [new winston.transports.Console()];

// logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info", // info, warn, error. will neglect the less important logs like debug, verbose
  format, // production -> JSON format, development -> colorize format
  transports, // only console for now, can be expanded to files or database
});
