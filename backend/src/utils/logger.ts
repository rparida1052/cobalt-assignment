type LogLevel = "info" | "warn" | "error" | "debug" | "success";

class Logger {
  private isDev: boolean;
  private colors: Record<LogLevel, string> = {
    info: "\x1b[34m", // Blue
    warn: "\x1b[33m", // Yellow
    error: "\x1b[31m", // Red
    debug: "\x1b[35m", // Magenta
    success: "\x1b[32m", // Green
  };
  private reset = "\x1b[0m";

  constructor() {
    this.isDev = process.env.NODE_ENV === "development";
  }

  private log(
    level: LogLevel,
    message: string,
    ...optionalParams: any[]
  ): void {
    if (!this.isDev) return;

    const color = this.colors[level];
    console.log(
      `${color}[${level.toUpperCase()}]${this.reset}`,
      message,
      ...optionalParams
    );
  }

  info(message: string, ...optionalParams: any[]): void {
    this.log("info", message, ...optionalParams);
  }

  warn(message: string, ...optionalParams: any[]): void {
    this.log("warn", message, ...optionalParams);
  }

  error(message: string, ...optionalParams: any[]): void {
    this.log("error", message, ...optionalParams);
  }

  debug(message: string, ...optionalParams: any[]): void {
    this.log("debug", message, ...optionalParams);
  }

  success(message: string, ...optionalParams: any[]): void {
    this.log("success", message, ...optionalParams);
  }
}

const logger = new Logger();
export default logger;