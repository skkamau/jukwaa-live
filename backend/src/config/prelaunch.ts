import type { ConfigService } from '@nestjs/config';

export function isPrelaunchTestEmail(config: ConfigService, email: string): boolean {
  return (
    config.get<boolean>('app.prelaunch.enabled', false) &&
    config.get<string>('app.mailMode') === 'disabled' &&
    (
      config.get<boolean>('app.prelaunch.allAccounts', false) ||
      config.get<string[]>('app.prelaunch.emails', []).includes(email.trim().toLowerCase())
    )
  );
}

export function isPrelaunchStreamSimulationAllowed(
  config: ConfigService,
  email: string,
): boolean {
  return (
    isPrelaunchTestEmail(config, email) &&
    config.get<boolean>('app.prelaunch.streamSimulation', false) &&
    config.get<string>('app.streaming.provider') === 'mock'
  );
}
