import { Logger } from '@nestjs/common';

type LogMetadata = Record<string, unknown> | undefined;

function serializeMetadata(metadata: LogMetadata): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return '';
  }

  try {
    return JSON.stringify(metadata);
  } catch {
    return '[unserializable metadata]';
  }
}

export function logDebug(logger: Logger, message: string, metadata?: LogMetadata) {
  const suffix = serializeMetadata(metadata);
  logger.debug(suffix ? `${message} | ${suffix}` : message);
}

export function logInfo(logger: Logger, message: string, metadata?: LogMetadata) {
  const suffix = serializeMetadata(metadata);
  logger.log(suffix ? `${message} | ${suffix}` : message);
}

export function logWarn(logger: Logger, message: string, metadata?: LogMetadata) {
  const suffix = serializeMetadata(metadata);
  logger.warn(suffix ? `${message} | ${suffix}` : message);
}

export function logError(
  logger: Logger,
  message: string,
  error?: unknown,
  metadata?: LogMetadata,
) {
  const suffix = serializeMetadata(metadata);
  const finalMessage = suffix ? `${message} | ${suffix}` : message;

  if (error instanceof Error) {
    logger.error(finalMessage, error.stack);
    return;
  }

  logger.error(finalMessage);
}


